/**
 * Agent Chain Optimizer Middleware
 * Express middleware for integrating optimizer with web services
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AgentChainOptimizer, createOptimizer, PerformanceAnalysis, CriticalPath } from 'agent-chain-optimizer';

export interface MiddlewareConfig {
  autoOptimize?: boolean;
  paths?: {
    analyze?: string;
    optimize?: string;
    metrics?: string;
    criticalPath?: string;
  };
}

export interface WorkflowRequest extends Request {
  workflowOptimizer?: AgentChainOptimizer;
  workflowAnalysis?: PerformanceAnalysis;
  criticalPath?: CriticalPath;
}

/**
 * Create optimizer middleware
 */
export function createOptimizerMiddleware(config: MiddlewareConfig = {}): RequestHandler {
  const optimizer = createOptimizer({ 
    autoOptimize: config.autoOptimize ?? false 
  });

  return (req: WorkflowRequest, res: Response, next: NextFunction) => {
    req.workflowOptimizer = optimizer;
    next();
  };
}

/**
 * Analyze endpoint handler
 */
export function createAnalyzeHandler(optimizer: AgentChainOptimizer): RequestHandler {
  return (req: WorkflowRequest, res: Response) => {
    const { workflowId } = req.body;
    
    if (!workflowId) {
      return res.status(400).json({ error: 'workflowId is required' });
    }

    const analysis = optimizer.analyzeWorkflow(workflowId);
    req.workflowAnalysis = analysis;
    
    res.json(analysis);
  };
}

/**
 * Optimize endpoint handler
 */
export function createOptimizeHandler(optimizer: AgentChainOptimizer): RequestHandler {
  return (req: WorkflowRequest, res: Response) => {
    const { workflow } = req.body;
    
    if (!workflow) {
      return res.status(400).json({ error: 'workflow is required' });
    }

    const result = optimizer.optimizeWorkflow(workflow);
    res.json(result);
  };
}

/**
 * Metrics endpoint handler
 */
export function createMetricsHandler(optimizer: AgentChainOptimizer): RequestHandler {
  return (req: WorkflowRequest, res: Response) => {
    const metrics = optimizer.getTelemetryCollector().getAggregatedMetrics();
    res.json(metrics);
  };
}

/**
 * Critical path endpoint handler
 */
export function createCriticalPathHandler(optimizer: AgentChainOptimizer): RequestHandler {
  return (req: WorkflowRequest, res: Response) => {
    const { executionId } = req.params;
    
    if (!executionId) {
      return res.status(400).json({ error: 'executionId is required' });
    }

    const executions = optimizer.getTelemetryCollector().getWorkflowExecutions();
    const execution = executions.find(e => e.id === executionId);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    const criticalPath = optimizer.analyzeExecutionCriticalPath(execution);
    res.json(criticalPath);
  };
}

/**
 * Express router setup
 */
export function setupOptimizerRoutes(optimizer: AgentChainOptimizer, basePath: string = '/api/optimizer') {
  return {
    [`${basePath}/analyze`]: {
      method: 'post',
      handler: createAnalyzeHandler(optimizer),
    },
    [`${basePath}/optimize`]: {
      method: 'post', 
      handler: createOptimizeHandler(optimizer),
    },
    [`${basePath}/metrics`]: {
      method: 'get',
      handler: createMetricsHandler(optimizer),
    },
    [`${basePath}/critical-path/:executionId`]: {
      method: 'get',
      handler: createCriticalPathHandler(optimizer),
    },
  };
}

/**
 * Create full Express app with optimizer routes
 */
export function createOptimizerApp(config: MiddlewareConfig = {}) {
  const optimizer = createOptimizer({ 
    autoOptimize: config.autoOptimize ?? true 
  });

  return {
    optimizer,
    middleware: createOptimizerMiddleware(config),
    routes: setupOptimizerRoutes(optimizer, config.paths?.analyze?.replace('/analyze', '') || '/api/optimizer'),
  };
}

export { AgentChainOptimizer, createOptimizer, PerformanceAnalysis, CriticalPath };
