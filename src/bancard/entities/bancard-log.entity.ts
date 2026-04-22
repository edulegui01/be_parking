export type BancardTipoOperacion =
  | 'INICIAR_TARJETA'
  | 'CONFIRMAR_TARJETA'
  | 'PAGO_QR';

export type BancardStatus = 'SUCCESS' | 'ERROR' | 'TIMEOUT';
