"""
Pydantic schemas for CopilotKit integration with comprehensive validation.
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional, Union
from enum import Enum
import re
from datetime import datetime


class AgentType(str, Enum):
    REPOSITORY_ANALYZER = "repository_analyzer"
    REQUIREMENTS_EXTRACTOR = "requirements_extractor"
    ARCHITECTURE_DESIGNER = "architecture_designer"
    IMPLEMENTATION_PLANNER = "implementation_planner"
    VALIDATOR = "validator"


class WorkflowType(str, Enum):
    FULL_ANALYSIS = "full_analysis"
    ARCHITECTURE_ONLY = "architecture_only"
    IMPLEMENTATION_PLAN = "implementation_plan"
    VALIDATION_ONLY = "validation_only"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ActionType(str, Enum):
    DEPLOYMENT = "deployment"
    CRITICAL_CHANGE = "critical_change"
    RESOURCE_INTENSIVE = "resource_intensive"
    MULTI_AGENT_WORKFLOW = "multi_agent_workflow"


class AgentTaskRequest(BaseModel):
    """Request schema for agent task execution."""
    agent_type: AgentType = Field(..., description="Type of agent to execute")
    task_description: str = Field(..., min_length=1, max_length=1000, description="Description of the task")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional parameters")
    
    @validator('task_description')
    def validate_task_description(cls, v):
        if not v.strip():
            raise ValueError("Task description cannot be empty")
        return v.strip()
    
    @validator('parameters')
    def validate_parameters(cls, v):
        if v is None:
            return {}
        # Ensure no dangerous keys
        dangerous_keys = ['__import__', 'eval', 'exec', 'open', 'file']
        for key in v.keys():
            if any(danger in key.lower() for danger in dangerous_keys):
                raise ValueError(f"Parameter key '{key}' contains potentially dangerous content")
        return v


class WorkflowRequest(BaseModel):
    """Request schema for workflow execution."""
    workflow_type: WorkflowType = Field(..., description="Type of workflow to execute")
    repository_path: Optional[str] = Field(None, description="Path to the repository")
    requirements: Optional[str] = Field(None, max_length=2000, description="Requirements for the workflow")
    
    @validator('repository_path')
    def validate_repository_path(cls, v):
        if v is not None:
            # Basic path validation
            if '..' in v:
                raise ValueError("Repository path cannot contain '..'")
            if v.startswith('/'):
                v = v[1:]  # Remove leading slash
            if not v:
                raise ValueError("Repository path cannot be empty")
        return v
    
    @validator('requirements')
    def validate_requirements(cls, v):
        if v is not None:
            return v.strip()
        return v


class ApprovalRequest(BaseModel):
    """Request schema for human approval."""
    action_id: str = Field(..., min_length=1, max_length=100, description="Unique identifier for the action")
    action_type: ActionType = Field(..., description="Type of action requiring approval")
    description: str = Field(..., min_length=1, max_length=500, description="Detailed description of the action")
    risk_level: RiskLevel = Field(..., description="Risk level of the action")
    estimated_cost: Optional[float] = Field(None, ge=0, description="Estimated cost in USD")
    estimated_duration: Optional[int] = Field(None, ge=0, description="Estimated duration in minutes")
    agent_involved: Optional[str] = Field(None, description="Agent involved in the action")
    
    @validator('action_id')
    def validate_action_id(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("Action ID can only contain alphanumeric characters, underscores, and hyphens")
        return v
    
    @validator('description')
    def validate_description(cls, v):
        if not v.strip():
            raise ValueError("Description cannot be empty")
        return v.strip()


class HumanInputRequest(BaseModel):
    """Request schema for human input."""
    prompt: str = Field(..., min_length=1, max_length=1000, description="Prompt to show the user")
    input_type: str = Field(..., pattern=r'^(text|select|number|boolean)$', description="Type of input required")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")
    
    @validator('prompt')
    def validate_prompt(cls, v):
        if not v.strip():
            raise ValueError("Prompt cannot be empty")
        return v.strip()
    
    @validator('input_type')
    def validate_input_type(cls, v):
        if v == 'select' and 'options' not in cls.context:
            raise ValueError("Select input type requires 'options' in context")
        return v


class AgentTaskResponse(BaseModel):
    """Response schema for agent task execution."""
    success: bool = Field(..., description="Whether the task was successful")
    agent_type: AgentType = Field(..., description="Type of agent that was executed")
    task_description: str = Field(..., description="Description of the task that was executed")
    result: Optional[Dict[str, Any]] = Field(None, description="Result of the task execution")
    error: Optional[str] = Field(None, description="Error message if the task failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the response")
    execution_time_ms: Optional[int] = Field(None, description="Execution time in milliseconds")


class WorkflowResponse(BaseModel):
    """Response schema for workflow execution."""
    success: bool = Field(..., description="Whether the workflow was successful")
    workflow_type: WorkflowType = Field(..., description="Type of workflow that was executed")
    results: Optional[Dict[str, Any]] = Field(None, description="Results of the workflow execution")
    error: Optional[str] = Field(None, description="Error message if the workflow failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the response")
    execution_time_ms: Optional[int] = Field(None, description="Execution time in milliseconds")
    steps_completed: List[str] = Field(default_factory=list, description="List of completed workflow steps")


class ApprovalResponse(BaseModel):
    """Response schema for approval requests."""
    action_id: str = Field(..., description="ID of the action that was approved/rejected")
    approved: bool = Field(..., description="Whether the action was approved")
    reason: Optional[str] = Field(None, description="Reason for rejection")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the response")


class HumanInputResponse(BaseModel):
    """Response schema for human input."""
    input: Optional[Union[str, int, float, bool]] = Field(None, description="User input")
    cancelled: bool = Field(False, description="Whether the user cancelled the input")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the response")


class CopilotKitActionRequest(BaseModel):
    """Generic CopilotKit action request wrapper."""
    name: str = Field(..., description="Name of the action to execute")
    parameters: Dict[str, Any] = Field(..., description="Parameters for the action")
    
    @validator('name')
    def validate_name(cls, v):
        allowed_actions = ['executeAgentTask', 'executeWorkflow', 'requestHumanApproval', 'requestHumanInput']
        if v not in allowed_actions:
            raise ValueError(f"Action '{v}' is not allowed")
        return v


class CopilotKitMessageRequest(BaseModel):
    """Request schema for CopilotKit messages."""
    messages: List[Dict[str, Any]] = Field(..., min_items=1, description="List of messages")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")
    
    @validator('messages')
    def validate_messages(cls, v):
        if not any(msg.get('role') == 'user' for msg in v):
            raise ValueError("At least one user message is required")
        return v


class CopilotKitMessageResponse(BaseModel):
    """Response schema for CopilotKit messages."""
    messages: List[Dict[str, Any]] = Field(..., description="Response messages")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Updated context")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the response")
