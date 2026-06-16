import { registerAs } from '@nestjs/config';

export default registerAs('externalApi', () => ({
  baseUrl: process.env.EXTERNAL_API_URL,
  username: process.env.EXTERNAL_API_USERNAME,
  password: process.env.EXTERNAL_API_PASSWORD,
  retryAttempts: Number(process.env.EXTERNAL_API_RETRY_ATTEMPTS ?? 2),
  retryDelayMs: Number(process.env.EXTERNAL_API_RETRY_DELAY_MS ?? 500),
}));
