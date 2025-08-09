# CLAUDE.md

该文件为 Claude Code (claude.ai/code) 在此存储库中操作代码时提供指导。

## 项目概述

这是一个名为 "Videotape" 的 React Native 视频学习应用，使用 Expo 构建。它提供了类似抖音的界面用于本地视频学习，专为开发人员离线观看教育视频而设计。该应用具有垂直滚动视频播放、文件管理和学习进度跟踪功能。

## 🚨 关键：并发执行和文件管理

**绝对规则**：
1. 所有操作必须在单个消息中并发/并行执行
2. **切勿将工作文件、文本/mds 和测试保存到根文件夹**
3. 始终将文件组织到适当的子目录中

### ⚡ 黄金法则："1 条消息 = 所有相关操作"

**强制模式**：
- **TodoWrite**：始终在单次调用中批量处理所有待办事项（最少 5-10 个）
- **Task 工具**：始终在单条消息中生成所有代理并附上完整指令
- **文件操作**：始终在单条消息中批量处理所有读取/写入/编辑操作
- **Bash 命令**：始终在单条消息中批量处理所有终端操作
- **内存操作**：始终在单条消息中批量处理所有内存存储/检索操作

### 📁 文件组织规则

**切勿保存到根文件夹。使用这些目录**：
- `/src` - 源代码文件
- `/tests` - 测试文件
- `/docs` - 文档和 markdown 文件
- `/config` - 配置文件
- `/scripts` - 实用脚本
- `/examples` - 示例代码

## 开发命令

### 核心开发
- `npm start` - 启动 Expo 开发服务器
- `npm run android` - 在 Android 设备/模拟器上运行
- `npm run ios` - 在 iOS 设备/模拟器上运行
- `npm run web` - 运行网页版本

### 构建命令
- `npm run build:dev` - 构建开发版本
- `npm run build:preview` - 构建预览版本
- `npm run build:prod` - 构建生产版本
- `expo prebuild` - 生成原生构建文件

### SPARC 命令
- `npx claude-flow sparc modes` - 列出可用模式
- `npx claude-flow sparc run <mode> "<task>"` - 执行特定模式
- `npx claude-flow sparc tdd "<feature>"` - 运行完整 TDD 工作流
- `npx claude-flow sparc info <mode>` - 获取模式详情

### 批处理工具命令
- `npx claude-flow sparc batch <modes> "<task>"` - 并行执行
- `npx claude-flow sparc pipeline "<task>"` - 完整管道处理
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - 多任务处理

### 构建命令
- `npm run build` - 构建项目
- `npm run test` - 运行测试
- `npm run lint` - 代码检查
- `npm run typecheck` - 类型检查

### 代码质量
- `npm run lint` - 运行 ESLint 和 Prettier 检查
- `npm run typecheck` - 运行 TypeScript 类型检查
- `npm run format` - 使用 ESLint 和 Prettier 格式化代码

## SPARC 工作流阶段

1. **规范** - 需求分析 (`sparc run spec-pseudocode`)
2. **伪代码** - 算法设计 (`sparc run spec-pseudocode`)
3. **架构** - 系统设计 (`sparc run architect`)
4. **优化** - TDD 实现 (`sparc tdd`)
5. **完成** - 集成 (`sparc run integration`)

## 技术栈

- **框架**：React Native + Expo (~53.0.20)
- **语言**：TypeScript
- **导航**：Expo Router
- **样式**：Tailwind CSS (NativeWind)
- **状态管理**：Zustand
- **数据库**：Realm（从 Dexie.js 迁移）
- **视频播放**：react-native-video
- **文件存储**：Expo File System
- **包管理器**：pnpm

## 架构

### 数据库层
该应用使用 Realm 作为主数据库，具有全面的架构：

- **Video**：包含元数据、播放统计和索引的主要视频实体
- **Playlist**：包含视频 ID 数组的视频集合
- **Folder**：分层组织结构
- **PlayHistory**：包含设备信息的详细播放跟踪
- **AppSettings**：用户偏好和应用配置

