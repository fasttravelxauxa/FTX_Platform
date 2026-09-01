import { BUSINESS_CONFIG } from '../constants';
import { Reservation } from '../types';

export class WhatsAppService {
  /**
   * Genera enlace de WhatsApp para que el cliente contacte por mensaje
   */
  public static getCustomerSupportLink(reservation?: Partial<Reservation>): string {
    const phone = BUSINESS_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
    let text = 'Hola Fast Travel Xauxa, me gustaría hacer una consulta por mensaje.';

    if (reservation?.code) {
      text = `Hola Fast Travel Xauxa, adjunto mi código de reserva: *${reservation.code}*.\n*Servicio:* ${reservation.origin} ➔ ${reservation.destination}\n*Fecha/Hora:* ${reservation.scheduled_at ? new Date(reservation.scheduled_at).toLocaleString('es-PE') : ''}.\nQuisiera información sobre el estado de mi viaje.`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * ALERTA AUTOMÁTICA AL TELÉFONO DEL ADMINISTRADOR (929 667 586)
   * Genera el mensaje de notificación instantánea cuando un cliente crea una nueva reserva.
   */
  public static getAdminNewBookingAlertLink(reservation: Reservation): string {
    const adminPhone = BUSINESS_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
    const dateFormatted = new Date(reservation.scheduled_at).toLocaleString('es-PE', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    let invoiceText = 'No solicitó comprobante fiscal';
    if (reservation.invoice_details && reservation.invoice_details.type !== 'ninguno') {
      invoiceText = `${reservation.invoice_details.type.toUpperCase()} ` +
        (reservation.invoice_details.ruc ? `(RUC: ${reservation.invoice_details.ruc} - ${reservation.invoice_details.companyName})` : `(DNI: ${reservation.invoice_details.dni})`);
    }

    const hasVoucher = Array.isArray(reservation.payments) && reservation.payments.length > 0;
    const voucherText = hasVoucher
      ? `Adjuntado en la plataforma`
      : `PENDIENTE (Pagar antes de la hora programada)`;

    const isShared = reservation.service_id === 'a2222222-2222-2222-2222-222222222222' || reservation.service?.code === 'compartido-aeropuerto';
    const modalityText = isShared
      ? `Servicio Compartido (${reservation.passengers_count || 1} Asiento(s) contratado(s))`
      : `Servicio Privado Exclusivo SUV (Camioneta Completa)`;

    const text = `*NOTIFICACIÓN DE RESERVA - FAST TRAVEL XAUXA*\n\n` +
      `*Código:* *${reservation.code}*\n` +
      `*Cliente:* ${reservation.customer?.full_name || 'Pasajero'} (${reservation.customer?.phone})\n` +
      `*Modalidad:* ${modalityText}\n` +
      `*Ruta:* ${reservation.origin} ➔ ${reservation.destination}\n` +
      `*Fecha y Hora:* ${dateFormatted}\n` +
      `*Vuelo:* ${reservation.flight_airline || 'N/A'} (${reservation.flight_number || 'N/A'})\n` +
      `*Monto Total:* S/ ${reservation.total_amount.toFixed(2)}\n` +
      `*Adelanto (20%):* S/ ${reservation.deposit_amount.toFixed(2)}\n` +
      `*Comprobante Fiscal:* ${invoiceText}\n` +
      `*Voucher:* ${voucherText}\n\n` +
      `*Panel Operativo:* Revise la reserva en el panel de control.`;

    return `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Genera enlace para que el administrador notifique la confirmación de viaje al cliente
   */
  public static getAdminConfirmationLink(reservation: Reservation, customerPhone: string): string {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const dateFormatted = new Date(reservation.scheduled_at).toLocaleString('es-PE', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const isShared = reservation.service_id === 'a2222222-2222-2222-2222-222222222222' || reservation.service?.code === 'compartido-aeropuerto';
    const modalityText = isShared
      ? `Servicio Compartido (${reservation.passengers_count || 1} Asiento(s) contratado(s))`
      : `Servicio Privado Exclusivo SUV (Camioneta Completa)`;

    let invoiceText = '';
    if (reservation.invoice_details && reservation.invoice_details.type !== 'ninguno') {
      invoiceText = `\n*Comprobante Solicitado:* ${reservation.invoice_details.type.toUpperCase()}` +
        (reservation.invoice_details.ruc ? ` (RUC: ${reservation.invoice_details.ruc} - ${reservation.invoice_details.companyName})` : ` (DNI: ${reservation.invoice_details.dni})`) +
        `\n_(Su Boleta o Factura Electrónica será adjuntada por este medio)_`;
    }

    const text = `*FAST TRAVEL XAUXA - RESERVA CONFIRMADA*\n\nEstimado(a) *${reservation.customer?.full_name || 'Pasajero(a)'}*,\nSu reserva con código *${reservation.code}* ha sido *CONFIRMADA* formalmente.\n\n*Modalidad:* ${modalityText}\n*Fecha y Hora:* ${dateFormatted}\n*Origen:* ${reservation.origin}\n*Destino:* ${reservation.destination}\n*Saldo Restante:* S/ ${reservation.balance_amount.toFixed(2)} (se abona al abordar la unidad)${invoiceText}\n\n*Ver detalles de su reserva:* https://fast-travel-xauxa.vercel.app/reserva/${reservation.code}\n\nGracias por elegir Fast Travel Xauxa. Coordinación oficial únicamente por este canal de WhatsApp.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Genera enlace para que el administrador recuerde al cliente abonar el adelanto del 20%
   */
  public static getPaymentReminderLink(reservation: Reservation): string {
    const cleanPhone = (reservation.customer?.phone || '').replace(/[^0-9]/g, '');
    const dateFormatted = new Date(reservation.scheduled_at).toLocaleString('es-PE', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const isShared = reservation.service_id === 'a2222222-2222-2222-2222-222222222222' || reservation.service?.code === 'compartido-aeropuerto';
    const modalityText = isShared
      ? `Servicio Compartido (${reservation.passengers_count || 1} Asiento(s) contratado(s))`
      : `Servicio Privado Exclusivo SUV (Camioneta Completa)`;

    const text = `*FAST TRAVEL XAUXA - RECORDATORIO DE ADELANTO*\n\n` +
      `Estimado(a) *${reservation.customer?.full_name || 'Pasajero(a)'}*,\n` +
      `Le saludamos de Fast Travel Xauxa. Le recordamos que tiene una reserva registrada con código *${reservation.code}* para el traslado:\n\n` +
      `*Modalidad:* ${modalityText}\n` +
      `*Ruta:* ${reservation.origin} ➔ ${reservation.destination}\n` +
      `*Fecha y Hora:* ${dateFormatted}\n` +
      `*Monto Total:* S/ ${reservation.total_amount.toFixed(2)}\n` +
      `*Adelanto Requerido (20%):* *S/ ${reservation.deposit_amount.toFixed(2)}*\n` +
      `*Saldo al Abordar (80%):* S/ ${reservation.balance_amount.toFixed(2)}\n\n` +
      `*Cuentas Oficiales para el Adelanto:*\n` +
      `- Yape: 929 667 586 (JORGE TRU.)\n` +
      `- Plin: 929 667 586 (JORGE ANTONIO TRUCIOS MEZA)\n` +
      `- BCP: 40002021972079 (CCI: 00240010202197207901)\n\n` +
      `Para asegurar su cupo en la SUV del año, por favor realice el abono antes de la hora programada y adjunte su comprobante aquí:\n` +
      `https://fast-travel-xauxa.vercel.app/reserva/${reservation.code}\n\n` +
      `Quedamos a su disposición para coordinar su viaje.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Genera enlace para que el administrador notifique rechazo de comprobante
   */
  public static getAdminRejectionLink(reservation: Reservation, customerPhone: string, reason: string): string {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const text = `*FAST TRAVEL XAUXA - ATENCIÓN CON SU RESERVA ${reservation.code}*\n\nEstimado(a) *${reservation.customer?.full_name || 'Pasajero(a)'}*,\nRevisamos el comprobante remitido para la reserva *${reservation.code}* y no pudimos procesarlo debido al siguiente motivo:\n- *${reason}*\n\nPor favor vuelva a adjuntar un comprobante válido en:\nhttps://fast-travel-xauxa.vercel.app/reserva/${reservation.code}\n\nO responda a este mensaje para brindarle asistencia inmediata.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}
