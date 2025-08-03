# Event-Driven Subagent Auto-Invocation System

## Overview

This directory contains the complete implementation of an event-driven subagent system that automatically invokes relevant agents based on file changes, deployment events, and code modifications. The system provides intelligent, proactive workflow coordination while preserving all existing manual coordination capabilities.

## 🎯 Key Features

### Automatic Trigger Detection
- **File Pattern Matching**: Detects changes to Vue components, API services, database migrations, tests, and more
- **Keyword Analysis**: Identifies security, performance, accessibility, and other critical concerns
- **Scope Assessment**: Evaluates change impact from single files to architectural modifications
- **Priority Calculation**: Intelligent priority assignment with context-aware adjustments

### Deployment Stage Integration
- **Pre-deployment Validation**: Automatic quality gates, security scans, and performance checks
- **During Deployment Monitoring**: Real-time validation and monitoring
- **Post-deployment Verification**: Automated testing and performance baseline establishment
- **Rollback Coordination**: Intelligent rollback detection and assistance

### Intelligent Agent Coordination
- **Context-Aware Handoffs**: Automatic agent chaining with relevant context
- **Workload Balancing**: Intelligent task distribution based on agent capacity
- **Priority Escalation**: Automatic escalation for critical issues and timeouts
- **Hybrid Operation**: Seamless integration with existing manual workflows

## 📁 System Components

### Core Configuration Files

#### `auto-invoke.yaml`
Primary configuration for automatic workflow triggers with comprehensive file pattern detection, priority levels, and agent coordination rules.

**Key Capabilities:**
- Vue component triggers → `vue-component-architect` + quality chain
- Backend API changes → `backend-architect` + security + performance chain  
- Database migrations → `migration-workflow-orchestrator` + performance testing
- Test files → `test-writer-fixer` with coverage validation
- Form components → Specialized form design chain with mobile optimization

#### `deployment-triggers.yaml`
Deployment lifecycle automation with pre/during/post deployment validation, monitoring, and rollback coordination.

**Deployment Stages:**
- **Pre-deployment**: Quality gates, security scans, performance validation
- **During Deployment**: Real-time monitoring with automatic rollback triggers
- **Post-deployment**: Validation testing, performance baselines, documentation updates
- **Hotfix Support**: Expedited workflows for critical security and bug fixes

#### `priority-matrix.yaml`
Sophisticated priority calculation system with dynamic adjustments based on file types, keywords, scope, temporal factors, and team availability.

**Priority Factors:**
- **File Type Priority**: Database > Security > API > Components > Tests > Documentation
- **Keyword Boosters**: Security (+2.0), Performance (+1.5), Breaking Changes (+1.8)
- **Scope Modifiers**: Single file (0.0) → Cross-module (+0.6) → Architectural (+1.0)
- **Temporal Adjustments**: Business hours, sprint proximity, holiday periods

#### `validation-rules.yaml`
Comprehensive test suite for validating trigger patterns, priority calculations, workflow chains, and system performance.

**Test Coverage:**
- Pattern matching accuracy for all file types
- Priority calculation validation with edge cases
- Workflow chain execution verification
- Performance benchmarks and load testing
- Integration tests for end-to-end workflows

#### `system-integration.yaml`
Integration layer connecting auto-triggers with existing manual workflow coordination, ensuring backward compatibility and hybrid operation.

**Integration Features:**
- **Backward Compatibility**: All existing @mention patterns preserved
- **Manual Override**: Manual triggers can override automatic decisions
- **Context Enhancement**: Auto-populated context with manual preservation
- **Hybrid Modes**: Auto-primary, manual-primary, and balanced operation

## 🚀 Quick Start

### File Change Triggers

**Automatic Detection:**
```bash
# Vue component changes automatically trigger:
src/components/ContactCard.vue → vue-component-architect → quality-compliance-auditor → test-writer-fixer

# API service changes automatically trigger:
src/services/contactsApi.ts → backend-architect → security-specialist → comprehensive-performance-tester

# Database migrations automatically trigger:
sql/add_contacts_table.sql → migration-workflow-orchestrator → comprehensive-performance-tester (CRITICAL priority)

# Form components automatically trigger:
src/components/forms/ContactForm.vue → form-design-architect → mobile-pwa-specialist → delight-experience-enhancer
```

### Deployment Event Triggers

**Automatic Validation:**
```bash
# Pull request to main automatically triggers:
PR → main: quality-compliance-auditor + security-specialist + comprehensive-performance-tester (CRITICAL priority)

# Production deployment automatically triggers:
Production Deploy: Real-time monitoring + security validation + performance baseline

# Hotfix deployment automatically triggers:
Hotfix: Expedited security review + critical path testing + intensive monitoring
```

### Priority-Based Execution

**Intelligent Prioritization:**
```bash
# Critical (Interrupt all): Database migrations, security vulnerabilities, production failures
# High: API changes, component modifications, performance issues  
# Medium: Test updates, store changes, documentation
# Low: Style updates, comments, non-functional changes
```

## 🔧 Configuration

### Enabling Auto-Triggers

Auto-triggers are enabled by default but can be configured:

```yaml
# In auto-invoke.yaml
trigger_config:
  enable_auto_invocation: true
  max_concurrent_workflows: 3
  debounce_interval_ms: 2000
  retry_failed_invocations: true
```

### Customizing File Patterns

Add custom patterns for your specific needs:

