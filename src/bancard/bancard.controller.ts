import { Controller, Post, Body, Ip } from '@nestjs/common';
import { BancardService } from './bancard.service';
import {
  IniciarPagoTarjetaRequestDto,
  IniciarPagoTarjetaResponseDto,
  ConfirmarPagoTarjetaRequestDto,
  PagoQrRequestDto,
  VentaTarjetaResponseDto,
  VentaQrResponseDto,
} from './dto/bancard.dto';

@Controller('bancard')
export class BancardController {
  constructor(private readonly bancardService: BancardService) {}

  @Post('verificar-conexion')
  async verificarConexion(@Ip() clientIp: string): Promise<{ eco: number }> {
    return this.bancardService.verificarConexion(clientIp);
  }

  @Post('iniciar-pago-tarjeta')
  async iniciarPagoTarjeta(
    @Body() data: IniciarPagoTarjetaRequestDto,
    @Ip() clientIp: string,
  ): Promise<IniciarPagoTarjetaResponseDto> {
    return this.bancardService.iniciarPagoTarjeta(data, clientIp);
  }

  @Post('confirmar-pago-tarjeta')
  async confirmarPagoTarjeta(
    @Body() data: ConfirmarPagoTarjetaRequestDto,
    @Ip() clientIp: string,
  ): Promise<VentaTarjetaResponseDto> {
    return this.bancardService.confirmarPagoTarjeta(data, clientIp);
  }

  @Post('pago-qr')
  async pagoQr(
    @Body() data: PagoQrRequestDto,
    @Ip() clientIp: string,
  ): Promise<VentaQrResponseDto> {
    return this.bancardService.pagoQr(data, clientIp);
  }
}
