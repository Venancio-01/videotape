import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventBus, useEventEmitter, AppEvents } from '../utils/eventBus';
import { Video as VideoType } from '../types';

/**
 * 事件总线演示组件
 */
export const EventBusDemo: React.FC = () => {
  const [events, setEvents] = useState<Array<{ type: string; data: any; timestamp: Date }>>([]);
  const [eventCount, setEventCount] = useState(0);
  const emit = useEventEmitter();

  // 监听所有事件
  useEventBus('*', (data) => {
    setEvents(prev => [
      { type: '*', data, timestamp: new Date() },
      ...prev.slice(0, 19) // 只保留最近20个事件
    ]);
    setEventCount(prev => prev + 1);
  });

  // 监听视频相关事件
  useEventBus(AppEvents.VIDEO_ADDED, (data) => {
    console.log('Video added:', data);
  });

  useEventBus(AppEvents.VIDEO_PLAYED, (data) => {
    console.log('Video played:', data);
  });

  useEventBus(AppEvents.ERROR_OCCURRED, (data) => {
    Alert.alert('错误', data.message || '发生错误');
  });

  // 触发示例事件
  const handleEmitVideoAdded = () => {
    emit.emit(AppEvents.VIDEO_ADDED, {
      video: {
        id: `video_${Date.now()}`,
        title: '示例视频',
        duration: 120,
      },
      timestamp: new Date(),
    });
  };

  const handleEmitVideoPlayed = () => {
    emit.emit(AppEvents.VIDEO_PLAYED, {
      videoId: `video_${Date.now()}`,
      position: 30,
      timestamp: new Date(),
    });
  };

  const handleEmitError = () => {
    emit.emit(AppEvents.ERROR_OCCURRED, {
      message: '这是一个示例错误',
      code: 'EXAMPLE_ERROR',
      timestamp: new Date(),
    });
  };

  const handleEmitCustomEvent = () => {
    emit.emit('custom-event', {
      message: '自定义事件',
      data: { key: 'value' },
      timestamp: new Date(),
    });
  };

  const handleClearEvents = () => {
    setEvents([]);
    setEventCount(0);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      backgroundColor: '#007AFF',
      padding: 16,
      paddingTop: 60,
      paddingBottom: 20,
    },
    title: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    stats: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-around',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#666',
    },
    actions: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
      color: '#333',
    },
    actionButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    actionButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
    },
    actionButtonSecondary: {
      backgroundColor: '#f0f0f0',
    },
    actionButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    actionButtonTextSecondary: {
      color: '#333',
    },
    events: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    eventList: {
      flex: 1,
    },
    eventItem: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    eventItemLast: {
      borderBottomWidth: 0,
    },
    eventType: {
      fontSize: 12,
      fontWeight: '600',
      color: '#007AFF',
      marginBottom: 2,
    },
    eventData: {
      fontSize: 11,
      color: '#666',
      marginBottom: 2,
    },
    eventTime: {
      fontSize: 10,
      color: '#999',
    },
    clearButton: {
      backgroundColor: '#ff4444',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    clearButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
  });

  const renderEventItem = ({ item, index }: { item: any; index: number }) => (
    <View
      key={index}
      style={[
        styles.eventItem,
        index === events.length - 1 && styles.eventItemLast,
      ]}
    >
      <Text style={styles.eventType}>{item.type}</Text>
      <Text style={styles.eventData}>
        {JSON.stringify(item.data, null, 2)}
      </Text>
      <Text style={styles.eventTime}>
        {item.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>事件总线演示</Text>
        <Text style={styles.subtitle}>展示事件总线的使用方法</Text>
      </View>

      <View style={styles.content}>
        {/* 统计信息 */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{eventCount}</Text>
            <Text style={styles.statLabel}>总事件数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{events.length}</Text>
            <Text style={styles.statLabel}>显示事件</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>监听器</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Text style={styles.sectionTitle}>触发事件</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEmitVideoAdded}
            >
              <Text style={styles.actionButtonText}>视频添加</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleEmitVideoPlayed}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                视频播放
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleEmitCustomEvent}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                自定义事件
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleEmitError}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                触发错误
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearEvents}
          >
            <Text style={styles.clearButtonText}>清空事件</Text>
          </TouchableOpacity>
        </View>

        {/* 事件列表 */}
        <View style={styles.events}>
          <Text style={styles.sectionTitle}>事件日志</Text>
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#999', fontSize: 14 }}>
                  暂无事件记录
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </View>
  );
};