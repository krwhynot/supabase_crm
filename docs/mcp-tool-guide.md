# MCP Tool Guide

A comprehensive guide to the Model Context Protocol (MCP) tools configured in this project.

## Table of Contents

- [knowledge-graph](#knowledge-graph)
- [exa](#exa)
- [supabase](#supabase)
- [magicuidesign](#magicuidesign)
- [sequential-thinking](#sequential-thinking)
- [Context7](#context7)
- [github](#github)
- [filesystem](#filesystem)
- [playwright](#playwright)

---

## knowledge-graph

### Purpose/Description
Knowledge Graph Memory Server that provides persistent memory using a local knowledge graph with customizable memory path. Enables AI models to remember information about users across chats through entities, relations, and observations.

### Syntax
```bash
mcp-knowledge-graph [--memory-path <path>]
```

### Configuration
- **Command**: `mcp-knowledge-graph`
- **Arguments**: `["--memory-path", "./.knowledge"]`
- **Priority**: Essential
- **Startup Delay**: 0ms
- **Timeout**: 30s

### Core Concepts
- **Entities**: Primary nodes with unique names, entity types, and observations
- **Relations**: Directed connections between entities in active voice
- **Observations**: Discrete pieces of information attached to entities

### Available Tools
- `create_entities` - Create multiple new entities in the knowledge graph
- `create_relations` - Create multiple new relations between entities
- `add_observations` - Add new observations to existing entities
- `delete_entities` - Remove entities and their relations
- `delete_observations` - Remove specific observations from entities
- `delete_relations` - Remove relations between entities
- `read_graph` - Read the entire knowledge graph
- `search_nodes` - Search for nodes based on query
- `open_nodes` - Open specific nodes by their names
- `update_entities` - Update existing entities
- `update_relations` - Update existing relations

### Example Usage
```bash
# Server runs automatically with memory stored in ./.knowledge directory
# Access via MCP tools like create_entities, add_observations, etc.
```

---

## exa

### Purpose/Description
Exa MCP Server provides advanced web search, research, and data discovery capabilities through multiple specialized tools for web content, academic papers, company research, and more.

### Syntax
```bash
exa-mcp-server [options]
```

### Available Flags/Options
- `--version` - Show version number
- `--tools` - Comma-separated list of tools to enable (default: all enabled-by-default tools)
- `--list-tools` - List all available tools and exit
- `--help` - Show help

### Configuration
- **Command**: `exa-mcp-server`
- **Arguments**: `["--tools=web_search_exa,research_paper_search,company_research,crawling,competitor_finder,linkedin_search,wikipedia_search_exa,github_search"]`
- **Environment**: `EXA_API_KEY` required
- **Priority**: Essential
- **Startup Delay**: 100ms
- **Timeout**: 30s

### Available Tools
- `web_search_exa` - General web search with configurable result counts
- `research_paper_search` - Search 100M+ research papers with full text access
- `company_research` - Research companies using targeted website crawling
- `crawling` - Extract content from specific URLs
- `competitor_finder` - Find competitors of a company
- `linkedin_search` - Search LinkedIn for companies
- `wikipedia_search_exa` - Search Wikipedia content
- `github_search` - Search GitHub repositories and code

### Example Usage
```bash
exa-mcp-server --tools=web_search_exa,research_paper_search
exa-mcp-server --list-tools
```

---

## supabase

### Purpose/Description
Supabase MCP Server enables comprehensive interaction with Supabase databases, providing full CRUD operations, project management, and advanced querying capabilities for AI assistants.

### Syntax
```bash
mcp-server-supabase
```

### Configuration
- **Command**: `mcp-server-supabase`
- **Arguments**: `[]`
- **Environment Variables**:
  - `SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_ANON_KEY` - Anonymous access key
  - `SUPABASE_ACCESS_TOKEN` - Personal access token
- **Priority**: Optional
- **Startup Delay**: 200ms
- **Timeout**: 30s

### Available Tools
- `list_organizations` - List all organizations user is member of
- `get_organization` - Get organization details including subscription plan
- `list_projects` - List all Supabase projects
- `get_project` - Get project details
- `get_cost` - Get cost of creating new project or branch
- `confirm_cost` - Confirm cost understanding before creation
- `create_project` - Create new Supabase project
- `pause_project` / `restore_project` - Manage project state
- `create_branch` / `list_branches` / `delete_branch` - Branch management
- `merge_branch` / `reset_branch` / `rebase_branch` - Branch operations
- `list_tables` / `list_extensions` / `list_migrations` - Database inspection
- `apply_migration` / `execute_sql` - Database operations
- `get_logs` / `get_advisors` - Monitoring and analysis
- `get_project_url` / `get_anon_key` - Project information
- `generate_typescript_types` - Type generation
- `search_docs` - Documentation search via GraphQL

### Example Usage
```bash
# Server runs automatically with configured environment variables
# Access via MCP tools like list_projects, create_project, execute_sql, etc.
```

---

## magicuidesign

### Purpose/Description
Magic UI Design MCP Server provides access to modern UI component generation and design system integration capabilities.

### Syntax
```bash
mcp
```

### Configuration
- **Command**: `mcp`
- **Arguments**: `[]`
- **Priority**: Optional
- **Startup Delay**: 300ms
- **Timeout**: 30s

### Available Tools
- `getUIComponents` - Get comprehensive list of all Magic UI components
- `getComponents` - Get implementation details for specific components (marquee, terminal, hero-video-dialog, bento-grid, animated-list, dock, globe, tweet-card, etc.)
- `getDeviceMocks` - Get device mock components (safari, iphone-15-pro, android)
- `getSpecialEffects` - Get special effect components (animated-beam, border-beam, shine-border, magic-card, meteors, etc.)
- `getAnimations` - Get animation components (blur-fade)
- `getTextAnimations` - Get text animation components (text-animate, aurora-text, number-ticker, etc.)
- `getButtons` - Get button components (rainbow-button, shimmer-button, shiny-button, etc.)
- `getBackgrounds` - Get background components (warp-background, flickering-grid, animated-grid-pattern, etc.)

### Example Usage
```bash
# Server runs automatically
# Access via MCP tools like getUIComponents, getButtons, getAnimations, etc.
```

---

## sequential-thinking

### Purpose/Description
Sequential Thinking MCP Server provides structured, multi-step problem-solving capabilities with branching logic, revision support, and systematic analysis for complex reasoning tasks.

### Syntax
```bash
mcp-server-sequential-thinking [options]
```

### Available Options
- `--max-thoughts=15` - Maximum number of thoughts per session
- `--branch-limit=2` - Maximum number of branches allowed
- `--detail-level=low` - Level of detail in thinking process
- `--revision-depth=3` - Maximum depth for thought revisions

### Configuration
- **Command**: `mcp-server-sequential-thinking`
- **Arguments**: `["--max-thoughts=15", "--branch-limit=2", "--detail-level=low", "--revision-depth=3"]`
- **Environment**: `DISABLE_THOUGHT_LOGGING=false`
- **Priority**: Optional
- **Startup Delay**: 400ms
- **Timeout**: 30s

### Available Tools
- `sequentialthinking` - Dynamic and reflective problem-solving through structured thoughts with branching and revision capabilities

### Key Features
- Adaptive thought estimation with real-time adjustment
- Thought revision and questioning of previous decisions
- Branching for alternative approaches
- Hypothesis generation and verification
- Solution validation and iteration

### Example Usage
```bash
mcp-server-sequential-thinking --max-thoughts=20 --detail-level=high
# Access via sequentialthinking tool for complex analysis
```

---

## Context7

### Purpose/Description
Context7 MCP Server provides access to up-to-date library documentation and code examples for software development, enabling retrieval of official documentation patterns and best practices.

### Syntax
```bash
context7-mcp [options]
```

### Available Flags/Options
- `--transport <stdio|http|sse>` - Transport type (default: stdio)
- `--port <number>` - Port for HTTP/SSE transport (default: 3000)
- `-h, --help` - Display help for command

### Configuration
- **Command**: `context7-mcp`
- **Arguments**: `[]`
- **Priority**: Optional
- **Startup Delay**: 500ms
- **Timeout**: 30s

### Available Tools
- `resolve-library-id` - Resolve package/product name to Context7-compatible library ID
- `get-library-docs` - Fetch up-to-date documentation for a library using resolved library ID

### Workflow Process
1. Use `resolve-library-id` to find the correct library identifier
2. Use `get-library-docs` with the resolved ID to fetch documentation
3. Access comprehensive documentation with code examples and best practices

### Example Usage
```bash
context7-mcp --transport stdio
context7-mcp --transport http --port 4000
```

---

## github

### Purpose/Description
GitHub MCP Server provides comprehensive GitHub API integration for repository management, issue tracking, pull request workflows, and code collaboration.

### Syntax
```bash
mcp-server-github
```

### Configuration
- **Command**: `mcp-server-github`
- **Arguments**: `[]`
- **Environment**: `GITHUB_PERSONAL_ACCESS_TOKEN` required
- **Priority**: Essential
- **Startup Delay**: 600ms
- **Timeout**: 30s

### Available Tools
- `create_or_update_file` - Create or update single file in repository
- `search_repositories` - Search for GitHub repositories
- `create_repository` - Create new GitHub repository
- `get_file_contents` - Get contents of file or directory
- `push_files` - Push multiple files in single commit
- `create_issue` / `list_issues` / `get_issue` / `update_issue` - Issue management
- `add_issue_comment` - Add comments to issues
- `create_pull_request` / `list_pull_requests` / `get_pull_request` - Pull request management
- `create_pull_request_review` / `get_pull_request_reviews` - Code review
- `merge_pull_request` / `update_pull_request_branch` - Pull request operations
- `get_pull_request_files` / `get_pull_request_status` / `get_pull_request_comments` - Pull request details
- `fork_repository` - Fork repositories
- `create_branch` / `list_commits` - Branch and commit management
- `search_code` / `search_issues` / `search_users` - Advanced search capabilities

### Example Usage
```bash
# Server runs automatically with GITHUB_PERSONAL_ACCESS_TOKEN
# Access via MCP tools like create_repository, search_code, create_pull_request, etc.
```

---

## filesystem

### Purpose/Description
Filesystem MCP Server provides secure file and directory operations with built-in security restrictions, enabling AI assistants to interact with local file systems within predefined safe directories.

### Syntax
```bash
mcp-server-filesystem [directories...]
```

### Configuration
- **Command**: `mcp-server-filesystem`
- **Arguments**: `["/home/krwhynot/Projects/KitchenPantry", "/home/krwhynot/Projects", "/home/krwhynot"]`
- **Priority**: Essential
- **Startup Delay**: 700ms
- **Timeout**: 30s

### Security Features
- Path restrictions to predefined safe directories
- File size limits (1MB for reading)
- Permission handling with graceful error management
- Path validation preventing directory traversal attacks
- Safe operations with pre-execution validation

### Available Tools
- `read_file` - Read complete contents of text files (with optional head/tail parameters)
- `read_multiple_files` - Read multiple files simultaneously for efficiency
- `write_file` - Create new file or overwrite existing file
- `edit_file` - Make line-based edits with git-style diff output
- `create_directory` - Create directories with nested support
- `list_directory` - Get detailed directory listings
- `list_directory_with_sizes` - Get directory listings with file sizes
- `directory_tree` - Get recursive tree view as JSON structure
- `move_file` - Move or rename files and directories
- `search_files` - Recursively search for files matching patterns
- `get_file_info` - Retrieve detailed file/directory metadata
- `list_allowed_directories` - Show accessible directory list

### Example Usage
```bash
mcp-server-filesystem /home/user/projects /home/user/documents
# Access via MCP tools like read_file, write_file, list_directory, etc.
```

---

## playwright

### Purpose/Description
Playwright MCP Server enables browser automation, end-to-end testing, and web interaction capabilities with support for multiple browsers and advanced configuration options.

### Syntax
```bash
@playwright/mcp [options]
```

### Available Flags/Options
- `-V, --version` - Output version number
- `--allowed-origins <origins>` - Semicolon-separated allowed origins
- `--blocked-origins <origins>` - Semicolon-separated blocked origins
- `--block-service-workers` - Block service workers
- `--browser <browser>` - Browser to use (chrome, firefox, webkit, msedge)
- `--browser-agent <endpoint>` - Use browser agent (experimental)
- `--caps <caps>` - Capabilities to enable (tabs, pdf, history, wait, files, install)
- `--cdp-endpoint <endpoint>` - CDP endpoint to connect to
- `--config <path>` - Path to configuration file
- `--device <device>` - Device to emulate (e.g., "iPhone 15")
- `--executable-path <path>` - Path to browser executable
- `--headless` - Run browser in headless mode
- `--host <host>` - Host to bind server (default: localhost)
- `--ignore-https-errors` - Ignore HTTPS errors
- `--isolated` - Keep browser profile in memory
- `--image-responses <mode>` - Image response handling (allow/omit/auto)
- `--no-sandbox` - Disable sandbox for all processes
- `--output-dir <path>` - Output directory path
- `--port <port>` - Port for SSE transport
- `--proxy-bypass <bypass>` - Domains to bypass proxy
- `--proxy-server <proxy>` - Proxy server specification
- `--save-trace` - Save Playwright Trace to output directory
- `--storage-state <path>` - Storage state file path
- `--user-agent <ua string>` - Custom user agent string
- `--user-data-dir <path>` - User data directory path
- `--viewport-size <size>` - Browser viewport size (e.g., "1280,720")
- `--vision` - Run server using screenshots
- `-h, --help` - Display help

### Configuration
- **Command**: `mcp-server-playwright`
- **Arguments**: `["--isolated", "--headless"]`
- **Priority**: Optional
- **Startup Delay**: 800ms
- **Timeout**: 30s

### Available Tools
- `browser_close` / `browser_resize` - Browser window management
- `browser_console_messages` - Get console output
- `browser_handle_dialog` - Handle browser dialogs
- `browser_file_upload` - Upload files to browser
- `browser_install` - Install browser if missing
- `browser_press_key` - Keyboard input
- `browser_navigate` / `browser_navigate_back` / `browser_navigate_forward` - Navigation
- `browser_network_requests` - Monitor network activity
- `browser_pdf_save` - Save page as PDF
- `browser_take_screenshot` / `browser_snapshot` - Capture page content
- `browser_click` / `browser_drag` / `browser_hover` - Mouse interactions
- `browser_type` / `browser_select_option` - Form interactions
- `browser_tab_list` / `browser_tab_new` / `browser_tab_select` / `browser_tab_close` - Tab management
- `browser_generate_playwright_test` - Generate test code
- `browser_wait_for` - Wait for conditions

### Example Usage
```bash
@playwright/mcp --headless --isolated --browser chrome
@playwright/mcp --device "iPhone 15" --viewport-size "375,667"
```