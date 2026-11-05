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
   * Determina si la fecha programada cuenta como reserva anticipada
   * (al menos 24 horas antes del traslado).
   */
  public static isAdvanceBooking(scheduledAt?: string): boolean {
    if (!scheduledAt) return false;
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    const hoursUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= PRIVATE_PRICING.advanceHoursRequired;
  }

  /**
   * Calcula una cotización formal para una reserva.
   * Aplica lógica diferenciada para compartido (escalón por cantidad)
   * y privado (anticipación + zona centro/afueras + recojo interior).
   */
  public static calculateQuote(params: {
    serviceCode: string;
    origin: string;
    destination: string;
    destinationCode?: string;
    passengersCount: number;
    hoursCount?: number;
    scheduledAt?: string;
    huancayoDropoffType?: 'plaza' | 'custom_address';
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

          if (isAdvance) {
            // Precio anticipado: S/ 65 centro, S/ 75 afueras
            if (params.huancayoDropoffType === 'custom_address') {
              subtotal = PRIVATE_PRICING.advancePriceOutskirts;
              details.push(`Traslado Privado Exclusivo a Huancayo (Dirección particular): S/ ${subtotal.toFixed(2)}`);
              details.push('✓ Precio preferencial por reserva anticipada (24h+)');
            } else {
              subtotal = PRIVATE_PRICING.advancePriceCenter;
              details.push(`Traslado Privado Exclusivo a Huancayo Centro: S/ ${subtotal.toFixed(2)}`);
              details.push('✓ Precio preferencial por reserva anticipada (24h+)');
            }
          } else {
            // Precio regular sin anticipación
            subtotal = PRIVATE_PRICING.regularPrice;
            details.push(`Traslado Privado Exclusivo a Huancayo: S/ ${subtotal.toFixed(2)}`);
            details.push('ℹ Reserva con 24h+ de anticipación para tarifa preferencial desde S/ 65');
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
