# Configuration & Tool Integration

## Overview

The Vue 3 CRM project integrates multiple development tools and configurations for optimal development experience, including ESLint, MCP integration, environment management, and comprehensive tooling setup.

## ESLint Configuration

### ESLint Setup (`.eslintrc.cjs`)
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
}
```

## MCP Integration (`.mcp.json`)

### Comprehensive MCP Server Configuration
```json
{
  "mcpServers": {
    "knowledge-graph": {
      "command": "mcp-knowledge-graph",
      "args": ["--database", "./knowledge.db"]
    },
    "exa": {
      "command": "mcp-exa-server", 
      "args": [],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      }
    },
    "github": {
      "command": "mcp-github-server",
      "args": [],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "supabase": {
      "command": "mcp-server-supabase",
      "args": [],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "filesystem": {
      "command": "mcp-filesystem-server",
      "args": ["/home/krwhynot/Projects/Supabase"]
    },
    "playwright": {
      "command": "mcp-playwright-server",
      "args": []
    }
  }
}
```

## Environment Management

### Environment Variables Structure
- `.env.example` - Template with required variables
- `.env.development` - Development-specific settings  
- `.env.production` - Production-specific settings
- Environment validation and demo mode fallbacks

### Key Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_ENABLE_ANALYTICS` - Analytics toggle
- `NODE_ENV` - Environment mode

## Development Tools Integration

### Git Configuration
- `.gitignore` - Comprehensive exclusions
- Pre-commit hooks for linting and type checking
- Branch protection and validation

### VS Code Integration
- TypeScript IntelliSense support
- Vue 3 extension recommendations
- Debugging configuration
- Workspace settings optimization

This configuration provides a robust development environment with comprehensive tooling integration and quality assurance automation.