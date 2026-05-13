import { Module } from '@nestjs/common';
import { NfcTagService } from './nfc-tag.service';
import { NfcTagController } from './nfc-tag.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [NfcTagController],
  providers: [NfcTagService, PrismaService],
})
export class NfcTagModule {}
