/**
 * Redis Configuration Generator
 */
import type { TemplateContext } from '@specverse/engine-realize';

export default function generateRedisConfig(context: TemplateContext): string {
  const { instance } = context;
  const instanceName = instance?.name || 'redis';
  return `// Redis configuration for ${instanceName}
// TODO: Implement full Redis config generator
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};
`;
}
