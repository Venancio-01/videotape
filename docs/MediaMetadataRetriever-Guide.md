# MediaMetadataRetriever 完整使用指南

## 概述

本指南详细介绍了如何在Android原生代码中使用`MediaMetadataRetriever` API来获取视频文件的元数据信息，包括时长、分辨率、格式等。同时提供了React Native桥接实现和完整的使用示例。

## 目录

1. [Android原生实现](#android原生实现)
2. [React Native桥接](#react-native桥接)
3. [TypeScript接口定义](#typescript接口定义)
4. [使用示例](#使用示例)
5. [最佳实践](#最佳实践)
6. [性能优化](#性能优化)
7. [错误处理](#错误处理)

## Android原生实现

### 1. 核心类结构

#### VideoMetadata 数据类

```kotlin
data class VideoMetadata(
    val duration: Long = 0,           // 视频时长（毫秒）
    val width: Int = 0,              // 视频宽度
    val height: Int = 0,             // 视频高度
    val bitrate: Long = 0,            // 比特率（bps）
    val rotation: Int = 0,            // 视频旋转角度
    val mimeType: String? = null,     // MIME类型
    val hasAudio: Boolean = false,    // 是否包含音频
    val hasVideo: Boolean = false,    // 是否包含视频
    val frameRate: String? = null,    // 帧率
    val fileSize: Long = 0,           // 文件大小（字节）
    val creationTime: Long = 0,       // 创建时间
    val modificationTime: Long = 0,    // 修改时间
    val errorMessage: String? = null  // 错误信息
)
```

#### VideoMetadataRetriever 核心类

主要功能：
- 获取单个视频元数据
- 批量获取视频元数据
- 并发处理优化
- 视频文件验证
- 缩略图生成

### 2. 初始化MediaMetadataRetriever

```kotlin
fun getVideoMetadata(filePath: String): VideoMetadata {
    val retriever = MediaMetadataRetriever()
    return try {
        // 根据不同的URI类型设置数据源
        when {
            filePath.startsWith("content://") -> {
                retriever.setDataSource(filePath)
            }
            filePath.startsWith("http://") || filePath.startsWith("https://") -> {
                retriever.setDataSource(filePath, HashMap<String, String>())
            }
            else -> {
                val file = File(filePath)
                if (!file.exists()) {
                    return VideoMetadata(errorMessage = "文件不存在: $filePath")
                }
                retriever.setDataSource(file.absolutePath)
            }
        }
        
        // 提取元数据
        extractMetadata(retriever, File(filePath))
        
    } catch (e: Exception) {
        Log.e(TAG, "获取视频元数据失败: ${e.message}", e)
        VideoMetadata(errorMessage = "获取元数据失败: ${e.message}")
    } finally {
        try {
            retriever.release()
        } catch (e: Exception) {
            Log.w(TAG, "释放MediaMetadataRetriever失败", e)
        }
    }
}
```

### 3. 获取视频元数据

```kotlin
private fun extractMetadata(retriever: MediaMetadataRetriever, file: File): VideoMetadata {
    return try {
        // 获取基本元数据
        val duration = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_DURATION)
        val width = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
        val height = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
        val bitrate = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_BITRATE).toLong()
        val rotation = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
        val mimeType = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_MIMETYPE)
        
        // 检查是否有音频和视频轨道
        val hasAudio = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO) == "yes"
        val hasVideo = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_HAS_VIDEO) == "yes"
        
        // 获取文件信息
        val fileSize = if (file.exists()) file.length() else 0L
        val creationTime = if (file.exists()) file.lastModified() else 0L
        
        VideoMetadata(
            duration = duration.toLong(),
            width = width,
            height = height,
            bitrate = bitrate,
            rotation = rotation,
            mimeType = mimeType,
            hasAudio = hasAudio,
            hasVideo = hasVideo,
            fileSize = fileSize,
            creationTime = creationTime,
            modificationTime = creationTime
        )
        
    } catch (e: Exception) {
        Log.e(TAG, "提取元数据失败: ${e.message}", e)
        VideoMetadata(errorMessage = "提取元数据失败: ${e.message}")
    }
}
```

### 4. 资源释放

```kotlin
// 始终在finally块中释放资源
finally {
    try {
        retriever.release()
    } catch (e: Exception) {
        Log.w(TAG, "释放MediaMetadataRetriever失败", e)
    }
}
```

### 5. 批量处理优化

```kotlin
// 并发批量处理
fun getBatchVideoMetadataConcurrent(filePaths: List<String>): List<VideoMetadata> {
    return filePaths.parallelStream().map { path ->
        getVideoMetadata(path)
    }.toList()
}

// 智能批量处理（带缓存）
fun getBatchVideoMetadataWithCache(filePaths: List<String>): List<VideoMetadata> {
    val uncachedPaths = mutableListOf<String>()
    val results = mutableListOf<VideoMetadata>()
    
    // 先从缓存中获取
    synchronized(cacheLock) {
        filePaths.forEach { path ->
            val cached = metadataCache[path]
            if (cached != null) {
                results.add(cached)
            } else {
                uncachedPaths.add(path)
            }
        }
    }
    
    // 批量处理未缓存的文件
    if (uncachedPaths.isNotEmpty()) {
        val newResults = getBatchVideoMetadataConcurrent(uncachedPaths)
        synchronized(cacheLock) {
            newResults.forEach { metadata ->
                val index = uncachedPaths.indexOfFirst { 
                    it == filePaths[results.size + newResults.indexOf(metadata)] 
                }
                if (index >= 0) {
                    metadataCache[uncachedPaths[index]] = metadata
                }
            }
        }
        results.addAll(newResults)
    }
    
    return results
}
```

## React Native桥接

### 1. 模块注册

在`MainApplication.kt`中添加模块：

```kotlin
override fun getPackages(): List<ReactPackage> {
    return listOf(
        MainPackage(this),
        VideoMetadataPackage() // 添加视频元数据包
    )
}
```

### 2. JavaScript接口

```typescript
import { NativeModules } from 'react-native';

const { VideoMetadataModule } = NativeModules;

// 获取单个视频元数据
const metadata = await VideoMetadataModule.getVideoMetadata(filePath);

// 批量获取视频元数据
const metadataList = await VideoMetadataModule.getBatchVideoMetadata(filePaths);

// 带缓存的获取
const cachedMetadata = await VideoMetadataModule.getVideoMetadataWithCache(filePath);

// 验证视频文件
const isValid = await VideoMetadataModule.isValidVideoFile(filePath);

// 获取缩略图
const thumbnail = await VideoMetadataModule.getVideoThumbnail(filePath);
```

## TypeScript接口定义

### 1. 基础接口

```typescript
export interface VideoMetadata {
  duration: number;           // 视频时长（毫秒）
  width: number;             // 视频宽度
  height: number;            // 视频高度
  bitrate: number;           // 比特率（bps）
  rotation: number;          // 视频旋转角度
  mimeType?: string;         // MIME类型
  hasAudio: boolean;         // 是否包含音频
  hasVideo: boolean;         // 是否包含视频
  frameRate?: string;        // 帧率
  fileSize: number;          // 文件大小（字节）
  creationTime: number;      // 创建时间
  modificationTime: number; // 修改时间
  errorMessage?: string;     // 错误信息
}
```

### 2. 工具类

```typescript
export class VideoMetadataUtils {
  // 格式化时长
  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // 获取视频方向
  getVideoOrientation(width: number, height: number, rotation: number): 'portrait' | 'landscape' {
    const effectiveRotation = rotation % 360;
    if (effectiveRotation === 90 || effectiveRotation === 270) {
      return width > height ? 'portrait' : 'landscape';
    }
    return width > height ? 'landscape' : 'portrait';
  }
}
```

## 使用示例

### 1. 基本使用

```typescript
import { VideoMetadataModule } from 'react-native';

async function getVideoInfo(filePath: string) {
  try {
    const metadata = await VideoMetadataModule.getVideoMetadata(filePath);
    
    if (metadata.errorMessage) {
      console.error('获取元数据失败:', metadata.errorMessage);
      return;
    }
    
    console.log('视频信息:');
    console.log(`时长: ${formatDuration(metadata.duration)}`);
    console.log(`分辨率: ${metadata.width}x${metadata.height}`);
    console.log(`文件大小: ${formatFileSize(metadata.fileSize)}`);
    console.log(`比特率: ${Math.round(metadata.bitrate / 1000)} kbps`);
    
  } catch (error) {
    console.error('处理失败:', error);
  }
}
```

### 2. 批量处理

```typescript
async function processMultipleVideos(filePaths: string[]) {
  try {
    // 验证文件
    const validFiles = await Promise.all(
      filePaths.map(async (path) => {
        const isValid = await VideoMetadataModule.isValidVideoFile(path);
        return isValid ? path : null;
      })
    ).then(results => results.filter(Boolean) as string[]);
    
    console.log(`有效文件: ${validFiles.length}/${filePaths.length}`);
    
    // 批量获取元数据
    const metadataList = await VideoMetadataModule.getBatchVideoMetadataWithCache(validFiles);
    
    // 统计信息
    const stats = {
      totalFiles: validFiles.length,
      totalSize: metadataList.reduce((sum, m) => sum + m.fileSize, 0),
      totalDuration: metadataList.reduce((sum, m) => sum + m.duration, 0)
    };
    
    console.log('统计:', stats);
    
  } catch (error) {
    console.error('批量处理失败:', error);
  }
}
```

### 3. 高级使用

```typescript
import { VideoMetadataUtils, VideoMetadataCache } from './utils';

async function advancedExample(filePaths: string[]) {
  const utils = new VideoMetadataUtils(VideoMetadataModule);
  const cache = new VideoMetadataCache(VideoMetadataModule);
  
  // 预加载缓存
  await cache.preloadMetadata(filePaths.slice(0, 10));
  
  // 带进度处理的批量操作
  const results = await utils.processBatchWithProgress(
    filePaths,
    (processed, total) => {
      console.log(`进度: ${Math.round((processed / total) * 100)}%`);
    }
  );
  
  // 获取统计信息
  const stats = await utils.getVideoStats(filePaths);
  console.log('视频统计:', stats);
}
```

## 最佳实践

### 1. 资源管理

- **始终释放资源**: 确保在finally块中调用`retriever.release()`
- **避免内存泄漏**: 不要长时间持有MediaMetadataRetriever实例
- **设置超时**: 为网络资源设置合理的超时时间

### 2. 性能优化

- **使用批量处理**: 优先使用批量API而不是单个处理
- **启用缓存**: 使用缓存减少重复解析
- **控制并发**: 限制并发处理数量
- **分批处理**: 将大量文件分批处理

### 3. 错误处理

- **验证文件存在性**: 处理前检查文件是否存在
- **处理权限问题**: 确保有读取文件的权限
- **处理损坏文件**: 优雅处理损坏的视频文件
- **记录错误信息**: 记录详细的错误信息用于调试

### 4. 内存管理

- **及时清理缓存**: 定期清理不需要的缓存
- **限制缓存大小**: 避免缓存过多数据
- **处理大文件**: 大文件处理时要注意内存使用

## 性能优化策略

### 1. 缓存策略

```kotlin
// LRU缓存实现
class VideoMetadataCache {
    private val cache = mutableMapOf<String, VideoMetadata>()
    private val maxCacheSize = 100 // 最大缓存数量
    
    fun get(filePath: String): VideoMetadata? {
        return cache[filePath]
    }
    
    fun put(filePath: String, metadata: VideoMetadata) {
        if (cache.size >= maxCacheSize) {
            // 移除最旧的条目
            val oldestKey = cache.keys.first()
            cache.remove(oldestKey)
        }
        cache[filePath] = metadata
    }
}
```

### 2. 并发处理

```kotlin
// 使用协程进行并发处理
suspend fun processVideosConcurrent(filePaths: List<String>): List<VideoMetadata> {
    return coroutineScope {
        filePaths.map { path ->
            async(Dispatchers.IO) {
                getVideoMetadata(path)
            }
        }.awaitAll()
    }
}
```

### 3. 内存优化

```kotlin
// 使用对象池减少GC压力
object MediaMetadataRetrieverPool {
    private val pool = mutableMapOf<String, MediaMetadataRetriever>()
    
    fun acquire(): MediaMetadataRetriever {
        return synchronized(pool) {
            pool.values.firstOrNull() ?: MediaMetadataRetriever().also {
                pool[it.toString()] = it
            }
        }
    }
    
    fun release(retriever: MediaMetadataRetriever) {
        synchronized(pool) {
            pool.remove(retriever.toString())
            retriever.release()
        }
    }
}
```

## 错误处理

### 1. 常见错误类型

```kotlin
sealed class VideoMetadataError(message: String) : Exception(message) {
    class FileNotFound(path: String) : VideoMetadataError("文件不存在: $path")
    class InvalidFormat(path: String) : VideoMetadataError("无效的视频格式: $path")
    class PermissionDenied(path: String) : VideoMetadataError("权限被拒绝: $path")
    class IoError(path: String, cause: Throwable) : VideoMetadataError("IO错误: $path, ${cause.message}")
    class TimeoutError(path: String) : VideoMetadataError("处理超时: $path")
}
```

### 2. 错误处理示例

```kotlin
fun getVideoMetadataSafe(filePath: String): VideoMetadata {
    return try {
        val file = File(filePath)
        if (!file.exists()) {
            return VideoMetadata(errorMessage = "文件不存在: $filePath")
        }
        
        if (!file.canRead()) {
            return VideoMetadata(errorMessage = "无法读取文件: $filePath")
        }
        
        getVideoMetadata(filePath)
        
    } catch (e: SecurityException) {
        VideoMetadata(errorMessage = "权限被拒绝: ${e.message}")
    } catch (e: IOException) {
        VideoMetadata(errorMessage = "IO错误: ${e.message}")
    } catch (e: Exception) {
        VideoMetadata(errorMessage = "未知错误: ${e.message}")
    }
}
```

## 完整代码文件

1. **Android原生代码**:
   - `/android/app/src/main/java/com/expostarter/videometadata/VideoMetadataRetriever.kt`
   - `/android/app/src/main/java/com/expostarter/videometadata/VideoMetadataModule.kt`

2. **TypeScript接口**:
   - `/src/types/videoMetadata.ts`

3. **使用示例**:
   - `/src/utils/videoMetadataExample.ts`

## 总结

本指南提供了完整的MediaMetadataRetriever使用方案，包括：

1. **完整的Android原生实现**：支持多种URI类型，完善的错误处理
2. **React Native桥接**：完整的TypeScript接口定义
3. **丰富的使用示例**：从基础到高级的各种场景
4. **最佳实践**：性能优化、错误处理、资源管理
5. **性能优化策略**：缓存、并发、内存优化

通过这个完整的实现，您可以高效地在React Native应用中获取视频文件的元数据信息。