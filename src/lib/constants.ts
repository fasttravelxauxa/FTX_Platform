import { Service } from './types';

export const BUSINESS_CONFIG = {
  appName: 'Fast Travel Xauxa',
  currencySymbol: 'S/',
  currencyCode: 'PEN',
  depositPercentage: 0.50, // 50% de adelanto
  cancellationWindowMinutes: 60, // 60 minutos para reembolso total
  airportToleranceMinutes: 30, // 30 min de tolerancia tras aterrizaje
  maxSharedPassengers: 4, // Máximo 4 pasajeros en compartido
  whatsappNumber: '+51929667586', // Número de WhatsApp de coordinación (SOLO MENSAJES)
  whatsappFormatted: '+51 929 667 586',
  whatsappCallDisclaimer: 'Sólo mensajes de WhatsApp (No llamadas)',
  invoicingDisclaimer: 'Emitimos Boletas y Facturas Electrónicas. Ingresa tus datos tributarios en la reserva y te enviamos tu comprobante fiscal vía WhatsApp.',
  vehicleInitial: {
    id: 'b1111111-1111-1111-1111-111111111111',
    brand: 'Jetour',
    model: 'SUV Deluxe (Último Modelo)',
    capacity: 4,
    plate: 'W4X-892',
  },
};

export const PAYMENT_METHODS_INFO = {
  yape: {
    name: 'Yape',
    phone: '929 667 586',
    owner: 'Fast Travel Xauxa',
    qrImage: '/images/payment/yape-qr.png',
  },
  plin: {
    name: 'Plin',
    phone: '929 667 586',
    owner: 'Fast Travel Xauxa',
    qrImage: '/images/payment/plin-qr.png',
  },
  bcp: {
    name: 'Transferencia BCP',
    accountNumber: '355-98765432-0-12',
    cci: '002-355009876543201289',
    owner: 'Fast Travel Xauxa',
  },
};

export interface DestinationRoute {
  code: string;
  name: string;
  sharedPricePerSeat: number;
  privatePriceSuv: number;
  description: string;
}

export const DESTINATIONS_CATALOG: DestinationRoute[] = [
  {
    code: 'huancayo',
    name: 'Huancayo (Centro / El Tambo / Chilca)',
    sharedPricePerSeat: 20.00,
    privatePriceSuv: 80.00,
    description: 'Ruta principal Aeropuerto Jauja ↔ Huancayo. En servicio privado incluye dirección exacta puerta a puerta.',
  },
  {
    code: 'tarma',
    name: 'Tarma (La Perla de los Andes)',
    sharedPricePerSeat: 35.00,
    privatePriceSuv: 140.00,
    description: 'Servicio directo Aeropuerto Jauja ↔ Tarma (S/ 35.00 por asiento / S/ 140.00 SUV privada exclusiva).',
  },
  {
    code: 'la-oroya',
    name: 'La Oroya',
    sharedPricePerSeat: 40.00,
    privatePriceSuv: 160.00,
    description: 'Servicio directo Aeropuerto Jauja ↔ La Oroya (S/ 40.00 por asiento / S/ 160.00 SUV privada exclusiva).',
  },
  {
    code: 'la-merced',
    name: 'La Merced (Chanchamayo - Selva Central)',
    sharedPricePerSeat: 60.00,
    privatePriceSuv: 240.00,
    description: 'Servicio directo Aeropuerto Jauja ↔ La Merced (S/ 60.00 por asiento / S/ 240.00 SUV privada exclusiva).',
  },
  {
    code: 'otro',
    name: 'Otro Destino / Excursión a Medida',
    sharedPricePerSeat: 50.00,
    privatePriceSuv: 180.00,
    description: 'Rutas personalizadas o servicio por horas (S/ 50.00/h).',
  },
];

export const SERVICES_CATALOG: Service[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    code: 'privado-aeropuerto',
    name: 'Aeropuerto Privado',
    description: 'Servicio exclusivo puerta a puerta desde/hacia el Aeropuerto de Jauja en SUV completa (hasta 4 pasajeros). Se requiere dirección exacta.',
    base_price: 80.00,
    price_unit: 'fixed',
    active: true,
    icon: 'Plane',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    code: 'compartido-aeropuerto',
    name: 'Aeropuerto Compartido',
    description: 'Viaje ejecutivo por asiento en SUV compartida (máximo 4 pasajeros). Tarifas según ciudad de destino.',
    base_price: 20.00,
    price_unit: 'fixed',
    active: true,
    icon: 'Users',
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    code: 'excursion',
    name: 'Excursiones Turísticas',
    description: 'Recorridos personalizados por el Valle del Mantaro, Ingenio, Concepción, Chupaca y atractivos turísticos locales.',
    base_price: 50.00,
    price_unit: 'hourly',
    active: true,
    icon: 'Compass',
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    code: 'visita-local',
    name: 'Visitas Locales',
    description: 'Traslados para reuniones ejecutivas, eventos familiares, compras o gestiones en Huancayo y alrededores.',
    base_price: 50.00,
    price_unit: 'hourly',
    active: true,
    icon: 'MapPin',
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    code: 'renta-horas',
    name: 'Renta por Horas con Conductor',
    description: 'Vehículo SUV Jetour a tu completa disposición por el tiempo que requieras para moverte con total libertad.',
    base_price: 50.00,
    price_unit: 'hourly',
    active: true,
    icon: 'Clock',
  },
];

export const AIRLINES = [
  { code: 'LATAM', name: 'LATAM Airlines' },
  { code: 'SKY', name: 'SKY Airline' },
  { code: 'STAR', name: 'Star Perú' },
  { code: 'OTRO', name: 'Otro Vuelo / Chárter' },
];

export const PERIPHERY_ZONES = [
  'chilca',
  'azapampa',
  'la punta',
  'sapallanga',
  'huancan',
  'pilcomayo',
  'sicaya',
  'san jerónimo',
];
