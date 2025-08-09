/**
 * 数据迁移工具 - 已废弃
 * 此文件保留用于历史参考，迁移工作已完成
 * 应用现在完全使用 Realm 数据库
 */

// 注意：此文件已废弃，仅用于历史参考
// 实际应用已完全迁移到 Realm 数据库

// 此文件已废弃 - 迁移已完成
// 应用现在完全使用 Realm 数据库

// 导出空的接口和类以保持兼容性
export interface MigrationProgress {
  stage: 'completed';
  progress: number;
  total: number;
  current: number;
  message: string;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  duration: number;
  stats: {
    videos: { migrated: number; failed: number };
    playlists: { migrated: number; failed: number };
    folders: { migrated: number; failed: number };
    history: { migrated: number; failed: number };
    settings: { migrated: number; failed: number };
  };
  errors: string[];
  warnings: string[];
}

export class DataMigrationService {
  constructor(onProgress?: (progress: MigrationProgress) => void) {
    // 迁移已完成，此构造函数保留用于兼容性
  }

  async migrate(): Promise<MigrationResult> {
    return {
      success: true,
      duration: 0,
      stats: {
        videos: { migrated: 0, failed: 0 },
        playlists: { migrated: 0, failed: 0 },
        folders: { migrated: 0, failed: 0 },
        history: { migrated: 0, failed: 0 },
        settings: { migrated: 0, failed: 0 },
      },
      errors: [],
      warnings: ['迁移已完成，应用现在使用 Realm 数据库']
    };
  }

  async createBackup(): Promise<string> {
    const { getUnifiedDatabase } = await import('./unified-realm-service');
    const newDb = getUnifiedDatabase();
    return await newDb.batch.backup();
  }

  async cleanupOldData(): Promise<void> {
    console.log('迁移已完成，无需清理旧数据');
  }
}

export async function migrateData(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const migrationService = new DataMigrationService(onProgress);
  return await migrationService.migrate();
}

export async function needsMigration(): Promise<boolean> {
  // 迁移已完成，不再需要迁移
  return false;
}

export default DataMigrationService;