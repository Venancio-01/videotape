/**
 * MediaMetadataRetriever 使用示例和最佳实践
 * 
 * 本文件展示了如何在Android原生代码中使用MediaMetadataRetriever API
 * 来获取视频文件的元数据信息。
 */

import { NativeModules, Platform } from 'react-native';
import type { VideoMetadata, VideoMetadataUtils, VideoMetadataCache } from '../types/videoMetadata';

// 获取原生模块
const { VideoMetadataModule } = NativeModules;

/**
 * 使用示例：获取单个视频元数据
 */
export async function getSingleVideoMetadata(filePath: string): Promise<void> {
  try {
    console.log('开始获取视频元数据:', filePath);
    
    // 方法1：直接获取（无缓存）
    const metadata = await VideoMetadataModule.getVideoMetadata(filePath);
    console.log('视频元数据:', metadata);
    
    // 方法2：带缓存的获取（推荐）
    const cachedMetadata = await VideoMetadataModule.getVideoMetadataWithCache(filePath);
    console.log('缓存的视频元数据:', cachedMetadata);
    
    // 检查是否成功
    if (metadata.errorMessage) {
      console.error('获取元数据失败:', metadata.errorMessage);
    } else {
      console.log('视频基本信息:');
      console.log(`- 时长: ${formatDuration(metadata.duration)}`);
      console.log(`- 分辨率: ${metadata.width}x${metadata.height}`);
      console.log(`- 文件大小: ${formatFileSize(metadata.fileSize)}`);
      console.log(`- 比特率: ${Math.round(metadata.bitrate / 1000)} kbps`);
      console.log(`- 旋转角度: ${metadata.rotation}°`);
      console.log(`- 包含音频: ${metadata.hasAudio}`);
      console.log(`- MIME类型: ${metadata.mimeType}`);
    }
    
  } catch (error) {
    console.error('获取视频元数据时发生错误:', error);
  }
}

/**
 * 使用示例：批量获取视频元数据
 */
export async function getBatchVideoMetadata(filePaths: string[]): Promise<void> {
  try {
    console.log(`开始批量获取 ${filePaths.length} 个视频的元数据`);
    
    // 方法1：直接批量获取
    const metadataList = await VideoMetadataModule.getBatchVideoMetadata(filePaths);
    
    // 方法2：带缓存的批量获取（推荐）
    const cachedMetadataList = await VideoMetadataModule.getBatchVideoMetadataWithCache(filePaths);
    
    console.log(`成功获取 ${metadataList.length} 个视频的元数据`);
    
    // 统计信息
    const stats = {
      totalFiles: filePaths.length,
      validFiles: metadataList.filter(m => !m.errorMessage).length,
      totalSize: metadataList.reduce((sum, m) => sum + m.fileSize, 0),
      totalDuration: metadataList.reduce((sum, m) => sum + m.duration, 0)
    };
    
    console.log('统计信息:', stats);
    
    // 处理每个视频的元数据
    metadataList.forEach((metadata, index) => {
      if (metadata.errorMessage) {
        console.warn(`文件 ${filePaths[index]} 处理失败:`, metadata.errorMessage);
      } else {
        console.log(`视频 ${index + 1}: ${formatDuration(metadata.duration)} - ${metadata.width}x${metadata.height}`);
      }
    });
    
  } catch (error) {
    console.error('批量获取视频元数据时发生错误:', error);
  }
}

/**
 * 使用示例：视频验证
 */
export async function validateVideoFiles(filePaths: string[]): Promise<void> {
  try {
    console.log('开始验证视频文件...');
    
    const validationResults = await Promise.all(
      filePaths.map(async (path) => {
        try {
          const isValid = await VideoMetadataModule.isValidVideoFile(path);
          return { path, isValid };
        } catch (error) {
          return { path, isValid: false, error: error.message };
        }
      })
    );
    
    const validFiles = validationResults.filter(r => r.isValid);
    const invalidFiles = validationResults.filter(r => !r.isValid);
    
    console.log(`验证完成: ${validFiles.length} 个有效文件, ${invalidFiles.length} 个无效文件`);
    
    if (invalidFiles.length > 0) {
      console.log('无效文件列表:');
      invalidFiles.forEach(file => {
        console.log(`- ${file.path}: ${file.error || '未知错误'}`);
      });
    }
    
  } catch (error) {
    console.error('验证视频文件时发生错误:', error);
  }
}

