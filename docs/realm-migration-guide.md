# React Native 数据持久化迁移指南

## 概述

本指南详细介绍了如何将 Videotape 应用从 Dexie.js (IndexedDB) 迁移到 Realm + MMKV 的混合持久化方案。这个新的架构提供了更好的性能、更低的内存占用和更丰富的功能。

## 迁移方案总结

### 核心组件

1. **Realm 数据库** - 主要数据存储
   - 视频、播放列表、文件夹、播放历史等结构化数据
   - 支持复杂查询、事务、实时更新
   - 性能接近原生 SQLite

2. **MMKV 存储** - 高性能配置存储
   - 用户设置、缓存、临时数据
   - 极高的读写性能（0.1-2ms）
   - 自动内存管理

3. **配置管理服务** - 统一的配置管理
   - 分层配置结构
   - 实时配置更新
   - 类型安全的配置访问

## 快速开始

### 1. 安装依赖

```bash
# 安装 Realm
npm install realm @types/realm

# 安装 MMKV (如果需要原生实现)
npm install react-native-mmkv
```

### 2. 初始化数据库

```typescript
import { initializeDatabase } from '@/database';

// 在应用启动时初始化
async function initializeApp() {
  try {
    await initializeDatabase();
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}
```

### 3. 检查并执行迁移

```typescript
import { needsMigration, migrateData } from '@/database';

async function checkAndMigrate() {
  if (await needsMigration()) {
    console.log('检测到需要数据迁移');
    
    const result = await migrateData((progress) => {
      console.log(`迁移进度: ${progress.stage} - ${progress.progress}%`);
    });
    
    if (result.success) {
      console.log('迁移成功!');
    } else {
      console.error('迁移失败:', result.errors);
    }
  }
}
```

## 使用指南

### 1. 数据库操作

#### 视频管理

```typescript
import { getDatabase } from '@/database';

const db = getDatabase();

// 添加视频
const video = await db.videos.add({
  title: '新视频',
  uri: '/path/to/video.mp4',
  duration: 120,
  size: 1024 * 1024,
  mimeType: 'video/mp4',
});

// 搜索视频
const results = db.videos.search('React', {
  sortBy: 'date',
  sortOrder: 'desc',
  limit: 20,
  filters: {
    quality: 'high'
  }
});

// 获取最近视频
const recentVideos = db.videos.getRecent(10);
```

#### 播放列表管理

```typescript
// 创建播放列表
const playlist = await db.playlists.add({
  name: '学习合集',
  videoIds: ['video1', 'video2'],
});

// 添加视频到播放列表
await db.playlists.addVideoToPlaylist(playlist.id, 'video3');
```

### 2. 配置管理

```typescript
import { config } from '@/storage/config-service';

// 获取配置
const settings = config.get();

// 更新播放器设置
await config.player.update({
  volume: 0.8,
  playbackSpeed: 1.5,
  defaultQuality: 'high'
});

// 监听配置变化
const unsubscribe = config.addListener('player', (newSettings) => {
  console.log('播放器设置已更新:', newSettings);
});
```

### 3. 缓存管理

```typescript
import { mmkvStorage } from '@/storage/mmkv-storage';

// 存储缓存数据
await mmkvStorage.setWithTTL('user_cache', userData, 3600000); // 1小时

// 获取缓存数据
const cachedData = await mmkvStorage.getWithTTL('user_cache');

// 批量操作
await mmkvStorage.multiSet([
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2' }
]);
```

## 性能优化

### 1. 查询优化

```typescript
import { queryOptimizer } from '@/database/performance-optimizer';

// 优化查询条件
const optimizedConditions = queryOptimizer.optimizeQueryConditions({
  title: 'React',
  sortBy: 'date',
  limit: 50
});

// 获取优化建议
const suggestions = queryOptimizer.suggestQueryOptimizations({
  filters: { title: 'React' },
  sortBy: 'title',
  limit: 200
});
```

### 2. 性能监控

