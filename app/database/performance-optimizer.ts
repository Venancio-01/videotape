/**
 * Realm 数据库性能优化和调优指南
 * 提供完整的性能优化策略和最佳实践
 */

import { getDatabase } from './realm-service';
import { mmkvStorage } from '../storage/mmkv-storage';

/**
 * 性能监控指标
 */
export interface PerformanceMetrics {
  queryTime: number;
  writeTime: number;
  readTime: number;
  memoryUsage: number;
  databaseSize: number;
  cacheHitRate: number;
  indexUsage: any;
}

/**
 * 性能优化器
 */
export class PerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    queryTime: 0,
    writeTime: 0,
    readTime: 0,
    memoryUsage: 0,
    databaseSize: 0,
    cacheHitRate: 0,
    indexUsage: {},
  };

  private queryTimes: number[] = [];
  private writeTimes: number[] = [];
  private readTimes: number[] = [];

  /**
   * 监控查询性能
   */
  async monitorQuery<T>(operation: () => Promise<T>, queryName: string): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.queryTimes.push(duration);
      this.metrics.queryTime = duration;
      
      // 记录详细的查询性能
      this.logQueryPerformance(queryName, duration);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.queryTimes.push(duration);
      this.metrics.queryTime = duration;
      
      this.logQueryPerformance(queryName, duration, error);
      throw error;
    }
  }

  /**
   * 监控写入性能
   */
  async monitorWrite<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.writeTimes.push(duration);
      this.metrics.writeTime = duration;
      
      this.logWritePerformance(operationName, duration);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.writeTimes.push(duration);
      this.metrics.writeTime = duration;
      
      this.logWritePerformance(operationName, duration, error);
      throw error;
    }
  }

  /**
   * 监控读取性能
   */
  async monitorRead<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.readTimes.push(duration);
      this.metrics.readTime = duration;
      
      this.logReadPerformance(operationName, duration);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.readTimes.push(duration);
      this.metrics.readTime = duration;
      
      this.logReadPerformance(operationName, duration, error);
      throw error;
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    summary: PerformanceMetrics;
    details: {
      queryStats: any;
      writeStats: any;
      readStats: any;
      recommendations: string[];
    };
  } {
    const queryStats = this.calculateStats(this.queryTimes);
    const writeStats = this.calculateStats(this.writeTimes);
    const readStats = this.calculateStats(this.readTimes);

    const recommendations = this.generateRecommendations(queryStats, writeStats, readStats);

    return {
      summary: { ...this.metrics },
      details: {
        queryStats,
        writeStats,
        readStats,
        recommendations,
      },
    };
  }

  /**
   * 计算统计数据
   */
  private calculateStats(times: number[]): {
    count: number;
    average: number;
    min: number;
    max: number;
    percentile95: number;
  } {
    if (times.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        percentile95: 0,
      };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((acc, val) => acc + val, 0);
    
    return {
      count: times.length,
      average: sum / times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      percentile95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(queryStats: any, writeStats: any, readStats: any): string[] {
    const recommendations: string[] = [];

    // 查询性能建议
    if (queryStats.average > 100) {
      recommendations.push('查询性能较慢，建议添加更多索引或优化查询条件');
    }
    if (queryStats.percentile95 > 500) {
      recommendations.push('存在慢查询，建议检查复杂查询并优化');
    }

    // 写入性能建议
    if (writeStats.average > 50) {
      recommendations.push('写入性能较慢，建议使用批量操作或优化事务');
    }
    if (writeStats.count > 100 && writeStats.average > 20) {
      recommendations.push('频繁写入操作，建议考虑使用批量写入');
    }

    // 读取性能建议
    if (readStats.average > 30) {
      recommendations.push('读取性能较慢，建议增加缓存层或优化数据访问模式');
    }

    // 缓存建议
    const cacheHitRate = this.calculateCacheHitRate();
    if (cacheHitRate < 0.8) {
      recommendations.push('缓存命中率较低，建议优化缓存策略');
    }

    return recommendations;
  }

  /**
   * 计算缓存命中率
   */
  private calculateCacheHitRate(): number {
    // 这里可以实现具体的缓存命中率计算逻辑
    return 0.85; // 示例值
  }

  /**
   * 记录查询性能
   */
  private logQueryPerformance(queryName: string, duration: number, error?: any): void {
    if (error) {
      console.warn(`查询性能 [${queryName}] 失败: ${duration}ms`, error);
    } else {
      console.log(`查询性能 [${queryName}]: ${duration}ms`);
    }
  }

  /**
   * 记录写入性能
   */
  private logWritePerformance(operationName: string, duration: number, error?: any): void {
    if (error) {
      console.warn(`写入性能 [${operationName}] 失败: ${duration}ms`, error);
    } else {
      console.log(`写入性能 [${operationName}]: ${duration}ms`);
    }
  }

  /**
   * 记录读取性能
   */
  private logReadPerformance(operationName: string, duration: number, error?: any): void {
    if (error) {
      console.warn(`读取性能 [${operationName}] 失败: ${duration}ms`, error);
    } else {
      console.log(`读取性能 [${operationName}]: ${duration}ms`);
    }
  }
}

/**
 * 数据库优化策略
 */
export class DatabaseOptimizer {
  private performanceOptimizer = new PerformanceOptimizer();

  /**
   * 优化数据库配置
   */
  async optimizeDatabase(): Promise<void> {
    const db = getDatabase();
    
    try {
      console.log('开始优化数据库配置...');
      
      // 1. 清理过期数据
      await this.cleanupExpiredData();
      
      // 2. 优化索引
      await this.optimizeIndexes();
      
      // 3. 压缩数据库
      await this.compactDatabase();
      
      // 4. 优化缓存
      await this.optimizeCache();
      
      console.log('数据库优化完成');
    } catch (error) {
      console.error('数据库优化失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期数据
   */
  private async cleanupExpiredData(): Promise<void> {
    const db = getDatabase();
    
    try {
      // 清理过期的播放历史
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30天前
      const oldHistory = db.playHistory.getRecent(1000).filter(
        h => new Date(h.playedAt) < cutoffDate
      );

      if (oldHistory.length > 0) {
        await db.batch.write(() => {
          oldHistory.forEach(history => {
            db.playHistory.delete(history.id);
          });
        });
        console.log(`清理了 ${oldHistory.length} 条过期播放历史`);
      }

      // 清理 MMKV 缓存
      await mmkvStorage.cleanup();
      
    } catch (error) {
      console.error('清理过期数据失败:', error);
    }
  }

  /**
   * 优化索引
   */
  private async optimizeIndexes(): Promise<void> {
    const db = getDatabase();
    
    try {
      // 分析查询模式
      const queryPatterns = await this.analyzeQueryPatterns();
      
      // 根据查询模式建议索引优化
      const recommendations = this.generateIndexRecommendations(queryPatterns);
      
      console.log('索引优化建议:', recommendations);
      
    } catch (error) {
      console.error('优化索引失败:', error);
    }
  }

  /**
   * 分析查询模式
   */
  private async analyzeQueryPatterns(): Promise<any> {
    // 这里可以实现查询模式分析逻辑
    return {
      frequentQueries: [
        { field: 'title', frequency: 'high' },
        { field: 'folderId', frequency: 'medium' },
        { field: 'createdAt', frequency: 'high' },
      ],
      sortPatterns: [
        { field: 'createdAt', direction: 'desc' },
        { field: 'title', direction: 'asc' },
      ],
    };
  }

  /**
   * 生成索引建议
   */
  private generateIndexRecommendations(queryPatterns: any): string[] {
    const recommendations: string[] = [];
    
    queryPatterns.frequentQueries.forEach((query: any) => {
      if (query.frequency === 'high' && query.field !== 'id') {
        recommendations.push(`考虑为 ${query.field} 字段添加索引`);
      }
    });
    
    return recommendations;
  }

  /**
   * 压缩数据库
   */
  private async compactDatabase(): Promise<void> {
    const db = getDatabase();
    
    try {
      const beforeSize = await this.getDatabaseSize();
      await db.utils.compact();
      const afterSize = await this.getDatabaseSize();
      
      const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(2);
      console.log(`数据库压缩完成: ${beforeSize} -> ${afterSize} (${reduction}% 减少)`);
      
    } catch (error) {
      console.error('压缩数据库失败:', error);
    }
  }

  /**
   * 优化缓存
   */
  private async optimizeCache(): Promise<void> {
    try {
      // 优化 MMKV 缓存配置
      await mmkvStorage.cleanup();
      
      // 预热常用数据
      await this.preloadCache();
      
      console.log('缓存优化完成');
      
    } catch (error) {
      console.error('优化缓存失败:', error);
    }
  }

  /**
   * 预加载缓存
   */
  private async preloadCache(): Promise<void> {
    const db = getDatabase();
    
    try {
      // 预加载最近访问的视频
      const recentVideos = db.videos.getRecent(50);
      
      // 预加载常用设置
      const settings = db.settings.get();
      
      console.log(`预加载了 ${recentVideos.length} 个视频到缓存`);
      
    } catch (error) {
      console.error('预加载缓存失败:', error);
    }
  }

  /**
   * 获取数据库大小
   */
  private async getDatabaseSize(): Promise<number> {
    try {
      const stats = await mmkvStorage.getStats();
      return stats.estimatedSize;
    } catch (error) {
      console.error('获取数据库大小失败:', error);
      return 0;
    }
  }

  /**
   * 获取性能优化建议
   */
  async getOptimizationRecommendations(): Promise<{
    immediate: string[];
    scheduled: string[];
    longTerm: string[];
  }> {
    const performanceReport = this.performanceOptimizer.getPerformanceReport();
    const dbStats = await this.getDatabaseStats();
    
    return {
      immediate: this.getImmediateActions(performanceReport, dbStats),
      scheduled: this.getScheduledActions(performanceReport, dbStats),
      longTerm: this.getLongTermActions(performanceReport, dbStats),
    };
  }

  /**
   * 获取立即执行的操作
   */
  private getImmediateActions(report: any, stats: any): string[] {
    const actions: string[] = [];
    
    if (stats.estimatedSize > 100 * 1024 * 1024) { // 100MB
      actions.push('立即清理过期数据');
    }
    
    if (report.details.queryStats.average > 100) {
      actions.push('优化慢查询');
    }
    
    if (report.details.writeStats.average > 50) {
      actions.push('优化写入操作');
    }
    
    return actions;
  }

  /**
   * 获取计划执行的操作
   */
  private getScheduledActions(report: any, stats: any): string[] {
    const actions: string[] = [];
    
    actions.push('每周执行数据库压缩');
    actions.push('每月分析查询性能');
    actions.push('每季度审查索引策略');
    
    return actions;
  }

  /**
   * 获取长期执行的操作
   */
  private getLongTermActions(report: any, stats: any): string[] {
    const actions: string[] = [];
    
    actions.push('实现读写分离');
    actions.push('考虑数据分片策略');
    actions.push('实现更智能的缓存策略');
    
    return actions;
  }

  /**
   * 获取数据库统计信息
   */
  private async getDatabaseStats(): Promise<any> {
    const db = getDatabase();
    const storageStats = await mmkvStorage.getStats();
    
    return {
      ...db.utils.getStats(),
      storage: storageStats,
    };
  }
}

/**
 * 查询优化器
 */
export class QueryOptimizer {
  /**
   * 优化查询条件
   */
  optimizeQueryConditions(conditions: any): any {
    const optimized = { ...conditions };
    
    // 移除无效条件
    Object.keys(optimized).forEach(key => {
      if (optimized[key] === undefined || optimized[key] === null || optimized[key] === '') {
        delete optimized[key];
      }
    });
    
    // 优化排序条件
    if (optimized.sortBy && !this.isIndexedField(optimized.sortBy)) {
      console.warn(`排序字段 ${optimized.sortBy} 没有索引，可能影响性能`);
    }
    
    return optimized;
  }

  /**
   * 检查字段是否有索引
   */
  private isIndexedField(fieldName: string): boolean {
    const indexedFields = ['id', 'title', 'folderId', 'createdAt', 'playCount'];
    return indexedFields.includes(fieldName);
  }

  /**
   * 建议查询优化
   */
  suggestQueryOptimizations(query: any): string[] {
    const suggestions: string[] = [];
    
    // 检查是否使用了索引字段
    if (query.filters && !Object.keys(query.filters).some(field => this.isIndexedField(field))) {
      suggestions.push('建议在过滤条件中使用索引字段');
    }
    
    // 检查分页大小
    if (query.limit && query.limit > 100) {
      suggestions.push('分页大小过大，建议减少到50条以下');
    }
    
    // 检查排序字段
    if (query.sortBy && !this.isIndexedField(query.sortBy)) {
      suggestions.push(`排序字段 ${query.sortBy} 没有索引，建议添加索引`);
    }
    
    return suggestions;
  }
}

/**
 * 全局性能优化器实例
 */
export const performanceOptimizer = new PerformanceOptimizer();
export const databaseOptimizer = new DatabaseOptimizer();
export const queryOptimizer = new QueryOptimizer();

/**
 * 便捷的性能监控装饰器
 */
export function monitorPerformance(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return await performanceOptimizer.monitorQuery(
        () => originalMethod.apply(this, args),
        `${operationName}.${propertyKey}`
      );
    };
    
    return descriptor;
  };
}

/**
 * 自动优化数据库
 */
export async function autoOptimizeDatabase(): Promise<void> {
  try {
    console.log('开始自动优化数据库...');
    
    // 执行优化
    await databaseOptimizer.optimizeDatabase();
    
    // 获取优化建议
    const recommendations = await databaseOptimizer.getOptimizationRecommendations();
    
    console.log('优化建议:', recommendations);
    
    // 记录优化结果
    const report = performanceOptimizer.getPerformanceReport();
    console.log('性能报告:', report);
    
  } catch (error) {
    console.error('自动优化数据库失败:', error);
  }
}

export default PerformanceOptimizer;