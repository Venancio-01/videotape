import { useEffect, useRef } from 'react';

// 事件类型定义
export type AppEventType =
  | 'video-added'
  | 'video-deleted'
  | 'video-updated'
  | 'video-played'
  | 'video-paused'
  | 'video-ended'
  | 'playlist-created'
  | 'playlist-updated'
  | 'playlist-deleted'
  | 'folder-created'
  | 'folder-updated'
  | 'folder-deleted'
  | 'settings-changed'
  | 'theme-changed'
  | 'network-status-changed'
  | 'error-occurred'
  | 'sync-started'
  | 'sync-completed'
  | 'sync-failed';

// 事件数据类型
export interface AppEventData {
  [key: string]: any;
}

// 事件监听器类型
export type EventListener = (data: AppEventData) => void;

/**
 * 事件总线类
 */
class EventBus {
  private listeners: Map<AppEventType, EventListener[]> = new Map();
  private onceListeners: Map<AppEventType, EventListener[]> = new Map();

  /**
   * 添加事件监听器
   */
  on(event: AppEventType, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  /**
   * 添加一次性事件监听器
   */
  once(event: AppEventType, listener: EventListener): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, []);
    }
    this.onceListeners.get(event)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  off(event: AppEventType, listener: EventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      const index = onceListeners.indexOf(listener);
      if (index > -1) {
        onceListeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event: AppEventType, data: AppEventData = {}): void {
    // 执行普通监听器
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }

    // 执行一次性监听器
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      onceListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in once event listener for ${event}:`, error);
        }
      });
      // 清理一次性监听器
      this.onceListeners.delete(event);
    }
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: AppEventType): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: AppEventType): number {
    const normalCount = this.listeners.get(event)?.length || 0;
    const onceCount = this.onceListeners.get(event)?.length || 0;
    return normalCount + onceCount;
  }

  /**
   * 获取所有事件类型
   */
  eventNames(): AppEventType[] {
    const events = new Set<AppEventType>();
    this.listeners.forEach((_, event) => events.add(event));
    this.onceListeners.forEach((_, event) => events.add(event));
    return Array.from(events);
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus();

/**
 * React Hook 用于事件监听
 */
export function useEventBus<T extends AppEventData>(
  event: AppEventType,
  callback: (data: T) => void,
  deps: any[] = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const wrappedCallback = (data: AppEventData) => {
      callbackRef.current(data as T);
    };

    eventBus.on(event, wrappedCallback);

    return () => {
      eventBus.off(event, wrappedCallback);
    };
  }, [event, ...deps]);
}

/**
 * React Hook 用于一次性事件监听
 */
export function useEventBusOnce<T extends AppEventData>(
  event: AppEventType,
  callback: (data: T) => void,
  deps: any[] = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const wrappedCallback = (data: AppEventData) => {
      callbackRef.current(data as T);
    };

    eventBus.once(event, wrappedCallback);

    return () => {
      eventBus.off(event, wrappedCallback);
    };
  }, [event, ...deps]);
}

/**
 * 事件发射器 Hook
 */
export function useEventEmitter() {
  return {
    emit: (event: AppEventType, data: AppEventData = {}) => {
      eventBus.emit(event, data);
    },
    on: (event: AppEventType, listener: EventListener) => {
      eventBus.on(event, listener);
    },
    off: (event: AppEventType, listener: EventListener) => {
      eventBus.off(event, listener);
    },
    once: (event: AppEventType, listener: EventListener) => {
      eventBus.once(event, listener);
    },
  };
}

// 导出事件类型常量
export const AppEvents = {
  VIDEO_ADDED: 'video-added' as const,
  VIDEO_DELETED: 'video-deleted' as const,
  VIDEO_UPDATED: 'video-updated' as const,
  VIDEO_PLAYED: 'video-played' as const,
  VIDEO_PAUSED: 'video-paused' as const,
  VIDEO_ENDED: 'video-ended' as const,
  PLAYLIST_CREATED: 'playlist-created' as const,
  PLAYLIST_UPDATED: 'playlist-updated' as const,
  PLAYLIST_DELETED: 'playlist-deleted' as const,
  FOLDER_CREATED: 'folder-created' as const,
  FOLDER_UPDATED: 'folder-updated' as const,
  FOLDER_DELETED: 'folder-deleted' as const,
  SETTINGS_CHANGED: 'settings-changed' as const,
  THEME_CHANGED: 'theme-changed' as const,
  NETWORK_STATUS_CHANGED: 'network-status-changed' as const,
  ERROR_OCCURRED: 'error-occurred' as const,
  SYNC_STARTED: 'sync-started' as const,
  SYNC_COMPLETED: 'sync-completed' as const,
  SYNC_FAILED: 'sync-failed' as const,
} as const;
