# CopilotKit Integration Guide

This document explains how CopilotKit hooks have been integrated into the Agent Orchestra system to create a production-ready AI-human collaboration platform.

## Overview

The integration adds a React frontend with CopilotKit to the existing Python backend, enabling:
- AI agents to execute actions through the frontend
- Human approval workflows for critical operations
- Natural language interaction with the orchestra
- Real-time agent status monitoring

## Architecture

### Backend Integration (`copilotkit_integration.py`)

The backend exposes CopilotKit endpoints that:
- Route actions to appropriate agents
- Execute multi-agent workflows
- Handle chat messages with intelligent routing
- Maintain the existing enterprise features (multi-tenancy, audit logging, etc.)

### Frontend Hooks

#### `useAgentOrchestration.ts`

Implements two frontend tools using `useFrontendTool`:

1. **executeAgentTask**: Single agent execution
   - Maps to specific agent instances
   - Handles parameters and results
   - Updates UI state

2. **executeWorkflow**: Multi-agent workflow execution
   - Supports different workflow types
   - Orchestrates multiple agents
   - Returns comprehensive results

#### `useHumanApproval.ts`

Implements human-in-the-loop workflows using `useHumanInTheLoop`:

1. **requestHumanApproval**: Approval modal for critical actions
   - Displays risk level, cost, duration
   - Captures approve/reject decisions
   - Manages pending approvals queue

2. **requestHumanInput**: Input collection for complex parameters
   - Supports text and select inputs
   - Provides context-aware options
   - Handles cancellation

### Dashboard Component

The `AgentOrchestraDashboard` provides:
- Real-time agent status display
- Workflow execution controls
- Activity logging
- Pending approval notifications

## Key Features Enabled by CopilotKit

### 1. Frontend Tools

Agents can now trigger frontend actions:
```typescript
// AI can execute agents through natural language
"Analyze the repository at /path/to/project"
→ Calls executeAgentTask with repository_analyzer
```

### 2. Human-in-the-Loop

Critical operations require human approval:
```typescript
// AI requests approval for high-risk actions
"This deployment requires approval. Cost: $50, Duration: 10 minutes"
→ Shows approval modal to user
```

### 3. Generative UI

Context-aware UI generation:
- Dynamic forms based on agent requirements
- Real-time status updates
- Interactive workflow controls

### 4. Natural Language Interface

Users can interact with the orchestra using plain language:
- "Run full analysis on my React project"
- "Deploy to staging with approval"
- "Show me the architecture design"

## Security Considerations

### Input Validation
- All CopilotKit inputs are validated using Pydantic schemas
- Parameters are sanitized before agent execution
- File paths are restricted to allowed directories

### Approval Gates
- High-risk actions automatically require approval
- Risk levels are calculated based on action type and parameters
- Audit logs capture all approval decisions

### Multi-Tenancy
- CopilotKit actions inherit tenant context
- Actions are isolated per tenant
- Budget controls apply to AI-executed actions

## Production Best Practices

### Error Handling
- Graceful degradation when agents are unavailable
- User-friendly error messages
- Automatic retry with exponential backoff

### Performance
- Agent execution is non-blocking
- Status updates use React state management
- Optimistic updates for responsive UI

### Observability
- All CopilotKit actions are logged
- Metrics collection for AI interactions
- Correlation IDs for request tracing

## Migration Path

### From `useCopilotAction` (Deprecated)

The integration uses the new specialized hooks:
- `useFrontendTool` for agent execution
- `useHumanInTheLoop` for approvals
- `useRenderToolCall` for backend visualization (future)

### Future Enhancements

1. **Real-time Updates**: WebSocket integration for live agent status
2. **Advanced Workflows**: Custom workflow builder
3. **Agent Chat**: Direct chat with individual agents
4. **Analytics Dashboard**: AI usage metrics and insights
5. **Plugin System**: Custom agent plugins

## Troubleshooting

### Common Issues

1. **CopilotKit connection failed**
   - Ensure backend is running on port 8000
   - Check CORS configuration
   - Verify `/copilotkit` endpoints are accessible

2. **Agent execution fails**
   - Check agent dependencies are installed
   - Verify repository paths are valid
   - Review agent logs for errors

3. **Approval modal not showing**
   - Check if action exceeds risk threshold
   - Verify `useHumanInTheLoop` is properly initialized
   - Ensure modal CSS is not blocked

### Debug Mode

Enable debug logging:
```typescript
// In frontend
localStorage.setItem('copilotkit-debug', 'true');

// In backend
export DEBUG=true
```

## Conclusion

The CopilotKit integration transforms the Agent Orchestra from a pure backend system into a collaborative AI-human platform. The hooks enable natural language interaction while maintaining the enterprise-grade security and multi-tenancy of the original system.
