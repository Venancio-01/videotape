package com.expostarter.videometadata

import android.media.MediaMetadataRetriever
import android.util.Log
import java.io.File
import java.io.IOException

/**
 * 视频元数据信息类
 */
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

/**
 * MediaMetadataRetriever 工具类
 * 提供高性能的视频元数据获取功能
 */
class VideoMetadataRetriever {
    companion object {
        private const val TAG = "VideoMetadataRetriever"
        private const val TIMEOUT_MS = 5000L // 5秒超时
        
        /**
         * 获取单个视频文件的完整元数据
         */
        fun getVideoMetadata(filePath: String): VideoMetadata {
            val retriever = MediaMetadataRetriever()
            return try {
                // 设置数据源
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
                
                // 提取所有元数据
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
        
        /**
         * 批量获取视频元数据（优化版本）
         */
        fun getBatchVideoMetadata(filePaths: List<String>): List<VideoMetadata> {
            return filePaths.map { path ->
                getVideoMetadata(path)
            }
        }
        
        /**
         * 批量获取视频元数据（并发版本，适用于大量文件）
         */
        fun getBatchVideoMetadataConcurrent(filePaths: List<String>): List<VideoMetadata> {
            return filePaths.parallelStream().map { path ->
                getVideoMetadata(path)
            }.toList()
        }
        
        /**
         * 从MediaMetadataRetriever提取元数据
         */
        private fun extractMetadata(retriever: MediaMetadataRetriever, file: File): VideoMetadata {
            try {
                // 获取基本元数据
                val duration = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_DURATION)
                val width = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
                val height = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
                val bitrate = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_BITRATE).toLong()
                val rotation = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
                val mimeType = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_MIMETYPE)
                val frameRate = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_CAPTURE_FRAMERATE)
                
                // 检查是否有音频和视频轨道
                val hasAudio = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO) == "yes"
                val hasVideo = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_HAS_VIDEO) == "yes"
                
                // 获取文件信息
                val fileSize = if (file.exists()) file.length() else 0L
                val creationTime = if (file.exists()) file.lastModified() else 0L
                val modificationTime = if (file.exists()) file.lastModified() else 0L
                
                return VideoMetadata(
                    duration = duration.toLong(),
                    width = width,
                    height = height,
                    bitrate = bitrate,
                    rotation = rotation,
                    mimeType = mimeType,
                    hasAudio = hasAudio,
                    hasVideo = hasVideo,
                    frameRate = frameRate,
                    fileSize = fileSize,
                    creationTime = creationTime,
                    modificationTime = modificationTime
                )
                
            } catch (e: Exception) {
                Log.e(TAG, "提取元数据失败: ${e.message}", e)
                return VideoMetadata(errorMessage = "提取元数据失败: ${e.message}")
            }
        }
        
        /**
         * 提取整型元数据
         */
        private fun extractIntMetadata(retriever: MediaMetadataRetriever, key: Int): Int {
            return try {
                retriever.extractMetadata(key)?.toIntOrNull() ?: 0
            } catch (e: Exception) {
                Log.w(TAG, "提取整型元数据失败: $key", e)
                0
            }
        }
        
        /**
         * 提取字符串元数据
         */
        private fun extractStringMetadata(retriever: MediaMetadataRetriever, key: Int): String? {
            return try {
                retriever.extractMetadata(key)
            } catch (e: Exception) {
                Log.w(TAG, "提取字符串元数据失败: $key", e)
                null
            }
        }
        
        /**
         * 检查文件是否为有效的视频文件
         */
        fun isValidVideoFile(filePath: String): Boolean {
            val retriever = MediaMetadataRetriever()
            return try {
                when {
                    filePath.startsWith("content://") -> {
                        retriever.setDataSource(filePath)
                    }
                    else -> {
                        val file = File(filePath)
                        if (!file.exists()) return false
                        retriever.setDataSource(file.absolutePath)
                    }
                }
                
                // 尝试获取基本元数据来验证是否为有效视频
                val duration = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_DURATION)
                val hasVideo = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_HAS_VIDEO) == "yes"
                
                duration > 0 && hasVideo
                
            } catch (e: Exception) {
                Log.e(TAG, "验证视频文件失败: ${e.message}", e)
                false
            } finally {
                try {
                    retriever.release()
                } catch (e: Exception) {
                    Log.w(TAG, "释放MediaMetadataRetriever失败", e)
                }
            }
        }
        
        /**
         * 获取视频缩略图（可选功能）
         */
        fun getVideoThumbnail(filePath: String, timeUs: Long = -1L): ByteArray? {
            val retriever = MediaMetadataRetriever()
            return try {
                when {
                    filePath.startsWith("content://") -> {
                        retriever.setDataSource(filePath)
                    }
                    else -> {
                        val file = File(filePath)
                        if (!file.exists()) return null
                        retriever.setDataSource(file.absolutePath)
                    }
                }
                
                // 如果没有指定时间，使用视频的中间位置
                val actualTime = if (timeUs > 0) timeUs else {
                    val duration = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_DURATION).toLong() * 1000
                    duration / 2
                }
                
                retriever.getFrameAtTime(actualTime, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
                
            } catch (e: Exception) {
                Log.e(TAG, "获取视频缩略图失败: ${e.message}", e)
                null
            } finally {
                try {
                    retriever.release()
                } catch (e: Exception) {
                    Log.w(TAG, "释放MediaMetadataRetriever失败", e)
                }
            }
        }
    }
}

/**
 * 视频元数据管理器
 * 提供缓存和批量处理功能
 */
class VideoMetadataManager {
    private val metadataCache = mutableMapOf<String, VideoMetadata>()
    private val cacheLock = Any()
    
    /**
     * 获取视频元数据（带缓存）
     */
    fun getVideoMetadataWithCache(filePath: String): VideoMetadata {
        synchronized(cacheLock) {
            return metadataCache[filePath] ?: run {
                val metadata = VideoMetadataRetriever.getVideoMetadata(filePath)
                metadataCache[filePath] = metadata
                metadata
            }
        }
    }
    
    /**
     * 批量获取视频元数据（智能处理，优先使用缓存）
     */
    fun getBatchVideoMetadataWithCache(filePaths: List<String>): List<VideoMetadata> {
        val uncachedPaths = mutableListOf<String>()
        val results = mutableListOf<VideoMetadata>()
        
        synchronized(cacheLock) {
            // 先从缓存中获取
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
            val newResults = VideoMetadataRetriever.getBatchVideoMetadataConcurrent(uncachedPaths)
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
    
    /**
     * 清除缓存
     */
    fun clearCache() {
        synchronized(cacheLock) {
            metadataCache.clear()
        }
    }
    
    /**
     * 移除特定文件的缓存
     */
    fun removeFromCache(filePath: String) {
        synchronized(cacheLock) {
            metadataCache.remove(filePath)
        }
    }
    
    /**
     * 获取缓存大小
     */
    fun getCacheSize(): Int {
        synchronized(cacheLock) {
            return metadataCache.size
        }
    }
}