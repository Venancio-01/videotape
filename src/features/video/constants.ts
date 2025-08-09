/**
 * 视频功能模块的常量
 */
export const VIDEO_CONSTANTS = {
  // 播放器配置
  PLAYER: {
    MIN_SPEED: 0.25,
    MAX_SPEED: 4.0,
    DEFAULT_SPEED: 1.0,
    SPEED_STEP: 0.25,
    VOLUME_STEP: 0.1,
    BUFFER_SIZE: 1000, // 缓冲时间（毫秒）
  },

  // 缩略图配置
  THUMBNAIL: {
    WIDTH: 320,
    HEIGHT: 180,
    QUALITY: 80,
  },

  // 文件类型
  SUPPORTED_FORMATS: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ],

  // 搜索配置
  SEARCH: {
    DEBOUNCE_MS: 300,
    MIN_QUERY_LENGTH: 2,
    MAX_RESULTS: 50,
  },

  // 缓存配置
  CACHE: {
    THUMBNAIL_TTL: 7 * 24 * 60 * 60 * 1000, // 7天
    METADATA_TTL: 24 * 60 * 60 * 1000, // 24小时
  },
} as const;
