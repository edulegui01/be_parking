import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { TicketRepository } from './ticket.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrinterModule } from 'src/printer/printer.module';
import { HttpModule } from 'src/common/http.module';

@Module({
  imports: [PrinterModule, HttpModule],
  providers: [TicketService, TicketRepository, PrismaService],
  controllers: [TicketController],
  exports: [TicketService],
})
export class TicketModule {}
