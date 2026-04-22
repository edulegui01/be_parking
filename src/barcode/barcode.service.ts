import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrinterService } from 'src/printer/printer.service';
import { GenerateBarcodeResponse } from './dto/barcode.dto';

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);
  private readonly barcodeApiUrl = `http://${process.env.BARCODE_MACHINE_IP}:8080`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly printerService: PrinterService,
  ) {}

  async generateBarcode(): Promise<string> {
    const now = new Date();

    let barcode: string;
    try {
      const response = await fetch(`${this.barcodeApiUrl}/generate-barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          u32InTimeSecond: Math.floor(now.getTime() / 1000),
          u32ChargeTimeSecond: 0,
          szInChannelID: process.env.BARCODE_CHANNEL_ID,
          szChargeChannelID: '',
          fActualAmount: 0.0,
          u16Number: Math.floor(Math.random() * 65535) + 1,
        }),
      });
      const data = (await response.json()) as GenerateBarcodeResponse;
      barcode = data.barcode;
    } catch (error) {
      this.logger.error(
        'Error al conectar con el servicio del totem',
        (error as Error).message,
      );
      throw new InternalServerErrorException(
        'Error al conectar con el servicio del totem',
      );
    }

    try {
      // await this.prisma.ticket.create({
      //   data: {
      //     ticket_code: barcode,
      //     entry_date: now,
      //     is_auxiliary_ticket: true,
      //   },
      // });
    } catch (error) {
      this.logger.error(
        'Error al guardar ticket en base de datos',
        (error as Error).message,
      );
      throw error;
    }

    // await this.printerService.printAuxiliaryTicket({
    //   barcode,
    //   entry_date: now,
    // });

    return barcode;
  }

  async generateQrPng(barcode: string): Promise<Buffer> {
    this.logger.log(`Generating QR PNG for barcode: ${barcode}`);
    return QRCode.toBuffer(barcode);
  }
}
