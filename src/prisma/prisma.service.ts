import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error('Error connecting to the database:', error);
    }
  }
}
