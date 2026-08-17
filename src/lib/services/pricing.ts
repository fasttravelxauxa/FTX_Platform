import { PriceQuote } from '../types';
import { BUSINESS_CONFIG, DESTINATIONS_CATALOG, PERIPHERY_ZONES, SERVICES_CATALOG } from '../constants';

export class PricingService {
  /**
   * Calcula una cotización formal para una reserva
   */
  public static calculateQuote(params: {
    serviceCode: string;
    origin: string;
    destination: string;
    destinationCode?: string;
    passengersCount: number;
    hoursCount?: number;
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

    const originLower = params.origin.toLowerCase();
    const destLower = params.destination.toLowerCase();

    // Verificación de zona periférica (Chilca, Sapallanga, etc.)
    const isOriginPeriphery = PERIPHERY_ZONES.some((zone) => originLower.includes(zone));
    const isDestPeriphery = PERIPHERY_ZONES.some((zone) => destLower.includes(zone));

    switch (service.code) {
      case 'privado-aeropuerto':
        subtotal = destRoute.privatePriceSuv;
        details.push(`Traslado Privado SUV Exclusiva (${destRoute.name}): S/ ${subtotal.toFixed(2)}`);

        if ((isOriginPeriphery || isDestPeriphery) && destCode === 'huancayo') {
          surcharges += 10.00;
          details.push('Recargo por cobertura en zona periférica / Chilca: +S/ 10.00');
        }
        break;

      case 'compartido-aeropuerto':
        const seatCount = Math.max(1, params.passengersCount);
        subtotal = destRoute.sharedPricePerSeat * seatCount;
        details.push(
          `Traslado Compartido (${seatCount} asiento(s) x S/ ${destRoute.sharedPricePerSeat.toFixed(2)} a ${destRoute.name}): S/ ${subtotal.toFixed(2)}`
        );
        break;

      case 'excursion':
      case 'visita-local':
      case 'renta-horas':
        const hours = Math.max(1, params.hoursCount || 2);
        subtotal = service.base_price * hours;
        details.push(`Servicio por horas (${hours} hora(s) x S/ ${service.base_price.toFixed(2)}/h): S/ ${subtotal.toFixed(2)}`);

        if (isOriginPeriphery || isDestPeriphery) {
          surcharges += 10.00;
          details.push('Recargo por origen/destino fuera del casco central: +S/ 10.00');
        }
        break;

      default:
        subtotal = service.base_price;
        details.push(`Tarifa base: S/ ${subtotal.toFixed(2)}`);
    }

    const total = subtotal + surcharges;
    const depositRequired = Math.round(total * BUSINESS_CONFIG.depositPercentage * 100) / 100;
    const balanceRemaining = Math.round((total - depositRequired) * 100) / 100;

    return {
      serviceCode: service.code,
      subtotal,
      surcharges,
      discounts: 0,
      total,
      depositRequired,
      balanceRemaining,
      currency: 'PEN',
      details,
    };
  }
}
