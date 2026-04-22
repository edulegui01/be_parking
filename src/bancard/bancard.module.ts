import { Module } from '@nestjs/common';
import { BancardService } from './bancard.service';
import { BancardController } from './bancard.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BancardController],
  providers: [BancardService, PrismaService],
  exports: [BancardService],
})
export class BancardModule {}
