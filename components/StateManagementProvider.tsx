/**
 * 状态管理提供者组件
 * 统一管理所有状态 store，提供全局状态访问
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { 
  useVideoStore, 
  usePlaybackStore, 
  useSettingsStore,
  type VideoStore,
  type PlaybackStore,
  type SettingsStore
} from '@/src/stores';

// 状态管理上下文
interface StateManagementContextType {
  // Store 实例
  videoStore: VideoStore;
  playbackStore: PlaybackStore;
  settingsStore: SettingsStore;
  
  // 便捷的状态访问
  isLoading: boolean;
  error: string | null;
  
  // 全局操作
  resetAllStores: () => void;
  exportAllState: () => string;
  importAllState: (stateJson: string) => boolean;
}

const StateManagementContext = createContext<StateManagementContextType | undefined>(undefined);

// 状态管理提供者组件
interface StateManagementProviderProps {
  children: ReactNode;
}

export const StateManagementProvider: React.FC<StateManagementProviderProps> = ({ 
  children 
}) => {
  // 获取所有 store 实例
  const videoStore = useVideoStore();
  const playbackStore = usePlaybackStore();
  const settingsStore = useSettingsStore();
  
  // 计算全局状态
  const isLoading = videoStore.isLoading || playbackStore.isLoading || settingsStore.isLoading;
  const error = videoStore.error || playbackStore.error || settingsStore.error;
  
  // 重置所有 store
  const resetAllStores = () => {
    videoStore.reset();
    playbackStore.resetPlaybackState();
    settingsStore.resetSettings();
  };
  
  // 导出所有状态
  const exportAllState = (): string => {
    const state = {
      video: videoStore.getState(),
      playback: playbackStore.getState(),
      settings: settingsStore.getState(),
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    
    return JSON.stringify(state, null, 2);
  };
  
  // 导入所有状态
  const importAllState = (stateJson: string): boolean => {
    try {
      const importedState = JSON.parse(stateJson);
      
      // 验证导入的数据格式
      if (!importedState.version || !importedState.video || !importedState.playback || !importedState.settings) {
        throw new Error('Invalid state format');
      }
      
      // 恢复各个 store 的状态
      if (importedState.video) {
        videoStore.setState(importedState.video);
      }
      
      if (importedState.playback) {
        playbackStore.setState(importedState.playback);
      }
      
      if (importedState.settings) {
        settingsStore.setState(importedState.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import state:', error);
      return false;
    }
  };
  
  const contextValue: StateManagementContextType = {
    videoStore,
    playbackStore,
    settingsStore,
    isLoading,
    error,
    resetAllStores,
    exportAllState,
    importAllState,
  };
  
  return (
    <StateManagementContext.Provider value={contextValue}>
      {children}
    </StateManagementContext.Provider>
  );
};

// 使用状态管理的 Hook
export const useStateManagement = (): StateManagementContextType => {
  const context = useContext(StateManagementContext);
  
  if (context === undefined) {
    throw new Error('useStateManagement must be used within a StateManagementProvider');
  }
  
  return context;
};

// 便捷的 Hook
export const useVideoState = () => {
  const { videoStore } = useStateManagement();
  return videoStore;
};

export const usePlaybackState = () => {
  const { playbackStore } = useStateManagement();
  return playbackStore;
};

export const useSettingsState = () => {
  const { settingsStore } = useStateManagement();
  return settingsStore;
};

export const useGlobalState = () => {
  const { isLoading, error, resetAllStores, exportAllState, importAllState } = useStateManagement();
  return {
    isLoading,
    error,
    resetAllStores,
    exportAllState,
    importAllState,
  };
};

// 状态监听 Hook
export const useStateListener = (
  storeName: 'video' | 'playback' | 'settings',
  callback: (state: any, prevState: any) => void
) => {
  const { videoStore, playbackStore, settingsStore } = useStateManagement();
  
  React.useEffect(() => {
    let store: any;
    
    switch (storeName) {
      case 'video':
        store = videoStore;
        break;
      case 'playback':
        store = playbackStore;
        break;
      case 'settings':
        store = settingsStore;
        break;
      default:
        throw new Error(`Unknown store: ${storeName}`);
    }
    
    const unsubscribe = store.subscribe(callback);
    return unsubscribe;
  }, [storeName, videoStore, playbackStore, settingsStore, callback]);
};

// 状态选择器 Hook
export const useStateSelector = <T>(
  storeName: 'video' | 'playback' | 'settings',
  selector: (state: any) => T
): T => {
  const { videoStore, playbackStore, settingsStore } = useStateManagement();
  
  switch (storeName) {
    case 'video':
      return videoStore.select(selector);
    case 'playback':
      return playbackStore.select(selector);
    case 'settings':
      return settingsStore.select(selector);
    default:
      throw new Error(`Unknown store: ${storeName}`);
  }
};

// 状态同步 Hook
export const useStateSync = (
  sourceStore: 'video' | 'playback' | 'settings',
  targetStore: 'video' | 'playback' | 'settings',
  mapping: (sourceState: any) => Partial<any>
) => {
  const { videoStore, playbackStore, settingsStore } = useStateManagement();
  
  React.useEffect(() => {
    const getSourceStore = () => {
      switch (sourceStore) {
        case 'video': return videoStore;
        case 'playback': return playbackStore;
        case 'settings': return settingsStore;
        default: throw new Error(`Unknown source store: ${sourceStore}`);
      }
    };
    
    const getTargetStore = () => {
      switch (targetStore) {
        case 'video': return videoStore;
        case 'playback': return playbackStore;
        case 'settings': return settingsStore;
        default: throw new Error(`Unknown target store: ${targetStore}`);
      }
    };
    
    const source = getSourceStore();
    const target = getTargetStore();
    
    const unsubscribe = source.subscribe((sourceState, prevState) => {
      const targetUpdates = mapping(sourceState);
      if (Object.keys(targetUpdates).length > 0) {
        target.setState(targetUpdates);
      }
    });
    
    return unsubscribe;
  }, [sourceStore, targetStore, mapping, videoStore, playbackStore, settingsStore]);
};

// 默认导出提供者
export default StateManagementProvider;