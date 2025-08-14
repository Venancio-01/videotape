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
