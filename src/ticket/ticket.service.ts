import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TicketRepository } from './ticket.repository';
import { TicketRequestCreate } from './dto/ticket_request_create.entity';
import { TicketResponseCreate } from './dto/ticket_response_create.entity';
import { TicketResponseUpdate } from './dto/ticket_response_update.entity';
import { TicketRequestUpdate } from './dto/ticket_request_update.entity';
import { TicketResponseConsultaMonto } from './dto/ticket_response_consulta_monto.entity';
import { TicketResponseConsultarContribuyente } from './dto/ticket_response_consultar_contribuyente.entity';
import { HttpService } from 'src/common/http.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/common/api-response.type';
import { ExternalApiException } from 'src/common/external-api.exception';
import { TicketResponseGenerateInvoice } from './dto/ticket_response_generate_invoice';
import { TicketRequestGenerateInvoice } from './dto/ticket_request_generate_invoice';
import { TicketResponseExit } from './dto/ticket_response_exit';
import externalApiConfig from 'src/config/external-api.config';
import { TICKET_ENDPOINTS } from './constants/endpoints';
import issuerMap from './constants/issuer-map.json';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    @Inject(externalApiConfig.KEY)
    private readonly config: ConfigType<typeof externalApiConfig>,
  ) {}

  async create(
    data: TicketRequestCreate,
  ): Promise<ApiResponse<TicketResponseCreate>> {
    return await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const localStr = now.toLocaleString('sv-SE', {
        timeZone: 'America/Asuncion',
      });
      const entry_date = new Date(localStr.replace(' ', 'T') + 'Z');

      if (!data.nfc) {
        try {
          this.logger.log(
            `Creando ticket en BD: ${JSON.stringify({ ...data, entry_date })}`,
          );
          await tx.ticket.create({
            data: { ticket_code: data.ticket_code, entry_date },
          });
        } catch (error) {
          this.logger.error(
            'Error al crear ticket en base de datos',
            (error as Error).message,
          );
          throw new InternalServerErrorException('Error al crear ticket');
        }
      }

      try {
        const payload = {
          codigo_ticket: data.ticket_code,
          fecha_ingreso: entry_date,
          nfc: data.nfc,
        };
        this.logger.log(`Enviando a API externa: ${JSON.stringify(payload)}`);
        return await this.httpService.post<TicketResponseCreate>(
          `${this.config.baseUrl}${TICKET_ENDPOINTS.REGISTRAR_TICKET}`,
          payload,
        );
      } catch (error) {
        if (error instanceof ExternalApiException) {
          this.logger.warn(
            'API externa rechazó el registro del ticket',
            error.getResponse(),
          );
          throw error;
        }
        this.logger.error(
          'Error al registrar ticket en API externa',
          (error as Error).message,
        );
        throw new InternalServerErrorException(
          'Error al registrar ticket en sistema externo',
        );
      }

      return {
        status: 'success',
        data: {
          codigo_ticket: data.ticket_code,
          fecha_ingreso: entry_date.toISOString(),
          message: 'Ticket registrado correctamente',
        },
        error: null,
        meta: {
          trace_id: '',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version ?? '1.0.0',
        },
      };
    });
  }

  async updateExitDate(
    data: TicketRequestUpdate,
  ): Promise<TicketResponseUpdate> {
    const ticket = await this.ticketRepository.updateExitDate(data);

    return {
      ticket_code: ticket.ticket_code,
      exit_date: ticket.exit_date,
    };
  }

  async consultarContribuyente(
    documento: string,
  ): Promise<ApiResponse<TicketResponseConsultarContribuyente>> {
    try {
      return await this.httpService.get<TicketResponseConsultarContribuyente>(
        `${this.config.baseUrl}${TICKET_ENDPOINTS.CONSULTAR_CONTRIBUYENTE}?documento=${documento}`,
      );
    } catch (error) {
      if (error instanceof ExternalApiException) {
        this.logger.warn(
          'API externa rechazó la consulta de contribuyente',
          error.getResponse(),
        );
        throw error;
      }
      this.logger.error(
        'Error al consultar contribuyente en API externa',
        (error as Error).message,
      );
      throw new InternalServerErrorException(
        'Error al consultar contribuyente',
      );
    }
  }

  async consultaMonto(
    ticket_code: string,
    documento: string,
  ): Promise<ApiResponse<TicketResponseConsultaMonto>> {
    try {
      return await this.httpService.get<TicketResponseConsultaMonto>(
        `${this.config.baseUrl}${TICKET_ENDPOINTS.CONSULTA_MONTO}?codigo_ticket=${ticket_code}&documento=${documento}`,
      );
    } catch (error) {
      if (error instanceof ExternalApiException) {
        this.logger.warn(
          'API externa rechazó la consulta de monto',
          error.getResponse(),
        );
        throw error;
      }
      this.logger.error(
        'Error al consultar monto en API externa',
        (error as Error).message,
      );
      throw new InternalServerErrorException('Error al consultar monto');
    }
  }

  async generateInvoice(
    data: TicketRequestGenerateInvoice,
  ): Promise<ApiResponse<TicketResponseGenerateInvoice>> {
    try {
      const response =
        await this.httpService.post<TicketResponseGenerateInvoice>(
          `${this.config.baseUrl}${TICKET_ENDPOINTS.GENERAR_FACTURA}`,
          {
            codigo_ticket: data.ticket_code,
            monto: data.amount,
            id_expediente: data.id_expediente ?? null,
            ruc: data.ruc ?? '',
            a_nombre_de: data.a_nombre_de ?? '',
            correo_electronico: data.correo_electronico ?? '',
            ip_address: data.ip_address ?? '',
            hostname: data.hostname ?? '',
            nro_boleta: data.nro_boleta ?? '',
            forma_pago: data.issuer_id
              ? ((issuerMap as Record<string, string>)[data.issuer_id] ?? '')
              : '',
          },
        );
      this.logger.log(`Respuesta generateInvoice: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      if (error instanceof ExternalApiException) {
        this.logger.warn(
          'API externa rechazó la generación de factura',
          error.getResponse(),
        );
        throw error;
      }
      this.logger.error(
        'Error al generar factura en API externa',
        (error as Error).message,
      );
      throw new InternalServerErrorException('Error al generar factura');
    }
  }

  async exit(
    ticket_code: string,
    nfc: boolean,
  ): Promise<ApiResponse<TicketResponseExit>> {
    try {
      const response = await this.httpService.post<TicketResponseExit>(
        `${this.config.baseUrl}${TICKET_ENDPOINTS.EGRESO}`,
        { codigo_ticket: ticket_code, nfc },
      );

      try {
        const exitNow = new Date();
        const exitLocalStr = exitNow.toLocaleString('sv-SE', {
          timeZone: 'America/Asuncion',
        });
        const exit_date = new Date(exitLocalStr.replace(' ', 'T') + 'Z');
        await this.updateExitDate({ ticket_code, exit_date });
      } catch {
        this.logger.warn(
          `Ticket ${ticket_code} no encontrado en BD, exit_date no actualizado`,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof ExternalApiException) {
        this.logger.warn(
          'API externa rechazó el egreso del ticket',
          error.getResponse(),
        );
        throw error;
      }
      this.logger.error(
        'Error al registrar salida del ticket',
        (error as Error).message,
      );
      throw new InternalServerErrorException('Error al registrar salida');
    }
  }
}
