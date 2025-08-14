/**
 * 数据库模块统一类型定义
 */

// ===== 基础类型 =====

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Timestamps {
  created_at: Date;
  updated_at: Date;
}

// ===== 查询相关类型 =====

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface SearchOptions extends QueryOptions {
  query?: string;
  filters?: Record<string, any>;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===== 数据库操作类型 =====

export interface DatabaseOperation<T = any> {
  execute(): Promise<T>;
  rollback?(): Promise<void>;
}

export interface TransactionOptions {
  isolation?:
    | "readUncommitted"
    | "readCommitted"
    | "repeatableRead"
    | "serializable";
  timeout?: number;
}

// ===== 仓库接口类型 =====

export interface IRepository<T extends BaseEntity> {
  // 查询方法
  getAllQuery(options?: QueryOptions): any;
  findByIdQuery(id: string): any;

  // CRUD 操作
  create(data: Omit<T, "id" | "created_at" | "updated_at">): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;

  // 批量操作
  bulkCreate(data: Omit<T, "id" | "created_at" | "updated_at">[]): Promise<T[]>;
  bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<T[]>;
  bulkDelete(ids: string[]): Promise<number>;
}

// ===== 错误类型 =====

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ConnectionError extends DatabaseError {
  constructor(originalError?: Error) {
    super("数据库连接失败", "CONNECTION_ERROR", originalError);
    this.name = "ConnectionError";
  }
}

export class MigrationError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, "MIGRATION_ERROR", originalError);
    this.name = "MigrationError";
  }
}

export class QueryError extends DatabaseError {
  constructor(
    message: string,
    public query: string,
    originalError?: Error,
  ) {
    super(message, "QUERY_ERROR", originalError);
    this.name = "QueryError";
  }
}

// ===== 事件类型 =====

export interface DatabaseEvent {
  type: "connect" | "disconnect" | "query" | "transaction" | "error";
  timestamp: Date;
  data?: any;
}

export type DatabaseEventHandler = (event: DatabaseEvent) => void;

// ===== 性能监控类型 =====

export interface PerformanceMetrics {
  queryCount: number;
  averageQueryTime: number;
  slowQueries: Array<{
    query: string;
    time: number;
    timestamp: Date;
  }>;
  connectionCount: number;
  memoryUsage: number;
}

// ===== 备份类型 =====

export interface BackupOptions {
  path?: string;
  includeMigrations?: boolean;
  compress?: boolean;
}

export interface BackupInfo {
  id: string;
  timestamp: Date;
  size: number;
  path: string;
  checksum: string;
}

// ===== 健康检查类型 =====

export interface HealthCheckResult {
  isHealthy: boolean;
  connection: boolean;
  migrations: boolean;
  performance: boolean;
  details: {
    connectionTime?: number;
    migrationCount?: number;
    slowQueryCount?: number;
    errors: string[];
  };
}
