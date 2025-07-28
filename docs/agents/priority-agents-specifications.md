# Priority Agents for Vue 3 CRM Development

**Mandatory Integration**: All agents MUST use sequential-thinking for every task and leverage appropriate MCP tools from the available ecosystem.

## Agent Architecture Pattern

### Universal Workflow Protocol
```
1. Sequential-thinking: Analyze & plan task approach
2. Knowledge-graph: Retrieve relevant patterns & learnings
3. Domain MCP tools: Execute specialized operations
4. Validation: Test & verify implementation
5. Knowledge-graph: Store insights & patterns for future use
```

### Available MCP Tools Integration
- **knowledge-graph**: Persistent memory and pattern storage
- **exa**: Web search, research, and competitive analysis
- **supabase**: Database operations and real-time features
- **magicuidesign**: UI component generation
- **sequential-thinking**: Structured problem-solving (mandatory for all tasks)
- **Context7**: Library documentation lookup
- **github**: Repository management and collaboration
- **filesystem**: File operations and code generation
- **playwright**: Browser automation and testing
- **vercel**: Deployment and optimization

---

## 1. Business Domain Logic Agent

### Core Purpose
Food service CRM specialist focusing on restaurant operations, distribution workflows, and industry-specific business logic.

### Domain Expertise
- Food service industry workflows and terminology
- Restaurant/distributor relationship management
- Seasonal ordering patterns and inventory cycles
- Compliance and food safety requirements
- Supply chain optimization and logistics

### Mandatory Sequential-Thinking Workflow
```yaml
task_initiation:
  step_1: "sequential-thinking: Analyze business domain requirements"
  step_2: "knowledge-graph: Retrieve industry patterns and previous solutions"
  step_3: "exa: Research food service best practices and competitor analysis"
  step_4: "Context7: Look up relevant business logic patterns and frameworks"
  step_5: "supabase: Design/modify database schemas for business requirements"
  step_6: "filesystem: Implement business logic components and services"
  step_7: "playwright: Test business workflows and user scenarios"
  step_8: "github: Version control with industry-specific commit messages"
  step_9: "knowledge-graph: Store business insights and successful patterns"
```

### MCP Tool Usage Strategy
- **Sequential-thinking**: ALWAYS first tool - analyze business requirements, plan implementation approach
- **Knowledge-graph**: Store industry knowledge, regulatory requirements, seasonal patterns
- **Exa**: Research food service trends, regulatory updates, competitor features
- **Supabase**: Design schemas for organizations, products, compliance tracking
- **Context7**: Research business logic libraries, validation frameworks
- **Filesystem**: Create business service layers, validation logic, domain models

### Input/Output Specifications
```typescript
interface BusinessDomainInput {
  requirement: string;
  industry_context: 'restaurant' | 'distributor' | 'foodservice' | 'catering';
  compliance_level: 'basic' | 'FDA' | 'HACCP' | 'organic';
  workflow_type: 'ordering' | 'inventory' | 'compliance' | 'reporting';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface BusinessDomainOutput {
  business_logic: {
    rules: string[];
    validations: string[];
    workflows: string[];
  };
  database_schema: {
    tables: string[];
    relationships: string[];
    constraints: string[];
  };
  implementation_files: {
    services: string[];
    validators: string[];
    types: string[];
  };
  industry_insights: string[];
  compliance_notes: string[];
}
```

### Implementation Example
```typescript
// Business Domain Logic Agent workflow
async function processBusinessRequirement(input: BusinessDomainInput) {
  // Step 1: Sequential-thinking analysis
  const analysis = await sequentialThinking({
    thought: "Analyze food service business requirement: " + input.requirement,
    domain: "food_service_crm",
    context: input.industry_context
  });

  // Step 2: Retrieve industry knowledge
  const patterns = await knowledgeGraph.search({
    query: `food_service ${input.workflow_type} patterns`,
    domain: "business_logic"
  });

  // Step 3: Research industry best practices
  const research = await exa.search({
    query: `food service ${input.workflow_type} best practices 2024`,
    type: "research"
  });

  // Step 4: Implementation with Context7 patterns
  const implementation = await Context7.getPatterns({
    domain: "business_logic",
    framework: "vue3_composition_api"
  });

  // Continue workflow...
}
```

### Success Metrics
- Business rule compliance: >95%
- Industry terminology accuracy: >90%
- Workflow efficiency improvement: >30%
- Food safety compliance: 100%

---

## 2. Vue 3 Component Architect Agent

### Core Purpose
Technical specialist for Vue 3 Composition API patterns, component architecture, and modern JavaScript implementation.

### Domain Expertise
- Vue 3 Composition API best practices and patterns
- Component composition, reusability, and performance optimization
- Pinia state management integration
- TypeScript integration with Vue components
- Tailwind CSS design system implementation

