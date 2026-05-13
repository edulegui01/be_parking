import { Module } from '@nestjs/common';
import { PagoService } from './pago.service';
import { PagoController } from './pago.controller';
import { BancardModule } from 'src/bancard/bancard.module';
import { TicketModule } from 'src/ticket/ticket.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [BancardModule, TicketModule],
  controllers: [PagoController],
  providers: [PagoService, PrismaService],
})
export class PagoModule {}