/**
 * 使用示例：获取视频缩略图
 */
export async function getVideoThumbnails(filePaths: string[]): Promise<void> {
  try {
    console.log('开始获取视频缩略图...');
    
    for (const filePath of filePaths) {
      try {
        // 获取视频中间帧作为缩略图
        const thumbnail = await VideoMetadataModule.getVideoThumbnail(filePath);
        
        if (thumbnail) {
          console.log(`成功获取缩略图: ${filePath}`);
          // 这里可以将thumbnail设置为Image组件的source
          // <Image source={{ uri: thumbnail }} style={{ width: 100, height: 100 }} />
        } else {
          console.warn(`无法获取缩略图: ${filePath}`);
        }
        
        // 也可以指定特定时间点（微秒）
        const specificTimeThumbnail = await VideoMetadataModule.getVideoThumbnail(filePath, 5000000); // 5秒处
        console.log(`5秒处缩略图: ${specificTimeThumbnail ? '成功' : '失败'}`);
        
      } catch (error) {
        console.error(`获取缩略图失败 ${filePath}:`, error);
      }
    }
    
  } catch (error) {
    console.error('获取视频缩略图时发生错误:', error);
  }
}

/**
 * 使用示例：缓存管理
 */
export async function manageCache(): Promise<void> {
  try {
    console.log('开始管理缓存...');
    
    // 获取当前缓存大小
    const cacheSize = await VideoMetadataModule.getCacheSize();
    console.log(`当前缓存大小: ${cacheSize}`);
    
    // 清除缓存
    await VideoMetadataModule.clearCache();
    console.log('缓存已清除');
    
    // 重新获取一些数据来填充缓存
    const testFiles = [
      '/storage/emulated/0/DCIM/Camera/video1.mp4',
      '/storage/emulated/0/Download/video2.mp4'
    ];
    
    for (const file of testFiles) {
      try {
        await VideoMetadataModule.getVideoMetadataWithCache(file);
      } catch (error) {
        console.warn(`预加载缓存失败 ${file}:`, error);
      }
    }
    
    // 检查缓存大小
    const newCacheSize = await VideoMetadataModule.getCacheSize();
    console.log(`新缓存大小: ${newCacheSize}`);
    
  } catch (error) {
    console.error('管理缓存时发生错误:', error);
  }
}

/**
 * 高级使用示例：使用工具类
 */
export async function advancedUsageExample(filePaths: string[]): Promise<void> {
  try {
    // 导入工具类（需要先创建实例）
    const utils = new VideoMetadataUtils(VideoMetadataModule);
    const cache = new VideoMetadataCache(VideoMetadataModule);
    
    console.log('开始高级使用示例...');
    
    // 1. 过滤有效视频文件
    const validFiles = await utils.filterValidVideos(filePaths);
    console.log(`有效视频文件: ${validFiles.length}/${filePaths.length}`);
    
    // 2. 预加载元数据到缓存
    await cache.preloadMetadata(validFiles.slice(0, 10)); // 只预加载前10个
    console.log('预加载完成');
    
    // 3. 获取视频统计信息
    const stats = await utils.getVideoStats(validFiles);
    console.log('视频统计:', {
      totalFiles: stats.totalFiles,
      validFiles: stats.validFiles,
      totalSize: utils.formatFileSize(stats.totalSize),
      totalDuration: utils.formatDuration(stats.totalDuration),
      averageBitrate: Math.round(stats.averageBitrate / 1000) + ' kbps',
      resolutions: stats.resolutions
    });
    
    // 4. 带进度回调的批量处理
    console.log('开始批量处理...');
    const batchResults = await utils.processBatchWithProgress(
      validFiles,
      (processed, total) => {
        const progress = Math.round((processed / total) * 100);
        console.log(`处理进度: ${progress}% (${processed}/${total})`);
      }
    );
    
    console.log(`批量处理完成，处理了 ${batchResults.length} 个文件`);
    
    // 5. 获取单个视频的详细信息
    if (validFiles.length > 0) {
      const firstFile = validFiles[0];
      const basicInfo = await utils.getVideoBasicInfo(firstFile);
      console.log('第一个视频的基本信息:', basicInfo);
      
      const orientation = utils.getVideoOrientation(
        basicInfo.width,
        basicInfo.height,
        0 // rotation
      );
      console.log(`视频方向: ${orientation}`);
    }
    
  } catch (error) {
    console.error('高级使用示例失败:', error);
  }
}

