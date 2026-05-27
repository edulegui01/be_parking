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
  private readonly fallbackUrl: string;
  private readonly posMap: Map<string, string>;

  constructor(private readonly prisma: PrismaService) {
    const ip = process.env.BANCARD_IP;
    const port = process.env.BANCARD_PORT;
    this.fallbackUrl = `http://${ip}:${port}`;
    this.posMap = this.parsePosMap(process.env.BANCARD_POS_MAP);
  }

  private parsePosMap(raw?: string): Map<string, string> {
    const map = new Map<string, string>();
    if (!raw) return map;
    for (const entry of raw.split(',')) {
      const [frontendIp, posIp, posPort] = entry.trim().split(':');
      if (frontendIp && posIp && posPort) {
        map.set(frontendIp, `http://${posIp}:${posPort}`);
      }
    }
    return map;
  }

  private normalizeIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    // Strip IPv6-mapped IPv4 prefix (e.g. "::ffff:192.168.1.1" -> "192.168.1.1")
    return ip.replace(/^::ffff:/, '');
  }

  private getPosUrl(clientIp?: string): string {
    const ip = this.normalizeIp(clientIp);
    if (ip && this.posMap.has(ip)) {
      return this.posMap.get(ip)!;
    }
    return this.fallbackUrl;
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

  async verificarConexion(clientIp?: string): Promise<{ eco: number }> {
    this.logger.log(
      `Client IP recibida: ${clientIp} | normalizada: ${this.normalizeIp(clientIp)} | POS URL: ${this.getPosUrl(clientIp)}`,
    );
    const url = `${this.getPosUrl(clientIp)}/pos/eco`;

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
    clientIp?: string,
  ): Promise<IniciarPagoTarjetaResponseDto> {
    const url = `${this.getPosUrl(clientIp)}/pos/venta-ux`;
    const requestJson = JSON.stringify(data);

    try {
      this.logger.log(`Enviando petición venta-ux a Bancard: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestJson,
      });

      const responseData = await response.json();

      if (!response.ok) {
        await this.saveLog(
          'INICIAR_TARJETA',
          'ERROR',
          response.status,
          requestJson,
          JSON.stringify(responseData),
          data.monto,
        );
        const errorResponse: BancardErrorDto = {
          statusCode: response.status,
          error: responseData.error || 'Error',
          message: responseData.message || 'Error en Bancard al iniciar pago',
        };
        this.logger.error(
          `Error en iniciarPagoTarjeta: ${JSON.stringify(errorResponse)}`,
        );
        throw new HttpException(errorResponse, response.status);
      }

      await this.saveLog(
        'INICIAR_TARJETA',
        'SUCCESS',
        response.status,
        requestJson,
        JSON.stringify(responseData),
        data.monto,
      );
      this.logger.log(`Respuesta venta-ux: ${JSON.stringify(responseData)}`);

      return responseData as IniciarPagoTarjetaResponseDto;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      await this.saveLog(
        'INICIAR_TARJETA',
        'ERROR',
        500,
        requestJson,
        (error as Error).message,
      );
      const errorResponse: BancardErrorDto = {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS para iniciar pago',
      };
      this.logger.error(
        `Error en iniciarPagoTarjeta: ${JSON.stringify(errorResponse)}`,
      );
      throw new HttpException(errorResponse, 500);
    }
  }

  async confirmarPagoTarjeta(
    data: ConfirmarPagoTarjetaRequestDto,
    clientIp?: string,
  ): Promise<VentaTarjetaResponseDto> {
    const url = `${this.getPosUrl(clientIp)}/pos/descuento`;
    const requestJson = JSON.stringify(data);

    try {
      this.logger.log(`Enviando petición descuento a Bancard: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestJson,
      });

      const responseData = await response.json();

      if (!response.ok) {
        await this.saveLog(
          'CONFIRMAR_TARJETA',
          'ERROR',
          response.status,
          requestJson,
          JSON.stringify(responseData),
          data.monto,
        );
        const errorResponse: BancardErrorDto = {
          statusCode: response.status,
          error: responseData.error || 'Error',
          message: responseData.message || 'Error en Bancard al confirmar pago',
        };
        this.logger.error(
          `Error en confirmarPagoTarjeta: ${JSON.stringify(errorResponse)}`,
        );
        throw new HttpException(errorResponse, response.status);
      }

      await this.saveLog(
        'CONFIRMAR_TARJETA',
        'SUCCESS',
        response.status,
        requestJson,
        JSON.stringify(responseData),
        data.monto,
      );
      this.logger.log(`Respuesta descuento: ${JSON.stringify(responseData)}`);

      return responseData as VentaTarjetaResponseDto;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      await this.saveLog(
        'CONFIRMAR_TARJETA',
        'ERROR',
        500,
        requestJson,
        (error as Error).message,
      );
      const errorResponse: BancardErrorDto = {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS para confirmar pago',
      };
      this.logger.error(
        `Error en confirmarPagoTarjeta: ${JSON.stringify(errorResponse)}`,
      );
      throw new HttpException(errorResponse, 500);
    }
  }

  async pagoQr(
    data: PagoQrRequestDto,
    clientIp?: string,
  ): Promise<VentaQrResponseDto> {
    const url = `${this.getPosUrl(clientIp)}/pos/venta-qr`;
    const requestJson = JSON.stringify(data);

    try {
      this.logger.log(`Enviando petición QR a Bancard: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestJson,
      });

      const responseData = await response.json();

      if (!response.ok) {
        await this.saveLog(
          'PAGO_QR',
          'ERROR',
          response.status,
          requestJson,
          JSON.stringify(responseData),
          data.monto,
        );
        const errorResponse: BancardErrorDto = {
          statusCode: response.status,
          error: responseData.error || 'Error',
          message: responseData.message || 'Error en Bancard al procesar pago QR',
        };
        this.logger.error(`Error en pagoQr: ${JSON.stringify(errorResponse)}`);
        throw new HttpException(errorResponse, response.status);
      }

      await this.saveLog(
        'PAGO_QR',
        'SUCCESS',
        response.status,
        requestJson,
        JSON.stringify(responseData),
        data.monto,
      );
      this.logger.log(`Respuesta QR exitosa: ${JSON.stringify(responseData)}`);

      return responseData as VentaQrResponseDto;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      await this.saveLog(
        'PAGO_QR',
        'ERROR',
        500,
        requestJson,
        (error as Error).message,
      );
      const errorResponse: BancardErrorDto = {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS para pago QR',
      };
      this.logger.error(`Error en pagoQr: ${JSON.stringify(errorResponse)}`);
      throw new HttpException(errorResponse, 500);
    }
  }
}
