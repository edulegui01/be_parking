import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { NfcTagService } from './nfc-tag.service';
import { CreateNfcTagDto, UpdateNfcTagDto } from './dto/nfc-tag.dto';

@Controller('nfc-tag')
export class NfcTagController {
  constructor(private readonly nfcTagService: NfcTagService) {}

  @Get('exists/:code')
  existsByCode(@Param('code') code: string) {
    return this.nfcTagService.existsByCode(code);
  }

  @Post()
  create(@Body() data: CreateNfcTagDto) {
    return this.nfcTagService.create(data);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateNfcTagDto) {
    return this.nfcTagService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nfcTagService.remove(id);
  }
}
