/**
 * 应用配置管理服务
 * 统一管理应用配置，使用 MMKV 进行高性能存储
 */

import { mmkvStorage, CONFIG_KEYS } from './mmkv-storage';

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * 语言类型
 */
export type Language = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

/**
 * 视频质量类型
 */
export type VideoQuality = 'auto' | 'low' | 'medium' | 'high';

/**
 * 播放器设置
 */
export interface PlayerSettings {
  volume: number;
  playbackSpeed: number;
  defaultQuality: VideoQuality;
  autoPlay: boolean;
  loop: boolean;
  shuffle: boolean;
  rememberPosition: boolean;
  skipIntro: boolean;
  skipCredits: boolean;
  subtitlesEnabled: boolean;
  subtitleLanguage?: string;
  audioLanguage?: string;
}

/**
 * UI 设置
 */
export interface UISettings {
  theme: Theme;
  language: Language;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily?: string;
  animationsEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  statusBarHidden: boolean;
  navigationBarHidden: boolean;
  autoRotate: boolean;
  brightness: number;
  gridMode: boolean;
  thumbnailSize: 'small' | 'medium' | 'large';
}

/**
 * 网络设置
 */
export interface NetworkSettings {
  dataSaver: boolean;
  wifiOnlyDownloads: boolean;
  autoDownload: boolean;
  maxDownloadQuality: VideoQuality;
  maxStreamingQuality: VideoQuality;
  bandwidthLimit: number; // KB/s
  concurrentDownloads: number;
  cacheSize: number; // MB
}

/**
 * 缓存设置
 */
export interface CacheSettings {
  enabled: boolean;
  maxSize: number; // MB
  thumbnailCacheSize: number; // MB
  metadataCacheSize: number; // MB
  autoCleanup: boolean;
  cleanupInterval: number; // days
}

/**
 * 隐私设置
 */
export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  usageDataCollection: boolean;
  personalizedAds: boolean;
  locationServices: boolean;
}

/**
 * 实验性功能
 */
export interface ExperimentalSettings {
  betaFeatures: string[];
  developerMode: boolean;
  debugMode: boolean;
  forceUpdate: boolean;
}

/**
 * 应用配置
 */
export interface AppConfig {
  player: PlayerSettings;
  ui: UISettings;
  network: NetworkSettings;
  cache: CacheSettings;
  privacy: PrivacySettings;
  experimental: ExperimentalSettings;
  
  // 元数据
  version: string;
  lastUpdated: Date;
  installId: string;
}

/**
 * 配置管理服务
 */
