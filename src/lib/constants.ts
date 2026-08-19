import { Service } from './types';

export const BUSINESS_CONFIG = {
  appName: 'Fast Travel Xauxa',
  currencySymbol: 'S/',
  currencyCode: 'PEN',
  depositPercentage: 0.50, // 50% de adelanto
  cancellationWindowMinutes: 60, // 60 minutos para reembolso total
  airportToleranceMinutes: 30, // 30 min de tolerancia tras aterrizaje
  maxSharedPassengers: 4, // Máximo 4 pasajeros en compartido
  minSharedPassengersForDeparture: 3, // Mínimo 3 asientos para confirmar salida del transporte compartido
  whatsappNumber: '+51929667586', // Número de WhatsApp de coordinación (SOLO MENSAJES)
  whatsappFormatted: '+51 929 667 586',
  whatsappCallDisclaimer: 'Sólo mensajes de WhatsApp (No llamadas)',
  invoicingDisclaimer: 'Emitimos Boletas y Facturas Electrónicas. Ingresa tus datos tributarios en la reserva y te enviamos tu comprobante fiscal vía WhatsApp.',
  sharedServiceNotice: 'Tu asiento queda 100% reservado y asegurado al realizar el pago del adelanto. La confirmación de la salida del vehículo se activa al completarse un mínimo de 3 asientos para tu horario programado. Si no se alcanza el cupo, coordinaremos la reprogramación o devolución completa sin penalización.',
  vehicleInitial: {
    id: 'b1111111-1111-1111-1111-111111111111',
    brand: 'Jetour',
    model: 'X70 FL (Modelo 2027)',
    capacity: 4,
    plate: 'W4X-892',
  },
};

export const MOBILITY_OPTIONS = [
  {
    code: 'suv-jetour',
    name: 'SUV Jetour X70 FL 2027 (Oficial)',
    capacity: '1 a 4 pasajeros',
    description: 'Camioneta SUV moderna, aire climatizado, asientos de cuero y maletero amplio.',
    recommended: true,
  },
  {
    code: 'van-ejecutiva',
    name: 'Van Ejecutiva (Grupos)',
    capacity: '5 a 8 pasajeros',
    description: 'Ideal para familias o delegaciones con equipaje voluminoso.',
    recommended: false,
  },
  {
    code: 'sedan-ejecutivo',
    name: 'Sedán Ejecutivo',
    capacity: '1 a 3 pasajeros',
    description: 'Vehículo ligero confortable para traslados rápidos.',
    recommended: false,
  },
];

export const PAYMENT_METHODS_INFO = {
  yape: {
    name: 'Yape',
    phone: '929 667 586',
    owner: 'JORGE TRU.',
    qrImage: '/images/payment/yape-qr.png',
    active: true,
  },
  plin: {
    name: 'Plin',
    phone: '929 667 586',
    owner: 'JORGE ANTONIO TRUCIOS MEZA',
    qrImage: '/images/payment/plin-qr.png',
    active: true,
  },
  bcp: {
    name: 'Transferencia BCP',
    accountNumber: '355-98765432-0-12',
    cci: '002-355009876543201289',
    owner: 'JORGE ANTONIO TRUCIOS MEZA',
    active: false,
    notice: 'En proceso de habilitación oficial. Por favor realiza tu pago por Yape o Plin.',
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
    description: 'Ruta principal Aeropuerto Jauja ↔ Huancayo. Privado: S/ 80.00 vehículo completo puerta a puerta | Compartido: S/ 20.00 por asiento.',
  },
  {
    code: 'tarma',
    name: 'Tarma (La Perla de los Andes)',
    sharedPricePerSeat: 35.00,
    privatePriceSuv: 140.00,
    description: 'Servicio directo Aeropuerto Jauja ↔ Tarma. Privado: S/ 140.00 vehículo completo | Compartido: S/ 35.00 por asiento.',
  },
  {
    code: 'la-oroya',
    name: 'La Oroya',
    sharedPricePerSeat: 40.00,
    privatePriceSuv: 160.00,
    description: 'Servicio directo Aeropuerto Jauja ↔ La Oroya. Privado: S/ 160.00 vehículo completo | Compartido: S/ 40.00 por asiento.',
  },
  {
    code: 'la-merced',
    name: 'La Merced (Chanchamayo - Selva Central)',
    sharedPricePerSeat: 60.00,
    privatePriceSuv: 240.00,
    description: 'Servicio directo Aeropuerto Jauja ↔ La Merced. Privado: S/ 240.00 vehículo completo | Compartido: S/ 60.00 por asiento.',
  },
  {
    code: 'otro',
    name: 'Otro Destino / Excursión a Medida',
    sharedPricePerSeat: 50.00,
    privatePriceSuv: 180.00,
    description: 'Rutas personalizadas o servicio por horas (S/ 50.00/h con conductor).',
  },
];

export const SERVICES_CATALOG: Service[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    code: 'privado-aeropuerto',
    name: 'Servicio Privado Exclusivo',
    description: 'Vehículo SUV Jetour a tu completa disposición (hasta 4 pasajeros). Tarifa fija por el vehículo completo. Incluye traslado directo a tu dirección exacta.',
    base_price: 80.00,
    price_unit: 'fixed',
    active: true,
    icon: 'Plane',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    code: 'compartido-aeropuerto',
    name: 'Servicio Compartido por Asiento',
    description: 'Reserva y paga por asiento (máximo 4 pasajeros por unidad). Tu asiento queda asegurado al pagar. Salida del vehículo confirmada con mínimo 3 asientos ocupados.',
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
