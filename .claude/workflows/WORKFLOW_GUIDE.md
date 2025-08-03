# Workflow Coordination Guide

## Overview

This guide provides comprehensive documentation for the subagent coordination system implemented for the Vue 3 + Supabase CRM project. The system enables seamless agent-to-agent communication and task delegation through automated handoff protocols.

## System Architecture

### Core Components

1. **Master Configuration** (`agent-chains.yaml`)
   - Central registry of all agents and their capabilities
   - Workflow chain definitions with trigger patterns
   - Quality gates and validation checkpoints

2. **Chain Configurations**
   - `backend-chain.yaml` - Backend → Security → Performance workflow
   - `frontend-chain.yaml` - Frontend → Quality → Testing workflow  
   - `integration-chain.yaml` - Cross-feature coordination workflows

3. **Real-World Examples**
   - Component lifecycle demonstrations
   - API development workflows
   - Security audit patterns

## Quick Start

### Initiating a Workflow

**Backend Development:**
```
@backend-architect Please implement user export API with pagination
```

**Frontend Development:**
```
@vue-component-architect Create ContactCard component with accessibility
```

**Full-Stack Feature:**
```
@integration-chain:full-stack-feature Implement opportunity batch creation
```

### Monitoring Progress

Workflows automatically create handoff documentation in `.claude/workflows/handoffs/` with:
- Input specifications received
- Output deliverables produced
- Validation results
- Next agent assignments

## Workflow Patterns

### 1. Backend-Security-Performance Chain

**Trigger Conditions:**
- API endpoint modifications
- Database schema changes
- Authentication/authorization updates
- Performance-critical operations

**Flow:**
```
backend-architect → security-specialist → comprehensive-performance-tester
```

**Example Use Cases:**
- RESTful API development
- Database migration implementation
- Authentication system updates
- Batch processing operations

### 2. Frontend-Quality Chain

**Trigger Conditions:**
- Vue component creation/modification
- UI/UX implementation
- Accessibility requirements
- Design system updates

**Flow:**
```
vue-component-architect → quality-compliance-auditor → test-writer-fixer
```

**Example Use Cases:**
- Component library development
- Form implementation
- Dashboard creation
- Mobile responsiveness

### 3. Integration Workflows

**Available Patterns:**
- `full-stack-feature` - Complete feature development
- `api-contract-first` - API-driven development
- `component-system` - Design system evolution
- `security-focused` - Security-first implementation

## Handoff Protocols

### Input Specifications

Each workflow stage expects structured input:

```yaml
input:
  type: "feature-request" | "bug-fix" | "enhancement"
  context:
    user_requirements: "Detailed requirements"
    technical_constraints: "Known limitations"
    acceptance_criteria: "Success definitions"
  files:
    - path: "File paths to examine"
      purpose: "Why this file is relevant"
```

### Output Deliverables

Each stage produces structured output:

```yaml
output:
  deliverables:
    - type: "implementation" | "analysis" | "test-suite"
      files: ["List of created/modified files"]
      description: "What was accomplished"
  validation:
    status: "passed" | "failed" | "requires-review"
    details: "Validation results"
  next_action:
    agent: "Next agent to receive handoff"
    priority: "high" | "medium" | "low"
```

### Quality Gates

Automated validation at each handoff:

1. **Code Quality**
   - TypeScript compilation
   - ESLint compliance
   - Prettier formatting

2. **Security Validation**
   - No exposed secrets
   - RLS policy compliance
   - Input sanitization

3. **Performance Benchmarks**
   - API response times
   - Bundle size limits
   - Database query optimization

4. **Accessibility Compliance**
   - WCAG 2.1 AA standards
   - Keyboard navigation
   - Screen reader compatibility

## Configuration Management

### Adding New Agents

1. Register in `agent-chains.yaml`:
```yaml
agents:
  new-agent:
    capabilities: ["list", "of", "skills"]
    input_format: "expected-format"
    output_format: "produced-format"
```

2. Create chain configuration:
```yaml
workflow_chains:
  new-chain:
    agents: ["agent1", "new-agent", "agent3"]
    # ... chain definition
```

### Modifying Workflows

Update chain configurations to:
- Add/remove validation steps
- Modify trigger patterns
- Adjust success criteria
- Update handoff formats

### Creating Custom Triggers

Define new trigger patterns in `agent-chains.yaml`:

```yaml
trigger_patterns:
  custom_pattern:
    file_patterns: ["specific/**/*.ext"]
    keywords: ["trigger", "words"]
    conditions:
      - type: "file_change"
        pattern: "src/custom/**"
```

## Best Practices

### 1. Clear Requirements

Always provide:
- Specific user requirements
- Technical constraints
- Acceptance criteria
- Context from existing implementation

### 2. Incremental Development

Use workflows for:
- Single feature implementation
- Focused bug fixes
- Specific enhancements
- Isolated improvements

### 3. Documentation

Maintain:
- Clear commit messages
- Inline code comments
- API documentation
- User guide updates

### 4. Testing Strategy

Ensure:
- Unit test coverage
- Integration test validation
- End-to-end test scenarios
- Performance benchmarking

## Troubleshooting

### Common Issues

**Workflow Not Triggering:**
- Verify trigger patterns in `agent-chains.yaml`
- Check file path matching
- Ensure @mention format is correct

**Handoff Failures:**
- Review input format requirements
- Validate output structure
- Check quality gate failures

**Performance Issues:**
- Monitor workflow execution times
- Review agent task complexity
- Consider workflow splitting

### Debug Commands

```bash
# Validate YAML configuration
yamllint .claude/workflows/*.yaml

# Check workflow status
ls -la .claude/workflows/handoffs/

# Review recent handoffs
tail -f .claude/workflows/handoffs/*.md
```

## Migration from Manual Coordination

### Phase 1: Basic Workflows
- Implement core backend and frontend chains
- Train team on @mention patterns
- Monitor workflow adoption

### Phase 2: Advanced Integration
- Deploy integration workflows
- Implement custom triggers
- Add performance monitoring

### Phase 3: Full Automation
- Automate quality gates
- Implement CI/CD integration
- Enable advanced orchestration

## Security Considerations

### Data Handling
- No sensitive data in handoff files
- Secure credential management
- Audit trail maintenance

### Access Control
- Workflow execution permissions
- Agent capability restrictions
- Output validation requirements

### Compliance
- GDPR data processing
- SOC 2 control validation
- Security audit trails

## Performance Monitoring

### Metrics Collection
- Workflow execution times
- Quality gate pass rates
- Agent utilization patterns
- Handoff success rates

### Optimization Strategies
- Parallel execution where possible
- Efficient validation processes
- Streamlined handoff formats
- Performance benchmarking

## Support and Maintenance

### Regular Tasks
- Review workflow performance
- Update agent capabilities
- Refine trigger patterns
- Optimize quality gates

### Escalation Procedures
- Failed workflow handling
- Complex requirement resolution
- Cross-team coordination
- Emergency hotfixes

---

**Last Updated:** 2025-01-02
**Version:** 1.0.0
**Maintainer:** CRM Development Team