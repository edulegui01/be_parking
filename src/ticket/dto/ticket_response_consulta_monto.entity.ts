export interface TicketResponseConsultaMonto {
  codigo_ticket: string;
  fecha_ingreso: string;
  documento: string;
  tipo_documento: string;
  descuento_porcentaje: number;
  iva_porcentaje: number;
  tarifa_calculada: number;
  monto_iva: number;
  monto_gravado: number;
  monto_total: number;
  mensaje: string;
  tiempo_transcurrido: string;
  facturado: string;
  facturas: {
    id_factura_parking: number;
    id_factura: number | null;
    fecha_factura: string;
  }[];
  paciente: {
    paciente: string;
    ruc: string | null;
    pasaporte: string | null;
    id_grupo: number;
    secuencia: number;
    id_expediente: number;
    email: string;
    porc_iva: number;
    descuento: number;
  };
}
