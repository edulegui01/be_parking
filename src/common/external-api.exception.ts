import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from './api-response.type';

export class ExternalApiException extends HttpException {
  constructor(apiResponse: ApiResponse<null>) {
    super(apiResponse, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
