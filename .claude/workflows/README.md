# Agent Coordination Workflows

This directory contains the subagent coordination system for the Vue 3 + Supabase CRM project. The workflow system enables seamless handoffs between specialized agents based on code change types and project requirements.

## Directory Structure

```
.claude/workflows/
├── README.md                 # This documentation
├── agent-chains.yaml         # Master configuration file
├── backend-chain.yaml        # Backend-Security-Performance workflow
├── frontend-chain.yaml       # Frontend-Quality workflow
├── integration-chain.yaml    # Cross-feature integration workflow
└── examples/                 # Real-world workflow examples
    ├── component-lifecycle.md
    ├── api-development.md
    └── security-audit.md
```

## Core Agent Chains

### 1. Backend-Security-Performance Chain
**Sequence**: `backend-architect` → `security-specialist` → `comprehensive-performance-tester`

**Triggers**:
- Database schema changes (`sql/**/*.sql`)
- API modifications (`src/services/**/*.ts`, `src/stores/**/*.ts`)
- Supabase configuration updates

**Use Cases**:
- New table creation with RLS policies
- API endpoint development and optimization
- Database performance optimization

### 2. Frontend-Quality Chain
**Sequence**: `vue-component-architect` → `quality-compliance-auditor` → `test-writer-fixer`

**Triggers**:
- Vue component creation/modification (`src/components/**/*.vue`)
- Form implementations (`src/components/forms/**/*.vue`)
- UI state management changes (`src/stores/**/*.ts`)

**Use Cases**:
- New component development
- Form creation with validation
- UI compliance and testing

### 3. Cross-Feature Integration Chain
**Orchestrator**: `workflow-studio-orchestrator`

**Coordinates**:
- Multi-agent workflows for complex features
- Parallel execution of frontend and backend chains
- Dependency resolution and conflict management

## Handoff Protocol

### Data Transfer Format
Each handoff includes standardized metadata:

```yaml
handoff_data:
  source_agent: string              # Agent initiating handoff
  target_agent: string              # Agent receiving handoff
  deliverable_type: string          # component|schema|api|feature
  file_paths: array                 # Files modified/created
  validation_criteria: object       # Success criteria for next agent
  context: object                   # Additional context and requirements
  priority: string                  # low|medium|high|critical
  timestamp: string                 # ISO 8601 timestamp
```

### Validation Checkpoints
- **Pre-handoff**: Source agent validates deliverable meets handoff criteria
- **Post-handoff**: Target agent confirms deliverable meets input requirements
- **Quality Gates**: Each transition includes compliance and quality validation
- **Rollback**: Failed handoffs trigger rollback procedures and escalation

## Agent Integration Patterns

### @mention Delegation
Agents can automatically delegate using specific patterns:
- `@backend-architect` for database/API work
- `@vue-component-architect` for UI components
- `@security-specialist` for security reviews
- `@quality-compliance-auditor` for compliance checks

### Conditional Triggers
File patterns automatically route to appropriate agents:
- `src/components/**/*.vue` → Frontend chain
- `sql/**/*.sql` → Backend chain
- `src/stores/**/*.ts` → Store-specific routing
- `tests/**/*.spec.ts` → Test-focused routing

## Workflow Examples

### Example 1: New Contact Form Component
1. `vue-component-architect` creates accessible form component
2. `quality-compliance-auditor` validates design system compliance
3. `test-writer-fixer` creates comprehensive test coverage

### Example 2: Database Schema Update
1. `backend-architect` designs schema with RLS policies
2. `security-specialist` audits security implementation
3. `comprehensive-performance-tester` validates query performance

## Configuration Files

- **agent-chains.yaml**: Master workflow definitions
- **backend-chain.yaml**: Backend workflow configuration
- **frontend-chain.yaml**: Frontend workflow configuration
- **integration-chain.yaml**: Cross-feature coordination rules

## Usage Guidelines

1. **Sequential Handoffs**: Follow defined agent sequences for quality assurance
2. **Parallel Execution**: Use integration chains for independent validations
3. **Escalation Procedures**: Failed workflows route to `workflow-studio-orchestrator`
4. **Context Preservation**: Maintain complete context through handoff data
5. **Quality Gates**: Never skip compliance and testing validations

## Performance Metrics

- **Handoff Efficiency**: Time between agent transitions
- **Success Rate**: Percentage of successful workflow completions
- **Quality Score**: Compliance and test coverage metrics
- **Escalation Rate**: Frequency of workflow failures requiring intervention

This system transforms ad-hoc agent usage into structured, predictable workflows that ensure quality and consistency across all development activities.