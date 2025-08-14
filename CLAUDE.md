# Claude Code Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:

1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. When it comes to the use of dependent frameworks, view their documentation immediately using context7 mcp

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS**:

- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**

- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Overview

This project uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Claude-Flow orchestration for systematic Test-Driven Development.

## SPARC Commands

### Core Commands

- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

### Batchtools Commands

- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

### Build Commands

- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Linting
- `npm run typecheck` - Type checking

## SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Algorithm design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

## 🚀 Available Agents (54 Total)

### Core Development

`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination

`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed

`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization

`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository

`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology

`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development

`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation

`tdd-london-swarm`, `production-validator`

### Migration & Planning

`migration-planner`, `swarm-init`

## 🎯 Claude Code vs MCP Tools

### Claude Code Handles ALL

- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

### MCP Tools ONLY

- Coordination and planning
- Memory management
- Neural features
- Performance tracking
- Swarm orchestration
- GitHub integration

**KEY**: MCP coordinates, Claude Code executes.

## 🚀 Quick Setup

```bash
# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

## MCP Tool Categories

### Coordination

`swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring

`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### Memory & Neural

`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub Integration

`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### System

`benchmark_run`, `features_detect`, `swarm_monitor`

## 📋 Agent Coordination Protocol

### Every Agent MUST

**1️⃣ BEFORE Work:**

```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**

```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**

```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 Concurrent Execution Examples

### ✅ CORRECT (Single Message)

```javascript
[BatchTool]:
  // Initialize swarm
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }

  // Spawn agents with Task tool
  Task("Research agent: Analyze requirements...")
  Task("Coder agent: Implement features...")
  Task("Tester agent: Create test suite...")

  // Batch todos
  TodoWrite { todos: [
    {id: "1", content: "Research", status: "in_progress", priority: "high"},
    {id: "2", content: "Design", status: "pending", priority: "high"},
    {id: "3", content: "Implement", status: "pending", priority: "high"},
    {id: "4", content: "Test", status: "pending", priority: "medium"},
    {id: "5", content: "Document", status: "pending", priority: "low"}
  ]}

  // File operations
  Bash "mkdir -p app/{src,tests,docs}"
  Write "app/src/index.js"
  Write "app/tests/index.test.js"
  Write "app/docs/README.md"
```

### ❌ WRONG (Multiple Messages)

```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

## Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

## Hooks Integration

### Pre-Operation

- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

### Post-Operation

- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

### Session Management

- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

## Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

## Integration Tips

1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first

## Support

- Documentation: <https://github.com/ruvnet/claude-flow>
- Issues: <https://github.com/ruvnet/claude-flow/issues>

---

Remember: **Claude Flow coordinates, Claude Code creates!**

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

## 项目概述

这是一个基于 Expo 和 React Native 的本地优先视频播放应用，使用 TypeScript 开发。项目采用现代化技术栈，包含本地数据库、状态管理、UI 组件库等完整功能。

## 开发命令

### 开发环境启动

```bash
npm run dev              # 启动开发服务器（通过隧道）
npm run dev:android      # Android 开发模式
npm run dev:ios          # iOS 开发模式
```

### 构建和发布

```bash
npm run build            # 构建所有平台
npm run build:web        # 构建 Web 版本
npm run android          # 运行 Android 应用
npm run ios              # 运行 iOS 应用
```

### 代码质量

```bash
npm run lint             # 代码检查（使用 biome）
npm run lint:fix         # 自动修复代码问题
npm run format           # 格式化代码
npm run typecheck        # TypeScript 类型检查
```

### 数据库相关

```bash
npm run db:generate      # 生成数据库迁移文件
```

### 依赖检查

```bash
npm run expo-check       # 检查 Expo 依赖
```

## 技术架构

### 核心技术栈

- **Expo Router v5** - 文件路由系统
- **React Native 0.79** - 跨平台移动应用框架
- **TypeScript** - 类型安全的 JavaScript
- **SQLite** - 本地数据库（使用 Drizzle ORM）
- **Zustand** - 轻量级状态管理
- **NativeWind v4** - Tailwind CSS for React Native
- **Radix UI** - 可访问性 UI 组件

### 项目结构

#### `/src/app` - 路由和页面

- 使用 Expo Router 的文件路由
- 主要页面：首页、播放列表、搜索、设置
- 支持嵌套路由和动态路由

#### `/src/db` - 数据库层

- **schema/** - 数据库表结构定义
- **migrations/** - 数据库迁移文件
- **repositories/** - 数据访问层
- **hooks/** - 数据库相关 React Hooks
- **services/** - 数据库服务

#### `/src/stores` - 状态管理

- 基于 Zustand 的模块化状态管理
- 包含：视频、播放、队列、设置、UI、播放列表等 store
- 支持持久化和中间件

#### `/src/components` - UI 组件

- **ui/** - 基础 UI 组件库
- **primitives/** - Radix UI 原生组件
- **video/** - 视频相关组件
- **settings/** - 设置页面组件

#### `/src/features` - 功能模块

- **player/** - 播放器功能
- **playlist/** - 播放列表管理
- **search/** - 搜索功能
- **settings/** - 设置功能
- **upload/** - 上传功能
- **video/** - 视频管理

### 数据库架构

使用 Drizzle ORM 管理 SQLite 数据库，包含：

- 视频表（videos）
- 播放列表表（playlists）
- 播放列表项目表（playlist_items）
- 设置表（settings）

### 状态管理架构

采用 Zustand 进行状态管理，特点：

- 模块化设计，每个功能独立 store
- 支持持久化（react-native-mmkv）
- 中间件支持（日志、开发工具）
- TypeScript 类型安全

### UI 组件架构

- 基于 Radix UI 构建可访问性组件
- 使用 NativeWind 进行样式管理
- 统一的设计系统和主题支持
- 支持深色/浅色模式切换

## 开发规范

### 代码风格

- 使用 Biome 进行代码格式化和检查
- TypeScript 严格模式
- ESLint 规则集成在 Biome 中

### 文件组织

- 按功能模块组织代码
- 组件文件使用 PascalCase
- 工具函数使用 camelCase
- 类型定义放在同目录的 types/ 子目录

### 测试策略

- 使用 Vitest 进行单元测试
- 测试文件放在 **tests**/ 子目录
- 支持 React Native Testing Library

## 构建和部署

### 多平台支持

- iOS（通过 Expo）
- Android（通过 Expo）
- Web（通过 Metro bundler）

### 环境配置

- 使用 app.config.ts 管理应用配置
- 支持不同环境的变量配置
- Expo EAS 集成支持

## 注意事项

### 数据库迁移

- 使用 Drizzle Kit 生成迁移文件
- 迁移文件位于 `src/db/migrations/` 目录
- 支持版本回滚和升级

### 状态持久化

- 使用 react-native-mmkv 进行高性能存储
- 支持选择性持久化特定状态
- 自动处理数据序列化

### 性能优化

- 使用 Flash List 进行长列表优化
- 图片懒加载和缓存
- 数据库查询优化
