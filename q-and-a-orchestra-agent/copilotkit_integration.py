"""
CopilotKit integration for Agent Orchestra backend.
Provides the CopilotKit runtime endpoint and integrates with existing FastAPI application.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
import json
import asyncio
import time
from datetime import datetime

from core.model_router import ModelRouter
from orchestrator.orchestrator import OrchestraOrchestrator
from agents.repository_analyzer import RepositoryAnalyzerAgent
from agents.requirements_extractor import RequirementsExtractorAgent
from agents.architecture_designer import ArchitectureDesignerAgent
from agents.implementation_planner import ImplementationPlannerAgent
from agents.validator import ValidatorAgent
from schemas.copilotkit_schemas import (
    CopilotKitActionRequest, AgentTaskRequest, WorkflowRequest,
    CopilotKitMessageRequest, AgentTaskResponse, WorkflowResponse,
    CopilotKitMessageResponse
)
from core.enterprise.multi_tenancy import get_current_tenant, TenantContext
from core.enterprise.audit_logging import AuditLogger, AuditAction
from core.enterprise.budget_management import BudgetManager

router = APIRouter(prefix="/copilotkit", tags=["copilotkit"])

# Global instances (will be injected from main app)
model_router: Optional[ModelRouter] = None
orchestrator: Optional[OrchestraOrchestrator] = None
audit_logger: Optional[AuditLogger] = None
budget_manager: Optional[BudgetManager] = None


@router.post("/actions")
async def handle_copilot_action(
    request: CopilotKitActionRequest,
    tenant_context: Optional[TenantContext] = Depends(get_current_tenant)
):
    """
    Handle CopilotKit actions from the frontend.
    Routes actions to appropriate agents or workflows.
    """
    if not tenant_context:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    start_time = time.time()
    
    try:
        # Log action attempt
        if audit_logger:
            await audit_logger.log_action(
                AuditAction.MODEL_SELECTED,
                tenant_context.tenant_id,
                tenant_context.user_id,
                metadata={"action_name": request.name, "parameters": request.parameters}
            )
        
        # Route to appropriate handler
        if request.name == "executeAgentTask":
            result = await execute_agent_task(request.parameters, tenant_context)
        elif request.name == "executeWorkflow":
            result = await execute_workflow(request.parameters, tenant_context)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {request.name}")
        
        # Calculate execution time
        execution_time_ms = int((time.time() - start_time) * 1000)
        if isinstance(result, dict):
            result["execution_time_ms"] = execution_time_ms
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        # Log error
        if audit_logger:
            await audit_logger.log_action(
                AuditAction.MODEL_SELECTED,
                tenant_context.tenant_id,
                tenant_context.user_id,
                metadata={"action_name": request.name, "error": str(e)}
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute action {request.name}: {str(e)}"
        )


async def execute_agent_task(parameters: Dict[str, Any], tenant_context: TenantContext) -> Dict[str, Any]:
    """Execute a single agent task with proper error handling."""
    start_time = time.time()
    
    try:
        # Validate parameters
        task_request = AgentTaskRequest(**parameters)
        
        # Check budget
        if budget_manager:
            budget_status = await budget_manager.check_budget(tenant_context.tenant_id)
            if not budget_status.can_execute:
                return AgentTaskResponse(
                    success=False,
                    agent_type=task_request.agent_type,
                    task_description=task_request.task_description,
                    error="Budget limit exceeded"
                ).dict()
        
        # Map agent types to agent instances
        agent_map = {
            "repository_analyzer": orchestrator.repository_analyzer,
            "requirements_extractor": orchestrator.requirements_extractor,
            "architecture_designer": orchestrator.architecture_designer,
            "implementation_planner": orchestrator.implementation_planner,
            "validator": orchestrator.validator,
        }
        
        agent = agent_map.get(task_request.agent_type.value)
        if not agent:
            return AgentTaskResponse(
                success=False,
                agent_type=task_request.agent_type,
                task_description=task_request.task_description,
                error=f"Agent {task_request.agent_type} not available"
            ).dict()
        
        # Execute the agent task with timeout
        try:
            if task_request.agent_type == "repository_analyzer":
                result = await asyncio.wait_for(
                    agent.analyze_repository(
                        repository_path=task_request.parameters.get("repository_path", "."),
                        focus_areas=task_request.parameters.get("focus_areas", [])
                    ),
                    timeout=300  # 5 minutes
                )
            elif task_request.agent_type == "requirements_extractor":
                result = await asyncio.wait_for(
                    agent.extract_requirements(
                        project_description=task_request.task_description,
                        context=task_request.parameters.get("context", {})
                    ),
                    timeout=300
                )
            elif task_request.agent_type == "architecture_designer":
                result = await asyncio.wait_for(
                    agent.design_architecture(
                        requirements=task_request.parameters.get("requirements", {}),
                        constraints=task_request.parameters.get("constraints", {})
                    ),
                    timeout=300
                )
            elif task_request.agent_type == "implementation_planner":
                result = await asyncio.wait_for(
                    agent.create_implementation_plan(
                        architecture=task_request.parameters.get("architecture", {}),
                        requirements=task_request.parameters.get("requirements", {})
                    ),
                    timeout=300
                )
            elif task_request.agent_type == "validator":
                result = await asyncio.wait_for(
                    agent.validate_implementation(
                        implementation=task_request.parameters.get("implementation", {}),
                        requirements=task_request.parameters.get("requirements", {})
                    ),
                    timeout=300
                )
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            return AgentTaskResponse(
                success=True,
                agent_type=task_request.agent_type,
                task_description=task_request.task_description,
                result=result,
                execution_time_ms=execution_time_ms
            ).dict()
            
        except asyncio.TimeoutError:
            return AgentTaskResponse(
                success=False,
                agent_type=task_request.agent_type,
                task_description=task_request.task_description,
                error="Agent execution timed out"
            ).dict()
        
    except ValueError as e:
        # Validation error
        return AgentTaskResponse(
            success=False,
            agent_type=parameters.get("agent_type", "unknown"),
            task_description=parameters.get("task_description", "unknown"),
            error=f"Validation error: {str(e)}"
        ).dict()
    
    except Exception as e:
        # Unexpected error
        return AgentTaskResponse(
            success=False,
            agent_type=parameters.get("agent_type", "unknown"),
            task_description=parameters.get("task_description", "unknown"),
            error=f"Execution error: {str(e)}"
        ).dict()


async def execute_workflow(parameters: Dict[str, Any], tenant_context: TenantContext) -> Dict[str, Any]:
    """Execute a complete multi-agent workflow with proper error handling."""
    start_time = time.time()
    steps_completed = []
    
    try:
        # Validate parameters
        workflow_request = WorkflowRequest(**parameters)
        
        # Check budget for multi-agent workflow
        if budget_manager:
            budget_status = await budget_manager.check_budget(tenant_context.tenant_id)
            if not budget_status.can_execute:
                return WorkflowResponse(
                    success=False,
                    workflow_type=workflow_request.workflow_type,
                    error="Budget limit exceeded for workflow execution"
                ).dict()
        
        if workflow_request.workflow_type == "full_analysis":
            # Execute full analysis workflow
            workflow_results = {}
            
            try:
                # Step 1: Repository Analysis
                repo_result = await asyncio.wait_for(
                    orchestrator.repository_analyzer.analyze_repository(
                        repository_path=workflow_request.repository_path or "."
                    ),
                    timeout=300
                )
                workflow_results["repository_analysis"] = repo_result
                steps_completed.append("repository_analysis")
                
                # Step 2: Requirements Extraction
                req_result = await asyncio.wait_for(
                    orchestrator.requirements_extractor.extract_requirements(
                        project_description=workflow_request.requirements or "Analyze repository",
                        context={"repository_analysis": repo_result}
                    ),
                    timeout=300
                )
                workflow_results["requirements"] = req_result
                steps_completed.append("requirements_extraction")
                
                # Step 3: Architecture Design
                arch_result = await asyncio.wait_for(
                    orchestrator.architecture_designer.design_architecture(
                        requirements=req_result.get("requirements", {}),
                        constraints={"repository_structure": repo_result.get("structure", {})}
                    ),
                    timeout=300
                )
                workflow_results["architecture"] = arch_result
                steps_completed.append("architecture_design")
                
                # Step 4: Implementation Planning
                impl_result = await asyncio.wait_for(
                    orchestrator.implementation_planner.create_implementation_plan(
                        architecture=arch_result.get("architecture", {}),
                        requirements=req_result.get("requirements", {})
                    ),
                    timeout=300
                )
                workflow_results["implementation_plan"] = impl_result
                steps_completed.append("implementation_planning")
                
                # Step 5: Validation
                val_result = await asyncio.wait_for(
                    orchestrator.validator.validate_implementation(
                        implementation=impl_result.get("plan", {}),
                        requirements=req_result.get("requirements", {})
                    ),
                    timeout=300
                )
                workflow_results["validation"] = val_result
                steps_completed.append("validation")
                
            except asyncio.TimeoutError as e:
                execution_time_ms = int((time.time() - start_time) * 1000)
                return WorkflowResponse(
                    success=False,
                    workflow_type=workflow_request.workflow_type,
                    error=f"Workflow step timed out: {str(e)}",
                    steps_completed=steps_completed,
                    execution_time_ms=execution_time_ms
                ).dict()
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            return WorkflowResponse(
                success=True,
                workflow_type=workflow_request.workflow_type,
                results=workflow_results,
                steps_completed=steps_completed,
                execution_time_ms=execution_time_ms
            ).dict()
        
        elif workflow_request.workflow_type == "architecture_only":
            # Execute architecture-only workflow
            workflow_results = {}
            
            try:
                repo_result = await asyncio.wait_for(
                    orchestrator.repository_analyzer.analyze_repository(
                        repository_path=workflow_request.repository_path or "."
                    ),
                    timeout=300
                )
                workflow_results["repository_analysis"] = repo_result
                steps_completed.append("repository_analysis")
                
                req_result = await asyncio.wait_for(
                    orchestrator.requirements_extractor.extract_requirements(
                        project_description=workflow_request.requirements or "Design architecture",
                        context={"repository_analysis": repo_result}
                    ),
                    timeout=300
                )
                workflow_results["requirements"] = req_result
                steps_completed.append("requirements_extraction")
                
                arch_result = await asyncio.wait_for(
                    orchestrator.architecture_designer.design_architecture(
                        requirements=req_result.get("requirements", {}),
                        constraints={"repository_structure": repo_result.get("structure", {})}
                    ),
                    timeout=300
                )
                workflow_results["architecture"] = arch_result
                steps_completed.append("architecture_design")
                
            except asyncio.TimeoutError as e:
                execution_time_ms = int((time.time() - start_time) * 1000)
                return WorkflowResponse(
                    success=False,
                    workflow_type=workflow_request.workflow_type,
                    error=f"Architecture workflow timed out: {str(e)}",
                    steps_completed=steps_completed,
                    execution_time_ms=execution_time_ms
                ).dict()
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            return WorkflowResponse(
                success=True,
                workflow_type=workflow_request.workflow_type,
                results=workflow_results,
                steps_completed=steps_completed,
                execution_time_ms=execution_time_ms
            ).dict()
        
        else:
            raise ValueError(f"Unknown workflow type: {workflow_request.workflow_type}")
    
    except ValueError as e:
        return WorkflowResponse(
            success=False,
            workflow_type=parameters.get("workflow_type", "unknown"),
            error=f"Validation error: {str(e)}"
        ).dict()
    
    except Exception as e:
        return WorkflowResponse(
            success=False,
            workflow_type=parameters.get("workflow_type", "unknown"),
            error=f"Workflow execution error: {str(e)}"
        ).dict()


@router.post("/messages")
async def handle_copilot_messages(
    request: CopilotKitMessageRequest,
    tenant_context: Optional[TenantContext] = Depends(get_current_tenant)
):
    """
    Handle CopilotKit chat messages with agent orchestration.
    """
    if not tenant_context:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Extract the latest user message
        user_message = None
        for msg in reversed(request.messages):
            if msg.get("role") == "user":
                user_message = msg.get("content")
                break
        
        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found")
        
        # Route to appropriate agent based on message content
        response = ""
        if "analyze" in user_message.lower() and "repository" in user_message.lower():
            # Route to repository analyzer
            result = await orchestrator.repository_analyzer.analyze_repository(
                repository_path=request.context.get("repository_path", ".")
            )
            response = f"Repository analysis complete. Key findings: {result.get('summary', 'No summary available')}"
        
        elif "architecture" in user_message.lower() or "design" in user_message.lower():
            # Route to architecture designer
            result = await orchestrator.architecture_designer.design_architecture(
                requirements={"description": user_message},
                constraints=request.context.get("constraints", {})
            )
            response = f"Architecture design complete. Recommended approach: {result.get('summary', 'No summary available')}"
        
        elif "implement" in user_message.lower() or "plan" in user_message.lower():
            # Route to implementation planner
            result = await orchestrator.implementation_planner.create_implementation_plan(
                requirements={"description": user_message},
                architecture=request.context.get("architecture", {})
            )
            response = f"Implementation plan created. Key steps: {result.get('summary', 'No summary available')}"
        
        else:
            # Default to requirements extraction
            result = await orchestrator.requirements_extractor.extract_requirements(
                project_description=user_message,
                context=request.context
            )
            response = f"Requirements extracted: {result.get('summary', 'No summary available')}"
        
        return CopilotKitMessageResponse(
            messages=[
                {
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ]
        ).dict()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")


def inject_dependencies(
    mrouter: ModelRouter, 
    orch: OrchestraOrchestrator,
    audit_log: Optional[AuditLogger] = None,
    budget_mgr: Optional[BudgetManager] = None
):
    """Inject dependencies from main application."""
    global model_router, orchestrator, audit_logger, budget_manager
    model_router = mrouter
    orchestrator = orch
    audit_logger = audit_log
    budget_manager = budget_mgr
