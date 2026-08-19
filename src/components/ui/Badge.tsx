import React from 'react';
import { ReservationStatus, PaymentStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/services/reservation-state';

interface BadgeProps {
  status: ReservationStatus | PaymentStatus;
  type?: 'reservation' | 'payment';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, type = 'reservation', size = 'md' }) => {
  if (type === 'reservation') {
    const config = STATUS_LABELS[status as ReservationStatus] || {
      label: status,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium transition-colors dark:bg-opacity-20 dark:border-opacity-40 ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        } ${config.color}`}
      >
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
        {config.label}
      </span>
    );
  }

  // Payment status rendering
  const paymentLabels: Record<PaymentStatus, { label: string; color: string }> = {
    PENDING: { label: 'Pago Pendiente', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    SUBMITTED: { label: 'Comprobante Enviado', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    UNDER_REVIEW: { label: 'En Revisión', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    APPROVED: { label: 'Adelanto Verificado', color: 'bg-crusoe-100 text-crusoe-900 border-crusoe-300 font-semibold' },
    REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-800 border-red-300' },
    REFUNDED: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    PARTIALLY_REFUNDED: { label: 'Reembolso Parcial', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  };

  const config = paymentLabels[status as PaymentStatus] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium transition-colors dark:bg-opacity-20 dark:border-opacity-40 ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      } ${config.color}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
      {config.label}
    </span>
  );
};
