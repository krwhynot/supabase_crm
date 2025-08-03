/**
 * Agent Chain Metrics Collector
 * 
 * Comprehensive monitoring system for agent workflow chains
 * Collects performance metrics, success rates, and failure analysis
 */

export interface ChainMetrics {
  chainId: string
  chainType: 'backend_security_performance' | 'frontend_quality' | 'migration_performance' | 'deployment_lifecycle'
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'interrupted'
  totalDuration?: number
  agentExecutions: AgentExecution[]
  triggerContext: TriggerContext
  successRate: number
  errorDetails?: string[]
}

export interface AgentExecution {
  agentType: string
  startTime: Date
  endTime?: Date
  duration?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout'
  deliverables: string[]
  errorMessage?: string
  handoffContext?: Record<string, any>
}

export interface TriggerContext {
  triggerType: 'file_change' | 'deployment' | 'manual' | 'scheduled'
  files: string[]
  changeType: 'create' | 'modify' | 'delete'
  priority: number
  triggerTime: Date
  latency?: number // Time from trigger to first agent execution
}

export interface SystemHealth {
  timestamp: Date
  chainExecutionRate: number // chains per hour
  averageChainDuration: number // minutes
  successRate: number // percentage
  agentAvailability: Record<string, boolean>
  queueDepth: number
  systemResources: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
}

export interface PerformanceBaseline {
  chainType: string
  agentType?: string
  metricType: 'execution_time' | 'success_rate' | 'resource_usage'
  baselineValue: number
  thresholdWarning: number
  thresholdCritical: number
  lastUpdated: Date
}

class ChainMetricsCollector {
  private metrics: ChainMetrics[] = []
  private systemHealth: SystemHealth[] = []
  private baselines: PerformanceBaseline[] = []
  private alertThresholds: Record<string, number> = {
    chainSuccessRate: 0.95,
    averageExecutionTime: 300000, // 5 minutes in ms
    agentTimeoutRate: 0.05,
    triggerAccuracy: 0.90
  }

  constructor() {
    this.initializeBaselines()
    this.startHealthMonitoring()
  }

  /**
   * Record the start of a new chain execution
   */
  startChainExecution(
    chainType: ChainMetrics['chainType'],
    triggerContext: TriggerContext
  ): string {
    const chainId = this.generateChainId()
    const chainMetrics: ChainMetrics = {
      chainId,
      chainType,
      startTime: new Date(),
      status: 'running',
      agentExecutions: [],
      triggerContext,
      successRate: 0
    }

    this.metrics.push(chainMetrics)
    console.log(`📊 Chain ${chainId} started: ${chainType}`)
    
    return chainId
  }

  /**
   * Record agent execution within a chain
   */
  recordAgentExecution(
    chainId: string,
    agentType: string,
    execution: Partial<AgentExecution>
  ): void {
    const chain = this.metrics.find(m => m.chainId === chainId)
    if (!chain) {
      console.warn(`⚠️ Chain ${chainId} not found for agent execution recording`)
      return
    }

    const agentExecution: AgentExecution = {
      agentType,
      startTime: execution.startTime || new Date(),
      endTime: execution.endTime,
      duration: execution.duration,
      status: execution.status || 'running',
      deliverables: execution.deliverables || [],
      errorMessage: execution.errorMessage,
      handoffContext: execution.handoffContext
    }

    chain.agentExecutions.push(agentExecution)
    
    if (execution.status === 'completed') {
      console.log(`✅ Agent ${agentType} completed in chain ${chainId}`)
    } else if (execution.status === 'failed') {
      console.log(`❌ Agent ${agentType} failed in chain ${chainId}: ${execution.errorMessage}`)
    }
  }

  /**
   * Complete a chain execution
   */
  completeChainExecution(
    chainId: string,
    status: ChainMetrics['status'],
    errorDetails?: string[]
  ): void {
    const chain = this.metrics.find(m => m.chainId === chainId)
    if (!chain) {
      console.warn(`⚠️ Chain ${chainId} not found for completion`)
      return
    }

    chain.endTime = new Date()
    chain.totalDuration = chain.endTime.getTime() - chain.startTime.getTime()
    chain.status = status
    chain.errorDetails = errorDetails

    // Calculate success rate
    const completedAgents = chain.agentExecutions.filter(a => a.status === 'completed').length
    const totalAgents = chain.agentExecutions.length
    chain.successRate = totalAgents > 0 ? completedAgents / totalAgents : 0

    console.log(`📋 Chain ${chainId} completed: ${status} (${chain.totalDuration}ms, ${(chain.successRate * 100).toFixed(1)}% success)`)
    
    // Check for performance alerts
    this.checkPerformanceAlerts(chain)
    
    // Update baselines
    this.updateBaselines(chain)
  }

