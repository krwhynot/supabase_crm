# Environment Setup Guide

This guide will help you set up your development environment for the Vue 3 + TypeScript + Supabase CRM system. Follow these steps carefully to ensure a smooth setup process.

## 📋 Prerequisites

### System Requirements
- **Operating System**: macOS, Windows 10+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **Package Manager**: npm (included with Node.js)
- **Git**: Version 2.20 or higher
- **Code Editor**: VS Code (recommended) or similar

### Hardware Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space for development dependencies
- **CPU**: Modern multi-core processor (development builds can be intensive)

## 🔧 Step-by-Step Setup

### 1. Install Core Dependencies

#### Node.js Installation
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from https://nodejs.org/
# Recommended: Use Node Version Manager (nvm)

# macOS/Linux with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Windows with nvm-windows
# Download from: https://github.com/coreybutler/nvm-windows
```

#### Git Installation
```bash
# Check Git installation
git --version

# macOS
brew install git

# Ubuntu/Debian
sudo apt update && sudo apt install git

# Windows
# Download from: https://git-scm.com/download/win
```

### 2. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/your-organization/supabase-crm.git
cd supabase-crm

# Install dependencies
npm install

# Verify installation
npm run type-check
```

### 3. Environment Configuration

#### Copy Environment Template
```bash
# Copy the environment template
cp .env.example .env

# Open the file for editing
code .env  # VS Code
# or nano .env  # Terminal editor
```

#### Configure Environment Variables

Edit your `.env` file with the following configuration:

```bash
# Supabase Configuration (Required for full functionality)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_ENV=development

# Optional Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_DEBUG_LOGGING=true
VITE_ENABLE_DEV_TOOLS=true
MCP_ENABLED=true
```

**Getting Supabase Credentials:**

