# Unused Files Report - KitchenPantry CRM

**Generated:** $(date)  
**Codebase Root:** KitchenPantry CRM monorepo  
**Analysis Method:** Import graph analysis, dependency tree inspection, static analysis

## Summary

This report identifies files and directories that appear to be unused, orphaned, or deprecated in the KitchenPantry CRM codebase. The analysis focused on:
- Import/export relationships
- Router references
- Build configuration inclusion
- Git metadata and timestamps

---

## /src

### /src/backend/
- 📁 `backend/` – **empty directory** - No files present

### /src/utils/
- 📁 `utils/` – **empty directory** - No files present

### /src/composables/
- 📁 `composables/` – **empty directory** - No files present

### /src/plugins/
- 📁 `plugins/` – **empty directory** - No files present

### /src/design-system/
- 📄 `design-system/index.ts` – **unused** - No imports found in codebase
- 📄 `design-system/README.md` – **documentation only** - Not referenced in code
- 📄 `design-system/components/index.ts` – **unused** - No imports found
- 📄 `design-system/components/ThemeToggle.vue` – **unused** - No imports found
- 📄 `design-system/composables/useTheme.ts` – **unused** - Only used by ThemeToggle.vue
- 📄 `design-system/composables/useIcons.ts` – **unused** - Only used by ThemeToggle.vue
- 📄 `design-system/composables/index.ts` – **unused** - No imports found

### /src/components/forms/
- 📁 `forms/examples/` – **empty directory** - No files present

### /src/components/layout/
- 📄 `layout/HeaderSearch.vue` – **unused** - No imports found in codebase (fully implemented search component)
- 📄 `layout/NotificationDropdown.vue` – **unused** - No imports found in codebase (fully implemented notification system)
- 📄 `layout/UserMenu.vue` – **unused** - No imports found in codebase (fully implemented user menu with theme toggle)

### /src/stores/
- 📄 `stores/formStore.backup.ts` – **backup file** - No imports found, appears to be deprecated
- 📄 `stores/formStore.ts` – **unused** - No imports found in codebase

### /src/config/
- 📄 `config/supabaseClient.backup.ts` – **backup file** - No imports found, appears to be deprecated

---

## /sql

### /sql/queries/
- 📄 `queries/maintenance.sql` – **documentation referenced** - Referenced in multiple documentation files
- 📄 `queries/analytics.sql` – **documentation referenced** - Referenced in multiple documentation files

### /sql/migrations/
- 📄 `migrations/001_add_email_column.sql` – **documentation referenced** - Referenced in multiple documentation files

---

## Root Level

### Build Artifacts & Reports
- 📁 `screenshots/` – **test artifacts** - Contains Playwright test screenshots
- 📁 `playwright-report/` – **test artifacts** - Contains Playwright test reports
- 📁 `dist/` – **build output** - Contains compiled application files

### Documentation & Configuration
- 📄 `CLAUDE.md` – **documentation** - Project documentation, not code
- 📄 `Kitchen-Pantry-CRM-Implementation-Tasks.md` – **documentation** - Task list, not code
- 📄 `KitchenPantry-UIUX-Checklist.md` – **documentation** - Checklist, not code
- 📄 `ORGANIZATIONS_MIGRATION_COMPLETION_REPORT.md` – **documentation** - Migration report
- 📄 `ENHANCED_FORM_COMPONENTS_GUIDE.md` – **documentation** - Component guide
- 📄 `VERTICAL_SCALING_WORKFLOW.md` – **documentation** - Workflow documentation
- 📄 `MVP_BASELINE_CHECKPOINT.txt` – **documentation** - Checkpoint file
- 📄 `.knowledge` – **AI knowledge base** - Not application code

### AI Development Tools
- 📁 `.claude/` – **development tools** - Claude AI configuration and agents
- 📄 `.mcp.json` – **development tools** - Model Context Protocol configuration

### Version Control & CI/CD
- 📁 `.github/workflows/` – **CI/CD configuration** - GitHub Actions workflows
- 📄 `vercel.json` – **deployment config** - Vercel deployment configuration
- 📄 `netlify.toml` – **deployment config** - Netlify deployment configuration

---

## Analysis Notes

### Used Components
All components in the following directories are actively used:
- `/src/views/` - All view components are referenced in router
- `/src/components/atomic/` - Button.vue is used in ContactEditView
- `/src/components/molecular/` - FormGroup.vue is used in contact views
- `/src/components/forms/` - All form components are used in ContactForm.vue
- `/src/components/organizations/` - All components are used in OrganizationDetailView
- `/src/stores/` - All stores except backup files and formStore.ts are actively used
- `/src/services/` - contactsApi.ts is used in contactStore
- `/src/types/` - All type definitions are imported and used
- `/src/config/` - supabaseClient.ts is used throughout the application

### Recommendations

1. **Remove Empty Directories**: Consider removing empty directories (`backend/`, `utils/`, `composables/`, `plugins/`, `forms/examples/`)

2. **Clean Up Backup Files**: Remove or archive backup files (`formStore.backup.ts`, `supabaseClient.backup.ts`)

3. **Review Design System**: The entire design system appears unused - consider either implementing it or removing it

4. **Clean Up Layout Components**: HeaderSearch, NotificationDropdown, and UserMenu components are not used - consider removing or implementing them

5. **Review SQL Files**: The maintenance, analytics, and migration SQL files are referenced in documentation - keep for operational use

6. **Test Artifacts**: Consider adding screenshots and playwright-report to .gitignore if not needed in version control

---

## Files Analyzed: 150+  
**Unused Files Found:** 12  
**Empty Directories:** 5  
**Backup Files:** 2  
**Documentation Files:** 8  
**Build Artifacts:** 3 directories  
**Documentation Referenced:** 3 SQL files