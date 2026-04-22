import { registerAs } from '@nestjs/config';

export default registerAs('externalApi', () => ({
  baseUrl: process.env.EXTERNAL_API_URL,
  username: process.env.EXTERNAL_API_USERNAME,
  password: process.env.EXTERNAL_API_PASSWORD,
}));
