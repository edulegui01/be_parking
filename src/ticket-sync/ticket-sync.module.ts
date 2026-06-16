import { Module } from '@nestjs/common';
import { TicketSyncService } from './ticket-sync.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpModule } from 'src/common/http.module';

@Module({
  imports: [HttpModule],
  providers: [TicketSyncService, PrismaService],
})
export class TicketSyncModule {}
