/**
 * 仓库模块统一导出文件
 * 基于 Repository Pattern 的数据访问层
 */

// 接口定义
export * from "./interfaces";

// 仓库实现
export { VideoRepository } from "./VideoRepository";
export { PlaylistRepository } from "./PlaylistRepository";
export { DatabaseService, databaseService } from "./DatabaseService";

// 默认导出
export { databaseService as default } from "./DatabaseService";