关键数据库文件：
- `app/database/realm-schema.ts` - 数据库架构定义
- `app/database/realm-service.ts` - 数据库服务实现
- `app/database/index.ts` - 数据库管理器和迁移服务
- `app/database/migration-service.ts` - 数据迁移工具

### 服务层
- `app/services/videoService.ts` - 视频 CRUD 操作和搜索
- `app/services/storage.ts` - 文件系统操作
- `app/services/playlistService.ts` - 播放列表管理
- `app/services/database.ts` - 数据库抽象层

### 状态管理
- `app/stores/settingsStore.ts` - 用户设置状态
- `app/stores/store/store.ts` - 全局状态管理

### 组件架构
- `app/components/video/` - 视频播放组件
- `app/components/tiktok/` - 抖音风格源组件
- `app/components/common/` - 可重用 UI 组件

## 数据模型

### 核心类型
```typescript
interface Video {
  id: string;
  title: string;
  uri: string;
  thumbnailUri?: string;
  duration: number;
  size: number;
  mimeType: string;
  playCount: number;
  tags: string[];
  // ... 其他字段
}

interface PlayerState {
  currentVideo: Video | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  // ... 其他播放器状态
}
```

## 主要功能

### 视频管理
- 批量视频上传和组织
- 基于文件夹的结构支持
- 缩略图生成和缓存
- 元数据提取（持续时间、分辨率等）
- 搜索和过滤功能

### 播放功能
- 抖音风格垂直滚动
- 可变播放速度（0.25x - 4x）
- 进度保存和恢复
- 后台播放支持
- 音量和亮度控制

### 学习功能
- 播放历史跟踪
- 进度统计
- 书签功能
- 学习分析

## 数据库迁移

该项目已成功从 Dexie.js (IndexedDB) 迁移到 Realm 以在 React Native 中获得更好的性能。迁移工作已完成，应用现在完全使用 Realm 数据库。

**迁移状态**: ✅ 已完成
**主要改进**:
- 性能提升 2-3 倍
- 内存占用减少 50%
- 更好的 React Native 兼容性
- 类型安全的 API

**相关文件**:
- `app/database/migration-service.ts` - 已废弃的迁移工具（保留用于历史参考）
- `app/database/realm-schema.ts` - 完整的 Realm 数据库架构
- `docs/realm-migration-guide.md` - 迁移文档（历史参考）

## 文件组织

```
app/
├── components/          # React 组件
│   ├── video/          # 视频播放组件
│   ├── tiktok/         # 抖音风格组件
│   └── common/         # 共享 UI 组件
├── database/           # Realm 数据库层
├── services/           # 业务逻辑服务
├── screens/            # 屏幕组件
├── stores/             # Zustand 状态管理
├── types/              # TypeScript 类型定义
├── utils/              # 实用函数
└── storage/            # 存储和配置
```

## 🚀 可用代理（共 54 个）

### 核心开发
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### 群体协调
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### 共识与分布式
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### 性能与优化
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub 与仓库
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC 方法论
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### 专业开发
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### 测试与验证
`tdd-london-swarm`, `production-validator`

### 迁移与规划
`migration-planner`, `swarm-init`

## 🎯 Claude Code 与 MCP 工具

### Claude Code 处理所有：
- 文件操作（Read, Write, Edit, MultiEdit, Glob, Grep）
- 代码生成和编程
- Bash 命令和系统操作
- 实现工作
- 项目导航和分析
- TodoWrite 和任务管理
- Git 操作
- 包管理
- 测试和调试

### MCP 工具仅用于：
- 协调和规划
- 内存管理
- 神经功能
- 性能跟踪
- 群体编排
- GitHub 集成

**关键**：MCP 协调，Claude Code 创建。

## 🚀 快速设置