```typescript
import { performanceOptimizer } from '@/database/performance-optimizer';

// 监控查询性能
const results = await performanceOptimizer.monitorQuery(
  () => db.videos.search('React'),
  'video_search'
);

// 获取性能报告
const report = performanceOptimizer.getPerformanceReport();
console.log('性能报告:', report);
```

### 3. 自动优化

```typescript
import { autoOptimizeDatabase } from '@/database/performance-optimizer';

// 定期执行自动优化
setInterval(async () => {
  await autoOptimizeDatabase();
}, 24 * 60 * 60 * 1000); // 每天执行一次
```

## 测试和验证

### 1. 运行测试套件

```typescript
import { runMigrationTests, validateMigrationResult } from '@/database/migration-test';

// 运行完整测试套件
const testResults = await runMigrationTests();
console.log('测试结果:', testResults);

// 验证迁移结果
const validationResult = await validateMigrationResult(migrationResult);
console.log('验证结果:', validationResult);
```

### 2. 性能测试

```typescript
import { TestDataGenerator } from '@/database/migration-test';

// 生成测试数据
const testVideos = TestDataGenerator.generateTestVideos(100);
const testPlaylists = TestDataGenerator.generateTestPlaylists(10);

// 执行性能测试
const performanceResults = await runPerformanceTests(testVideos);
console.log('性能测试结果:', performanceResults);
```

## 迁移策略

### 1. 渐进式迁移

```typescript
// 第一步：并行运行
// 新旧数据库同时运行，写操作双写

// 第二步：逐步切换
// 读操作逐步切换到新数据库

// 第三步：完全切换
// 停止旧数据库写入，完全使用新数据库

// 第四步：清理
// 删除旧数据库，优化性能
```

### 2. 回滚策略

```typescript
// 创建备份
const backup = await databaseManager.backup();

// 如果出现问题，可以恢复
try {
  await migrateData();
} catch (error) {
  console.error('迁移失败，正在回滚...');
  await databaseManager.restore(backup);
}
```

## 最佳实践

### 1. 数据库操作

- **使用事务**：确保数据一致性
- **批量操作**：提高写入性能
- **合理使用索引**：优化查询性能
- **及时关闭连接**：避免内存泄漏

### 2. 缓存策略

- **分层缓存**：内存缓存 + 持久化缓存
- **TTL 管理**：设置合理的过期时间
- **缓存清理**：定期清理过期数据
- **命中率监控**：监控缓存效果

### 3. 性能优化

- **监控指标**：持续监控性能指标
- **定期优化**：定期执行数据库优化
- **查询优化**：避免复杂查询
- **内存管理**：合理使用内存

## 故障排除

### 1. 常见问题

**迁移失败**
```typescript
// 检查旧数据库是否存在
const oldDbExists = await needsMigration();
if (!oldDbExists) {
  console.log('无需迁移');
}
```

**性能问题**
```typescript
// 检查性能报告
const report = performanceOptimizer.getPerformanceReport();
if (report.details.queryStats.average > 100) {
  console.warn('查询性能较慢，需要优化');
}
```

**内存泄漏**
```typescript
// 确保正确关闭数据库连接
useEffect(() => {
  const db = getDatabase();
  return () => {
    db.utils.close();
  };
}, []);
```

### 2. 调试工具

```typescript
// 启用调试模式
const db = getDatabase();
console.log('数据库统计:', db.utils.getStats());

// 检查配置
console.log('配置信息:', configService.getConfig());

// 检查缓存
console.log('缓存统计:', await mmkvStorage.getStats());
```

## 总结

这个新的持久化方案提供了：

1. **更好的性能**：Realm 的读写性能比 IndexedDB 快 2-3 倍
2. **更丰富的功能**：支持复杂查询、事务、实时更新
3. **更低的内存占用**：MMKV 提供高效的键值存储
4. **更好的开发体验**：类型安全的 API 和统一的配置管理
5. **完善的工具链**：迁移工具、性能监控、测试套件

通过遵循本指南，您可以顺利完成从 Dexie.js 到 Realm + MMKV 的迁移，并为您的应用带来更好的性能和用户体验。