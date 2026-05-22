import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BancardService } from 'src/bancard/bancard.service';
import { TicketService } from 'src/ticket/ticket.service';
import { PagoRequestDto } from './dto/pago-request.dto';
import { ApiResponse } from 'src/common/api-response.type';
import { TicketResponseGenerateInvoice } from 'src/ticket/dto/ticket_response_generate_invoice';

@Injectable()
export class PagoService {
  private readonly logger = new Logger(PagoService.name);

  private readonly printAgentPort = process.env.PRINT_AGENT_PORT ?? '3001';

  constructor(
    private readonly prisma: PrismaService,
    private readonly bancardService: BancardService,
    private readonly ticketService: TicketService,
  ) {}

  private normalizeIp(ip: string): string {
    return ip.replace(/^::ffff:/, '');
  }

  private async getNextFacturaNro(): Promise<number> {
    const counter = await this.prisma.facturaCounter.upsert({
      where: { id: 1 },
      update: { current: { increment: 1 } },
      create: { id: 1, current: 1 },
    });
    return counter.current;
  }

  private async callPrintAgent(
    clientIp: string,
    invoice: TicketResponseGenerateInvoice,
  ): Promise<void> {
    try {
      await fetch(`http://${clientIp}:${this.printAgentPort}/print/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      this.logger.log(
        `Solicitud de impresión enviada al agente en ${clientIp}`,
      );
    } catch (error) {
      this.logger.warn(
        `Agente de impresión no disponible en ${clientIp}`,
        (error as Error).message,
      );
    }
  }

  async pagarTarjeta(
    data: PagoRequestDto,
    clientIp: string,
  ): Promise<ApiResponse<TicketResponseGenerateInvoice>> {
    clientIp = this.normalizeIp(clientIp);
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticket_code: data.ticket_code },
    });

    const facturaNro = await this.getNextFacturaNro();
    this.logger.log(`Iniciando pago tarjeta para ticket ${data.ticket_code}`);
    const { bin, nsu } = await this.bancardService.iniciarPagoTarjeta({
      facturaNro,
      monto: data.monto,
    }, clientIp);

    this.logger.log(`Confirmando pago tarjeta para ticket ${data.ticket_code}`);
    const { nroBoleta, issuerId } = await this.bancardService.confirmarPagoTarjeta({
      bin,
      nsu,
      monto: data.monto,
    }, clientIp);

    if (ticket) {
      await this.prisma.pago.create({
        data: {
          amount: data.monto,
          payment_date: new Date(),
          ticket_id: ticket.id,
        },
      });
      this.logger.log(`Pago registrado en BD para ticket ${data.ticket_code}`);
    } else {
      this.logger.warn(
        `Ticket ${data.ticket_code} no encontrado en BD, pago no registrado`,
      );
    }

    const invoice = await this.ticketService.generateInvoice({
      ticket_code: data.ticket_code,
      amount: data.monto,
      id_expediente: data.id_expediente ?? null,
      ruc: data.ruc,
      a_nombre_de: data.a_nombre_de,
      correo_electronico: data.correo_electronico,
      ip_address: clientIp,
      hostname: data.hostname,
      nro_boleta: nroBoleta,
      issuer_id: issuerId,
    });

    if (invoice.data) {
      await this.callPrintAgent(clientIp, invoice.data);
    }
    return invoice;
  }

  async pagarQr(
    data: PagoRequestDto,
    clientIp: string,
  ): Promise<ApiResponse<TicketResponseGenerateInvoice>> {
    clientIp = this.normalizeIp(clientIp);
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticket_code: data.ticket_code },
    });

    const facturaNro = await this.getNextFacturaNro();
    this.logger.log(`Iniciando pago QR para ticket ${data.ticket_code}`);
    const { nroBoleta, issuerId } = await this.bancardService.pagoQr({
      facturaNro,
      monto: data.monto,
    }, clientIp);

    if (ticket) {
      await this.prisma.pago.create({
        data: {
          amount: data.monto,
          payment_date: new Date(),
          ticket_id: ticket.id,
        },
      });
      this.logger.log(`Pago registrado en BD para ticket ${data.ticket_code}`);
    } else {
      this.logger.warn(
        `Ticket ${data.ticket_code} no encontrado en BD, pago no registrado`,
      );
    }

    const invoice = await this.ticketService.generateInvoice({
      ticket_code: data.ticket_code,
      amount: data.monto,
      id_expediente: data.id_expediente ?? null,
      ruc: data.ruc,
      a_nombre_de: data.a_nombre_de,
      correo_electronico: data.correo_electronico,
      ip_address: clientIp,
      hostname: data.hostname,
      nro_boleta: nroBoleta,
      issuer_id: issuerId,
    });

    if (invoice.data) {
      await this.callPrintAgent(clientIp, invoice.data);
    }
    return invoice;
  }
}
