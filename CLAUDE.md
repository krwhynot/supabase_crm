# CLAUDE.md

This file provides essential guidance to Claude Code when working with this Vue 3 TypeScript CRM application.

## Project Architecture

**Core Stack:** Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS + Supabase

**Key Features:**
- Dashboard with responsive sidebar navigation
- Contact/Organization/Opportunity management (full CRUD)
- Form validation with Yup schemas
- WCAG 2.1 AA accessibility compliance
- Real-time database integration

## Development Patterns

**Component Architecture:**
- `<script setup>` with Composition API
- Schema-driven validation with Yup + TypeScript inference
- Reusable form components (`InputField`, `SelectField`)
- WCAG-compliant accessibility with ARIA attributes

**Key Components:**
- `DashboardLayout.vue` - Master layout with sidebar
- View components follow `[Entity][Action]View.vue` pattern
- Form components use standardized props interface

**State Management:**
- Pinia stores for each entity (contacts, organizations, opportunities)
- Type-safe interfaces with Supabase integration

## Environment & Testing

**Environment Setup:**
- Copy `.env.example` to `.env` for Supabase integration
- Demo mode available when environment variables missing
- Production deployment: [crm.kjrcloud.com](https://crm.kjrcloud.com)

**Testing:**
- Playwright for E2E testing (`npm run test:e2e`)
- Vitest for unit tests (`npm test`)
- Test files in `/tests/` directory

## Database & Styling

**Database Schema:** SQL files in `/sql/` directory with type-safe TypeScript interfaces
**Styling:** Tailwind CSS with utility-first approach, mobile-first responsive design

## Key Features

**Opportunity Management:**
- 7-stage pipeline (NEW_LEAD → CLOSED_WON)
- Auto-naming: `[Organization] - [Principal] - [Context] - [Month Year]`
- Batch creation for multiple principals
- KPI dashboard with real-time metrics

**Navigation Routes:**
- `/` - Dashboard (default)
- `/contacts`, `/organizations`, `/opportunities` - Entity management
- Each entity supports full CRUD operations

## Additional Resources

**Documentation:** Comprehensive guides in `/ref/` and `/docs/` directories
**Design System:** Token-based components in `src/design-system/`
**Important:** No revenue/financial metrics in opportunity design - focus on relationship building