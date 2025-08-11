/**
 * 数据库工具函数
 */

import { DatabaseError, QueryError } from '../types';

// ===== SQL 构建工具 =====

/**
 * 构建 WHERE 条件
 */
export function buildWhereClause(conditions: Record<string, any>): {
  clause: string;
  params: any[];
} {
  const clauses: string[] = [];
  const params: any[] = [];

  Object.entries(conditions).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      clauses.push(`${key} IN (${value.map(() => '?').join(', ')})`);
      params.push(...value);
    } else if (typeof value === 'object' && value.operator) {
      clauses.push(`${key} ${value.operator} ?`);
      params.push(value.value);
    } else {
      clauses.push(`${key} = ?`);
      params.push(value);
    }
  });

  return {
    clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

/**
 * 构建 ORDER BY 子句
 */
export function buildOrderByClause(
  orderBy?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): string {
  if (!orderBy) return '';
  return `ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
}

/**
 * 构建 LIMIT 和 OFFSET 子句
 */
export function buildLimitOffsetClause(
  limit?: number,
  offset?: number
): string {
  const clauses: string[] = [];
  
  if (limit !== undefined) {
    clauses.push(`LIMIT ${limit}`);
  }
  
  if (offset !== undefined) {
    clauses.push(`OFFSET ${offset}`);
  }
  
  return clauses.join(' ');
}

// ===== 查询工具 =====

/**
 * 分页查询工具
 */
export function paginateQuery<T>(
  query: string,
  page: number,
  pageSize: number
): {
  paginatedQuery: string;
  countQuery: string;
} {
  const offset = (page - 1) * pageSize;
  
  return {
    paginatedQuery: `${query} LIMIT ${pageSize} OFFSET ${offset}`,
    countQuery: `SELECT COUNT(*) as total FROM (${query}) as subquery`,
  };
}

/**
 * 搜索查询工具
 */
export function searchQuery(
  tableName: string,
  searchFields: string[],
  searchTerm: string,
  additionalConditions?: string
): {
  query: string;
  params: any[];
} {
  const searchConditions = searchFields
    .map(field => `${field} LIKE ?`)
    .join(' OR ');
  
  const params = Array(searchFields.length).fill(`%${searchTerm}%`);
  
  let query = `SELECT * FROM ${tableName} WHERE (${searchConditions})`;
  
  if (additionalConditions) {
    query += ` AND ${additionalConditions}`;
  }
  
  return { query, params };
}

// ===== 数据转换工具 =====

/**
 * 转换为蛇形命名
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * 转换为驼峰命名
 */
export function toCamelCase(str: string): string {
  return str
    .split('_')
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

/**
 * 批量转换对象键名
 */
export function convertKeys<T>(
  obj: Record<string, any>,
  converter: (key: string) => string
): T {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[converter(key)] = value;
    return acc;
  }, {} as T);
}

// ===== 验证工具 =====

/**
 * 验证 ID 格式
 */
export function validateId(id: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
}

/**
 * 验证日期格式
 */
export function validateDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// ===== 错误处理工具 =====

/**
 * 包装数据库操作，提供统一错误处理
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      throw new DatabaseError(
        `${context}失败: ${error.message}`,
        'OPERATION_FAILED',
        error
      );
    }
    throw new DatabaseError(
      `${context}失败: 未知错误`,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * 重试工具
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// ===== 性能工具 =====

/**
 * 性能测量装饰器
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const end = performance.now();

    const duration = end - start;
    if (duration > 1000) { // 慢查询阈值
      console.warn(`慢查询检测: ${propertyKey} 耗时 ${duration.toFixed(2)}ms`);
    }

    return result;
  };

  return descriptor;
}

// ===== 导出工具 =====

/**
 * 生成 CSV 导出数据
 */
export function generateCSV(data: Record<string, any>[], headers?: string[]): string {
  if (data.length === 0) return '';
  
  const actualHeaders = headers || Object.keys(data[0]);
  const csvRows = [actualHeaders.join(',')];
  
  for (const row of data) {
    const values = actualHeaders.map(header => {
      const value = row[header];
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// ===== 备份工具 =====

/**
 * 生成备份文件名
 */
export function generateBackupFileName(prefix = 'backup'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.sql`;
}

/**
 * 计算文件大小
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}