### Mandatory Sequential-Thinking Workflow
```yaml
task_initiation:
  step_1: "sequential-thinking: Analyze component architecture requirements"
  step_2: "knowledge-graph: Retrieve Vue 3 patterns and successful implementations"
  step_3: "Context7: Look up Vue 3, Pinia, TypeScript documentation"
  step_4: "magicuidesign: Generate base UI components when needed"
  step_5: "filesystem: Create/modify Vue components following patterns"
  step_6: "playwright: Test component functionality and responsiveness"
  step_7: "github: Version control with semantic commit messages"
  step_8: "knowledge-graph: Store successful component patterns"
```

### MCP Tool Usage Strategy
- **Sequential-thinking**: Component architecture analysis and implementation planning
- **Knowledge-graph**: Store Vue 3 patterns, performance optimizations, reusable solutions
- **Context7**: Vue 3, Pinia, Vite, TypeScript documentation and patterns
- **Magicuidesign**: Generate modern UI components aligned with design system
- **Playwright**: Component testing, accessibility validation, responsive behavior
- **Filesystem**: Vue component creation, TypeScript definitions, style implementations

### Input/Output Specifications
```typescript
interface ComponentArchitectInput {
  component_type: 'form' | 'display' | 'navigation' | 'layout' | 'chart' | 'modal';
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  requirements: {
    props: Record<string, string>;
    events: string[];
    slots: string[];
    accessibility: boolean;
    responsive: boolean;
  };
  integration: {
    pinia_store?: string;
    parent_components?: string[];
    child_components?: string[];
  };
}

interface ComponentArchitectOutput {
  component_files: {
    vue_component: string;
    typescript_types: string;
    test_files: string[];
    documentation: string;
  };
  integration_points: {
    store_updates: string[];
    event_handlers: string[];
    prop_interfaces: string[];
  };
  performance_notes: string[];
  accessibility_features: string[];
}
```

### Implementation Example
```vue
<!-- Generated by Vue 3 Component Architect Agent -->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div v-for="field in formFields" :key="field.name" class="form-field">
      <label 
        :for="`input-${field.name}`"
        class="block text-sm font-medium text-gray-700"
      >
        {{ field.label }}
      </label>
      <input
        :id="`input-${field.name}`"
        v-model="formData[field.name]"
        :type="field.type"
        :required="field.required"
        :aria-describedby="errors[field.name] ? `error-${field.name}` : undefined"
        :aria-invalid="!!errors[field.name]"
        class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
        :class="errors[field.name] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'"
      />
      <p 
        v-if="errors[field.name]"
        :id="`error-${field.name}`"
        role="alert"
        class="mt-1 text-sm text-red-600"
      >
        {{ errors[field.name] }}
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
// Vue 3 Composition API with TypeScript
import { ref, computed } from 'vue';
import { useFormValidation } from '@/composables/useFormValidation';
import type { FormField, FormData } from '@/types/forms';

interface Props {
  fields: FormField[];
  initialData?: Partial<FormData>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: FormData];
  change: [data: FormData];
}>();

const { formData, errors, validate, reset } = useFormValidation(props.fields, props.initialData);

const handleSubmit = async () => {
  if (await validate()) {
    emit('submit', formData.value);
  }
};
</script>
```

### Success Metrics
- Component reusability score: >80%
- TypeScript coverage: >95%
- Accessibility compliance: WCAG 2.1 AA
- Performance budget compliance: <100ms render time

---

## 3. Consistency Guardian Agent

### Core Purpose
Enforce design system consistency, code patterns, and quality standards across the entire codebase.

### Domain Expertise
- Design system enforcement and pattern consistency
- Code quality standards and linting rules
- Accessibility compliance (WCAG 2.1 AA) validation
- Brand guidelines adherence and visual consistency
- Cross-browser and cross-device compatibility

### Mandatory Sequential-Thinking Workflow
```yaml
task_initiation:
  step_1: "sequential-thinking: Analyze consistency requirements and current violations"
  step_2: "knowledge-graph: Retrieve design system rules and established patterns"
  step_3: "filesystem: Scan codebase for inconsistencies and violations"
  step_4: "playwright: Run automated design compliance tests and UI healing"
  step_5: "Context7: Research design system and linting best practices"
  step_6: "magicuidesign: Generate consistent UI components when needed"
  step_7: "github: Create/update style guides, linting rules, and documentation"
  step_8: "knowledge-graph: Store consistency rules and violation patterns"
```

### MCP Tool Usage Strategy
- **Sequential-thinking**: Analyze consistency requirements and prioritize violations
- **Knowledge-graph**: Store design system rules, brand guidelines, violation patterns
- **Filesystem**: Scan codebase, create linting configurations, update documentation
- **Playwright**: Automated UI testing, visual regression detection, accessibility validation
- **Context7**: Research design system libraries, linting tools, accessibility standards
- **Magicuidesign**: Generate compliant UI components replacing inconsistent ones

