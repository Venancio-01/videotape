/**
 * 数据库迁移管理
 * 提供数据库迁移相关的工具和函数
 */

import { getDatabase } from "@/db/config/connection";
import { MigrationError } from "@/db/types";
import { sql } from "drizzle-orm";

/**
 * 运行数据库迁移
 */
export async function runMigrations(): Promise<void> {
  try {
    const db = getDatabase();

    // 创建迁移表（如果不存在）
    await db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 获取已执行的迁移
    const executedMigrations = await db
      .select({ name: sql`name` })
      .from(sql`migrations`);
    const executedNames = new Set(executedMigrations.map((m) => m.name));

    // 获取所有迁移文件
    const migrationFiles = await import("./migrations/migrations");

    // 运行未执行的迁移
    for (const migration of migrationFiles.default) {
      if (!executedNames.has(migration.name)) {
        console.log(`正在执行迁移: ${migration.name}`);

        // 在事务中执行迁移
        await db.transaction(async (tx) => {
          await tx.run(migration.sql);
          await tx.run("INSERT INTO migrations (name) VALUES (?)", [
            migration.name,
          ]);
        });

        console.log(`迁移完成: ${migration.name}`);
      }
    }

    console.log("所有迁移已完成");
  } catch (error) {
    throw new MigrationError(
      "运行迁移失败",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * 回滚迁移
 */
export async function rollbackMigration(migrationName: string): Promise<void> {
  try {
    const db = getDatabase();

    // 查找迁移的回滚SQL
    const migrationFiles = await import("./migrations/migrations");
    const migration = migrationFiles.default.find(
      (m) => m.name === migrationName,
    );

    if (!migration) {
      throw new Error(`迁移 ${migrationName} 未找到`);
    }

    if (!migration.rollback) {
      throw new Error(`迁移 ${migrationName} 不支持回滚`);
    }

    console.log(`正在回滚迁移: ${migrationName}`);

    // 在事务中执行回滚
    await db.transaction(async (tx) => {
      await tx.run(migration.rollback);
      await tx.run("DELETE FROM migrations WHERE name = ?", [migrationName]);
    });

    console.log(`回滚完成: ${migrationName}`);
  } catch (error) {
    throw new MigrationError(
      `回滚迁移 ${migrationName} 失败`,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * 获取迁移状态
 */
export async function getMigrationStatus(): Promise<{
  executed: string[];
  pending: string[];
}> {
  try {
    const db = getDatabase();

    // 获取已执行的迁移
    const executedMigrations = await db
      .select({ name: sql`name` })
      .from(sql`migrations`);
    const executedNames = executedMigrations.map((m) => m.name);

    // 获取所有迁移文件
    const migrationFiles = await import("./migrations/migrations");
    const allNames = migrationFiles.default.map((m) => m.name);

    // 计算待执行的迁移
    const pendingNames = allNames.filter(
      (name) => !executedNames.includes(name),
    );

    return {
      executed: executedNames,
      pending: pendingNames,
    };
  } catch (error) {
    throw new MigrationError(
      "获取迁移状态失败",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * 重置数据库（危险操作）
 */
export async function resetDatabase(): Promise<void> {
  try {
    const db = getDatabase();

    console.warn("正在重置数据库，这将删除所有数据！");

    // 获取所有表名
    const tables = await db
      .select({ name: sql`name` })
      .from(sql`sqlite_master`)
      .where(sql`type = 'table' AND name NOT LIKE 'sqlite_%'`);

    // 删除所有表
    for (const table of tables) {
      await db.run(`DROP TABLE IF EXISTS ${table.name}`);
    }

    // 重置迁移表
    await db.run("DROP TABLE IF EXISTS migrations");

    console.log("数据库已重置");
  } catch (error) {
    throw new MigrationError(
      "重置数据库失败",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * 备份数据库
 */
export async function backupDatabase(backupPath: string): Promise<void> {
  try {
    const db = getDatabase();

    // 创建备份
    await db.run(`ATTACH DATABASE '${backupPath}' AS backup_db`);

    // 获取所有表名
    const tables = await db
      .select({ name: sql`name` })
      .from(sql`sqlite_master`)
      .where(sql`type = 'table' AND name NOT LIKE 'sqlite_%'`);

    // 复制所有表
    for (const table of tables) {
      await db.run(
        `CREATE TABLE backup_db.${table.name} AS SELECT * FROM ${table.name}`,
      );
    }

    await db.run("DETACH DATABASE backup_db");

    console.log(`数据库已备份到: ${backupPath}`);
  } catch (error) {
    throw new MigrationError(
      "备份数据库失败",
      error instanceof Error ? error : undefined,
    );
  }
}
