/**
 * .gitignore Generator for React Frontend
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateGitignore(context: TemplateContext): string {
  return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.*.local
`;
}
