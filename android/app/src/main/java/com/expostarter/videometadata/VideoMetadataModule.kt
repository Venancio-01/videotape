package com.expostarter.videometadata

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONObject
import java.io.File

/**
 * React Native 视频元数据模块
 * 提供JavaScript到Kotlin的桥接功能
 */
@ReactModule(name = "VideoMetadataModule")
class VideoMetadataModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val metadataManager = VideoMetadataManager()
    
    override fun getName(): String {
        return "VideoMetadataModule"
    }
    
    /**
     * 获取单个视频文件的元数据
     */
    @ReactMethod
    fun getVideoMetadata(filePath: String, promise: Promise) {
        try {
            val metadata = VideoMetadataRetriever.getVideoMetadata(filePath)
            val metadataMap = convertMetadataToMap(metadata)
            promise.resolve(metadataMap)
        } catch (e: Exception) {
            promise.reject("METADATA_ERROR", "获取视频元数据失败: ${e.message}")
        }
    }
    
    /**
     * 获取单个视频文件的元数据（带缓存）
     */
    @ReactMethod
    fun getVideoMetadataWithCache(filePath: String, promise: Promise) {
        try {
            val metadata = metadataManager.getVideoMetadataWithCache(filePath)
            val metadataMap = convertMetadataToMap(metadata)
            promise.resolve(metadataMap)
        } catch (e: Exception) {
            promise.reject("METADATA_ERROR", "获取视频元数据失败: ${e.message}")
        }
    }
    
    /**
     * 批量获取视频元数据
     */
    @ReactMethod
    fun getBatchVideoMetadata(filePaths: ReadableArray, promise: Promise) {
        try {
            val paths = mutableListOf<String>()
            for (i in 0 until filePaths.size()) {
                paths.add(filePaths.getString(i))
            }
            
            val metadataList = VideoMetadataRetriever.getBatchVideoMetadata(paths)
            val result = Arguments.createArray()
            
            metadataList.forEach { metadata ->
                result.pushMap(convertMetadataToMap(metadata))
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("METADATA_ERROR", "批量获取视频元数据失败: ${e.message}")
        }
    }
    
    /**
     * 批量获取视频元数据（带缓存）
     */
    @ReactMethod
    fun getBatchVideoMetadataWithCache(filePaths: ReadableArray, promise: Promise) {
        try {
            val paths = mutableListOf<String>()
            for (i in 0 until filePaths.size()) {
                paths.add(filePaths.getString(i))
            }
            
            val metadataList = metadataManager.getBatchVideoMetadataWithCache(paths)
            val result = Arguments.createArray()
            
            metadataList.forEach { metadata ->
                result.pushMap(convertMetadataToMap(metadata))
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("METADATA_ERROR", "批量获取视频元数据失败: ${e.message}")
        }
    }
    
    /**
     * 检查文件是否为有效的视频文件
     */
    @ReactMethod
    fun isValidVideoFile(filePath: String, promise: Promise) {
        try {
            val isValid = VideoMetadataRetriever.isValidVideoFile(filePath)
            promise.resolve(isValid)
        } catch (e: Exception) {
            promise.reject("VALIDATION_ERROR", "验证视频文件失败: ${e.message}")
        }
    }
    
    /**
     * 获取视频缩略图（Base64格式）
     */
    @ReactMethod
    fun getVideoThumbnail(filePath: String, timeUs: Double, promise: Promise) {
        try {
            val thumbnail = VideoMetadataRetriever.getVideoThumbnail(filePath, timeUs.toLong())
            if (thumbnail != null) {
                val base64 = android.util.Base64.encodeToString(thumbnail, android.util.Base64.DEFAULT)
                promise.resolve("data:image/jpeg;base64,$base64")
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("THUMBNAIL_ERROR", "获取视频缩略图失败: ${e.message}")
        }
    }
    
    /**
     * 清除元数据缓存
     */
    @ReactMethod
    fun clearCache(promise: Promise) {
        try {
            metadataManager.clearCache()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CACHE_ERROR", "清除缓存失败: ${e.message}")
        }
    }
    
    /**
     * 移除特定文件的缓存
     */
    @ReactMethod
    fun removeFromCache(filePath: String, promise: Promise) {
        try {
            metadataManager.removeFromCache(filePath)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CACHE_ERROR", "移除缓存失败: ${e.message}")
        }
    }
    
    /**
     * 获取缓存大小
     */
    @ReactMethod
    fun getCacheSize(promise: Promise) {
        try {
            val size = metadataManager.getCacheSize()
            promise.resolve(size)
        } catch (e: Exception) {
            promise.reject("CACHE_ERROR", "获取缓存大小失败: ${e.message}")
        }
    }
    
    /**
     * 将VideoMetadata转换为ReadableMap
     */
    private fun convertMetadataToMap(metadata: VideoMetadata): WritableMap {
        val map = Arguments.createMap()
        
        map.putDouble("duration", metadata.duration.toDouble())
        map.putInt("width", metadata.width)
        map.putInt("height", metadata.height)
        map.putDouble("bitrate", metadata.bitrate.toDouble())
        map.putInt("rotation", metadata.rotation)
        map.putString("mimeType", metadata.mimeType)
        map.putBoolean("hasAudio", metadata.hasAudio)
        map.putBoolean("hasVideo", metadata.hasVideo)
        map.putString("frameRate", metadata.frameRate)
        map.putDouble("fileSize", metadata.fileSize.toDouble())
        map.putDouble("creationTime", metadata.creationTime.toDouble())
        map.putDouble("modificationTime", metadata.modificationTime.toDouble())
        map.putString("errorMessage", metadata.errorMessage)
        
        return map
    }
    
    /**
     * 获取支持的常量
     */
    override fun getConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "METADATA_KEY_DURATION" to android.media.MediaMetadataRetriever.METADATA_KEY_DURATION,
            "METADATA_KEY_WIDTH" to android.media.MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH,
            "METADATA_KEY_HEIGHT" to android.media.MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT,
            "METADATA_KEY_BITRATE" to android.media.MediaMetadataRetriever.METADATA_KEY_BITRATE,
            "METADATA_KEY_ROTATION" to android.media.MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION,
            "METADATA_KEY_MIMETYPE" to android.media.MediaMetadataRetriever.METADATA_KEY_MIMETYPE,
            "METADATA_KEY_FRAMERATE" to android.media.MediaMetadataRetriever.METADATA_KEY_CAPTURE_FRAMERATE
        )
    }
}

/**
 * 视频元数据模块包
 */
class VideoMetadataPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(VideoMetadataModule(reactContext))
    }
    
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}