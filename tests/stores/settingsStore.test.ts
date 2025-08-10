/**
 * 设置状态管理测试用例
 */

import { act, renderHook } from '@testing-library/react-native';
import { useSettingsStore, settingsSelectors, useSettingsSelector } from '@/stores/settingsStore';

describe('SettingsStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useSettingsStore.getState().resetSettings();
  });

  describe('初始状态', () => {
    it('应该具有正确的初始状态', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.theme).toBe('system');
      expect(result.current.language).toBe('zh-CN');
      expect(result.current.fontSize).toBe('medium');
      expect(result.current.defaultPlaybackSpeed).toBe(1.0);
      expect(result.current.defaultVolume).toBe(1.0);
      expect(result.current.defaultQuality).toBe('auto');
      expect(result.current.autoPlay).toBe(true);
      expect(result.current.autoNext).toBe(true);
      expect(result.current.maxCacheSize).toBe(1024);
      expect(result.current.cacheRetentionDays).toBe(30);
      expect(result.current.autoClearCache).toBe(true);
      expect(result.current.analyticsEnabled).toBe(false);
      expect(result.current.crashReportingEnabled).toBe(true);
      expect(result.current.debugMode).toBe(false);
      expect(result.current.logLevel).toBe('info');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('界面设置', () => {
    it('应该能够设置主题', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.theme).toBe('dark');
    });

    it('应该能够设置语言', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setLanguage('en-US');
      });
      
      expect(result.current.language).toBe('en-US');
    });

    it('应该能够设置字体大小', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setFontSize('large');
      });
      
      expect(result.current.fontSize).toBe('large');
    });
  });

  describe('播放设置', () => {
    it('应该能够设置默认播放速度', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDefaultPlaybackSpeed(1.5);
      });
      
      expect(result.current.defaultPlaybackSpeed).toBe(1.5);
    });

    it('应该能够限制播放速度在有效范围内', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDefaultPlaybackSpeed(0.1); // 低于最小值
      });
      
      expect(result.current.defaultPlaybackSpeed).toBe(0.25);
      
      act(() => {
        result.current.setDefaultPlaybackSpeed(5.0); // 超过最大值
      });
      
      expect(result.current.defaultPlaybackSpeed).toBe(4.0);
    });

    it('应该能够设置默认音量', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDefaultVolume(0.5);
      });
      
      expect(result.current.defaultVolume).toBe(0.5);
    });

    it('应该能够限制音量在有效范围内', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDefaultVolume(-0.5); // 负值
      });
      
      expect(result.current.defaultVolume).toBe(0);
      
      act(() => {
        result.current.setDefaultVolume(1.5); // 超过最大值
      });
      
      expect(result.current.defaultVolume).toBe(1.0);
    });

    it('应该能够设置默认质量', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDefaultQuality('high');
      });
      
      expect(result.current.defaultQuality).toBe('high');
    });

    it('应该能够设置自动播放', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setAutoPlay(false);
      });
      
      expect(result.current.autoPlay).toBe(false);
    });

    it('应该能够设置自动下一首', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setAutoNext(false);
      });
      
      expect(result.current.autoNext).toBe(false);
    });
  });

  describe('缓存设置', () => {
    it('应该能够设置最大缓存大小', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setMaxCacheSize(2048);
      });
      
      expect(result.current.maxCacheSize).toBe(2048);
    });

    it('应该能够限制缓存大小在有效范围内', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setMaxCacheSize(50); // 低于最小值
      });
      
      expect(result.current.maxCacheSize).toBe(100);
      
      act(() => {
        result.current.setMaxCacheSize(20000); // 超过最大值
      });
      
      expect(result.current.maxCacheSize).toBe(10240);
    });

    it('应该能够设置缓存保留天数', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setCacheRetentionDays(60);
      });
      
      expect(result.current.cacheRetentionDays).toBe(60);
    });

    it('应该能够限制缓存保留天数在有效范围内', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setCacheRetentionDays(0); // 低于最小值
      });
      
      expect(result.current.cacheRetentionDays).toBe(1);
      
      act(() => {
        result.current.setCacheRetentionDays(400); // 超过最大值
      });
      
      expect(result.current.cacheRetentionDays).toBe(365);
    });

    it('应该能够设置自动清理缓存', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setAutoClearCache(false);
      });
      
      expect(result.current.autoClearCache).toBe(false);
    });
  });

  describe('隐私设置', () => {
    it('应该能够启用分析', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setAnalyticsEnabled(true);
      });
      
      expect(result.current.analyticsEnabled).toBe(true);
    });

    it('应该能够启用崩溃报告', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setCrashReportingEnabled(false);
      });
      
      expect(result.current.crashReportingEnabled).toBe(false);
    });
  });

  describe('开发者设置', () => {
    it('应该能够启用调试模式', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDebugMode(true);
      });
      
      expect(result.current.debugMode).toBe(true);
      expect(result.current.logLevel).toBe('debug');
    });

    it('应该能够设置日志级别', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setLogLevel('warn');
      });
      
      expect(result.current.logLevel).toBe('warn');
    });
  });

  describe('批量更新', () => {
    it('应该能够批量更新设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.updateSettings({
          theme: 'dark',
          language: 'en-US',
          defaultPlaybackSpeed: 1.5,
        });
      });
      
      expect(result.current.theme).toBe('dark');
      expect(result.current.language).toBe('en-US');
      expect(result.current.defaultPlaybackSpeed).toBe(1.5);
    });

    it('应该在批量更新时验证数值', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.updateSettings({
          defaultPlaybackSpeed: 0.1, // 会被限制到最小值
          defaultVolume: 1.5, // 会被限制到最大值
        });
      });
      
      expect(result.current.defaultPlaybackSpeed).toBe(0.25);
      expect(result.current.defaultVolume).toBe(1.0);
    });
  });

  describe('设置重置', () => {
    it('应该能够重置所有设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setTheme('dark');
        result.current.setDefaultPlaybackSpeed(1.5);
        result.current.setDebugMode(true);
      });
      
      act(() => {
        result.current.resetSettings();
      });
      
      expect(result.current.theme).toBe('system');
      expect(result.current.defaultPlaybackSpeed).toBe(1.0);
      expect(result.current.debugMode).toBe(false);
    });

    it('应该能够重置界面设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setTheme('dark');
        result.current.setLanguage('en-US');
        result.current.setFontSize('large');
      });
      
      act(() => {
        result.current.resetUISettings();
      });
      
      expect(result.current.theme).toBe('system');
      expect(result.current.language).toBe('zh-CN');
      expect(result.current.fontSize).toBe('medium');
    });

    it('应该能够重置播放设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDefaultPlaybackSpeed(1.5);
        result.current.setDefaultVolume(0.5);
        result.current.setAutoPlay(false);
      });
      
      act(() => {
        result.current.resetPlaybackSettings();
      });
      
      expect(result.current.defaultPlaybackSpeed).toBe(1.0);
      expect(result.current.defaultVolume).toBe(1.0);
      expect(result.current.autoPlay).toBe(true);
    });

    it('应该能够重置缓存设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setMaxCacheSize(2048);
        result.current.setCacheRetentionDays(60);
        result.current.setAutoClearCache(false);
      });
      
      act(() => {
        result.current.resetCacheSettings();
      });
      
      expect(result.current.maxCacheSize).toBe(1024);
      expect(result.current.cacheRetentionDays).toBe(30);
      expect(result.current.autoClearCache).toBe(true);
    });

    it('应该能够重置隐私设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setAnalyticsEnabled(true);
        result.current.setCrashReportingEnabled(false);
      });
      
      act(() => {
        result.current.resetPrivacySettings();
      });
      
      expect(result.current.analyticsEnabled).toBe(false);
      expect(result.current.crashReportingEnabled).toBe(true);
    });

    it('应该能够重置开发者设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDebugMode(true);
        result.current.setLogLevel('debug');
      });
      
      act(() => {
        result.current.resetDeveloperSettings();
      });
      
      expect(result.current.debugMode).toBe(false);
      expect(result.current.logLevel).toBe('info');
    });
  });

  describe('导入导出', () => {
    it('应该能够导出设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setTheme('dark');
        result.current.setDefaultPlaybackSpeed(1.5);
      });
      
      const exported = result.current.exportSettings();
      
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe('1.0');
      expect(parsed.settings.theme).toBe('dark');
      expect(parsed.settings.defaultPlaybackSpeed).toBe(1.5);
    });

    it('应该能够导入设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      const settingsData = {
        version: '1.0',
        timestamp: '2024-01-01T00:00:00Z',
        settings: {
          theme: 'dark',
          language: 'en-US',
          defaultPlaybackSpeed: 1.5,
          defaultVolume: 0.8,
        },
      };
      
      const success = result.current.importSettings(JSON.stringify(settingsData));
      
      expect(success).toBe(true);
      expect(result.current.theme).toBe('dark');
      expect(result.current.language).toBe('en-US');
      expect(result.current.defaultPlaybackSpeed).toBe(1.5);
      expect(result.current.defaultVolume).toBe(0.8);
    });

    it('应该处理无效的导入数据', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      const success = result.current.importSettings('invalid json');
      
      expect(success).toBe(false);
      expect(result.current.error).toBe('导入设置失败：格式无效');
    });

    it('应该处理缺少版本信息的导入数据', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      const invalidData = {
        settings: {
          theme: 'dark',
        },
      };
      
      const success = result.current.importSettings(JSON.stringify(invalidData));
      
      expect(success).toBe(false);
      expect(result.current.error).toBe('导入设置失败：格式无效');
    });
  });

  describe('加载状态', () => {
    it('应该能够设置加载状态', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
    });

    it('应该能够设置错误', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setError('设置错误');
      });
      
      expect(result.current.error).toBe('设置错误');
    });

    it('应该能够清除错误', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setError('设置错误');
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('选择器', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setTheme('dark');
        result.current.setDefaultPlaybackSpeed(1.5);
        result.current.setDebugMode(true);
      });
    });

    it('应该能够获取主题', () => {
      const { result } = renderHook(() => useSettingsSelector(settingsSelectors.getTheme));
      
      expect(result.current).toBe('dark');
    });

    it('应该能够获取播放设置', () => {
      const { result } = renderHook(() => useSettingsSelector(settingsSelectors.getPlaybackSettings));
      
      expect(result.current.defaultPlaybackSpeed).toBe(1.5);
      expect(result.current.defaultVolume).toBe(1.0);
      expect(result.current.autoPlay).toBe(true);
    });

    it('应该能够获取开发者设置', () => {
      const { result } = renderHook(() => useSettingsSelector(settingsSelectors.getDeveloperSettings));
      
      expect(result.current.debugMode).toBe(true);
      expect(result.current.logLevel).toBe('debug');
    });

    it('应该能够获取界面设置', () => {
      const { result } = renderHook(() => useSettingsSelector(settingsSelectors.getUISettings));
      
      expect(result.current.theme).toBe('dark');
      expect(result.current.language).toBe('zh-CN');
      expect(result.current.fontSize).toBe('medium');
    });

    it('应该能够获取设置验证结果', () => {
      const { result } = renderHook(() => useSettingsSelector(settingsSelectors.getSettingsValidation));
      
      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toHaveLength(0);
    });

    it('应该能够检测无效设置', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setDefaultPlaybackSpeed(0.1); // 会被限制到最小值
      });
      
      const { result: validationResult } = renderHook(() => useSettingsSelector(settingsSelectors.getSettingsValidation));
      
      expect(validationResult.current.isValid).toBe(true);
      expect(validationResult.current.errors).toHaveLength(0);
    });

    it('应该能够获取设置统计信息', () => {
      const { result } = renderHook(() => useSettingsSelector(settingsSelectors.getSettingsStats));
      
      expect(result.current.totalSettings).toBeGreaterThan(0);
      expect(result.current.cacheSizeMB).toBe(1024);
      expect(result.current.cacheRetentionDays).toBe(30);
      expect(result.current.isDebugMode).toBe(true);
      expect(result.current.analyticsEnabled).toBe(false);
    });
  });

  describe('选项生成', () => {
    it('应该能够生成主题选项', () => {
      const options = settingsSelectors.getThemeOptions();
      
      expect(options).toHaveLength(3);
      expect(options[0].value).toBe('light');
      expect(options[1].value).toBe('dark');
      expect(options[2].value).toBe('system');
    });

    it('应该能够生成字体大小选项', () => {
      const options = settingsSelectors.getFontSizeOptions();
      
      expect(options).toHaveLength(3);
      expect(options[0].value).toBe('small');
      expect(options[1].value).toBe('medium');
      expect(options[2].value).toBe('large');
    });

    it('应该能够生成播放速度选项', () => {
      const options = settingsSelectors.getPlaybackSpeedOptions();
      
      expect(options).toHaveLength(8);
      expect(options[0].value).toBe(0.25);
      expect(options[options.length - 1].value).toBe(2.0);
    });

    it('应该能够生成质量选项', () => {
      const options = settingsSelectors.getQualityOptions();
      
      expect(options).toHaveLength(4);
      expect(options[0].value).toBe('auto');
      expect(options[1].value).toBe('low');
      expect(options[2].value).toBe('medium');
      expect(options[3].value).toBe('high');
    });

    it('应该能够生成缓存大小选项', () => {
      const options = settingsSelectors.getCacheSizeOptions();
      
      expect(options).toHaveLength(6);
      expect(options[0].value).toBe(100);
      expect(options[options.length - 1].value).toBe(10240);
    });

    it('应该能够生成日志级别选项', () => {
      const options = settingsSelectors.getLogLevelOptions();
      
      expect(options).toHaveLength(4);
      expect(options[0].value).toBe('debug');
      expect(options[1].value).toBe('info');
      expect(options[2].value).toBe('warn');
      expect(options[3].value).toBe('error');
    });
  });
});