import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketModule } from './ticket/ticket.module';
import { PrismaService } from './prisma/prisma.service';
import { BancardModule } from './bancard/bancard.module';
import { BarcodeModule } from './barcode/barcode.module';
import { PagoModule } from './pago/pago.module';
import { NfcTagModule } from './nfc-tag/nfc-tag.module';
import { TicketSyncModule } from './ticket-sync/ticket-sync.module';
import externalApiConfig from './config/external-api.config';
import emisorConfig from './config/emisor.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [externalApiConfig, emisorConfig],
    }),
    ScheduleModule.forRoot(),
    TicketModule,
    BancardModule,
    BarcodeModule,
    PagoModule,
    NfcTagModule,
    TicketSyncModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
