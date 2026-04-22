import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrinterService } from './printer.service';
import emisorConfig from 'src/config/emisor.config';

@Module({
  imports: [ConfigModule.forFeature(emisorConfig)],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}