  /**
   * Generate performance analytics
   */
  generateAnalytics(timeWindow: 'hour' | 'day' | 'week' = 'day'): {
    summary: {
      totalChains: number
      successRate: number
      averageExecutionTime: number
      mostCommonFailures: string[]
    }
    chainTypeBreakdown: Record<string, {
      count: number
      successRate: number
      averageTime: number
    }>
    agentPerformance: Record<string, {
      executions: number
      successRate: number
      averageTime: number
      timeoutRate: number
    }>
    triggerAnalysis: {
      accuracy: number
      latency: number
      falsePositiveRate: number
    }
  } {
    const cutoffTime = this.getTimeWindowCutoff(timeWindow)
    const recentMetrics = this.metrics.filter(m => m.startTime >= cutoffTime)

    // Summary statistics
    const totalChains = recentMetrics.length
    const successfulChains = recentMetrics.filter(m => m.status === 'completed').length
    const successRate = totalChains > 0 ? successfulChains / totalChains : 0
    
    const completedChains = recentMetrics.filter(m => m.totalDuration)
    const averageExecutionTime = completedChains.length > 0 
      ? completedChains.reduce((sum, m) => sum + (m.totalDuration || 0), 0) / completedChains.length
      : 0

    // Most common failures
    const failures = recentMetrics
      .filter(m => m.status === 'failed' && m.errorDetails)
      .flatMap(m => m.errorDetails || [])
    const failureCounts = failures.reduce((acc, error) => {
      acc[error] = (acc[error] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostCommonFailures = Object.entries(failureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error)

    // Chain type breakdown
    const chainTypeBreakdown: Record<string, any> = {}
    for (const chainType of ['backend_security_performance', 'frontend_quality', 'migration_performance', 'deployment_lifecycle']) {
      const chainMetrics = recentMetrics.filter(m => m.chainType === chainType)
      const successful = chainMetrics.filter(m => m.status === 'completed').length
      const completed = chainMetrics.filter(m => m.totalDuration)
      
      chainTypeBreakdown[chainType] = {
        count: chainMetrics.length,
        successRate: chainMetrics.length > 0 ? successful / chainMetrics.length : 0,
        averageTime: completed.length > 0 
          ? completed.reduce((sum, m) => sum + (m.totalDuration || 0), 0) / completed.length
          : 0
      }
    }

    // Agent performance analysis
    const agentPerformance: Record<string, any> = {}
    const allAgentExecutions = recentMetrics.flatMap(m => m.agentExecutions)
    
    for (const agentType of ['backend-architect', 'vue-component-architect', 'security-specialist', 'comprehensive-performance-tester', 'quality-compliance-auditor', 'migration-workflow-orchestrator']) {
      const executions = allAgentExecutions.filter(a => a.agentType === agentType)
      const successful = executions.filter(a => a.status === 'completed').length
      const timedOut = executions.filter(a => a.status === 'timeout').length
      const completed = executions.filter(a => a.duration)
      
      agentPerformance[agentType] = {
        executions: executions.length,
        successRate: executions.length > 0 ? successful / executions.length : 0,
        averageTime: completed.length > 0 
          ? completed.reduce((sum, a) => sum + (a.duration || 0), 0) / completed.length
          : 0,
        timeoutRate: executions.length > 0 ? timedOut / executions.length : 0
      }
    }

    // Trigger analysis
    const triggers = recentMetrics.map(m => m.triggerContext)
    const accurateTriggers = recentMetrics.filter(m => m.successRate > 0.5).length
    const triggerAccuracy = totalChains > 0 ? accurateTriggers / totalChains : 0
    
    const avgLatency = triggers
      .filter(t => t.latency)
      .reduce((sum, t) => sum + (t.latency || 0), 0) / Math.max(1, triggers.filter(t => t.latency).length)
    
    const falsePositives = recentMetrics.filter(m => m.successRate === 0).length
    const falsePositiveRate = totalChains > 0 ? falsePositives / totalChains : 0

    return {
      summary: {
        totalChains,
        successRate,
        averageExecutionTime,
        mostCommonFailures
      },
      chainTypeBreakdown,
      agentPerformance,
      triggerAnalysis: {
        accuracy: triggerAccuracy,
        latency: avgLatency,
        falsePositiveRate
      }
    }
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(chain: ChainMetrics): void {
    const alerts: string[] = []

    // Check chain duration
    if (chain.totalDuration && chain.totalDuration > this.alertThresholds.averageExecutionTime) {
      alerts.push(`Chain ${chain.chainId} exceeded execution time threshold: ${chain.totalDuration}ms`)
    }

    // Check success rate
    if (chain.successRate < this.alertThresholds.chainSuccessRate) {
      alerts.push(`Chain ${chain.chainId} below success rate threshold: ${(chain.successRate * 100).toFixed(1)}%`)
    }

    // Check agent timeouts
    const timeoutAgents = chain.agentExecutions.filter(a => a.status === 'timeout')
    if (timeoutAgents.length > 0) {
      alerts.push(`Chain ${chain.chainId} had ${timeoutAgents.length} agent timeout(s): ${timeoutAgents.map(a => a.agentType).join(', ')}`)
    }

    // Log alerts
    if (alerts.length > 0) {
      console.warn('🚨 Performance Alerts:')
      alerts.forEach(alert => console.warn(`  ⚠️ ${alert}`))
      this.writeAlertsToLog(alerts)
    }
  }

  /**
   * Update performance baselines
   */
  private updateBaselines(chain: ChainMetrics): void {
    // Update chain-level baseline
    const chainBaseline = this.baselines.find(b => 
      b.chainType === chain.chainType && 
      b.metricType === 'execution_time' && 
      !b.agentType
    )
    
    if (chainBaseline && chain.totalDuration) {
      // Exponential moving average with 0.1 alpha
      chainBaseline.baselineValue = chainBaseline.baselineValue * 0.9 + chain.totalDuration * 0.1
      chainBaseline.lastUpdated = new Date()
    }

    // Update agent-level baselines
    for (const agentExecution of chain.agentExecutions) {
      if (agentExecution.duration) {
        const agentBaseline = this.baselines.find(b => 
          b.chainType === chain.chainType && 
          b.agentType === agentExecution.agentType && 
          b.metricType === 'execution_time'
        )
        
        if (agentBaseline) {
          agentBaseline.baselineValue = agentBaseline.baselineValue * 0.9 + agentExecution.duration * 0.1
          agentBaseline.lastUpdated = new Date()
        }
      }
    }
  }

  /**
   * Initialize performance baselines
   */
  private initializeBaselines(): void {
    const chainTypes: ChainMetrics['chainType'][] = [
      'backend_security_performance', 
      'frontend_quality', 
      'migration_performance', 
      'deployment_lifecycle'
    ]
    
    const agentTypes = [
      'backend-architect', 
      'vue-component-architect', 
      'security-specialist', 
      'comprehensive-performance-tester', 
      'quality-compliance-auditor', 
      'migration-workflow-orchestrator'
    ]

    // Chain-level baselines
    for (const chainType of chainTypes) {
      this.baselines.push({
        chainType,
        metricType: 'execution_time',
        baselineValue: this.getInitialBaseline(chainType),
        thresholdWarning: this.getInitialBaseline(chainType) * 1.5,
        thresholdCritical: this.getInitialBaseline(chainType) * 2.0,
        lastUpdated: new Date()
      })
    }

    // Agent-level baselines
    for (const chainType of chainTypes) {
      for (const agentType of agentTypes) {
        this.baselines.push({
          chainType,
          agentType,
          metricType: 'execution_time',
          baselineValue: this.getInitialAgentBaseline(agentType),
          thresholdWarning: this.getInitialAgentBaseline(agentType) * 1.5,
          thresholdCritical: this.getInitialAgentBaseline(agentType) * 2.0,
          lastUpdated: new Date()
        })
      }
    }
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.collectSystemHealth()
    }, 60000) // Every minute
  }

  /**
   * Collect current system health metrics
   */
  private collectSystemHealth(): void {
    const now = new Date()
    const recentMetrics = this.metrics.filter(m => 
      now.getTime() - m.startTime.getTime() < 3600000 // Last hour
    )

    const health: SystemHealth = {
      timestamp: now,
      chainExecutionRate: recentMetrics.length,
      averageChainDuration: this.calculateAverageChainDuration(recentMetrics),
      successRate: this.calculateSuccessRate(recentMetrics),
      agentAvailability: this.checkAgentAvailability(),
      queueDepth: this.getQueueDepth(),
      systemResources: this.getSystemResources()
    }

    this.systemHealth.push(health)
    
    // Keep only last 24 hours of health data
    const cutoff = now.getTime() - (24 * 3600000)
    this.systemHealth = this.systemHealth.filter(h => h.timestamp.getTime() > cutoff)
  }

  // Utility methods
  private generateChainId(): string {
    return `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getTimeWindowCutoff(window: 'hour' | 'day' | 'week'): Date {
    const now = new Date()
    switch (window) {
      case 'hour': return new Date(now.getTime() - 3600000)
      case 'day': return new Date(now.getTime() - 86400000)
      case 'week': return new Date(now.getTime() - 604800000)
    }
  }

  private getInitialBaseline(chainType: string): number {
    const baselines = {
      'backend_security_performance': 450000, // 7.5 minutes
      'frontend_quality': 315000, // 5.25 minutes  
      'migration_performance': 585000, // 9.75 minutes
      'deployment_lifecycle': 720000 // 12 minutes
    }
    return baselines[chainType] || 300000 // 5 minutes default
  }

  private getInitialAgentBaseline(agentType: string): number {
    const baselines = {
      'backend-architect': 135000, // 2.25 minutes
      'vue-component-architect': 165000, // 2.75 minutes
      'security-specialist': 210000, // 3.5 minutes
      'comprehensive-performance-tester': 255000, // 4.25 minutes
      'quality-compliance-auditor': 180000, // 3 minutes
      'migration-workflow-orchestrator': 330000 // 5.5 minutes
    }
    return baselines[agentType] || 120000 // 2 minutes default
  }

  private calculateAverageChainDuration(metrics: ChainMetrics[]): number {
    const completed = metrics.filter(m => m.totalDuration)
    return completed.length > 0 
      ? completed.reduce((sum, m) => sum + (m.totalDuration || 0), 0) / completed.length / 60000 // Convert to minutes
      : 0
  }

  private calculateSuccessRate(metrics: ChainMetrics[]): number {
    if (metrics.length === 0) return 0
    const successful = metrics.filter(m => m.status === 'completed').length
    return successful / metrics.length
  }

  private checkAgentAvailability(): Record<string, boolean> {
    // Simplified availability check - in real implementation would ping agents
    return {
      'backend-architect': true,
      'vue-component-architect': true,
      'security-specialist': true,
      'comprehensive-performance-tester': true,
      'quality-compliance-auditor': true,
      'migration-workflow-orchestrator': true
    }
  }

  private getQueueDepth(): number {
    return this.metrics.filter(m => m.status === 'running').length
  }

  private getSystemResources(): SystemHealth['systemResources'] {
    // Simplified system resource monitoring
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100
    }
  }

  private writeAlertsToLog(alerts: string[]): void {
    const timestamp = new Date().toISOString()
    const logEntry = `${timestamp} - ALERTS:\n${alerts.map(a => `  ${a}`).join('\n')}\n\n`
    
    // In real implementation, would write to file system
    console.log('📝 Alert logged:', logEntry)
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    chains: ChainMetrics[]
    systemHealth: SystemHealth[]
    baselines: PerformanceBaseline[]
    analytics: ReturnType<typeof this.generateAnalytics>
  } {
    return {
      chains: this.metrics,
      systemHealth: this.systemHealth,
      baselines: this.baselines,
      analytics: this.generateAnalytics()
    }
  }
}

// Export singleton instance
export const metricsCollector = new ChainMetricsCollector()

// Export for testing and advanced usage
export { ChainMetricsCollector }