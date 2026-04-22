import { registerAs } from '@nestjs/config';

export default registerAs('emisor', () => ({
  ruc: process.env.EMISOR_RUC,
  razonSocial: process.env.EMISOR_RAZON_SOCIAL,
  direccion: process.env.EMISOR_DIRECCION,
  telefono: process.env.EMISOR_TELEFONO,
}));
