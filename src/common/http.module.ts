import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import externalApiConfig from 'src/config/external-api.config';
import { HttpService } from './http.service';

@Module({
  imports: [ConfigModule.forFeature(externalApiConfig)],
  providers: [HttpService],
  exports: [HttpService],
})
export class HttpModule {}
