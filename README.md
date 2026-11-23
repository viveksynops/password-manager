# Company Vault

A secure, internal credential and environment variable management system.

## Monorepo Layout

This repository is structured as an npm-workspaces monorepo:
- `apps/web`: Next.js web application
- `supabase/`: Database migrations, schema, and local configuration
- `docs/`: Technical specifications and architecture documentation

## Getting Started

From the repository root:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Run linting
npm run lint

# Run unit tests
npm run test

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
