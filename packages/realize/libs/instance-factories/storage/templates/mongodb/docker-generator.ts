/**
 * MongoDB Docker Compose Generator
 */
import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateMongoDBDocker(context: TemplateContext): string {
  const { instance } = context;
  const instanceName = instance?.name || 'mongodb';
  return `# MongoDB Docker Compose for ${instanceName}
# TODO: Implement full MongoDB docker generator
version: '3.8'
services:
  ${instanceName}:
    image: mongo:6
    ports:
      - "27017:27017"
`;
}