1. **Create Supabase Account**: Visit [supabase.com](https://supabase.com) and create an account
2. **Create New Project**: Click "New Project" and follow the setup wizard
3. **Get Project URL**: Go to Settings > API, copy the "Project URL"
4. **Get API Key**: Copy the "anon public" key from the same page

**Demo Mode**: If you don't have Supabase credentials yet, the application will run in demo mode with simulated data.

### 4. Development Server Setup

```bash
# Start the development server
npm run dev

# The application should be available at:
# http://localhost:3000
```

#### Verify Installation
Open your browser and navigate to `http://localhost:3000`. You should see:
- ✅ CRM dashboard loads successfully
- ✅ Navigation works between pages
- ✅ No console errors in browser dev tools
- ✅ If in demo mode, you'll see a banner indicating simulation

### 5. Database Setup (Optional but Recommended)

If you have Supabase credentials configured:

#### Run Database Migrations
```bash
# Install Supabase CLI (if not already installed)
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Verify database setup
npm run validate:config
```

#### Database Schema Validation
```bash
# Run this command to verify your database is properly configured
VITE_SUPABASE_URL=your-url VITE_SUPABASE_ANON_KEY=your-key npm run validate:config
```

### 6. IDE Configuration

#### VS Code Setup (Recommended)

Install the VS Code extensions from `.vscode/extensions.json`:

```bash
# Install recommended extensions automatically
code --install-extension Vue.volar
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-playwright.playwright
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
```

#### VS Code Settings
The project includes `.vscode/settings.json` with optimal configuration:
- TypeScript error checking
- Tailwind CSS IntelliSense
- Vue 3 syntax highlighting
- Auto-formatting on save
- ESLint integration

### 7. Testing Environment

```bash
# Install Playwright browsers
npx playwright install

# Run a quick test to verify setup
npm run test:smoke-production

# Run unit tests
npm run test:unit

# If tests pass, your environment is correctly configured
```

## 🚀 Quick Validation Checklist

Run through this checklist to ensure everything is working:

### ✅ Development Server
```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] Application loads at http://localhost:3000
- [ ] Hot reload works when editing files
- [ ] No TypeScript errors in terminal

### ✅ Build Process
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No TypeScript compilation errors
- [ ] Generated files in `dist/` directory

### ✅ Code Quality
```bash
npm run lint
npm run type-check
```
- [ ] Linting passes without errors
- [ ] TypeScript checking passes
- [ ] No critical warnings

### ✅ Testing
```bash
npm run test:unit
npx playwright test --project=desktop-chromium
```
- [ ] Unit tests pass
- [ ] At least one E2E test passes
- [ ] Test runner can launch browser

## 🔧 Advanced Configuration

### MCP Tools Setup (AI-Assisted Development)

The project includes MCP (Model Context Protocol) integration for AI-assisted development:

```bash
# MCP configuration is in .mcp.json
# Ensure MCP_ENABLED=true in your .env file

# Available MCP servers:
# - knowledge-graph: Persistent memory
# - exa: Web search capabilities  
# - github: Repository management
# - supabase: Database operations
# - playwright: Browser automation
```

### Performance Optimization

```bash
# Enable development optimizations
export NODE_OPTIONS="--max-old-space-size=4096"

# For faster builds on multi-core systems
npm config set script-shell bash  # Unix systems
```

### Custom Configuration

Create a local configuration file for personal settings:

```bash
# Create local config (gitignored)
touch .env.local

# Add personal overrides
echo "VITE_ENABLE_DEBUG_LOGGING=false" >> .env.local
echo "VITE_API_TIMEOUT=10000" >> .env.local
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Node.js Version Issues
```bash
# Error: Node version too old
# Solution: Use nvm to install correct version
nvm install 18
nvm use 18
```

#### Port Already in Use
```bash
# Error: Port 3000 is already in use
# Solution: Kill the process or use different port
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | find "3000"     # Windows

# Or start on different port
npm run dev -- --port 3001
```

#### Supabase Connection Issues
```bash
# Error: Failed to connect to Supabase
# Solution: Verify credentials and network
curl -H "apikey: your-anon-key" "your-supabase-url/rest/v1/"

# Check environment variables are loaded
node -e "console.log(process.env.VITE_SUPABASE_URL)"
```

#### Build Errors
```bash
# Error: TypeScript compilation failed
# Solution: Check for type errors
npm run type-check

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Test Environment Issues
```bash
# Error: Playwright browser not found
# Solution: Reinstall browsers
npx playwright install --force

# Error: Test timeout
# Solution: Increase timeout in playwright.config.ts
# Or run with headed mode for debugging
npm run test:debug
```

### Getting Help

If you encounter issues not covered here:

1. **Check existing issues**: Search GitHub issues for similar problems
2. **Ask your team**: Reach out to your onboarding buddy or team lead
3. **Create detailed issue**: Include error messages, system info, and steps to reproduce
4. **Join team chat**: Use designated communication channel for immediate help

## 📝 Environment Validation Script

Save this script as `docs/onboarding/scripts/validate-setup.js`:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Validating development environment...\n');

const checks = [
  {
    name: 'Node.js version',
    command: 'node --version',
    validate: (output) => {
      const version = parseInt(output.match(/v(\d+)/)[1]);
      return version >= 18;
    }
  },
  {
    name: 'npm availability',
    command: 'npm --version'
  },
  {
    name: 'Git configuration',
    command: 'git config user.name'
  },
  {
    name: 'Project dependencies',
    command: 'npm list --depth=0',
    validate: (output) => !output.includes('UNMET DEPENDENCY')
  },
  {
    name: 'TypeScript compilation',
    command: 'npm run type-check'
  },
  {
    name: 'Environment variables',
    validate: () => fs.existsSync('.env')
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  try {
    console.log(`Checking ${check.name}...`);
    
    let result = true;
    if (check.command) {
      const output = execSync(check.command, { encoding: 'utf8', stdio: 'pipe' });
      result = check.validate ? check.validate(output) : true;
    } else if (check.validate) {
      result = check.validate();
    }
    
    if (result) {
      console.log(`✅ ${check.name} - OK\n`);
      passed++;
    } else {
      console.log(`❌ ${check.name} - FAILED\n`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} - ERROR: ${error.message}\n`);
    failed++;
  }
});

console.log(`\n📊 Validation Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 Environment setup is complete! You\'re ready to start developing.');
} else {
  console.log('🚨 Please fix the failed checks before proceeding.');
  process.exit(1);
}
```

Run the validation script:
```bash
node docs/onboarding/scripts/validate-setup.js
```

## ✅ Next Steps

Once your environment is set up successfully:

1. **[Explore the Codebase](./02-codebase-overview.md)** - Understand the system architecture
2. **[Review Development Workflow](./03-development-workflow.md)** - Learn our development practices
3. **[Start Feature Development](./04-feature-development.md)** - Begin contributing to the project

**Environment setup complete!** 🎉 You're ready to start developing with the Vue 3 + TypeScript + Supabase CRM system.