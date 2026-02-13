# Getting Started with Agent Orchestra

This guide will help you set up and run the Agent Orchestra system with CopilotKit integration for AI-human collaboration.

## 🎯 Overview

Agent Orchestra is now a full-stack application consisting of:
- **Backend**: FastAPI server with multi-agent orchestration
- **Frontend**: React dashboard with CopilotKit integration
- **Real-time Features**: WebSocket updates and human approval workflows

## 📋 Prerequisites

### Required Software

- **Python 3.11+** (3.13 compatible)
- **Node.js 18+** and **npm** 
- **Redis** (for caching and message bus)
- **PostgreSQL** (for audit logs and analytics)

### Optional but Recommended

- **Ollama** (for local LLM models)
- **Docker** (for containerized deployment)

---

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/stackconsult/ui-ug-orch-tmp.git
cd ui-ug-orch-tmp

# Verify the structure
ls -la
# You should see: frontend/, q-and-a-orchestra-agent/, README.md, etc.
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd q-and-a-orchestra-agent

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install fastapi uvicorn pydantic

# Copy environment configuration
cp .env.example .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install Node.js dependencies
npm install

# Copy environment configuration
cp .env.local.example .env.local
```

### 4. Environment Configuration

**Backend Environment (.env):**

```bash
# Core Configuration
ENV=development
DEBUG=true
SECRET_KEY=your-secret-key-here-change-this
JWT_SECRET_KEY=your-jwt-secret-key-change-this

# Database (optional for basic setup)
DATABASE_URL=sqlite:///./orchestra.db
REDIS_URL=redis://localhost:6379/0

# Local Models (Ollama - optional)
OLLAMA_BASE_URL=http://localhost:11434
MODEL_ROUTING_MODE=local-preferred

# Cloud API Keys (optional - for fallback)
# ANTHROPIC_API_KEY=your-anthropic-key
# OPENAI_API_KEY=your-openai-key

# CORS Configuration
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**Frontend Environment (.env.local):**

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

### 5. Start the Applications

**Start Backend:**

```bash
# In the q-and-a-orchestra-agent directory
cd q-and-a-orchestra-agent
python main_v2.py
```

**Start Frontend (in new terminal):**

```bash
# In the frontend directory
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## 🎨 Frontend Features

### CopilotKit Integration

The React frontend provides seamless AI-human collaboration through:

1. **Agent Dashboard** - Real-time monitoring of all agents
2. **Human Approval Workflows** - Interactive approval for critical actions
3. **Human Input Collection** - Dynamic forms for additional context
4. **WebSocket Updates** - Live status without page refresh
5. **State Management** - Consistent state across all components

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `AgentOrchestraDashboard` | Main dashboard with agent status | `frontend/src/components/` |
| `ApprovalModal` | Interactive approval interface | `frontend/src/components/` |
| `InputModal` | Dynamic input collection | `frontend/src/components/` |
| `useAgentOrchestration` | Agent task execution hook | `frontend/src/hooks/` |
| `useHumanApproval` | Human-in-the-loop hook | `frontend/src/hooks/` |

### Using the Frontend

1. **Open the Dashboard**: Navigate to http://localhost:3000
2. **Monitor Agents**: View real-time status of all agents
3. **Execute Tasks**: Use the CopilotKit chat interface to run agent tasks
4. **Approve Actions**: Respond to approval requests for critical operations
5. **Provide Input**: Fill in dynamic forms when additional context is needed

---

## 🔧 Advanced Setup

### Setting Up Ollama (Optional)

For local LLM models:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# Pull a model (e.g., Llama2)
ollama pull llama2

# Verify installation
ollama list
```

Update your backend `.env`:
```bash
OLLAMA_BASE_URL=http://localhost:11434
MODEL_ROUTING_MODE=local-preferred
```

### Setting Up Redis (Optional)

For enhanced caching:

```bash
# Using Homebrew (macOS)
brew install redis
brew services start redis

# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Verify Redis is running
redis-cli ping
```

### Setting Up PostgreSQL (Optional)

For persistent storage:

