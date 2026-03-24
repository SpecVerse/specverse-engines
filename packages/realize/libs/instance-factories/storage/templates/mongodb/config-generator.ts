/**
 * MongoDB Configuration Generator
 */
import type { TemplateContext } from '@specverse/engine-realize';

export default function generateMongoDBConfig(context: TemplateContext): string {
  const { instance } = context;
  const instanceName = instance?.name || 'mongodb';
  return `// MongoDB configuration for ${instanceName}
// TODO: Implement full MongoDB config generator
export const mongoConfig = {
  url: process.env.MONGO_URL || 'mongodb://localhost:27017/${instanceName}'
};
`;
}