```yaml
# In auto-invoke.yaml
file_triggers:
  custom_pattern:
    patterns:
      - "src/custom/**/*.ts"
    agents:
      primary: "backend-architect"
    priority: "high"
```

### Adjusting Priority Calculation

Modify priority weights and boosters:

```yaml
# In priority-matrix.yaml
keyword_boosters:
  custom_keywords:
    keywords: ["urgent", "hotfix", "critical"]
    priority_boost: +1.5
```

## 🔍 Monitoring and Validation

### Real-Time Monitoring

The system tracks comprehensive metrics:
- Trigger accuracy and false positive rates
- Agent selection effectiveness  
- Workflow completion rates
- Response times and performance
- Priority calculation accuracy

### Validation Testing

Run validation tests to ensure pattern accuracy:

```bash
# Test file patterns
src/components/ContactCard.vue → Expected: vue-component-architect (high priority)
src/services/contactsApi.ts → Expected: backend-architect (high priority)  
sql/add_contacts_table.sql → Expected: migration-workflow-orchestrator (critical priority)
```

### Performance Benchmarks

- **Pattern Matching**: <100ms
- **Priority Calculation**: <50ms  
- **Workflow Initiation**: <200ms
- **End-to-End Trigger**: <1000ms

## 🛠 Integration with Existing System

### Manual Workflow Preservation

All existing manual triggers continue to work:
```bash
@backend-architect Implement user preferences API  # Still works
@vue-component-architect Create ContactCard component  # Still works
@integration-chain:full-stack-feature User management  # Still works
```

### Hybrid Operation

The system operates in intelligent hybrid mode:
- **Routine Changes**: Handled automatically with appropriate agent chains
- **Complex Features**: Manual coordination for architectural decisions
- **Emergency Fixes**: Auto-detection with expedited workflows
- **Oversight**: Manual override always available

### Context Enhancement

Auto-triggers enhance rather than replace manual context:
- **Auto-detected**: File types, change scope, keyword analysis
- **Manual Context**: User requirements, business logic, special instructions
- **Merged Intelligently**: Manual context takes precedence, auto-context supplements

## 📊 Success Metrics

### Target Performance
- **Trigger Accuracy**: ≥95%
- **False Positive Rate**: ≤5%  
- **Workflow Completion**: ≥98%
- **Manual Override Rate**: ≤15%
- **Response Time**: ≤2 seconds

### Continuous Improvement
- Pattern learning from manual overrides
- Priority calculation refinement based on outcomes
- Agent selection optimization through feedback
- Performance tuning based on system metrics

## 🚨 Safety and Fallback

### Automatic Safeguards
- **Failure Detection**: Auto-fallback to manual coordination
- **System Overload**: Priority filtering and queue management
- **Agent Unavailability**: Intelligent fallback agent selection
- **Emergency Override**: Immediate manual takeover capability

### Rollback Mechanisms
- **Configuration Rollback**: Instant return to manual-only mode
- **Partial Failure**: Graceful degradation to available agents
- **Performance Issues**: Automatic system adjustment

## 📚 Advanced Usage

### Custom Workflow Patterns

Create specialized workflows for your team:

```yaml
# Custom integration pattern
custom_security_workflow:
  patterns: ["**/security/**/*.ts"]
  agents: ["security-specialist", "senior-code-reviewer", "technical-documentation-agent"]
  priority: "critical"
  special_requirements: ["threat_modeling", "penetration_testing"]
```

### Deployment-Specific Configurations

Customize deployment triggers:

```yaml
# Custom deployment validation
staging_deployment:
  required_validations: ["security_scan", "performance_testing", "accessibility_audit"]
  blocking_issues: ["security_vulnerabilities", "performance_regression"]
  notification_channels: ["slack_security", "email_team_lead"]
```

### Team-Specific Adaptations

Adapt the system to your team's workflow:

```yaml
# Team-specific agent preferences
team_preferences:
  security_focus_team:
    default_security_review: true
    additional_agents: ["security-specialist"]
    priority_boost: +0.5
```

## 🔄 Future Enhancements

### Planned Features
- **Machine Learning**: Pattern learning and adaptive priority calculation
- **External Integrations**: GitHub Actions, Vercel, monitoring tools
- **Predictive Analytics**: Proactive issue detection and prevention
- **Advanced Orchestration**: Multi-project coordination and dependency management

### Extension Points
- **Custom Agents**: Easy integration of new specialized agents
- **External Triggers**: Webhook support for third-party systems
- **Advanced Analytics**: Deep insights into development patterns
- **Team Coordination**: Cross-team workflow orchestration

---

## 📞 Support and Troubleshooting

### Common Issues
1. **Pattern Not Matching**: Check file path patterns in `auto-invoke.yaml`
2. **Wrong Priority**: Review priority calculation in `priority-matrix.yaml`
3. **Agent Not Available**: Check agent capacity and workload balancing
4. **Workflow Not Completing**: Review escalation procedures and timeouts

### Debug Mode
Enable detailed logging for troubleshooting:

```yaml
debug_config:
  enable_debug_logging: true
  log_pattern_matching: true
  log_priority_calculation: true
  log_agent_selection: true
```

### Getting Help
- Review validation test results in `validation-rules.yaml`
- Check system integration status in `system-integration.yaml`
- Monitor deployment triggers in `deployment-triggers.yaml`
- Examine priority calculations in `priority-matrix.yaml`

---

**System Status**: Production Ready ✅  
**Version**: 1.0.0  
**Last Updated**: 2025-01-02  
**Integration**: Fully Compatible with Existing Workflows