# Agent Orchestra Production Build

**Enterprise-grade multi-agent orchestration system with CopilotKit integration for AI-human collaboration.**

A production-ready full-stack system that orchestrates specialized AI agents for software development tasks, featuring intelligent model routing, multi-tenancy, budget management, and a modern React frontend with real-time human-in-the-loop workflows.

---

## 🎯 What It Does

Agent Orchestra is a comprehensive AI-powered development platform that:

- **Analyzes repositories** to understand codebase structure and architecture
- **Extracts requirements** from project specifications and user stories
- **Designs architectures** tailored to specific project needs
- **Creates implementation plans** with detailed step-by-step guidance
- **Validates implementations** against best practices and requirements
- **Routes intelligently** between local and cloud LLMs based on task complexity and cost
- **Enables human collaboration** through CopilotKit integration with approval workflows
- **Provides real-time monitoring** via modern React dashboard with WebSocket updates

### 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                           │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Dashboard   │ CopilotKit  │ WebSocket   │ State Mgmt  │  │
│  │ UI          │ Integration │ Updates     │ (Zustand)   │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway (FastAPI)                    │
├─────────────────────────────────────────────────────────────┤
│  Security │ Rate Limit │ CORS │ Audit │ Multi-tenancy       │
├─────────────────────────────────────────────────────────────┤
│                   Model Router (Core)                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │   Local     │   Cloud     │   Hybrid    │   Fallback  │  │
│  │   Models    │   Models    │   Routing   │   Mechanism │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Agent Orchestrator                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Repository  │ Requirements│ Architecture│ Implementation│ │
│  │ Analyzer    │ Extractor   │ Designer    │ Planner      │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│              Enterprise Features (v2)                       │
│  • Semantic Caching  • Analytics  • Budget Mgmt  • Audit    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** (3.13 compatible)
- **Node.js 18+** and **npm** for frontend
- **Ollama** (for local models) - Optional but recommended
- **Redis** (for caching and message bus)
- **PostgreSQL** (for audit logs and analytics)

### Installation

```bash
# Clone the repository
git clone https://github.com/stackconsult/agent-orchestra-production-build-tmp
cd agent-orchestra-production-build-tmp

# Setup Backend
cd q-and-a-orchestra-agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup Frontend
cd ../frontend
npm install

# Setup environment
cp ../q-and-a-orchestra-agent/.env.example ../q-and-a-orchestra-agent/.env
cp .env.local.example .env.local
# Edit .env files with your configuration
```

### Environment Configuration

**Backend (.env):**

```bash
# Core Configuration
ENV=development
DEBUG=true
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/orchestra
REDIS_URL=redis://localhost:6379/0

# Local Models (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
MODEL_ROUTING_MODE=local-preferred

# Cloud API Keys (Optional - for fallback)
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# CORS Configuration
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local):**

```bash
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_COPKIT_URL=http://localhost:8000/copilotkit
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Development/Production
NODE_ENV=development

# Feature Flags
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Running the System

**Start Backend:**

```bash
cd q-and-a-orchestra-agent
python main_v2.py
```

**Start Frontend:**

```bash
cd frontend
npm run dev
```

**Access the Application:**

- Frontend Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

---

## 🎨 Frontend Features

### CopilotKit Integration

The React frontend provides seamless AI-human collaboration:

- **Agent Orchestration Dashboard** - Real-time monitoring of agent status and progress
- **Human Approval Workflows** - Interactive approval modals for critical actions
- **Human Input Collection** - Dynamic forms for gathering additional context
- **WebSocket Updates** - Live status updates without page refresh
- **State Management** - Zustand-based consistent state across components

### Key Components

- **AgentOrchestraDashboard** - Main dashboard with agent status and controls
- **ApprovalModal** - Interactive approval interface for critical operations
- **InputModal** - Dynamic input collection for various data types
- **useAgentOrchestration** - Hook for agent task execution
- **useHumanApproval** - Hook for human-in-the-loop workflows

### Frontend Architecture

```typescript
// Example: Using CopilotKit hooks
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';

function MyComponent() {
  const { isExecuting, currentTask } = useAgentOrchestration();
  
  // Component logic with real-time agent status
}
```

---

## 📚 API Documentation

### Core Endpoints

#### Chat with the Orchestra

```http
POST /v2/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Analyze my React project and suggest improvements",
  "session_id": "optional-session-id",
  "context": {
    "repository_path": "/path/to/repo",
    "task_type": "analysis"
  }
}
```

#### CopilotKit Integration

```http
POST /copilotkit/actions
Content-Type: application/json

{
  "name": "executeAgentTask",
  "parameters": {
    "agent_type": "repository_analyzer",
    "task_description": "Analyze the codebase structure",
    "parameters": {
      "repository_path": "/path/to/repo"
    }
  }
}
```

#### Human-in-the-Loop

```http
POST /copilotkit/messages
Content-Type: application/json

{
  "type": "human_approval_request",
  "data": {
    "action_id": "unique-action-id",
    "action_type": "deployment",
    "description": "Deploy to production environment",
    "risk_level": "high",
    "estimated_cost": 25.50
  }
}
```

#### List Available Models

```http
GET /v2/models
Authorization: Bearer <token>
```

