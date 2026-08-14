import { ReservationStatus } from '../types';
import { BUSINESS_CONFIG } from '../constants';

export const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAYMENT_SUBMITTED', 'EXPIRED', 'CANCELLED'],
  PAYMENT_SUBMITTED: ['PAYMENT_REVIEW', 'CANCELLED'],
  PAYMENT_REVIEW: ['CONFIRMED', 'PAYMENT_REJECTED', 'CANCELLED'],
  PAYMENT_REJECTED: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'RESCHEDULED', 'CANCELLED', 'OPERATIONAL_EXCEPTION'],
  ASSIGNED: ['READY', 'RESCHEDULED', 'NO_SHOW', 'CANCELLED', 'OPERATIONAL_EXCEPTION'],
  READY: ['PICKUP', 'NO_SHOW', 'OPERATIONAL_EXCEPTION'],
  PICKUP: ['IN_PROGRESS', 'OPERATIONAL_EXCEPTION'],
  IN_PROGRESS: ['COMPLETED', 'OPERATIONAL_EXCEPTION'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  NO_SHOW: [],
  RESCHEDULED: ['CONFIRMED', 'PENDING_PAYMENT'],
  OPERATIONAL_EXCEPTION: ['RESCHEDULED', 'COMPLETED', 'CANCELLED'],
};

export const STATUS_LABELS: Record<ReservationStatus, { label: string; color: string; badgeBg: string; textHex: string }> = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-300', badgeBg: '#F3F4F6', textHex: '#374151' },
  PENDING_PAYMENT: { label: 'Pendiente de Adelanto', color: 'bg-amber-100 text-amber-800 border-amber-300', badgeBg: '#FEF3C7', textHex: '#92400E' },
  PAYMENT_SUBMITTED: { label: 'Comprobante Subido', color: 'bg-blue-100 text-blue-800 border-blue-300', badgeBg: '#DBEAFE', textHex: '#1E40AF' },
  PAYMENT_REVIEW: { label: 'Pago en Revisión', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', badgeBg: '#E0E7FF', textHex: '#3730A3' },
  CONFIRMED: { label: 'Reserva Confirmada', color: 'bg-crusoe-100 text-crusoe-800 border-crusoe-300', badgeBg: '#E1F9DF', textHex: '#184417' },
  ASSIGNED: { label: 'Conductor Asignado', color: 'bg-teal-100 text-teal-800 border-teal-300', badgeBg: '#CCFBF1', textHex: '#115E59' },
  READY: { label: 'Vehículo Listo', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', badgeBg: '#CFFAFE', textHex: '#155E75' },
  PICKUP: { label: 'En Punto de Recogida', color: 'bg-purple-100 text-purple-800 border-purple-300', badgeBg: '#F3E8FF', textHex: '#6B21A8' },
  IN_PROGRESS: { label: 'Viaje en Curso', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse', badgeBg: '#D1FAE5', textHex: '#065F46' },
  COMPLETED: { label: 'Viaje Completado', color: 'bg-green-100 text-green-900 border-green-400 font-semibold', badgeBg: '#DCFCE7', textHex: '#14532D' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-300', badgeBg: '#FEE2E2', textHex: '#991B1B' },
  EXPIRED: { label: 'Expirada', color: 'bg-gray-200 text-gray-600 border-gray-300', badgeBg: '#E5E7EB', textHex: '#4B5563' },
  NO_SHOW: { label: 'No Presentado (No-Show)', color: 'bg-rose-100 text-rose-900 border-rose-400', badgeBg: '#FFE4E6', textHex: '#881337' },
  PAYMENT_REJECTED: { label: 'Comprobante Rechazado', color: 'bg-red-100 text-red-700 border-red-300', badgeBg: '#FEE2E2', textHex: '#B91C1C' },
  RESCHEDULED: { label: 'Reprogramada', color: 'bg-orange-100 text-orange-800 border-orange-300', badgeBg: '#FFEDD5', textHex: '#9A3412' },
  OPERATIONAL_EXCEPTION: { label: 'Incidencia Operativa', color: 'bg-yellow-100 text-yellow-900 border-yellow-400', badgeBg: '#FEF9C3', textHex: '#713F12' },
};

export class ReservationStateMachine {
  /**
   * Verifica si la transición de estado es válida
   */
  public static canTransition(current: ReservationStatus, next: ReservationStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  /**
   * Evalúa si una reserva califica para reembolso por cancelación (dentro de los 60 min)
   */
  public static isEligibleForRefund(createdAt: string | Date): boolean {
    const createdTime = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - createdTime) / (1000 * 60);
    return diffMinutes <= BUSINESS_CONFIG.cancellationWindowMinutes;
  }
}