```bash
# 添加 Claude Flow MCP 服务器
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

## MCP 工具类别

### 协调
`swarm_init`, `agent_spawn`, `task_orchestrate`

### 监控
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### 内存与神经
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub 集成
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### 系统
`benchmark_run`, `features_detect`, `swarm_monitor`

## 📋 代理协调协议

### 每个代理必须：

**1️⃣ 工作前：**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ 工作中：**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ 工作后：**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 并发执行示例

### ✅ 正确（单条消息）：
```javascript
[BatchTool]:
  // 初始化群体
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  
  // 使用 Task 工具生成代理
  Task("Research agent: Analyze requirements...")
  Task("Coder agent: Implement features...")
  Task("Tester agent: Create test suite...")
  
  // 批量待办事项
  TodoWrite { todos: [
    {id: "1", content: "Research", status: "in_progress", priority: "high"},
    {id: "2", content: "Design", status: "pending", priority: "high"},
    {id: "3", content: "Implement", status: "pending", priority: "high"},
    {id: "4", content: "Test", status: "pending", priority: "medium"},
    {id: "5", content: "Document", status: "pending", priority: "low"}
  ]}
  
  // 文件操作
  Bash "mkdir -p app/{src,tests,docs}"
  Write "app/src/index.js"
  Write "app/tests/index.test.js"
  Write "app/docs/README.md"
```

### ❌ 错误（多条消息）：
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// 这会破坏并行协调！
```

## 性能优势

- **84.8% SWE-Bench 解决率**
- **32.3% token 减少**
- **2.8-4.4x 速度提升**
- **27+ 神经模型**

## Hooks 集成

### 操作前
- 按文件类型自动分配代理
- 验证命令安全性
- 自动准备资源
- 按复杂度优化拓扑
- 缓存搜索

### 操作后
- 自动格式化代码
- 训练神经模式
- 更新内存
- 分析性能
- 跟踪 token 使用

### 会话管理
- 生成摘要
- 持久化状态
- 跟踪指标
- 恢复上下文
- 导出工作流

## 高级功能 (v2.0.0)

- 🚀 自动拓扑选择
- ⚡ 并行执行（2.8-4.4x 速度）
- 🧠 神经训练
- 📊 瓶颈分析
- 🤖 智能自动生成
- 🛡️ 自愈工作流
- 💾 跨会话内存
- 🔗 GitHub 集成

## 集成提示

1. 从基本群体初始化开始
2. 逐步扩展代理
3. 使用内存获取上下文
4. 定期监控进度
5. 从成功案例训练模式
6. 启用 hooks 自动化
7. 优先使用 GitHub 工具

## 支持

- 文档：https://github.com/ruvnet/claude-flow
- 问题：https://github.com/ruvnet/claude-flow/issues

---

记住：**Claude Flow 协调，Claude Code 创建！**

## 开发说明

### 数据库操作
- 使用 `databaseManager` 单例进行数据库访问
- 所有数据库操作都返回 promise
- 为数据库操作实现适当的错误处理
- 使用批量操作以获得更好的性能

### 视频文件处理
- 视频使用 Expo File System 存储
- 缩略图自动生成
- 使用 `storageService` 进行文件操作
- 删除视频时实施适当的清理

### 状态管理
- 使用 Zustand 进行状态管理
- 保持状态最小化和专注
- 对重要状态使用持久化中间件
- 在效果中实施适当的清理

### 样式
- 通过 NativeWind 使用 Tailwind CSS 类
- 遵循现有设计系统
- 使用响应式设计模式
- 实现深色/浅色主题支持

## 性能考虑

- 对频繁查询的字段使用 Realm 索引
- 为大型视频列表实现分页
- 对视频缩略图使用延迟加载
- 通过适当的缓存优化视频加载
- 监控大型视频文件的内存使用

## 测试

目前使用手动测试。应添加测试框架：
- 考虑为单元测试添加 Jest
- 用于组件测试的 React Native Testing Library
- 用于 E2E 测试的 Detox

## 构建和部署

- 使用 Expo Application Services (EAS) 进行构建
- 在 `eas.json` 中配置构建配置文件
- 实施适当的版本控制
- 在 iOS 和 Android 平台上测试

## 代码风格与最佳实践

- **模块化设计**：文件少于 500 行
- **环境安全**：绝不硬编码秘密
- **测试优先**：在实现之前编写测试
- **清洁架构**：分离关注点
- **文档**：保持更新