#### Health Check

```http
GET /health
```

#### Analytics Dashboard

```http
GET /v2/analytics/dashboard?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

### Agent-Specific Operations

The system orchestrates multiple specialized agents:

1. **Repository Analyzer** - Analyzes codebase structure
2. **Requirements Extractor** - Extracts and clarifies requirements
3. **Architecture Designer** - Creates system architectures
4. **Implementation Planner** - Generates detailed implementation plans
5. **Validator** - Validates against best practices

---

## 🔒 Enterprise Security

This system implements comprehensive security controls with **A+ security rating**:

### Security Features

- **CORS Protection**: Environment-based origin configuration
- **Input Validation**: Comprehensive Pydantic schemas with XSS prevention
- **Rate Limiting**: Endpoint-specific limits (10/min for invoke, 5/min for auth)
- **Prompt Injection Detection**: Advanced pattern-based threat detection
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Audit Logging**: SOC 2, HIPAA, GDPR compliant logging
- **Multi-tenancy**: Tenant isolation with context management
- **Budget Management**: Cost controls and spending limits
- **Human Approval**: Critical actions require human confirmation
- **WebSocket Security**: Authenticated real-time connections

### Security Verification

```bash
# Run comprehensive security checks
cd q-and-a-orchestra-agent
./scripts/security_verification.sh

# Expected: All checks PASSED ✅
```

---

## 🏢 Enterprise Features (v2)

### Multi-Tenancy

- Tenant isolation at all levels
- Per-tenant configurations and quotas
- Tenant-specific analytics and reporting

### Budget Management

- Cost tracking per tenant/model
- Configurable budget limits
- Automatic spending alerts
- Cost optimization recommendations

### Advanced Analytics

- Real-time usage metrics
- Model performance analytics
- Cost analysis and trends
- Custom dashboards

### Semantic Caching

- Intelligent response caching
- Semantic similarity matching
- Reduced API costs and latency
- Cache invalidation strategies

### Model Discovery

- Automatic model discovery
- Capability assessment
- Performance benchmarking
- Dynamic model registration

---

## 🛠️ Development

### Project Structure

```text
├── frontend/              # React frontend with CopilotKit
│   ├── src/
│   │   ├── app/          # Next.js app structure
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and configuration
│   │   ├── store/        # Zustand state management
│   │   └── types/        # TypeScript definitions
│   └── package.json
├── q-and-a-orchestra-agent/
│   ├── agents/              # Specialized AI agents
│   ├── core/                # Core routing and orchestration
│   ├── providers/           # LLM provider clients
│   ├── middleware/          # Security and utility middleware
│   ├── schemas/             # Pydantic schemas
│   ├── orchestrator/        # Message orchestration
│   ├── integrations/        # External integrations
│   ├── enterprise/          # Enterprise features
│   ├── config/              # Configuration modules
│   ├── copilotkit_integration.py  # CopilotKit router
│   └── scripts/             # Utility scripts
└── COPILOTKIT_INTEGRATION.md  # Detailed integration docs
```

### Running Tests

**Backend Tests:**

```bash
# Run all tests
cd q-and-a-orchestra-agent
pytest tests/ -v

# Run security tests
pytest tests/test_security.py -v

# Run with coverage
pytest --cov=. tests/
```

**Frontend Tests:**

```bash
cd frontend
npm test
npm run test:coverage
```

### Code Quality

**Backend:**

```bash
# Lint code
flake8 .

# Format code
black .

# Type checking
mypy .

# Security scan
safety scan
bandit -r .
```

**Frontend:**

```bash
# Lint and format
npm run lint
npm run format

# Type checking
npm run type-check

# Build check
npm run build
```

---

## 📊 Monitoring & Observability

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/api/health
```

### Metrics

- Request latency and throughput
- Model usage statistics
- Error rates and types
- Cost tracking
- Cache hit rates
- WebSocket connection status
- Human approval metrics

### Logging

- Structured JSON logging
- Configurable log levels
- Audit trail for all actions
- Performance tracing
- Frontend error tracking

---

## 🐳 Docker Deployment

```bash
# Build backend image
cd q-and-a-orchestra-agent
docker build -t agent-orchestra-backend .

# Build frontend image
cd ../frontend
docker build -t agent-orchestra-frontend .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## ☸️ Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f deployment/kubernetes/

# Check status
kubectl get pods -n orchestra

# Port forward
kubectl port-forward svc/orchestra-api 8000:80
kubectl port-forward svc/orchestra-frontend 3000:80
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: See the `/docs` directory and `COPILOTKIT_INTEGRATION.md`
- **Issues**: Create an issue on GitHub
- **Security**: Report security issues to <security@example.com>

---

## 🎯 Roadmap

- [x] ✅ CopilotKit integration with React frontend
- [x] ✅ Real-time WebSocket updates
- [x] ✅ Human approval workflows
- [x] ✅ TypeScript type safety
- [ ] Additional model providers (Cohere, Hugging Face)
- [ ] Advanced agent customization
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom agents
- [ ] GraphQL API support
- [ ] Mobile application

---

## Acknowledgments

Built with ❤️ for the developer community

Special thanks to the CopilotKit team for enabling seamless AI-human collaboration.
