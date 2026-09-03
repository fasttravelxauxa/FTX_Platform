import { Service } from './types';

export const BUSINESS_CONFIG = {
  appName: 'Fast Travel Xauxa',
  domain: 'fast-travel-xauxa.vercel.app',
  siteUrl: 'https://fast-travel-xauxa.vercel.app',
  operatorName: 'Empresa de Transportes y Turismo Jomyl',
  currencySymbol: 'S/',
  currencyCode: 'PEN',
  depositPercentage: 0.20, // 20% de adelanto
  cancellationWindowMinutes: 60, // 60 minutos para reembolso total
  airportToleranceMinutes: 30, // 30 min de tolerancia tras aterrizaje
  maxSharedPassengers: 4, // Máximo 4 pasajeros en compartido
  minSharedPassengersForDeparture: 3, // Mínimo 3 asientos para confirmar salida del transporte compartido
  whatsappNumber: '+51940378999', // Central Oficial de Reservas e Informes
  whatsappFormatted: '+51 940 378 999',
  whatsappCallDisclaimer: 'Reservas e Informes: +51 940 378 999 (Solo mensajes de WhatsApp)',
  urgentPaymentNumber: '+51929667586', // Línea de Pagos Yape/Plin y Atención de Urgencias
  urgentPaymentFormatted: '+51 929 667 586',
  personalYapeNumber: '+51929667586',
  personalYapeFormatted: '929 667 586',
  urgentDisclaimer: 'Esta línea (+51 929 667 586) es de uso exclusivo para recepción de pagos Yape/Plin e incidencias urgentes en servicio. Para reservas e informes comuníquese al 940 378 999.',
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
    notice: 'Línea de pagos Yape. Para consultas e informes generales comunicarse al 940 378 999.',
    active: true,
  },
  plin: {
    name: 'Plin',
    phone: '929 667 586',
    owner: 'JORGE ANTONIO TRUCIOS MEZA',
    qrImage: '/images/payment/plin-qr.png',
    notice: 'Línea de pagos Plin. Para consultas e informes generales comunicarse al 940 378 999.',
    active: true,
  },
  bcp: {
    name: 'Transferencia BCP',
    accountNumber: '40002021972079',
    cci: '00240010202197207901',
    owner: 'JORGE ANTONIO TRUCIOS MEZA',
    qrImage: '/images/payment/bcp-qr.png',
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
    code: 'huancayo',
    name: 'Huancayo (Plaza Constitución / Domicilio u Hotel)',
    sharedPricePerSeat: 20.00,
    privatePriceSuv: 80.00,
    description: 'Servicio directo Valle del Mantaro. Compartido: Parada final Plaza Constitución. Privado: Parada en Plaza Constitución o en la puerta de su hotel o domicilio.',
    image: '/images/destinos/plaza_constitucion.jpg',
  },
  {
    code: 'tarma',
    name: 'Tarma (La Perla de los Andes)',
    sharedPricePerSeat: 35.00,
    privatePriceSuv: 140.00,
    description: 'Servicio directo Aeropuerto Jauja ➔ Tarma. Servicio privado exclusivo a su hotel o dirección.',
    image: '/images/destinos/tarma.jpg',
  },
  {
    code: 'la-merced',
    name: 'La Merced (Chanchamayo - Selva Central)',
    sharedPricePerSeat: 60.00,
    privatePriceSuv: 240.00,
    description: 'Servicio directo Aeropuerto Jauja ➔ La Merced / Selva Central. Confort, climatización y seguridad.',
    image: '/images/destinos/la_merced.jpg',
  },
  {
    code: 'la-oroya',
    name: 'La Oroya (Cruce Central)',
    sharedPricePerSeat: 40.00,
    privatePriceSuv: 160.00,
    description: 'Servicio directo Aeropuerto Jauja ➔ La Oroya. Traslado corporativo y ejecutivo.',
    image: '/images/destinos/la_oroya.jpg',
  },
  {
    code: 'otro',
    name: 'Otro Destino / Excursión a Medida',
    sharedPricePerSeat: 50.00,
    privatePriceSuv: 180.00,
    description: 'Rutas personalizadas por horas o circuitos turísticos en el Valle del Mantaro con conductor profesional.',
    image: '/images/destinos/Huancayo.webp',
  },
];

export const SERVICES_CATALOG: Service[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    code: 'privado-aeropuerto',
    name: 'Servicio Privado Exclusivo',
    description: 'Servicio 100% exclusivo, climatizado con aire acondicionado, asientos amplios y confortables en SUV del año. Opción de parada final en Plaza Constitución o traslado directo a la dirección exacta de su hotel o domicilio.',
    base_price: 80.00,
    price_unit: 'fixed',
    active: true,
    icon: 'Car',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    code: 'compartido-aeropuerto',
    name: 'Servicio Compartido por Asiento',
    description: 'Servicio compartido por asiento en SUV del año. Parada final establecida en Plaza Constitución (Centro de Huancayo). Máximo 4 pasajeros por unidad.',
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


