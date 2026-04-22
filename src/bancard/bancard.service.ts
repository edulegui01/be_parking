import { Injectable, HttpException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  IniciarPagoTarjetaRequestDto,
  IniciarPagoTarjetaResponseDto,
  ConfirmarPagoTarjetaRequestDto,
  PagoQrRequestDto,
  VentaQrResponseDto,
  VentaTarjetaResponseDto,
  BancardErrorDto,
} from './dto/bancard.dto';
import {
  BancardTipoOperacion,
  BancardStatus,
} from './entities/bancard-log.entity';

@Injectable()
export class BancardService {
  private readonly logger = new Logger(BancardService.name);
  private readonly baseUrl: string;

  constructor(private readonly prisma: PrismaService) {
    const ip = process.env.BANCARD_IP;
    const port = process.env.BANCARD_PORT;
    this.baseUrl = `http://${ip}:${port}`;
  }

  private async saveLog(
    tipo_operacion: BancardTipoOperacion,
    status: BancardStatus,
    http_status_code: number,
    request_json?: string,
    response_json?: string,
    monto?: number,
  ): Promise<void> {
    await this.prisma.bancard_log.create({
      data: {
        tipo_operacion,

        status,
        http_status_code,
        request_json,
        response_json,
        monto,
      },
    });
  }

  async verificarConexion(): Promise<{ eco: number }> {
    const url = `${this.baseUrl}/pos/eco`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eco: 1 }),
      });

      const data = (await response.json()) as { eco: number };
      return data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      const errorResponse: BancardErrorDto = {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS',
      };
      this.logger.error(
        `Error en verificarConexion: ${JSON.stringify(errorResponse)}`,
      );
      throw new HttpException(errorResponse, 500);
    }
  }

  async iniciarPagoTarjeta(
    data: IniciarPagoTarjetaRequestDto,
  ): Promise<IniciarPagoTarjetaResponseDto> {
    const url = `${this.baseUrl}/pos/venta-ux`;
    const requestJson = JSON.stringify(data);

    try {
      this.logger.log(`Enviando petición venta-ux a Bancard: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestJson,
      });

      const responseData =
        (await response.json()) as IniciarPagoTarjetaResponseDto;

      await this.saveLog(
        'INICIAR_TARJETA',
        'SUCCESS',
        response.status,
        requestJson,
        JSON.stringify(responseData),
        data.monto,
      );
      this.logger.log(`Respuesta venta-ux: ${JSON.stringify(responseData)}`);

      return responseData;
    } catch (error) {
      await this.saveLog(
        'INICIAR_TARJETA',
        'ERROR',
        error.response?.status || 500,
        requestJson,
        JSON.stringify(error.response?.data),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const errorResponse: BancardErrorDto = error.response?.data || {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS para iniciar pago',
      };
      this.logger.error(
        `Error en iniciarPagoTarjeta: ${JSON.stringify(errorResponse)}`,
      );
      throw new HttpException(errorResponse, error.response?.status || 500);
    }
  }

  async confirmarPagoTarjeta(
    data: ConfirmarPagoTarjetaRequestDto,
  ): Promise<VentaTarjetaResponseDto> {
    const url = `${this.baseUrl}/pos/descuento`;
    const requestJson = JSON.stringify(data);

    try {
      this.logger.log(`Enviando petición descuento a Bancard: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestJson,
      });

      const responseData = (await response.json()) as VentaTarjetaResponseDto;

      await this.saveLog(
        'CONFIRMAR_TARJETA',
        'SUCCESS',
        response.status,
        requestJson,
        JSON.stringify(responseData),
        data.monto,
      );
      this.logger.log(`Respuesta descuento: ${JSON.stringify(responseData)}`);

      return responseData;
    } catch (error) {
      await this.saveLog(
        'CONFIRMAR_TARJETA',
        'ERROR',
        error.response?.status || 500,
        requestJson,
        JSON.stringify(error.response?.data),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const errorResponse: BancardErrorDto = error.response?.data || {
        statusCode: 500,
        error: 'Internal Server Error',
        message:
          'No se pudo establecer conexión con el POS para confirmar pago',
      };
      this.logger.error(
        `Error en confirmarPagoTarjeta: ${JSON.stringify(errorResponse)}`,
      );
      throw new HttpException(errorResponse, error.response?.status || 500);
    }
  }

  async pagoQr(data: PagoQrRequestDto): Promise<VentaQrResponseDto> {
    const url = `${this.baseUrl}/pos/venta-qr`;
    const requestJson = JSON.stringify(data);

    try {
      this.logger.log(`Enviando petición QR a Bancard: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestJson,
      });

      const responseData = (await response.json()) as VentaQrResponseDto;

      await this.saveLog(
        'PAGO_QR',
        'SUCCESS',
        response.status,
        requestJson,
        JSON.stringify(responseData),
        data.monto,
      );
      this.logger.log(`Respuesta QR exitosa: ${JSON.stringify(responseData)}`);

      return responseData;
    } catch (error) {
      await this.saveLog(
        'PAGO_QR',
        'ERROR',
        error.response?.status || 500,
        requestJson,
        JSON.stringify(error.response?.data),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const errorResponse: BancardErrorDto = error.response?.data || {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS para pago QR',
      };
      this.logger.error(`Error en pagoQr: ${JSON.stringify(errorResponse)}`);
      throw new HttpException(errorResponse, error.response?.status || 500);
    }
  }
}
