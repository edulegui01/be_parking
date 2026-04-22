import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import externalApiConfig from 'src/config/external-api.config';
import { ApiResponse } from './api-response.type';
import { ExternalApiException } from './external-api.exception';

@Injectable()
export class HttpService {
  private readonly logger = new Logger(HttpService.name);
  private readonly authHeader: string;

  constructor(
    @Inject(externalApiConfig.KEY)
    private readonly config: ConfigType<typeof externalApiConfig>,
  ) {
    const credentials = Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const rawBody = await response.text().catch(() => '');
    this.logger.error(
      `HTTP ${response.status} ${response.statusText} — body: ${rawBody || '(vacío)'}`,
    );
    throw new Error(
      `HTTP ${response.status}: ${rawBody || response.statusText}`,
    );
  }

  async post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const parsed = (await response.json()) as unknown as ApiResponse<T>;

    if (parsed.status === 'error') {
      throw new ExternalApiException(parsed as ApiResponse<null>);
    }

    return parsed;
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      headers: { Authorization: this.authHeader },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const parsed = (await response.json()) as unknown as ApiResponse<T>;

    if (parsed.status === 'error') {
      throw new ExternalApiException(parsed as ApiResponse<null>);
    }

    return parsed;
  }
}
