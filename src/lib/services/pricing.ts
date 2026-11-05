import { PriceQuote } from '../types';
import {
  BUSINESS_CONFIG,
  DESTINATIONS_CATALOG,
  SERVICES_CATALOG,
  SHARED_PRICING,
  PRIVATE_PRICING,
  PICKUP_OPTIONS,
} from '../constants';

export class PricingService {
  /**
   * Determina si la fecha programada cuenta como reserva anticipada.
   * Se considera anticipada si el usuario reserva con al menos 1 día de anticipación
   * (de un día para otro o fecha posterior, en el huso horario de Perú UTC-5).
   */
  public static isAdvanceBooking(scheduledAt?: string): boolean {
    if (!scheduledAt) return false;
    try {
      // Extraer la fecha programada en formato YYYY-MM-DD
      const schedDateStr = scheduledAt.slice(0, 10);

      // Obtener la fecha actual en hora oficial de Perú (America/Lima)
      const now = new Date();
      const peruDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      // Si la fecha programada es posterior a hoy (es decir mañana o después), es anticipada
      return schedDateStr > peruDateStr;
    } catch {
      return false;
    }
  }

  /**
   * Calcula una cotización formal para una reserva.
   * Aplica lógica diferenciada para:
   * - Compartido: escalón por cantidad de asientos (1 asiento S/ 20, 2+ asientos S/ 15 c/u).
   * - Privado: anticipación (1 día antes = S/ 65 centro) + recargo si va a afueras/periferia (+S/ 10).
   * - Recojo: puerta de salida (S/ 0) o interior del aeropuerto (+S/ 6 por parqueo).
   */
  public static calculateQuote(params: {
    serviceCode: string;
    origin: string;
    destination: string;
    destinationCode?: string;
    passengersCount: number;
    hoursCount?: number;
    scheduledAt?: string;
    huancayoZone?: 'centro' | 'afueras';
    huancayoDropoffType?: 'plaza' | 'custom_address'; // compatibilidad
    pickupOptionCode?: 'puerta-salida' | 'interior-aeropuerto';
  }): PriceQuote {
    const service = SERVICES_CATALOG.find((s) => s.code === params.serviceCode);
    if (!service) {
      throw new Error(`Servicio desconocido: ${params.serviceCode}`);
    }

    // Buscar ruta/ciudad de destino en el catálogo
    const destCode = params.destinationCode || 'huancayo';
    const destRoute = DESTINATIONS_CATALOG.find((d) => d.code === destCode) || DESTINATIONS_CATALOG[0];

    let subtotal = 0;
    let surcharges = 0;
    const details: string[] = [];
    let discounts = 0;

    switch (service.code) {
      case 'privado-aeropuerto': {
        if (destCode === 'huancayo') {
          const isAdvance = PricingService.isAdvanceBooking(params.scheduledAt);
          const isAfueras = params.huancayoZone === 'afueras';

          if (isAdvance) {
            // Reserva anticipada (de un día para otro o más)
            if (isAfueras) {
              subtotal = PRIVATE_PRICING.advancePriceOutskirts;
              details.push(`Traslado Privado Exclusivo a Huancayo (Afueras/Periferia): S/ ${subtotal.toFixed(2)}`);
              details.push('✓ Tarifa anticipada aplicada con recargo de afueras (Chilca, Sapallanga, Huancán, etc.)');
            } else {
              subtotal = PRIVATE_PRICING.advancePriceCenter;
              details.push(`Traslado Privado Exclusivo a Huancayo Centro / Zona Urbana: S/ ${subtotal.toFixed(2)}`);
              details.push('✓ Tarifa preferencial por reserva con anticipación (al menos 1 día antes)');
            }
          } else {
            // Reserva para el mismo día (sin anticipación)
            if (isAfueras) {
              subtotal = PRIVATE_PRICING.regularPrice + PRIVATE_PRICING.outskirtsSurcharge;
              details.push(`Traslado Privado Exclusivo a Huancayo (Afueras/Periferia - Mismo día): S/ ${subtotal.toFixed(2)}`);
              details.push('ℹ Reserva con al menos 1 día de anticipación para acceder a tarifa de S/ 75');
            } else {
              subtotal = PRIVATE_PRICING.regularPrice;
              details.push(`Traslado Privado Exclusivo a Huancayo (Mismo día): S/ ${subtotal.toFixed(2)}`);
              details.push('ℹ Reserva con al menos 1 día de anticipación para acceder a tarifa preferencial de S/ 65');
            }
          }
        } else {
          // Destinos fuera de Huancayo (Tarma, etc.) — precio fijo del catálogo
          subtotal = destRoute.privatePriceSuv;
          details.push(`Traslado Privado Exclusivo (${destRoute.name}): S/ ${subtotal.toFixed(2)}`);
        }
        break;
      }

      case 'compartido-aeropuerto': {
        const seatCount = Math.max(1, params.passengersCount);
        let pricePerSeat: number;

        if (seatCount >= SHARED_PRICING.multiSeatThreshold) {
          pricePerSeat = SHARED_PRICING.multiSeatPrice;
          details.push(
            `Traslado Compartido (${seatCount} asiento(s) x S/ ${pricePerSeat.toFixed(2)} a ${destRoute.name}): S/ ${(pricePerSeat * seatCount).toFixed(2)}`
          );
          details.push('✓ Tarifa grupal aplicada (2+ asientos)');
        } else {
          pricePerSeat = SHARED_PRICING.singleSeatPrice;
          details.push(
            `Traslado Compartido (1 asiento con climatización premium a ${destRoute.name}): S/ ${pricePerSeat.toFixed(2)}`
          );
          details.push('💎 Incluye climatización premium');
        }

        subtotal = pricePerSeat * seatCount;
        break;
      }

      case 'excursion':
      case 'visita-local':
      case 'renta-horas': {
        const hours = Math.max(1, params.hoursCount || 2);
        subtotal = service.base_price * hours;
        details.push(`Servicio por horas (${hours} hora(s) x S/ ${service.base_price.toFixed(2)}/h): S/ ${subtotal.toFixed(2)}`);
        break;
      }

      default:
        subtotal = service.base_price;
        details.push(`Tarifa base: S/ ${subtotal.toFixed(2)}`);
    }

    // Recargo por recojo en zona interior del aeropuerto
    const pickupOption = PICKUP_OPTIONS.find((p) => p.code === params.pickupOptionCode);
    if (pickupOption && pickupOption.surcharge > 0) {
      surcharges += pickupOption.surcharge;
      details.push(`Recojo interior aeropuerto (parqueo): +S/ ${pickupOption.surcharge.toFixed(2)}`);
    }

    const total = subtotal + surcharges - discounts;
    const depositRequired = Math.round(total * BUSINESS_CONFIG.depositPercentage * 100) / 100;
    const balanceRemaining = Math.round((total - depositRequired) * 100) / 100;

    return {
      serviceCode: service.code,
      subtotal,
      surcharges,
      discounts,
      total,
      depositRequired,
      balanceRemaining,
      currency: 'PEN',
      details,
    };
  }
}
