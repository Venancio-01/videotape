/**
 * MMKV 使用示例
 * 演示如何在应用中正确使用修复后的 MMKV 存储
 */

import { mmkvStorage, CONFIG_KEYS } from './mmkv-storage';
import { StorageFactory, EnvironmentDetector } from './safe-mmkv';

/**
 * 用户设置存储示例
 */
export class UserSettingsExample {
  private storage = mmkvStorage;

  /**
   * 保存用户主题设置
   */
  async saveTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    try {
      await this.storage.setString(CONFIG_KEYS.THEME, theme);
      console.log('主题设置已保存:', theme);
    } catch (error) {
      console.error('保存主题设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户主题设置
   */
  async getTheme(): Promise<'light' | 'dark' | 'auto'> {
    try {
      const theme = await this.storage.getString(CONFIG_KEYS.THEME);
      return (theme as 'light' | 'dark' | 'auto') || 'auto';
    } catch (error) {
      console.error('获取主题设置失败:', error);
      return 'auto';
    }
  }

  /**
   * 保存播放器设置
   */
  async savePlayerSettings(settings: {
    volume: number;
    playbackSpeed: number;
    quality: string;
  }): Promise<void> {
    try {
      await this.storage.setNumber(CONFIG_KEYS.VOLUME, settings.volume);
      await this.storage.setNumber(CONFIG_KEYS.PLAYBACK_SPEED, settings.playbackSpeed);
      await this.storage.setString(CONFIG_KEYS.QUALITY, settings.quality);
      console.log('播放器设置已保存:', settings);
    } catch (error) {
      console.error('保存播放器设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取播放器设置
   */
  async getPlayerSettings(): Promise<{
    volume: number;
    playbackSpeed: number;
    quality: string;
  }> {
    try {
      const volume = await this.storage.getNumber(CONFIG_KEYS.VOLUME, 1.0);
      const playbackSpeed = await this.storage.getNumber(CONFIG_KEYS.PLAYBACK_SPEED, 1.0);
      const quality = (await this.storage.getString(CONFIG_KEYS.QUALITY)) || 'auto';

      return {
        volume,
        playbackSpeed,
        quality: quality || 'auto',
      };
    } catch (error) {
      console.error('获取播放器设置失败:', error);
      return {
        volume: 1.0,
        playbackSpeed: 1.0,
        quality: 'auto',
      };
    }
  }
}

/**
 * 缓存存储示例
 */
export class CacheExample {
  private storage = StorageFactory.getInstance('cache', 'cache_');

  /**
   * 缓存数据
   */
  async cacheData<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      };

      await this.storage.set(key, cacheEntry);
      console.log(`数据已缓存: ${key}`);
    } catch (error) {
      console.error(`缓存数据失败 (${key}):`, error);
    }
  }

  /**
   * 获取缓存数据
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cacheEntry = await this.storage.get<{
        data: T;
        timestamp: number;
        ttl: number;
      }>(key);

      if (!cacheEntry) {
        return null;
      }

      // 检查是否过期
      const now = Date.now();
      if (now - cacheEntry.timestamp > cacheEntry.ttl) {
        await this.storage.delete(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error(`获取缓存数据失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 清理过期缓存
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const allKeys = await this.storage.getAllKeys();
      const now = Date.now();

      for (const key of allKeys) {
        const cacheEntry = await this.storage.get<{
          timestamp: number;
          ttl: number;
        }>(key);

        if (cacheEntry && now - cacheEntry.timestamp > cacheEntry.ttl) {
          await this.storage.delete(key);
        }
      }

      console.log('过期缓存已清理');
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }
}

/**
 * 会话存储示例
 */
export class SessionExample {
  private storage = StorageFactory.getInstance('session', 'session_');

  /**
   * 保存用户会话
   */
  async saveUserSession(userId: string, sessionData: any): Promise<void> {
    try {
      await this.storage.set(`user_${userId}`, {
        ...sessionData,
        lastActive: Date.now(),
      });
      console.log(`用户会话已保存: ${userId}`);
    } catch (error) {
      console.error(`保存用户会话失败 (${userId}):`, error);
    }
  }

  /**
   * 获取用户会话
   */
  async getUserSession(userId: string): Promise<any | null> {
    try {
      const session = await this.storage.get(`user_${userId}`);
      return session;
    } catch (error) {
      console.error(`获取用户会话失败 (${userId}):`, error);
      return null;
    }
  }

  /**
   * 清理过期会话
   */
  async clearExpiredSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const allKeys = await this.storage.getAllKeys();
      const now = Date.now();

      for (const key of allKeys) {
        if (key.startsWith('user_')) {
          const session = await this.storage.get<{
            lastActive: number;
          }>(key);

          if (session && now - session.lastActive > maxAgeMs) {
            await this.storage.delete(key);
          }
        }
      }

      console.log('过期会话已清理');
    } catch (error) {
      console.error('清理过期会话失败:', error);
    }
  }
}

/**
 * 使用示例
 */
export async function demonstrateUsage(): Promise<void> {
  console.log('='.repeat(50));
  console.log('MMKV 存储使用示例');
  console.log('='.repeat(50));

  // 显示环境信息
  const envInfo = EnvironmentDetector.getEnvironmentInfo();
  console.log('当前环境:', envInfo);

  // 用户设置示例
  console.log('\n1. 用户设置示例');
  const userSettings = new UserSettingsExample();

  await userSettings.saveTheme('dark');
  const theme = await userSettings.getTheme();
  console.log('当前主题:', theme);

  await userSettings.savePlayerSettings({
    volume: 0.8,
    playbackSpeed: 1.5,
    quality: 'high',
  });

  const playerSettings = await userSettings.getPlayerSettings();
  console.log('播放器设置:', playerSettings);

  // 缓存示例
  console.log('\n2. 缓存示例');
  const cache = new CacheExample();

  // 缓存一些数据
  await cache.cacheData('user_profile', { name: 'John', age: 30 }, 10000);

  // 获取缓存数据
  const cachedProfile = await cache.getCachedData('user_profile');
  console.log('缓存的用户资料:', cachedProfile);

  // 会话示例
  console.log('\n3. 会话示例');
  const session = new SessionExample();

  await session.saveUserSession('user123', {
    name: 'John Doe',
    email: 'john@example.com',
    preferences: { theme: 'dark', language: 'zh' },
  });

  const userSession = await session.getUserSession('user123');
  console.log('用户会话:', userSession);

  console.log('\n'.repeat(50));
  console.log('使用示例完成');
  console.log('='.repeat(50));
}

// 如果直接运行此脚本，执行示例
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  demonstrateUsage().catch(console.error);
}
