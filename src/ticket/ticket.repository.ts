import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketRequestCreate } from './dto/ticket_request_create.entity';
import { ticket } from 'generated/prisma/client';
import { TicketRequestUpdate } from './dto/ticket_request_update.entity';

@Injectable()
export class TicketRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: TicketRequestCreate, entry_date: Date): Promise<ticket> {
    return await this.prisma.ticket.create({
      data: { ...data, entry_date },
    });
  }

  async updateExitDate(data: TicketRequestUpdate): Promise<ticket> {
    return await this.prisma.ticket.update({
      where: { ticket_code: data.ticket_code },
      data: { exit_date: data.exit_date },
    });
  }

  async findByTicketCode(ticket_code: string): Promise<ticket | null> {
    return await this.prisma.ticket.findUnique({
      where: { ticket_code },
    });
  }
}
