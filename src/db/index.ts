/**
 * 数据库模块统一导出文件
 * 提供所有数据库相关的功能和类型
 */

// ===== Schema 和类型 =====
export * from "./schema";

// ===== 仓库模式 =====
export * from "./repositories";

// ===== React Hooks =====
export * from "./hooks";

// ===== 迁移管理 =====
export * from "./migrations";

// ===== 组件 =====
export * from "./components/DatabaseErrorHandler";

// ===== 基础类型 =====
export * from "./types";

// ===== 便捷导出 =====
export { databaseService } from "./repositories/DatabaseService";
export { useDatabase } from "./hooks/useDatabase";