export class ConfigService {
  private config: AppConfig;
  private readonly configVersion = '1.0.0';
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): AppConfig {
    return {
      player: {
        volume: 1.0,
        playbackSpeed: 1.0,
        defaultQuality: 'auto',
        autoPlay: true,
        loop: false,
        shuffle: false,
        rememberPosition: true,
        skipIntro: false,
        skipCredits: false,
        subtitlesEnabled: false,
      },
      ui: {
        theme: 'auto',
        language: 'zh-CN',
        fontSize: 'medium',
        animationsEnabled: true,
        hapticFeedbackEnabled: true,
        statusBarHidden: false,
        navigationBarHidden: false,
        autoRotate: true,
        brightness: 1.0,
        gridMode: false,
        thumbnailSize: 'medium',
      },
      network: {
        dataSaver: false,
        wifiOnlyDownloads: false,
        autoDownload: false,
        maxDownloadQuality: 'high',
        maxStreamingQuality: 'auto',
        bandwidthLimit: 0,
        concurrentDownloads: 3,
        cacheSize: 100,
      },
      cache: {
        enabled: true,
        maxSize: 500,
        thumbnailCacheSize: 100,
        metadataCacheSize: 50,
        autoCleanup: true,
        cleanupInterval: 7,
      },
      privacy: {
        analyticsEnabled: false,
        crashReportingEnabled: true,
        usageDataCollection: false,
        personalizedAds: false,
        locationServices: false,
      },
      experimental: {
        betaFeatures: [],
        developerMode: false,
        debugMode: false,
        forceUpdate: false,
      },
      version: this.configVersion,
      lastUpdated: new Date(),
      installId: this.generateInstallId(),
    };
  }

  /**
   * 生成安装ID
   */
  private generateInstallId(): string {
    return `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await mmkvStorage.getObject<AppConfig>('app_config');
      
      if (savedConfig) {
        // 合并配置，确保新字段有默认值
        this.config = this.mergeConfig(this.config, savedConfig);
        
        // 检查版本升级
        if (savedConfig.version !== this.configVersion) {
          await this.handleConfigUpgrade(savedConfig.version, this.configVersion);
        }
      }
      
      // 定期清理缓存
      this.scheduleCacheCleanup();
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }

  /**
   * 合并配置
   */
  private mergeConfig(defaultConfig: AppConfig, savedConfig: Partial<AppConfig>): AppConfig {
    const merged = { ...defaultConfig };
    
    // 递归合并对象
    const deepMerge = (target: any, source: any): any => {
      if (typeof target !== 'object' || target === null) return source;
      if (typeof source !== 'object' || source === null) return target;
      
      const result = { ...target };
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && source[key] !== null) {
            result[key] = deepMerge(target[key], source[key]);
          } else {
            result[key] = source[key];
          }
        }
      }
      return result;
    };
    
    return deepMerge(merged, savedConfig);
  }

  /**
   * 处理配置升级
   */
  private async handleConfigUpgrade(oldVersion: string, newVersion: string): Promise<void> {
    console.log(`配置升级: ${oldVersion} -> ${newVersion}`);
    
    // 根据版本差异进行特殊处理
    // 这里可以添加版本特定的升级逻辑
    
    this.config.version = newVersion;
    this.config.lastUpdated = new Date();
    await this.saveConfig();
  }

  /**
   * 保存配置
   */
  private async saveConfig(): Promise<void> {
    try {
      this.config.lastUpdated = new Date();
      await mmkvStorage.setObject('app_config', this.config);
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * 获取播放器设置
   */
  getPlayerSettings(): PlayerSettings {
    return { ...this.config.player };
  }

  /**
   * 更新播放器设置
   */
  async updatePlayerSettings(settings: Partial<PlayerSettings>): Promise<void> {
    const oldSettings = { ...this.config.player };
    this.config.player = { ...this.config.player, ...settings };
    
    await this.saveConfig();
    this.notifyListeners('player', this.config.player);
    
    // 保存到单独的键以便快速访问
    if (settings.volume !== undefined) {
      await mmkvStorage.setNumber(CONFIG_KEYS.VOLUME, settings.volume);
    }
    if (settings.playbackSpeed !== undefined) {
      await mmkvStorage.setNumber(CONFIG_KEYS.PLAYBACK_SPEED, settings.playbackSpeed);
    }
    if (settings.defaultQuality !== undefined) {
      await mmkvStorage.setString(CONFIG_KEYS.QUALITY, settings.defaultQuality);
    }
  }

  /**
   * 获取UI设置
   */
  getUISettings(): UISettings {
    return { ...this.config.ui };
  }

  /**
   * 更新UI设置
   */
  async updateUISettings(settings: Partial<UISettings>): Promise<void> {
    const oldSettings = { ...this.config.ui };
    this.config.ui = { ...this.config.ui, ...settings };
    
    await this.saveConfig();
    this.notifyListeners('ui', this.config.ui);
    
    // 保存到单独的键以便快速访问
    if (settings.theme !== undefined) {
      await mmkvStorage.setString(CONFIG_KEYS.THEME, settings.theme);
    }
    if (settings.language !== undefined) {
      await mmkvStorage.setString(CONFIG_KEYS.LANGUAGE, settings.language);
    }
  }

  /**
   * 获取网络设置
   */
  getNetworkSettings(): NetworkSettings {
    return { ...this.config.network };
  }

  /**
   * 更新网络设置
   */
  async updateNetworkSettings(settings: Partial<NetworkSettings>): Promise<void> {
    this.config.network = { ...this.config.network, ...settings };
    await this.saveConfig();
    this.notifyListeners('network', this.config.network);
    
    // 保存到单独的键以便快速访问
    if (settings.dataSaver !== undefined) {
      await mmkvStorage.setBoolean(CONFIG_KEYS.DATA_SAVER, settings.dataSaver);
    }
  }

  /**
   * 获取缓存设置
   */
  getCacheSettings(): CacheSettings {
    return { ...this.config.cache };
  }

  /**
   * 更新缓存设置
   */
  async updateCacheSettings(settings: Partial<CacheSettings>): Promise<void> {
    this.config.cache = { ...this.config.cache, ...settings };
    await this.saveConfig();
    this.notifyListeners('cache', this.config.cache);
  }

  /**
   * 获取隐私设置
   */
  getPrivacySettings(): PrivacySettings {
    return { ...this.config.privacy };
  }

  /**
   * 更新隐私设置
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    this.config.privacy = { ...this.config.privacy, ...settings };
    await this.saveConfig();
    this.notifyListeners('privacy', this.config.privacy);
  }

  /**
   * 获取实验性设置
   */
  getExperimentalSettings(): ExperimentalSettings {
    return { ...this.config.experimental };
  }

  /**
   * 更新实验性设置
   */
  async updateExperimentalSettings(settings: Partial<ExperimentalSettings>): Promise<void> {
    this.config.experimental = { ...this.config.experimental, ...settings };
    await this.saveConfig();
    this.notifyListeners('experimental', this.config.experimental);
  }

  /**
   * 监听配置变化
   */
  addListener(section: keyof AppConfig, callback: (value: any) => void): () => void {
    if (!this.listeners.has(section)) {
      this.listeners.set(section, new Set());
    }
    
    this.listeners.get(section)!.add(callback);
    
    // 返回取消监听的函数
    return () => {
      const sectionListeners = this.listeners.get(section);
      if (sectionListeners) {
        sectionListeners.delete(callback);
        if (sectionListeners.size === 0) {
          this.listeners.delete(section);
        }
      }
    };
  }

  /**
   * 通知监听器
   */
  private notifyListeners(section: keyof AppConfig, value: any): void {
    const sectionListeners = this.listeners.get(section);
    if (sectionListeners) {
      sectionListeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`配置监听器错误 (${section}):`, error);
        }
      });
    }
  }

  /**
   * 重置配置
   */
  async resetConfig(): Promise<void> {
    this.config = this.getDefaultConfig();
    await this.saveConfig();
    
    // 通知所有监听器
    for (const section of this.listeners.keys()) {
      this.notifyListeners(section as keyof AppConfig, (this.config as any)[section]);
    }
  }

  /**
   * 导出配置
   */
  async exportConfig(): Promise<string> {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  async importConfig(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = this.mergeConfig(this.getDefaultConfig(), importedConfig);
      await this.saveConfig();
      
      // 通知所有监听器
      for (const section of this.listeners.keys()) {
        this.notifyListeners(section as keyof AppConfig, (this.config as any)[section]);
      }
    } catch (error) {
      throw new Error('配置格式无效');
    }
  }

  /**
   * 获取配置统计信息
   */
  async getConfigStats(): Promise<{
    configSize: number;
    lastUpdated: Date;
    version: string;
    listenerCount: number;
  }> {
    const configJson = JSON.stringify(this.config);
    const configSize = new Blob([configJson]).size;
    
    let listenerCount = 0;
    for (const listeners of this.listeners.values()) {
      listenerCount += listeners.size;
    }
    
    return {
      configSize,
      lastUpdated: this.config.lastUpdated,
      version: this.config.version,
      listenerCount,
    };
  }

  /**
   * 定期清理缓存
   */
  private scheduleCacheCleanup(): void {
    // 每天检查一次是否需要清理
    setInterval(async () => {
      const lastCleanup = await mmkvStorage.getNumber(CONFIG_KEYS.LAST_CLEANUP, 0);
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (now - lastCleanup > dayInMs) {
        await mmkvStorage.cleanup();
        await mmkvStorage.setNumber(CONFIG_KEYS.LAST_CLEANUP, now);
      }
    }, 60 * 60 * 1000); // 每小时检查一次
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.listeners.clear();
  }
}

// 默认实例
export const configService = new ConfigService();

// 便捷的配置访问函数
export const config = {
  get: () => configService.getConfig(),
  player: {
    get: () => configService.getPlayerSettings(),
    update: (settings: Partial<PlayerSettings>) => configService.updatePlayerSettings(settings),
  },
  ui: {
    get: () => configService.getUISettings(),
    update: (settings: Partial<UISettings>) => configService.updateUISettings(settings),
  },
  network: {
    get: () => configService.getNetworkSettings(),
    update: (settings: Partial<NetworkSettings>) => configService.updateNetworkSettings(settings),
  },
  privacy: {
    get: () => configService.getPrivacySettings(),
    update: (settings: Partial<PrivacySettings>) => configService.updatePrivacySettings(settings),
  },
  experimental: {
    get: () => configService.getExperimentalSettings(),
    update: (settings: Partial<ExperimentalSettings>) => configService.updateExperimentalSettings(settings),
  },
  reset: () => configService.resetConfig(),
  export: () => configService.exportConfig(),
  import: (configJson: string) => configService.importConfig(configJson),
  addListener: (section: keyof AppConfig, callback: (value: any) => void) => 
    configService.addListener(section, callback),
};

export default ConfigService;