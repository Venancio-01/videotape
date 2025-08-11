/**
 * 数据库模块统一导出文件
 * 提供所有数据库相关的功能和类型
 */

// ===== 配置 =====
export * from './config';

// ===== Schema 和类型 =====
export * from './schema';

// ===== 仓库模式 =====
export * from './repositories';

// ===== 服务层 =====
export * from './services';

// ===== React Hooks =====
export * from './hooks';

// ===== 工具函数 =====
export * from './utils';

// ===== 迁移管理 =====
export * from './migrations';

// ===== 组件 =====
export * from './components';

// ===== 基础类型 =====
export * from './types';

// ===== 便捷导出 =====
export { databaseService } from './repositories/DatabaseService';
export { useDatabase } from './hooks/useDatabase';