import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiKeyGuard } from 'src/common/api-key.guard';
import { BarcodeService } from './barcode.service';

@UseGuards(ApiKeyGuard)
@Controller('barcode')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Get('qr')
  async getQr(@Res() res: Response): Promise<void> {
    const barcode = await this.barcodeService.generateBarcode();
    //const barcode = 'TEST-1234';
    const png = await this.barcodeService.generateQrPng(barcode);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Barcode-Code', barcode);
    res.send(png);
  }
}
