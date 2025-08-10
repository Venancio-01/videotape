// 数据库模块统一导出文件
export * from "./schema";
export * from "./database-manager";
export * from "./database-service";
export * from "./database-performance";

// 主要导出
export { databaseManager } from "./database-manager";
export { databaseService } from "./database-service";
export { databasePerformanceService } from "./database-performance";

// 向后兼容的导出
export { initialize, useMigrationHelper } from "./drizzle";
export type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
