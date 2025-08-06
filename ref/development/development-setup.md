# Development Setup Guide

## Prerequisites

- **Node.js 18+** - JavaScript runtime
- **npm or yarn** - Package manager
- **Git** - Version control
- **Supabase account** (optional for demo mode)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd supabase-crm
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Configure Supabase (optional - runs in demo mode without)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Start Development Server
```bash
npm run dev
```

Application will be available at `http://localhost:5173`

### 5. Run Tests
```bash
# Unit tests
npm run test:unit

# E2E tests  
npm run test

# Accessibility tests
npm run test:accessibility
```

## Development Commands

### Primary Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Testing Commands
- `npm run test` - Full Playwright test suite
- `npm run test:unit` - Vitest unit tests
- `npm run test:accessibility` - WCAG compliance tests
- `npm run test:performance` - Performance benchmarks
- `npm run test:chrome` - Desktop Chrome tests
- `npm run test:ipad` - iPad viewport tests
- `npm run test:mobile` - Mobile viewport tests

## Project Structure

```
├── src/
│   ├── components/     # Vue components by domain
│   ├── views/         # Page-level components
│   ├── stores/        # Pinia state management
│   ├── services/      # API integration
│   ├── types/         # TypeScript definitions
│   └── assets/        # Static assets
├── tests/             # Test suite
├── sql/              # Database schema
├── docs/             # Documentation
├── ref/              # Implementation reference
└── public/           # Public assets
```

## Development Workflow

### 1. Feature Development
- Create feature branch from main
- Implement feature with tests
- Run comprehensive test suite
- Submit pull request with documentation

### 2. Quality Assurance
- All tests must pass
- ESLint and TypeScript checks required
- Accessibility compliance validation
- Performance benchmarks within thresholds

### 3. Code Review
- Peer review required for all changes
- Architecture and pattern consistency
- Documentation updates required
- Test coverage maintenance

## Environment Modes

### Demo Mode
- Runs without Supabase configuration
- Uses mock data for development
- Form submissions logged to console
- Full functionality with simulated backend

### Development Mode
- Supabase integration with development database
- Hot module replacement enabled
- Comprehensive error reporting
- Development-specific debugging tools

### Production Mode
- Optimized build with minification
- Service worker registration
- Performance monitoring
- Production error handling

This setup provides a comprehensive development environment with modern tooling, comprehensive testing, and quality assurance automation.