```bash
# Using Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=orchestra \
  -e POSTGRES_DB=orchestra \
  -p 5432:5432 \
  postgres:13

# Update .env
DATABASE_URL=postgresql://postgres:orchestra@localhost:5432/orchestra
```

---

## 🧪 Testing the Integration

### 1. Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# List available models
curl http://localhost:8000/v2/models

# Test CopilotKit endpoint
curl -X POST http://localhost:8000/copilotkit/actions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "executeAgentTask",
    "parameters": {
      "agent_type": "repository_analyzer",
      "task_description": "Test task",
      "parameters": {}
    }
  }'
```

### 2. Test Frontend

1. Open http://localhost:3000 in your browser
2. Verify the dashboard loads and shows agent status
3. Check browser console for any WebSocket connection errors
4. Test the CopilotKit chat interface

### 3. Run Integration Tests

```bash
# Backend tests
cd q-and-a-orchestra-agent
python test_copilotkit.py

# Frontend build test
cd ../frontend
npm run build
```

---

## 🐛 Common Issues & Solutions

### Backend Issues

**Issue**: `ModuleNotFoundError: No module named 'sentence_transformers'`
```bash
# Solution: Install basic dependencies only
pip install fastapi uvicorn pydantic
```

**Issue**: Database connection errors
```bash
# Solution: Use SQLite for development
DATABASE_URL=sqlite:///./orchestra.db
```

**Issue**: Port already in use
```bash
# Solution: Use different port
python main_v2.py --port 8001
```

### Frontend Issues

**Issue**: `npm install` fails
```bash
# Solution: Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Issue**: TypeScript compilation errors
```bash
# Solution: Check TypeScript version
npm run type-check
```

**Issue**: WebSocket connection fails
```bash
# Solution: Check backend is running and CORS settings
curl http://localhost:8000/health
```

### Integration Issues

**Issue**: CopilotKit not responding
```bash
# Solution: Check CopilotKit router is loaded
curl http://localhost:8000/copilotkit/actions
```

**Issue**: Human approval not working
```bash
# Solution: Check browser console for JavaScript errors
# Verify WebSocket connection is established
```

---

## 📚 Next Steps

### 1. Explore the Features

- **Agent Tasks**: Try different agent types and workflows
- **Human Approval**: Test approval workflows with different risk levels
- **Real-time Updates**: Monitor WebSocket activity in browser dev tools
- **State Management**: Examine Zustand store in React dev tools

### 2. Customize the System

- **Add Custom Agents**: Create new agent types in the backend
- **Modify UI Components**: Customize the React dashboard
- **Configure Workflows**: Adjust agent orchestration logic
- **Set Up Authentication**: Implement user authentication

### 3. Deploy to Production

- **Docker Deployment**: Use provided Docker configurations
- **Environment Setup**: Configure production environment variables
- **Security Hardening**: Enable all security features
- **Monitoring Setup**: Configure logging and metrics

---

## 🆘 Getting Help

### Documentation

- **Main README**: `/README.md` - Complete system overview
- **CopilotKit Integration**: `/COPILOTKIT_INTEGRATION.md` - Detailed integration guide
- **API Documentation**: http://localhost:8000/docs - Interactive API docs

### Troubleshooting

1. **Check Logs**: Both backend and frontend provide detailed logging
2. **Verify Configuration**: Ensure all environment variables are set correctly
3. **Test Components**: Use the provided test scripts to verify functionality
4. **Check Network**: Ensure no firewall blocks are preventing connections

### Community Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Contribute to improving documentation
- **Examples**: Share your use cases and configurations

---

## 🎯 Success Criteria

You'll know the system is working correctly when:

✅ Backend API responds to health checks  
✅ Frontend dashboard loads and displays agent status  
✅ CopilotKit integration is active and responsive  
✅ WebSocket connections are established  
✅ Human approval workflows function properly  
✅ Real-time updates appear in the dashboard  

Once all these are working, you're ready to explore the full capabilities of Agent Orchestra with CopilotKit integration!

---

**Happy building! 🚀**
