# Agent Orchestra Frontend with CopilotKit

A modern React frontend for the Agent Orchestra system, powered by CopilotKit for AI-human collaboration.

## Features

- **Agent Orchestration Dashboard**: Real-time monitoring and control of AI agents
- **Human-in-the-Loop Workflows**: Approval mechanisms for critical actions
- **AI-Powered Chat Interface**: Natural language interaction with the orchestra
- **Real-time Status Updates**: Live agent status and workflow progress
- **Multi-Agent Workflows**: Execute complex multi-agent processes

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **CopilotKit**: AI-human collaboration platform
- **Axios**: HTTP client for API communication
- **Zustand**: State management
- **Framer Motion**: Animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Agent Orchestra backend running on port 8000

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_COPKIT_URL=http://localhost:8000/copilotkit
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## CopilotKit Integration

### Frontend Tools

The app exposes several frontend tools to the CopilotKit AI assistant:

1. **executeAgentTask**: Execute a single agent task
   - Parameters: agent_type, task_description, parameters
   
2. **executeWorkflow**: Execute a complete multi-agent workflow
   - Parameters: workflow_type, repository_path, requirements

### Human-in-the-Loop Actions

1. **requestHumanApproval**: Request approval for critical actions
   - Shows modal with action details, risk level, cost estimates
   - User can approve or reject the action

2. **requestHumanInput**: Request input for complex configuration
   - Supports text input and select options
   - Collects user preferences or clarifications

## Usage Examples

### Basic Agent Execution

1. Open the CopilotKit popup (bottom-right)
2. Type: "Execute repository analyzer on /path/to/my/project"
3. The AI will use the executeAgentTask tool to run the analyzer
4. View results in the dashboard

### Multi-Agent Workflow

1. In the chat: "Run full analysis workflow on my React project"
2. The AI will execute all agents in sequence:
   - Repository Analyzer
   - Requirements Extractor  
   - Architecture Designer
   - Implementation Planner
   - Validator

### Human Approval

When an action requires approval:

1. A modal appears with action details
2. Review the risk level, cost, and duration estimates
3. Click "Approve" or "Reject"
4. The result is sent back to the AI

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with CopilotKit provider
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── AgentOrchestraDashboard.tsx  # Main dashboard
├── hooks/                 # Custom React hooks
│   ├── useAgentOrchestration.ts     # Agent execution hooks
│   └── useHumanApproval.ts          # Human-in-the-loop hooks
└── utils/                 # Utility functions
```

## API Integration

The frontend communicates with the backend through:

- **CopilotKit Runtime**: `/api/copilotkit/*` endpoints
- **Direct API calls**: Agent execution and status updates
- **WebSocket**: Real-time status updates (future enhancement)

## Production Deployment

```bash
npm run build
npm start
```

The production build is optimized for performance with:

- Tree-shaking to reduce bundle size
- Code splitting by route
- Static asset optimization
- TypeScript type checking
