import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpService } from 'src/common/http.service';
import { ExternalApiException } from 'src/common/external-api.exception';
import externalApiConfig from 'src/config/external-api.config';
import { TICKET_ENDPOINTS } from 'src/ticket/constants/endpoints';

@Injectable()
export class TicketSyncService {
  private readonly logger = new Logger(TicketSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    @Inject(externalApiConfig.KEY)
    private readonly config: ConfigType<typeof externalApiConfig>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryPendingTickets(): Promise<void> {
    const pending = await this.prisma.pending_ticket_request.findMany({
      where: { status: 'pending' },
      take: 20,
    });

    for (const request of pending) {
      try {
        await this.httpService.post(
          `${this.config.baseUrl}${TICKET_ENDPOINTS.REGISTRAR_TICKET}`,
          JSON.parse(request.payload),
        );
        await this.prisma.pending_ticket_request.update({
          where: { id: request.id },
          data: { status: 'success', last_error: null },
        });
        this.logger.log(
          `Ticket ${request.ticket_code} sincronizado correctamente con la API externa`,
        );
      } catch (error) {
        if (error instanceof ExternalApiException) {
          await this.prisma.pending_ticket_request.update({
            where: { id: request.id },
            data: {
              status: 'failed',
              attempts: { increment: 1 },
              last_error: JSON.stringify(error.getResponse()),
            },
          });
          this.logger.warn(
            `API externa rechazó la sincronización del ticket ${request.ticket_code}`,
            error.getResponse(),
          );
          continue;
        }

        await this.prisma.pending_ticket_request.update({
          where: { id: request.id },
          data: {
            attempts: { increment: 1 },
            last_error: (error as Error).message,
          },
        });
        this.logger.warn(
          `Reintento de sincronización fallido para el ticket ${request.ticket_code}`,
          (error as Error).message,
        );
      }
    }
  }
}
