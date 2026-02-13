# Development Setup

## Prerequisites

- Node.js 24.5.0+
- Python 3.13.3+
- Docker 19.03.1+
- Ollama (optional, for local models)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```

3. Or use Docker:
   ```bash
   npm run docker:up
   ```

## Project Structure

- `frontend/` - Next.js frontend with CopilotKit
- `q-and-a-orchestra-agent/` - FastAPI backend
- `infra/docker/` - Docker Compose configuration
- `docs/` - Documentation

## Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run test` - Run all tests
- `npm run docker:up` - Start with Docker Compose
- `npm run docker:down` - Stop Docker Compose