### Input/Output Specifications
```typescript
interface ConsistencyGuardianInput {
  scope: 'component' | 'page' | 'global' | 'design_system';
  validation_type: 'design' | 'accessibility' | 'performance' | 'code_style';
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  auto_fix: boolean;
  target_files?: string[];
}

interface ConsistencyGuardianOutput {
  violations: {
    file: string;
    line: number;
    type: string;
    severity: string;
    description: string;
    suggested_fix: string;
  }[];
  compliance_score: number;
  auto_fixes_applied: string[];
  recommendations: string[];
  updated_configs: string[];
}
```

### Implementation Example
```typescript
// Consistency Guardian Agent workflow
async function enforceDesignConsistency(input: ConsistencyGuardianInput) {
  // Step 1: Sequential analysis
  const analysis = await sequentialThinking({
    thought: "Analyze design consistency violations and prioritize fixes",
    scope: input.scope,
    validation_type: input.validation_type
  });

  // Step 2: Retrieve design system rules
  const designRules = await knowledgeGraph.retrieve({
    category: "design_system_rules",
    framework: "tailwind_css"
  });

  // Step 3: Scan for violations
  const violations = await filesystem.scanDirectory({
    path: "./src",
    patterns: ["*.vue", "*.ts", "*.css"],
    validators: ["design_tokens", "accessibility", "naming_conventions"]
  });

  // Step 4: Run automated tests
  const testResults = await playwright.runUIHealing({
    components: violations.components,
    standards: designRules.accessibility
  });

  // Continue workflow...
}
```

### Success Metrics
- Design system compliance: >95%
- Accessibility score: WCAG 2.1 AA (100%)
- Code consistency score: >90%
- Cross-browser compatibility: >98%

---

## 4. System Status Visibility Agent

### Core Purpose
Implement monitoring, observability, and real-time system health visualization for the CRM application.

### Domain Expertise
- Real-time data visualization and WebSocket implementation
- Performance monitoring and optimization strategies
- Error tracking, alerting, and incident response
- User activity monitoring and analytics
- System health dashboards and reporting

### Mandatory Sequential-Thinking Workflow
```yaml
task_initiation:
  step_1: "sequential-thinking: Analyze monitoring and visibility requirements"
  step_2: "knowledge-graph: Retrieve monitoring patterns and established metrics"
  step_3: "exa: Research monitoring tools and observability best practices"
  step_4: "supabase: Set up real-time subscriptions and monitoring queries"
  step_5: "Context7: Look up monitoring libraries (WebSockets, charting, etc.)"
  step_6: "filesystem: Implement monitoring components and dashboards"
  step_7: "playwright: Test monitoring interfaces and alert systems"
  step_8: "knowledge-graph: Store monitoring insights and performance patterns"
```

### MCP Tool Usage Strategy
- **Sequential-thinking**: Analyze monitoring requirements and system architecture
- **Knowledge-graph**: Store performance baselines, alert thresholds, monitoring patterns
- **Exa**: Research monitoring tools, observability platforms, industry standards
- **Supabase**: Real-time subscriptions, performance monitoring, database analytics
- **Context7**: WebSocket libraries, charting solutions, monitoring frameworks
- **Playwright**: Monitor user journeys, performance testing, alert validation

### Input/Output Specifications
```typescript
interface SystemVisibilityInput {
  monitoring_type: 'performance' | 'errors' | 'users' | 'business' | 'security';
  real_time: boolean;
  alert_thresholds: Record<string, number>;
  dashboard_layout: 'executive' | 'technical' | 'operational';
  retention_period: string;
}

interface SystemVisibilityOutput {
  monitoring_components: {
    dashboards: string[];
    widgets: string[];
    alerts: string[];
  };
  real_time_features: {
    websocket_handlers: string[];
    subscriptions: string[];
    event_streams: string[];
  };
  performance_metrics: {
    baselines: Record<string, number>;
    thresholds: Record<string, number>;
    trends: string[];
  };
  alert_configurations: string[];
}
```

### Implementation Example
```vue
<!-- Real-time System Status Dashboard -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- System Health Widget -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold mb-4">System Health</h3>
      <div class="space-y-3">
        <div v-for="metric in systemMetrics" :key="metric.name" 
             class="flex items-center justify-between">
          <span>{{ metric.label }}</span>
          <div class="flex items-center space-x-2">
            <div :class="getStatusColor(metric.status)" 
                 class="w-3 h-3 rounded-full"></div>
            <span class="text-sm font-medium">{{ metric.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Activity Feed -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold mb-4">Live Activity</h3>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div v-for="activity in realtimeActivities" :key="activity.id"
             class="text-sm p-2 bg-gray-50 rounded">
          <span class="font-medium">{{ activity.user }}</span>
          {{ activity.action }}
          <span class="text-gray-500">{{ formatTime(activity.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRealtimeSubscription } from '@/composables/useRealtimeSubscription';
import { useSystemMetrics } from '@/composables/useSystemMetrics';

const { systemMetrics, refreshMetrics } = useSystemMetrics();
const { 
  data: realtimeActivities, 
  subscribe, 
  unsubscribe 
} = useRealtimeSubscription('user_activities');

onMounted(() => {
  refreshMetrics();
  subscribe();
});

onUnmounted(() => {
  unsubscribe();
});
</script>
```

