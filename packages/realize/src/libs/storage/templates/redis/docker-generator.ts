/**
 * Redis Docker Compose Generator
 */
import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateRedisDocker(context: TemplateContext): string {
  const { instance } = context;
  const instanceName = instance?.name || 'redis';
  return `# Redis Docker Compose for ${instanceName}
# TODO: Implement full Redis docker generator
version: '3.8'
services:
  ${instanceName}:
    image: redis:7-alpine
    ports:
      - "6379:6379"
`;
}
