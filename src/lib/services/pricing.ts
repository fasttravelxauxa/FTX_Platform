import { PriceQuote, Service } from '../types';
import { BUSINESS_CONFIG, PERIPHERY_ZONES, SERVICES_CATALOG } from '../constants';

export class PricingService {
  /**
   * Calcula una cotización formal para una reserva
   */
  public static calculateQuote(params: {
    serviceCode: string;
    origin: string;
    destination: string;
    passengersCount: number;
    hoursCount?: number;
  }): PriceQuote {
    const service = SERVICES_CATALOG.find((s) => s.code === params.serviceCode);
    if (!service) {
      throw new Error(`Servicio desconocido: ${params.serviceCode}`);
    }

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
        subtotal = service.base_price; // S/ 80.00
        details.push(`Tarifa base traslado privado puerta a puerta: S/ ${subtotal.toFixed(2)}`);

        if (isOriginPeriphery || isDestPeriphery) {
          surcharges += 10.00;
          details.push('Recargo por cobertura en zona periférica / Chilca: +S/ 10.00');
        }
        break;

      case 'compartido-aeropuerto':
        const seatCount = Math.max(1, params.passengersCount);
        subtotal = service.base_price * seatCount; // S/ 20.00 * asientos
        details.push(`Tarifa compartida (${seatCount} asiento(s) x S/ ${service.base_price.toFixed(2)}): S/ ${subtotal.toFixed(2)}`);
        break;

      case 'excursion':
      case 'visita-local':
      case 'renta-horas':
        const hours = Math.max(1, params.hoursCount || 2);
        subtotal = service.base_price * hours; // S/ 50.00 * horas
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