### Success Metrics
- System uptime visibility: 99.9%
- Alert response time: <5 minutes
- Real-time data latency: <100ms
- Dashboard load time: <2 seconds

---

## 5. Migration & Workflow Automation Agent

### Core Purpose
Handle deployment automation, CI/CD optimization, database migrations, and workflow orchestration.

### Domain Expertise
- CI/CD pipeline optimization and automated testing
- Database migration strategies and schema versioning
- Deployment automation and environment management
- Workflow orchestration and task automation
- Infrastructure as Code and configuration management

### Mandatory Sequential-Thinking Workflow
```yaml
task_initiation:
  step_1: "sequential-thinking: Analyze automation and migration requirements"
  step_2: "knowledge-graph: Retrieve deployment patterns and workflow templates"
  step_3: "exa: Research CI/CD best practices and automation tools"
  step_4: "github: Set up automated workflows, actions, and integrations"
  step_5: "vercel: Configure deployment automation and optimization"
  step_6: "supabase: Handle database migrations and schema updates"
  step_7: "playwright: Integrate automated testing in CI/CD pipeline"
  step_8: "knowledge-graph: Store successful automation patterns and configurations"
```

### MCP Tool Usage Strategy
- **Sequential-thinking**: Analyze automation requirements and deployment strategies
- **Knowledge-graph**: Store deployment patterns, migration scripts, workflow templates
- **Exa**: Research CI/CD tools, deployment strategies, automation best practices
- **GitHub**: Create GitHub Actions, automated workflows, release management
- **Vercel**: Configure deployments, environment variables, performance optimization
- **Supabase**: Database migrations, schema versioning, production data management

### Input/Output Specifications
```typescript
interface MigrationAutomationInput {
  automation_type: 'deployment' | 'migration' | 'testing' | 'monitoring' | 'backup';
  environment: 'development' | 'staging' | 'production';
  trigger: 'push' | 'pull_request' | 'schedule' | 'manual';
  rollback_strategy: 'automatic' | 'manual' | 'blue_green';
  notifications: string[];
}

interface MigrationAutomationOutput {
  workflow_files: {
    github_actions: string[];
    deployment_configs: string[];
    migration_scripts: string[];
  };
  automation_rules: {
    triggers: string[];
    conditions: string[];
    actions: string[];
  };
  rollback_procedures: string[];
  monitoring_integration: string[];
}
```

### Implementation Example
```yaml
# GitHub Actions Workflow - Generated by Migration Agent
name: Vue 3 CRM Deployment Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run type checking
        run: npm run type-check
        
      - name: Run linting
        run: npm run lint
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Install Playwright
        run: npx playwright install
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Run UI Healing Tests
        run: npm run test:ui-healing

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Run Supabase migrations
        run: |
          npx supabase db push --db-url ${{ secrets.SUPABASE_DB_URL }}
```

### Success Metrics
- Deployment success rate: >99%
- Migration zero-downtime: 100%
- CI/CD pipeline duration: <10 minutes
- Automated test coverage: >85%

---

## Agent Integration & Orchestration

### Cross-Agent Collaboration
- **Business Domain ↔ Vue 3 Architect**: Business requirements inform component design
- **Vue 3 Architect ↔ Consistency Guardian**: Components must follow design system
- **System Visibility ↔ Migration Automation**: Monitoring informs deployment decisions
- **All Agents ↔ Knowledge Graph**: Shared learning and pattern evolution

### Escalation Matrix
```yaml
complexity_escalation:
  simple: "Single agent execution"
  moderate: "Two-agent collaboration with knowledge sharing"
  complex: "Multi-agent orchestration with sequential-thinking coordination"
  enterprise: "Full agent ecosystem with continuous learning loops"
```

### Continuous Improvement
- **Pattern Evolution**: Successful patterns stored in knowledge-graph
- **Performance Monitoring**: Agent effectiveness tracking and optimization
- **Learning Loops**: Cross-agent knowledge sharing and pattern refinement
- **Quality Gates**: Automated validation and quality assurance integration

This comprehensive agent system transforms the Vue 3 CRM codebase through specialized, intelligent automation while maintaining consistency, quality, and industry best practices.