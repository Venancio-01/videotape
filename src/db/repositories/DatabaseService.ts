/**
 * 统一数据库服务
 * 整合所有仓库的实现，提供统一的数据访问接口
 */

import { getDatabase } from "@/db/config/connection";
import { sql } from "drizzle-orm";
import { PlaylistRepository } from "./PlaylistRepository";
import { VideoRepository } from "./VideoRepository";
import type {
  IDatabaseService,
  IPlaylistRepository,
  IVideoRepository,
} from "./interfaces";

export class DatabaseService implements IDatabaseService {
  private static instance: DatabaseService;
  private isInitialized = false;

  // 仓库实例
  private _video: IVideoRepository;
  private _playlist: IPlaylistRepository;

  private constructor() {
    this._video = new VideoRepository();
    this._playlist = new PlaylistRepository();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ===== 仓库访问器 =====

  get video(): IVideoRepository {
    return this._video;
  }

  get playlist(): IPlaylistRepository {
    return this._playlist;
  }

  // ===== 连接管理 =====

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const db = getDatabase();
      await db.select({ count: sql`COUNT(*)` }).from(sql`sqlite_master`);
      this.isInitialized = true;
    } catch (error) {
      throw error;
    }
  }

  async close(): Promise<void> {
    this.isInitialized = false;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const db = getDatabase();
      await db.select({ count: sql`COUNT(*)` }).from(sql`sqlite_master`);
      return true;
    } catch {
      return false;
    }
  }

  // ===== 事务支持 =====

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    const db = getDatabase();
    return db.transaction(callback);
  }
}

// 导出单例实例
export const databaseService = DatabaseService.getInstance();
