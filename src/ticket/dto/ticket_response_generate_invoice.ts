export interface TicketResponseGenerateInvoice {
  codigo_ticket: string;
  monto_facturado: number;
  id_expediente: number;
  xml: string;
  cdc: string;
  url_qr: string;
  ruc: string;
}
