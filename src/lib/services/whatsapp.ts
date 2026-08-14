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
   * Genera enlace para que el administrador notifique la confirmación de viaje y comprobante fiscal
   */
  public static getAdminConfirmationLink(reservation: Reservation, customerPhone: string): string {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const dateFormatted = new Date(reservation.scheduled_at).toLocaleString('es-PE', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    let invoiceText = '';
    if (reservation.invoice_details && reservation.invoice_details.type !== 'ninguno') {
      invoiceText = `\n📄 *Comprobante Solicitado:* ${reservation.invoice_details.type.toUpperCase()}` +
        (reservation.invoice_details.ruc ? ` (RUC: ${reservation.invoice_details.ruc} - ${reservation.invoice_details.companyName})` : ` (DNI: ${reservation.invoice_details.dni})`) +
        `\n_(Tu Boleta/Factura Electrónica será adjuntada por este medio)_`;
    }

    const text = `✨ *Fast Travel Xauxa — Reserva Confirmada* ✨\n\nHola *${reservation.customer?.full_name || 'Estimado(a) pasajero(a)'}*,\nTu reserva *${reservation.code}* ha sido *CONFIRMADA* con éxito.\n\n📅 *Fecha y Hora:* ${dateFormatted}\n🚗 *Origen:* ${reservation.origin}\n📍 *Destino:* ${reservation.destination}\n💵 *Saldo Pendiente:* S/ ${reservation.balance_amount.toFixed(2)} (se abonará al abordar el vehículo)${invoiceText}\n\n¡Gracias por elegir viajar con comodidad, seguridad y puntualidad! Coordinaciones únicamente por este medio de WhatsApp.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Genera enlace para que el administrador notifique rechazo de comprobante
   */
  public static getAdminRejectionLink(reservation: Reservation, customerPhone: string, reason: string): string {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const text = `⚠️ *Fast Travel Xauxa — Atención con tu Reserva ${reservation.code}*\n\nHola *${reservation.customer?.full_name || 'Estimado(a)'}*,\nRevisamos el comprobante enviado para la reserva *${reservation.code}* y no pudimos procesarlo debido a:\n👉 *${reason}*\n\nPor favor vuelve a adjuntar un comprobante válido en la plataforma o escríbenos por este chat para ayudarte.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}
