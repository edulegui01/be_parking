import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} from 'node-thermal-printer';
import { XMLParser } from 'fast-xml-parser';
import emisorConfig from 'src/config/emisor.config';
import { TicketResponseGenerateInvoice } from 'src/ticket/dto/ticket_response_generate_invoice';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false });

  constructor(
    @Inject(emisorConfig.KEY)
    private readonly emisor: ConfigType<typeof emisorConfig>,
  ) {}

  private createPrinter(): ThermalPrinter {
    return new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: os.tmpdir() + '/thermal_print.bin',
      characterSet: CharacterSet.PC858_EURO,
      breakLine: BreakLine.CHARACTER,
      removeSpecialCharacters: false,
      lineCharacter: '-',
      options: { timeout: 3000 },
    });
  }

  private async executePrint(printer: ThermalPrinter): Promise<void> {
    const printerName = process.env.PRINTER_NAME ?? '80mm Series Printer';
    const tmpFile = path.join(os.tmpdir(), 'thermal_print.bin');
    const scriptPath = path.join(process.cwd(), 'scripts', 'raw-print.ps1');
    await printer.execute();
    const cmd = `powershell -NonInteractive -ExecutionPolicy Bypass -File "${scriptPath}" -FilePath "${tmpFile}" -PrinterName "${printerName}"`;
    this.logger.log(`Ejecutando impresión en: ${printerName}`);
    const output = execSync(cmd).toString();
    this.logger.log(output.trim());
  }

  async printEntryTicket(params: {
    ticket_code: string;
    entry_date: Date;
  }): Promise<void> {
    const printer = this.createPrinter();
    const dateStr = this.formatDate(params.entry_date);
    const timeStr = this.formatTime(params.entry_date);

    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('ESTACIONAMIENTO');
    printer.bold(false);
    printer.drawLine();

    printer.alignCenter();
    printer.println('TICKET DE INGRESO');
    printer.newLine();

    printer.alignLeft();
    printer.println(`Fecha:  ${dateStr}`);
    printer.println(`Hora:   ${timeStr}`);
    printer.newLine();

    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(2, 2);
    printer.println(params.ticket_code);
    printer.setTextSize(1, 1);
    printer.bold(false);
    printer.newLine();

    printer.drawLine();
    printer.alignCenter();
    printer.println('Conserve este ticket');
    printer.cut();

    try {
      await this.executePrint(printer);
      this.logger.log(`Ticket de ingreso impreso: ${params.ticket_code}`);
    } catch (error) {
      this.logger.warn(
        'Impresora no disponible, se omite la impresión',
        (error as Error).message,
      );
    }
  }

  async printAuxiliaryTicket(params: {
    barcode: string;
    entry_date: Date;
  }): Promise<void> {
    const printer = this.createPrinter();
    const dateStr = this.formatDate(params.entry_date);
    const timeStr = this.formatTime(params.entry_date);

    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('ESTACIONAMIENTO');
    printer.bold(false);
    printer.drawLine();

    printer.alignCenter();
    printer.println('TICKET AUXILIAR');
    printer.newLine();

    printer.alignLeft();
    printer.println(`Fecha:  ${dateStr}`);
    printer.println(`Hora:   ${timeStr}`);
    printer.newLine();

    printer.alignCenter();
    printer.printQR(params.barcode, {
      cellSize: 6,
      correction: 'M',
      model: 2,
    });
    printer.newLine();

    printer.drawLine();
    printer.alignCenter();
    printer.println('Conserve este ticket');
    printer.cut();

    try {
      await this.executePrint(printer);
      this.logger.log(`Ticket auxiliar impreso: ${params.barcode}`);
    } catch (error) {
      this.logger.warn(
        'Impresora no disponible, se omite la impresión',
        (error as Error).message,
      );
    }
  }

  async printExitReceipt(params: {
    ticket_code: string;
    entry_date: Date;
    exit_date: Date;
    amount: number;
  }): Promise<void> {
    const printer = this.createPrinter();
    const entryStr = `${this.formatDate(params.entry_date)} ${this.formatTime(params.entry_date)}`;
    const exitStr = `${this.formatDate(params.exit_date)} ${this.formatTime(params.exit_date)}`;

    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('ESTACIONAMIENTO');
    printer.bold(false);
    printer.drawLine();

    printer.alignCenter();
    printer.println('COMPROBANTE DE PAGO');
    printer.newLine();

    printer.alignLeft();
    printer.println(`Ticket: ${params.ticket_code}`);
    printer.println(`Ingreso: ${entryStr}`);
    printer.println(`Salida:  ${exitStr}`);
    printer.newLine();

    printer.drawLine();
    printer.alignLeft();
    printer.bold(true);
    printer.println(`TOTAL A PAGAR:`);
    printer.alignRight();
    printer.setTextSize(2, 1);
    printer.println(`Gs. ${this.formatAmount(params.amount)}`);
    printer.setTextSize(1, 1);
    printer.bold(false);
    printer.drawLine();

    printer.alignCenter();
    printer.println('Gracias por su visita');
    printer.cut();

    try {
      await this.executePrint(printer);
      this.logger.log(`Comprobante de salida impreso: ${params.ticket_code}`);
    } catch (error) {
      this.logger.warn(
        'Impresora no disponible, se omite la impresión',
        (error as Error).message,
      );
    }
  }

  async printInvoice(invoice: TicketResponseGenerateInvoice): Promise<void> {
    const printer = this.createPrinter();
    const parsed = this.xmlParser.parse(invoice.xml);
    const DE =
      parsed?.['soapenv:Envelope']?.['soapenv:Body']?.procesarLoteRequest
        ?.procesarDocumento?.rDE?.DE;

    const gTimb = DE?.gTimb ?? {};
    const gDatGralOpe = DE?.gDatGralOpe ?? {};
    const gDatRec = gDatGralOpe?.gDatRec ?? {};
    const gDtipDE = DE?.gDtipDE ?? {};
    const gCamCond = gDtipDE?.gCamCond ?? {};
    const gTotSub = DE?.gTotSub ?? {};

    const timbrado = String(gTimb.dNumTim ?? '');
    const fechaIniT = String(gTimb.dFeIniT ?? '');
    const est = String(gTimb.dEst ?? '').padStart(3, '0');
    const pun = String(gTimb.dPunExp ?? '').padStart(3, '0');
    const num = String(gTimb.dNumDoc ?? '').padStart(7, '0');
    const facturaNum = `${est}-${pun}-${num}`;

    const nomRec = String(gDatRec.dNomRec ?? 'CONSUMIDOR FINAL');
    const rucRec = gDatRec.dRucRec
      ? `${gDatRec.dRucRec}-${gDatRec.dDVRec ?? 0}`
      : '';
    const ciRec = String(gDatRec.dNumIDRec ?? '');
    const tipoFactura = String(gCamCond.dDCondOpe ?? 'Contado').toUpperCase();

    const fechaEmision = String(gDatGralOpe.dFeEmiDE ?? '');
    const [fechaPart, horaPart] = fechaEmision.split('T');
    const fechaStr = fechaPart ? fechaPart.split('-').reverse().join('/') : '';
    const horaStr = horaPart ? horaPart.substring(0, 8) : '';

    const rawItems = gDtipDE?.gCamItem;
    const items: any[] = Array.isArray(rawItems)
      ? rawItems
      : rawItems
        ? [rawItems]
        : [];

    const rawPagos = gCamCond?.gPaConEIni;
    const pagos: any[] = Array.isArray(rawPagos)
      ? rawPagos
      : rawPagos
        ? [rawPagos]
        : [];

    const subExe = Math.round(Number(gTotSub.dSubExe ?? 0));
    const sub5 = Math.round(Number(gTotSub.dSub5 ?? 0));
    const sub10 = Math.round(Number(gTotSub.dSub10 ?? 0));
    const iva5 = Math.round(Number(gTotSub.dIVA5 ?? 0));
    const iva10 = Math.round(Number(gTotSub.dIVA10 ?? 0));
    const totalIva = Math.round(Number(gTotSub.dTotIVA ?? 0));
    const totalGeneral = Math.round(Number(gTotSub.dTotGralOpe ?? 0));

    // Anchos de columna para 48 chars: cod(7) desc(18) cant(7) importe(9) iva(3) + 4 espacios
    const W = 48;
    const fmt = this.formatAmount.bind(this);
    const gs = (n: number) => `G ${fmt(n)}`;
    const row = (left: string, right: string) =>
      left + right.padStart(W - left.length);
    const itemRow = (
      cod: string,
      desc: string,
      cant: string,
      imp: string,
      iva: string,
    ) => {
      const codPart = cod.substring(0, 7).padEnd(7);
      const descPart = desc.substring(0, 18).padEnd(18);
      const cantPart = cant.padStart(7);
      const impPart = imp.padStart(9);
      const ivaPart = iva.padStart(3);
      return `${codPart} ${descPart} ${cantPart} ${impPart} ${ivaPart}`;
    };

    // 1. ENCABEZADO
    printer.alignCenter();
    printer.println('KUDE de Factura Electronica');
    printer.bold(true);
    printer.println(
      `${this.emisor.razonSocial ?? ''} R.U.C. ${this.emisor.ruc ?? ''}`,
    );
    printer.bold(false);
    if (this.emisor.direccion) printer.println(this.emisor.direccion);
    if (this.emisor.telefono) printer.println(`Tel.: ${this.emisor.telefono}`);
    printer.drawLine();

    // 2. TIMBRADO
    printer.alignLeft();
    printer.println(`TIMBRADO Nro.: ${timbrado}  Fecha Inicio: ${fechaIniT}`);
    printer.alignCenter();
    printer.println(`FACTURA Nro.: ${facturaNum}`);
    printer.drawLine();

    // 3. CLIENTE
    printer.alignLeft();
    printer.println(`CLIENTE :${nomRec}`);
    if (ciRec)
      printer.println(`C.I.:     ${ciRec.padEnd(10)} R.U.C.:  ${rucRec}`);
    else if (rucRec) printer.println(`R.U.C.:  ${rucRec}`);
    printer.println(`TIPO FACTURA: ${tipoFactura}`);
    printer.println(`FECHA EMISION:${fechaStr}   HORA:${horaStr}`);
    printer.drawLine();

    // 4. ITEMS
    printer.println(
      itemRow('CODIGO', 'DESC.ARTICULO', 'CANT', 'IMPORTE', 'IVA'),
    );
    printer.drawLine();
    for (const item of items) {
      const codigo = String(item.dCodInt ?? '');
      const desc = String(item.dDesProSer ?? '');
      const cant = Number(item.dCantProSer ?? 1);
      const importe = Math.round(
        Number(
          item.gValorItem?.gValorRestaItem?.dTotOpeItem ??
            item.gValorItem?.dTotOpeItem ??
            0,
        ),
      );
      const tasa = Number(item.gCamIVA?.dTasaIVA ?? 0);
      const cantStr = cant % 1 === 0 ? String(cant) : cant.toFixed(3);
      printer.println(
        itemRow(codigo, desc, cantStr, fmt(importe), String(tasa)),
      );
    }
    printer.drawLine();
    printer.println(row('TOTAL:', gs(totalGeneral)));
    printer.drawLine();

    // 5. DETALLE DE PAGOS
    printer.println('DETALLE DE PAGOS:');
    let totalPagos = 0;
    for (const pago of pagos) {
      const tipoPago = String(pago.dDesTiPag ?? '');
      const montoPago = Math.round(Number(pago.dMonTiPag ?? 0));
      totalPagos += montoPago;
      printer.println(row(tipoPago, gs(montoPago)));
    }
    printer.println(row('TOTAL PAGOS', gs(totalPagos)));
    printer.drawLine();

    // 6. SUB TOTALES
    // Columnas: label(13) liquidacion(17) iva(10) = 40 + espacios
    const subRow = (label: string, liq: string, iva: string) =>
      label.padEnd(13) + liq.padStart(15) + iva.padStart(10);
    printer.println(subRow('SUB TOTALES', 'LIQUIDACION', 'IVA'));
    printer.println(subRow('Exentas  E :', fmt(subExe), fmt(0)));
    printer.println(subRow('Gravado  5%:', fmt(sub5), fmt(iva5)));
    printer.println(subRow('Gravado 10%:', fmt(sub10), fmt(iva10)));
    printer.println(row('', `TOTAL:${fmt(totalIva).padStart(10)}`));
    printer.drawLine();

    // Total items
    printer.println(
      `Total items: ${items.length}    Total articulos vendidos: ${items.length}`,
    );
    printer.newLine();

    // 7. QR
    printer.alignCenter();
    printer.printQR(invoice.url_qr, { cellSize: 4, correction: 'M', model: 2 });
    printer.newLine();

    // 8. PIE
    printer.println('Consulte la validez de esta Factura');
    printer.println('Electronica con el numero de CDC impreso abajo en:');
    printer.println('https://ekuatia.set.gov.py/consultas/');
    printer.println(invoice.cdc);
    printer.newLine();
    printer.println('ESTE DOCUMENTO ES UNA REPRESENTACION');
    printer.println('GRAFICA DE UN DOCUMENTO ELECTRONICO (XML)');
    printer.println(
      'Informacion de interes del facturador electronico emisor.',
    );
    printer.cut();

    try {
      await this.executePrint(printer);
      this.logger.log(`Factura impresa para ticket ${invoice.codigo_ticket}`);
    } catch (error) {
      this.logger.warn(
        'Impresora no disponible, se omite la impresion de factura',
        (error as Error).message,
      );
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-PY', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatAmount(amount: number): string {
    return amount.toLocaleString('es-PY');
  }
}
