import { Service } from './types';

export const BUSINESS_CONFIG = {
  appName: 'Fast Travel Xauxa',
  currencySymbol: 'S/',
  currencyCode: 'PEN',
  depositPercentage: 0.20, // 20% de adelanto
  cancellationWindowMinutes: 60, // 60 minutos para reembolso total
  airportToleranceMinutes: 30, // 30 min de tolerancia tras aterrizaje
  maxSharedPassengers: 4, // Máximo 4 pasajeros en compartido
  minSharedPassengersForDeparture: 3, // Mínimo 3 asientos para confirmar salida del transporte compartido
  whatsappNumber: '+51929667586', // Número de WhatsApp de coordinación (SOLO MENSAJES)
  whatsappFormatted: '+51 929 667 586',
  whatsappCallDisclaimer: 'Sólo mensajes de WhatsApp (No llamadas)',
  invoicingDisclaimer: 'Emitimos Boletas y Facturas Electrónicas. Ingresa tus datos tributarios en la reserva y te enviamos tu comprobante fiscal vía WhatsApp.',
  sharedServiceNotice: 'Tu asiento queda 100% reservado y asegurado. La confirmación de la salida del vehículo se activa al completarse un mínimo de 3 asientos para tu horario programado. Si no se alcanza el cupo, coordinaremos la reprogramación o devolución completa sin penalización.',
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
    code: 'auto-confortable',
    name: 'Auto confortable de 4 pasajeros',
    capacity: '1 a 4 pasajeros',
    description: 'Vehículo ligero y confortable para traslados ejecutivos rápidos.',
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
    accountNumber: '40002021972079',
    cci: '00240010202197207901',
    owner: 'JORGE ANTONIO TRUCIOS MEZA',
    active: true,
    notice: 'Transferencia directa o interbancaria BCP inmediata.',
  },
};

export interface DestinationRoute {
  code: string;
  name: string;
  sharedPricePerSeat: number;
  privatePriceSuv: number;
  description: string;
  image?: string;
}

export const DESTINATIONS_CATALOG: DestinationRoute[] = [
  {
    code: 'plaza-constitucion',
    name: 'Plaza Constitución (Huancayo)',
    sharedPricePerSeat: 20.00,
    privatePriceSuv: 80.00,
    description: 'Servicio al centro de Huancayo. Privado: S/ 80.00 | Compartido: S/ 20.00 por asiento.',
    image: '/images/destinos/plaza_constitucion.jpg',
  },
  {
    code: 'ovalo-huancavelica',
    name: 'Óvalo Huancavelica (Huancayo)',
    sharedPricePerSeat: 20.00,
    privatePriceSuv: 80.00,
    description: 'Servicio a zona sur de Huancayo. Privado: S/ 80.00 | Compartido: S/ 20.00 por asiento.',
    image: '/images/destinos/Huancayo.webp',
  },
  {
    code: 'jr-calixto',
    name: 'Jr. Calixto (Centro de Huancayo)',
    sharedPricePerSeat: 20.00,
    privatePriceSuv: 80.00,
    description: 'Servicio al centro cívico comercial. Privado: S/ 80.00 | Compartido: S/ 20.00 por asiento.',
    image: '/images/destinos/Huancayo.webp',
  },
  {
    code: 'el-tambo',
    name: 'El Tambo / Chilca',
    sharedPricePerSeat: 20.00,
    privatePriceSuv: 80.00,
    description: 'Zonas aledañas de Huancayo. Privado: S/ 80.00 | Compartido: S/ 20.00 por asiento.',
    image: '/images/destinos/Huancayo.webp',
  },
  {
    code: 'tarma',
    name: 'Tarma (La Perla de los Andes)',
    sharedPricePerSeat: 35.00,
    privatePriceSuv: 140.00,
    description: 'Servicio directo Aeropuerto Jauja ➔ Tarma. Privado: S/ 140.00 | Compartido: S/ 35.00.',
    image: '/images/destinos/tarma.jpg',
  },
  {
    code: 'la-oroya',
    name: 'La Oroya',
    sharedPricePerSeat: 40.00,
    privatePriceSuv: 160.00,
    description: 'Servicio directo Aeropuerto Jauja ➔ La Oroya. Privado: S/ 160.00 | Compartido: S/ 40.00.',
    image: '/images/destinos/la_oroya.jpg',
  },
  {
    code: 'la-merced',
    name: 'La Merced (Selva Central)',
    sharedPricePerSeat: 60.00,
    privatePriceSuv: 240.00,
    description: 'Servicio directo Aeropuerto Jauja ➔ La Merced. Privado: S/ 240.00 | Compartido: S/ 60.00.',
    image: '/images/destinos/la_merced.jpg',
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


