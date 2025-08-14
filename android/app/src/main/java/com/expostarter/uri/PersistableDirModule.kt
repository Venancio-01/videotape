package com.myvideoplayer.uri

import android.app.Activity
import android.content.ContentResolver
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import androidx.documentfile.provider.DocumentFile
import com.facebook.react.bridge.*
import android.os.Build
import android.media.MediaMetadataRetriever
import android.util.Log

class PersistableDirModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pickerPromise: Promise? = null
    private val PICK_DIRECTORY = 2001
    private val VIDEO_EXTENSIONS = setOf("mp4", "mkv", "avi", "mov", "flv", "wmv", "webm", "m4v", "3gp", "mpg", "mpeg")

    init {
        reactContext.addActivityEventListener(this)
    }

    fun onActivityDestroyed() {
        pickerPromise?.reject("ACTIVITY_DESTROYED", "Activity destroyed")
        pickerPromise = null
    }

    override fun getName(): String = "PersistableDir"

    @ReactMethod
    fun pickDirectory(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No activity")
            return
        }

        pickerPromise = promise

        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
            addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION or
                        Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
                        Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
            )
        }
        activity.startActivityForResult(intent, PICK_DIRECTORY)
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == PICK_DIRECTORY && pickerPromise != null) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val uri: Uri? = data.data
                if (uri != null) {
                    val takeFlags = data.flags and
                            (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)

                    try {
                        activity?.contentResolver?.takePersistableUriPermission(uri, takeFlags)
                        val videos = getVideosFromDir(uri)
                        pickerPromise?.resolve(Arguments.fromList(videos))
                    } catch (e: SecurityException) {
                        pickerPromise?.reject("PERMISSION_DENIED", "Permission denied: ${e.message}")
                    } catch (e: Exception) {
                        pickerPromise?.reject("PERMISSION_ERROR", "Failed to take permission: ${e.message}")
                    }
                } else {
                    pickerPromise?.reject("NO_URI", "No URI selected")
                }
            } else {
                pickerPromise?.reject("CANCELLED", "User cancelled")
            }
            pickerPromise = null
        }
    }

    override fun onNewIntent(intent: Intent?) {
        // 不处理
    }

    private fun getVideosFromDir(dirUri: Uri): List<WritableMap> {
        val videos = mutableListOf<WritableMap>()
        val dir = DocumentFile.fromTreeUri(reactApplicationContext, dirUri)
        
        if (dir == null) {
            pickerPromise?.reject("INVALID_URI", "Invalid directory URI")
            return emptyList()
        }
        
        if (!dir.isDirectory) {
            pickerPromise?.reject("NOT_DIRECTORY", "Selected URI is not a directory")
            return emptyList()
        }
        
        try {
            val files = dir.listFiles()
            if (files == null) {
                pickerPromise?.reject("LIST_FILES_FAILED", "Failed to list directory contents")
                return emptyList()
            }
            
            for (file in files) {
                if (isVideoFile(file)) {
                    val metadata = getVideoMetadata(file.uri)
                    if (metadata != null) {
                        videos.add(metadata)
                    }
                }
            }
        } catch (e: SecurityException) {
            pickerPromise?.reject("ACCESS_DENIED", "Access denied to directory: ${e.message}")
            return emptyList()
        } catch (e: Exception) {
            pickerPromise?.reject("FILE_ERROR", "Error reading directory: ${e.message}")
            return emptyList()
        }
        
        return videos
    }

    @ReactMethod
    fun getVideoMetadata(uri: String, promise: Promise) {
        try {
            val videoUri = Uri.parse(uri)
            val metadata = getVideoMetadata(videoUri)
            if (metadata != null) {
                promise.resolve(metadata)
            } else {
                promise.reject("METADATA_ERROR", "Failed to extract video metadata")
            }
        } catch (e: Exception) {
            promise.reject("METADATA_ERROR", "Error getting video metadata: ${e.message}")
        }
    }

    private fun getVideoMetadata(uri: Uri): WritableMap? {
        val retriever = MediaMetadataRetriever()
        return try {
            retriever.setDataSource(reactApplicationContext, uri)
            
            val metadata = Arguments.createMap()
            
            // 基本信息
            metadata.putString("uri", uri.toString())
            metadata.putString("name", getFileNameFromUri(uri))
            
            // 视频元数据
            val duration = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_DURATION)
            val width = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
            val height = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
            val rotation = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
            val bitrate = extractIntMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_BITRATE)
            val mimeType = extractStringMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_MIMETYPE)
            
            // 文件大小
            val size = getFileSize(uri)
            
            // 设置元数据
            metadata.putInt("duration", duration / 1000) // 转换为秒
            metadata.putInt("width", width)
            metadata.putInt("height", height)
            metadata.putInt("rotation", rotation)
            metadata.putInt("bitrate", bitrate)
            metadata.putInt("size", size)
            metadata.putString("mimeType", mimeType)
            metadata.putString("format", getFileExtension(uri))
            
            // 计算实际分辨率（考虑旋转）
            val actualWidth = if (rotation == 90 || rotation == 270) height else width
            val actualHeight = if (rotation == 90 || rotation == 270) width else height
            metadata.putInt("resolutionWidth", actualWidth)
            metadata.putInt("resolutionHeight", actualHeight)
            
            metadata
        } catch (e: Exception) {
            Log.e("PersistableDirModule", "Error extracting metadata from $uri", e)
            null
        } finally {
            try {
                retriever.release()
            } catch (e: Exception) {
                Log.e("PersistableDirModule", "Error releasing MediaMetadataRetriever", e)
            }
        }
    }

    private fun extractIntMetadata(retriever: MediaMetadataRetriever, key: Int): Int {
        return try {
            val value = retriever.extractMetadata(key)
            value?.toIntOrNull() ?: 0
        } catch (e: Exception) {
            0
        }
    }

    private fun extractStringMetadata(retriever: MediaMetadataRetriever, key: Int): String {
        return try {
            retriever.extractMetadata(key) ?: "unknown"
        } catch (e: Exception) {
            "unknown"
        }
    }

    private fun getFileNameFromUri(uri: Uri): String {
        return try {
            val cursor = reactApplicationContext.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                val nameIndex = it.getColumnIndex(DocumentsContract.Document.COLUMN_DISPLAY_NAME)
                if (it.moveToFirst() && nameIndex != -1) {
                    it.getString(nameIndex)
                } else {
                    uri.lastPathSegment ?: "unknown"
                }
            } ?: uri.lastPathSegment ?: "unknown"
        } catch (e: Exception) {
            uri.lastPathSegment ?: "unknown"
        }
    }

    private fun getFileSize(uri: Uri): Int {
        return try {
            val cursor = reactApplicationContext.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                val sizeIndex = it.getColumnIndex(DocumentsContract.Document.COLUMN_SIZE)
                if (it.moveToFirst() && sizeIndex != -1) {
                    it.getInt(sizeIndex)
                } else {
                    0
                }
            } ?: 0
        } catch (e: Exception) {
            0
        }
    }

    private fun getFileExtension(uri: Uri): String {
        val fileName = getFileNameFromUri(uri)
        return fileName.substringAfterLast('.', "").lowercase()
    }

    private fun isVideoFile(file: DocumentFile): Boolean {
        val fileName = file.name ?: return false
        val extension = fileName.substringAfterLast('.', "").lowercase()
        return file.isFile && extension in VIDEO_EXTENSIONS
    }
}