/**
 * 工具函数：格式化时长
 */
function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 工具函数：格式化文件大小
 */
function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 最佳实践建议
 */
export const BEST_PRACTICES = {
  /**
   * 1. 资源管理
   */
  RESOURCE_MANAGEMENT: {
    // 始终在finally块中释放MediaMetadataRetriever
    // 原生代码已自动处理，但使用时仍需注意
    ALWAYS_RELEASE: '确保MediaMetadataRetriever被正确释放',
    AVOID_LEAKS: '避免在长时间运行的操作中持有引用',
    USE_TIMEOUTS: '设置合理的超时时间'
  },
  
  /**
   * 2. 性能优化
   */
  PERFORMANCE_OPTIMIZATION: {
    // 使用批量处理而不是单个处理
    USE_BATCH_PROCESSING: '优先使用批量处理API',
    // 启用缓存以避免重复解析
    ENABLE_CACHING: '使用缓存减少重复解析',
    // 限制并发数量
    LIMIT_CONCURRENT: '控制并发请求数量',
    // 分批处理大量文件
    PROCESS_IN_BATCHES: '将大量文件分批处理'
  },
  
  /**
   * 3. 错误处理
   */
  ERROR_HANDLING: {
    // 验证文件存在性
    CHECK_FILE_EXISTS: '处理前验证文件是否存在',
    // 处理权限问题
    HANDLE_PERMISSIONS: '确保有读取文件的权限',
    // 处理损坏的文件
    HANDLE_CORRUPTED: '优雅处理损坏的视频文件',
    // 记录详细错误信息
    LOG_ERRORS: '记录详细的错误信息用于调试'
  },
  
  /**
   * 4. 内存管理
   */
  MEMORY_MANAGEMENT: {
    // 及时清理缓存
    CLEAR_CACHE: '定期清理不需要的缓存',
    // 避免存储大量元数据
    LIMIT_CACHE_SIZE: '限制缓存大小',
    // 处理大文件时要小心
    HANDLE_LARGE_FILES: '大文件处理时要注意内存使用'
  },
  
  /**
   * 5. 线程安全
   */
  THREAD_SAFETY: {
    // 原生代码已处理线程安全
    THREAD_SAFE: '原生API是线程安全的',
    // 避免在主线程中进行耗时操作
    BACKGROUND_THREADS: '耗时操作应在后台线程执行'
  }
};

/**
 * 性能优化策略
 */
export const PERFORMANCE_STRATEGIES = {
  /**
   * 1. 智能缓存策略
   */
  CACHING: {
    // 使用LRU缓存策略
    LRU_CACHE: '最近最少使用的缓存策略',
    // 根据文件大小设置缓存优先级
    SIZE_BASED_PRIORITY: '大文件优先缓存',
    // 设置缓存过期时间
    CACHE_EXPIRY: '设置合理的缓存过期时间'
  },
  
  /**
   * 2. 批量处理优化
   */
  BATCH_PROCESSING: {
    // 根据文件大小动态调整批次大小
    DYNAMIC_BATCH_SIZE: '动态调整批次大小',
    // 使用并行处理提高速度
    PARALLEL_PROCESSING: '并行处理提高效率',
    // 预估处理时间
    TIME_ESTIMATION: '预估处理时间用于进度显示'
  },
  
  /**
   * 3. 内存优化
   */
  MEMORY_OPTIMIZATION: {
    // 及时释放不再需要的资源
    TIMELY_RELEASE: '及时释放资源',
    // 使用对象池减少GC压力
    OBJECT_POOLING: '使用对象池技术',
    // 限制单个处理的内存使用
    MEMORY_LIMITS: '设置内存使用限制'
  }
};

// 使用示例的导出
export default {
  getSingleVideoMetadata,
  getBatchVideoMetadata,
  validateVideoFiles,
  getVideoThumbnails,
  manageCache,
  advancedUsageExample,
  BEST_PRACTICES,
  PERFORMANCE_STRATEGIES
};