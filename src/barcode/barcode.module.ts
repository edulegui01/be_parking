import { Module } from '@nestjs/common';
import { BarcodeService } from './barcode.service';
import { BarcodeController } from './barcode.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrinterModule } from 'src/printer/printer.module';

@Module({
  imports: [PrinterModule],
  controllers: [BarcodeController],
  providers: [BarcodeService, PrismaService],
  exports: [BarcodeService],
})
export class BarcodeModule {}
