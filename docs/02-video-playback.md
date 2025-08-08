# 视频播放模块开发文档

## 1. 模块概述

### 1.1 功能描述
视频播放模块提供完整的视频播放和控制功能，是用户观看视频的核心模块。该模块支持多种视频格式，提供丰富的播放控制选项，并针对移动端进行了优化。

### 1.2 技术栈
- **视频播放**: react-native-video
- **状态管理**: Zustand
- **手势控制**: React Native Gesture Handler
- **动画效果**: React Native Reanimated
- **UI组件**: React Native + Nativewind

### 1.3 依赖关系
- 依赖视频管理模块获取视频数据
- 依赖状态管理模块同步播放状态
- 依赖存储管理模块保存播放进度

## 2. 功能需求

### 2.1 基础播放功能

#### 2.1.1 视频播放器组件
```typescript
// src/components/video/VideoPlayer.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Video from 'react-native-video';
import { usePlaybackStore } from '../../stores/playback.store';
import { VideoControls } from './VideoControls';
import { Video } from '../../database/schema';

interface VideoPlayerProps {
  video: Video;
  onPlaybackEnd?: () => void;
  onPlaybackError?: (error: any) => void;
  autoPlay?: boolean;
  showControls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onPlaybackEnd,
  onPlaybackError,
  autoPlay = true,
  showControls = true
}) => {
  const videoRef = useRef<Video>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout>();
  
  const {
    currentVideoId,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    quality,
    isFullscreen,
    isMuted,
    subtitles,
    setCurrentVideoId,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setPlaybackRate,
    setIsFullscreen,
    setIsMuted,
    setSubtitles,
    togglePlayPause,
    toggleMute,
    toggleFullscreen,
    seekTo
  } = usePlaybackStore();

  // 初始化播放状态
  useEffect(() => {
    if (currentVideoId !== video.id) {
      setCurrentVideoId(video.id);
      setCurrentTime(video.playbackProgress || 0);
      setIsPlaying(autoPlay);
    }
  }, [video.id, currentVideoId, autoPlay]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // 显示控制条
  const showControls = useCallback(() => {
    setIsControlsVisible(true);
    
    // 清除之前的定时器
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    // 3秒后隐藏控制条
    const timeout = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  // 隐藏控制条
  const hideControls = useCallback(() => {
    setIsControlsVisible(false);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
  }, [controlsTimeout]);

  // 处理视频加载
  const handleLoad = useCallback((payload: any) => {
    setDuration(payload.duration);
    setIsBuffering(false);
  }, [setDuration]);

  // 处理播放进度
  const handleProgress = useCallback((payload: any) => {
    setCurrentTime(payload.currentTime);
  }, [setCurrentTime]);

  // 处理播放结束
  const handleEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    onPlaybackEnd?.();
  }, [setIsPlaying, setCurrentTime, onPlaybackEnd]);

  // 处理播放错误
  const handleError = useCallback((error: any) => {
    console.error('Video playback error:', error);
    setIsPlaying(false);
    onPlaybackError?.(error);
  }, [setIsPlaying, onPlaybackError]);

  // 处理缓冲
  const handleBuffer = useCallback((buffer: { isBuffering: boolean }) => {
    setIsBuffering(buffer.isBuffering);
  }, []);

  // 处理点击屏幕
  const handleScreenPress = useCallback(() => {
    if (isControlsVisible) {
      hideControls();
    } else {
      showControls();
    }
  }, [isControlsVisible, showControls, hideControls]);

  // 处理播放/暂停
  const handlePlayPause = useCallback(() => {
    togglePlayPause();
    showControls();
  }, [togglePlayPause, showControls]);

  // 处理进度条拖动
  const handleSeek = useCallback((time: number) => {
    seekTo(time);
    showControls();
  }, [seekTo, showControls]);

  // 处理音量调节
  const handleVolumeChange = useCallback((volume: number) => {
    setVolume(volume);
    showControls();
  }, [setVolume, showControls]);

  // 处理倍速调节
  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    showControls();
  }, [setPlaybackRate, showControls]);

  // 处理全屏切换
  const handleFullscreenToggle = useCallback(() => {
    toggleFullscreen();
    showControls();
  }, [toggleFullscreen, showControls]);

  // 处理静音切换
  const handleMuteToggle = useCallback(() => {
    toggleMute();
    showControls();
  }, [toggleMute, showControls]);

  return (
    <View className="relative w-full h-full bg-black">
      {/* 视频播放器 */}
      <Video
        ref={videoRef}
        source={{ uri: video.filePath }}
        style={styles.video}
        resizeMode="contain"
        repeat={false}
        paused={!isPlaying}
        muted={isMuted}
        volume={volume}
        rate={playbackRate}
        selectedVideoTrack={{
          type: 'resolution',
          value: quality
        }}
        selectedTextTrack={subtitles.enabled ? {
          type: 'index',
          value: subtitles.tracks.findIndex(track => track.language === subtitles.language)
        } : undefined}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onEnd={handleEnd}
        onError={handleError}
        onBuffer={handleBuffer}
        onPlaybackRateChange={(payload) => setPlaybackRate(payload.playbackRate)}
        onAudioBecomingNoisy={() => setIsPlaying(false)}
        onAudioFocusChanged={(hasFocus) => setIsPlaying(hasFocus)}
      />

      {/* 缓冲指示器 */}
      {isBuffering && (
        <View className="absolute inset-0 items-center justify-center bg-black bg-opacity-50">
          <View className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </View>
      )}

      {/* 点击区域 */}
      <TouchableOpacity
        className="absolute inset-0"
        activeOpacity={1}
        onPress={handleScreenPress}
      />

      {/* 控制条 */}
      {showControls && isControlsVisible && (
        <VideoControls
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          volume={volume}
          playbackRate={playbackRate}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onPlaybackRateChange={handlePlaybackRateChange}
          onFullscreenToggle={handleFullscreenToggle}
          onMuteToggle={handleMuteToggle}
          onHide={hideControls}
        />
      )}

      {/* 顶部信息栏 */}
      {isControlsVisible && (
        <View className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black to-transparent">
          <Text className="text-white font-semibold text-lg">
            {video.title}
          </Text>
          <Text className="text-white text-opacity-70 text-sm">
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
            {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
  },
});
```

#### 2.1.2 播放控制组件
```typescript
// src/components/video/VideoControls.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Slider, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onFullscreenToggle: () => void;
  onMuteToggle: () => void;
  onHide: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  currentTime,
  duration,
  isPlaying,
  volume,
  playbackRate,
  isMuted,
  isFullscreen,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onFullscreenToggle,
  onMuteToggle,
  onHide
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaybackRateMenu, setShowPlaybackRateMenu] = useState(false);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 处理进度条变化
  const handleProgressChange = useCallback((value: number) => {
    onSeek(value);
  }, [onSeek]);

  // 处理音量变化
  const handleVolumeChange = useCallback((value: number) => {
    onVolumeChange(value);
  }, [onVolumeChange]);

  // 播放速度选项
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
      {/* 进度条 */}
      <View className="mb-4">
        <Slider
          value={currentTime}
          minimumValue={0}
          maximumValue={duration}
          onValueChange={handleProgressChange}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#4B5563"
          thumbStyle={styles.sliderThumb}
          style={styles.slider}
        />
        <View className="flex-row justify-between mt-1">
          <Text className="text-white text-xs">
            {formatTime(currentTime)}
          </Text>
          <Text className="text-white text-xs">
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* 控制按钮 */}
      <View className="flex-row items-center justify-between">
        {/* 左侧控制 */}
        <View className="flex-row items-center space-x-4">
          {/* 播放/暂停 */}
          <TouchableOpacity onPress={onPlayPause} className="p-2">
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="white"
            />
          </TouchableOpacity>

          {/* 音量控制 */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                setShowVolumeSlider(!showVolumeSlider);
                setShowPlaybackRateMenu(false);
              }}
              className="p-2"
            >
              <Ionicons
                name={isMuted ? 'volume-mute' : volume > 0.5 ? 'volume-high' : 'volume-low'}
                size={20}
                color="white"
              />
            </TouchableOpacity>
            
            {showVolumeSlider && (
              <View className="w-20 ml-2">
                <Slider
                  value={isMuted ? 0 : volume}
                  minimumValue={0}
                  maximumValue={1}
                  onValueChange={handleVolumeChange}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor="#4B5563"
                  thumbStyle={styles.smallSliderThumb}
                  style={styles.smallSlider}
                />
              </View>
            )}
          </View>

          {/* 播放速度 */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                setShowPlaybackRateMenu(!showPlaybackRateMenu);
                setShowVolumeSlider(false);
              }}
              className="p-2"
            >
              <Text className="text-white text-sm">
                {playbackRate}x
              </Text>
            </TouchableOpacity>
            
            {showPlaybackRateMenu && (
              <View className="absolute bottom-12 left-0 bg-black bg-opacity-80 rounded-lg p-2">
                {playbackRates.map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    onPress={() => {
                      onPlaybackRateChange(rate);
                      setShowPlaybackRateMenu(false);
                    }}
                    className="px-3 py-1"
                  >
                    <Text className={`text-sm ${rate === playbackRate ? 'text-blue-400' : 'text-white'}`}>
                      {rate}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 右侧控制 */}
        <View className="flex-row items-center space-x-4">
          {/* 静音 */}
          <TouchableOpacity onPress={onMuteToggle} className="p-2">
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-up'}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          {/* 全屏 */}
          <TouchableOpacity onPress={onFullscreenToggle} className="p-2">
            <Ionicons
              name={isFullscreen ? 'contract' : 'expand'}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slider: {
    width: '100%',
    height: 4,
  },
  sliderThumb: {
    width: 12,
    height: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  smallSlider: {
    width: '100%',
    height: 3,
  },
  smallSliderThumb: {
    width: 8,
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
});
```

### 2.2 高级播放功能

#### 2.2.1 播放列表管理
```typescript
// src/services/video/playlist.service.ts
import { db } from '../../database/schema';

export interface PlaylistItem {
  id: string;
  videoId: string;
  order: number;
  addedAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  currentVideoIndex: number;
  isPlaying: boolean;
  repeatMode: 'off' | 'one' | 'all';
  shuffleMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PlaylistService {
  // 创建播放列表
  async createPlaylist(name: string, description?: string): Promise<string> {
    const playlistId = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const playlist: Playlist = {
      id: playlistId,
      name,
      description,
      videoIds: [],
      currentVideoIndex: 0,
      isPlaying: false,
      repeatMode: 'off',
      shuffleMode: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.playlists.add(playlist);
    return playlistId;
  }

  // 添加视频到播放列表
  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        throw new Error('播放列表不存在');
      }

      // 检查视频是否已存在
      if (playlist.videoIds.includes(videoId)) {
        return false;
      }

      const updatedPlaylist = {
        ...playlist,
        videoIds: [...playlist.videoIds, videoId],
        updatedAt: new Date()
      };

      await db.playlists.update(playlistId, updatedPlaylist);
      return true;
    } catch (error) {
      console.error('添加视频到播放列表失败:', error);
      return false;
    }
  }

  // 从播放列表移除视频
  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        throw new Error('播放列表不存在');
      }

      const updatedPlaylist = {
        ...playlist,
        videoIds: playlist.videoIds.filter(id => id !== videoId),
        updatedAt: new Date()
      };

      // 调整当前播放索引
      if (updatedPlaylist.currentVideoIndex >= updatedPlaylist.videoIds.length) {
        updatedPlaylist.currentVideoIndex = Math.max(0, updatedPlaylist.videoIds.length - 1);
      }

      await db.playlists.update(playlistId, updatedPlaylist);
      return true;
    } catch (error) {
      console.error('从播放列表移除视频失败:', error);
      return false;
    }
  }

  // 播放下一个视频
  async playNext(playlistId: string): Promise<string | null> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist || playlist.videoIds.length === 0) {
        return null;
      }

      let nextIndex = playlist.currentVideoIndex + 1;

      // 处理重复模式
      if (nextIndex >= playlist.videoIds.length) {
        if (playlist.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return null; // 播放结束
        }
      }

      // 更新播放列表状态
      await db.playlists.update(playlistId, {
        currentVideoIndex: nextIndex,
        isPlaying: true,
        updatedAt: new Date()
      });

      return playlist.videoIds[nextIndex];
    } catch (error) {
      console.error('播放下一个视频失败:', error);
      return null;
    }
  }

  // 播放上一个视频
  async playPrevious(playlistId: string): Promise<string | null> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist || playlist.videoIds.length === 0) {
        return null;
      }

      let prevIndex = playlist.currentVideoIndex - 1;

      // 处理边界情况
      if (prevIndex < 0) {
        if (playlist.repeatMode === 'all') {
          prevIndex = playlist.videoIds.length - 1;
        } else {
          prevIndex = 0;
        }
      }

      // 更新播放列表状态
      await db.playlists.update(playlistId, {
        currentVideoIndex: prevIndex,
        isPlaying: true,
        updatedAt: new Date()
      });

      return playlist.videoIds[prevIndex];
    } catch (error) {
      console.error('播放上一个视频失败:', error);
      return null;
    }
  }

  // 设置播放模式
  async setRepeatMode(playlistId: string, mode: 'off' | 'one' | 'all'): Promise<boolean> {
    try {
      await db.playlists.update(playlistId, {
        repeatMode: mode,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('设置播放模式失败:', error);
      return false;
    }
  }

  // 设置随机播放
  async setShuffleMode(playlistId: string, shuffle: boolean): Promise<boolean> {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        return false;
      }

      let videoIds = [...playlist.videoIds];
      
      // 如果开启随机播放，打乱顺序
      if (shuffle) {
        for (let i = videoIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [videoIds[i], videoIds[j]] = [videoIds[j], videoIds[i]];
        }
      }

      await db.playlists.update(playlistId, {
        shuffleMode: shuffle,
        videoIds,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('设置随机播放失败:', error);
      return false;
    }
  }

  // 获取播放列表
  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    try {
      return await db.playlists.get(playlistId);
    } catch (error) {
      console.error('获取播放列表失败:', error);
      return null;
    }
  }

  // 获取所有播放列表
  async getAllPlaylists(): Promise<Playlist[]> {
    try {
      return await db.playlists.toArray();
    } catch (error) {
      console.error('获取所有播放列表失败:', error);
      return [];
    }
  }

  // 删除播放列表
  async deletePlaylist(playlistId: string): Promise<boolean> {
    try {
      await db.playlists.delete(playlistId);
      return true;
    } catch (error) {
      console.error('删除播放列表失败:', error);
      return false;
    }
  }
}
```

#### 2.2.2 字幕支持
```typescript
// src/services/video/subtitle.service.ts
import * as FileSystem from 'expo-file-system';
import { SubtitleTrack } from '../types/video';

export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
  index: number;
}

export class SubtitleService {
  private subtitleDirectory = `${FileSystem.documentDirectory}subtitles/`;

  constructor() {
    this.initializeDirectory();
  }

  // 初始化字幕目录
  private async initializeDirectory(): Promise<void> {
    await FileSystem.makeDirectoryAsync(this.subtitleDirectory, { intermediates: true });
  }

  // 解析字幕文件
  async parseSubtitleFile(filePath: string, format: 'srt' | 'vtt' = 'srt'): Promise<SubtitleCue[]> {
    try {
      const content = await FileSystem.readAsStringAsync(filePath);
      
      switch (format) {
        case 'srt':
          return this.parseSRT(content);
        case 'vtt':
          return this.parseVTT(content);
        default:
          throw new Error('不支持的字幕格式');
      }
    } catch (error) {
      console.error('解析字幕文件失败:', error);
      return [];
    }
  }

  // 解析SRT格式
  private parseSRT(content: string): SubtitleCue[] {
    const lines = content.split('\n');
    const cues: SubtitleCue[] = [];
    let currentCue: Partial<SubtitleCue> = {};
    let cueIndex = 0;
    let textLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // 空行，可能是一个字幕块的结束
        if (currentCue.startTime !== undefined && currentCue.endTime !== undefined) {
          cues.push({
            startTime: currentCue.startTime!,
            endTime: currentCue.endTime!,
            text: textLines.join('\n'),
            index: cueIndex++
          });
          currentCue = {};
          textLines = [];
        }
        continue;
      }

      // 解析时间轴
      if (line.includes('-->')) {
        const [startTime, endTime] = line.split('-->').map(time => this.parseTime(time.trim()));
        currentCue.startTime = startTime;
        currentCue.endTime = endTime;
        continue;
      }

      // 字幕文本
      if (currentCue.startTime !== undefined) {
        textLines.push(line);
      }
    }

    // 处理最后一个字幕块
    if (currentCue.startTime !== undefined && currentCue.endTime !== undefined) {
      cues.push({
        startTime: currentCue.startTime!,
        endTime: currentCue.endTime!,
        text: textLines.join('\n'),
        index: cueIndex++
      });
    }

    return cues;
  }

  // 解析VTT格式
  private parseVTT(content: string): SubtitleCue[] {
    // 简化的VTT解析器
    const lines = content.split('\n');
    const cues: SubtitleCue[] = [];
    let currentCue: Partial<SubtitleCue> = {};
    let cueIndex = 0;
    let textLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过WEBVTT头部
      if (line === 'WEBVTT') {
        continue;
      }

      if (!line) {
        // 空行，可能是一个字幕块的结束
        if (currentCue.startTime !== undefined && currentCue.endTime !== undefined) {
          cues.push({
            startTime: currentCue.startTime!,
            endTime: currentCue.endTime!,
            text: textLines.join('\n'),
            index: cueIndex++
          });
          currentCue = {};
          textLines = [];
        }
        continue;
      }

      // 解析时间轴
      if (line.includes('-->')) {
        const [startTime, endTime] = line.split('-->').map(time => this.parseTime(time.trim()));
        currentCue.startTime = startTime;
        currentCue.endTime = endTime;
        continue;
      }

      // 字幕文本
      if (currentCue.startTime !== undefined) {
        textLines.push(line);
      }
    }

    // 处理最后一个字幕块
    if (currentCue.startTime !== undefined && currentCue.endTime !== undefined) {
      cues.push({
        startTime: currentCue.startTime!,
        endTime: currentCue.endTime!,
        text: textLines.join('\n'),
        index: cueIndex++
      });
    }

    return cues;
  }

  // 解析时间字符串
  private parseTime(timeString: string): number {
    const timeMatch = timeString.match(/(\d+):(\d+):(\d+)[.,](\d+)/);
    if (!timeMatch) {
      return 0;
    }

    const [, hours, minutes, seconds, milliseconds] = timeMatch;
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      parseInt(milliseconds) / 1000
    );
  }

  // 获取当前时间的字幕
  getCurrentSubtitle(cues: SubtitleCue[], currentTime: number): SubtitleCue | null {
    return cues.find(cue => 
      currentTime >= cue.startTime && currentTime <= cue.endTime
    ) || null;
  }

  // 下载字幕文件
  async downloadSubtitle(url: string, videoId: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('下载失败');
      }

      const content = await response.text();
      const fileName = `subtitle_${videoId}_${Date.now()}.srt`;
      const filePath = `${this.subtitleDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, content);
      return filePath;
    } catch (error) {
      console.error('下载字幕失败:', error);
      return null;
    }
  }

  // 获取视频的字幕文件
  async getVideoSubtitles(videoId: string): Promise<SubtitleTrack[]> {
    try {
      // 这里可以扫描视频文件同目录下的字幕文件
      // 或者从数据库获取字幕信息
      return [];
    } catch (error) {
      console.error('获取视频字幕失败:', error);
      return [];
    }
  }
}
```

### 2.3 手势控制

#### 2.3.1 手势控制组件
```typescript
// src/components/video/VideoGestureControls.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import { usePlaybackStore } from '../../stores/playback.store';

interface VideoGestureControlsProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
}

export const VideoGestureControls: React.FC<VideoGestureControlsProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress,
  children
}) => {
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  
  const volumeAnim = React.useRef(new Animated.Value(volume)).current;
  const brightnessAnim = React.useRef(new Animated.Value(brightness)).current;

  const {
    setVolume,
    seekTo,
    currentTime,
    duration,
    togglePlayPause
  } = usePlaybackStore();

  // 创建手势响应器
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        
        onPanResponderGrant: (evt, gestureState) => {
          // 记录初始状态
          gestureState.startVolume = volume;
          gestureState.startBrightness = brightness;
          gestureState.startTime = currentTime;
        },
        
        onPanResponderMove: (evt, gestureState) => {
          const { dx, dy, vx, vy } = gestureState;
          const screenWidth = Dimensions.get('window').width;
          const screenHeight = Dimensions.get('window').height;
          
          // 判断手势类型
          if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动 - 调节播放进度
            const progressChange = dx / screenWidth;
            const timeChange = progressChange * duration * 0.1; // 10% 的时长范围
            const newTime = Math.max(0, Math.min(duration, gestureState.startTime + timeChange));
            
            // 可以在这里显示进度指示器
          } else {
            // 垂直滑动
            if (evt.nativeEvent.locationX < screenWidth / 2) {
              // 左侧屏幕 - 调节亮度
              const brightnessChange = -dy / screenHeight;
              const newBrightness = Math.max(0, Math.min(1, gestureState.startBrightness + brightnessChange));
              
              setBrightness(newBrightness);
              brightnessAnim.setValue(newBrightness);
              setShowBrightnessIndicator(true);
              
              // 设置屏幕亮度（需要导入Brightness模块）
              // Brightness.setBrightnessAsync(newBrightness);
            } else {
              // 右侧屏幕 - 调节音量
              const volumeChange = -dy / screenHeight;
              const newVolume = Math.max(0, Math.min(1, gestureState.startVolume + volumeChange));
              
              setVolume(newVolume);
              volumeAnim.setValue(newVolume);
              setShowVolumeIndicator(true);
            }
          }
        },
        
        onPanResponderRelease: (evt, gestureState) => {
          const { dx, dy } = gestureState;
          const screenWidth = Dimensions.get('window').width;
          const screenHeight = Dimensions.get('window').height;
          
          // 判断手势类型
          if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动 - 调节播放进度
            const progressChange = dx / screenWidth;
            const timeChange = progressChange * duration * 0.1;
            const newTime = Math.max(0, Math.min(duration, gestureState.startTime + timeChange));
            
            seekTo(newTime);
          } else {
            // 垂直滑动结束
            setShowVolumeIndicator(false);
            setShowBrightnessIndicator(false);
          }
          
          // 判断快速滑动
          if (Math.abs(vx) > 0.5) {
            if (dx > 50) {
              onSwipeRight?.();
            } else if (dx < -50) {
              onSwipeLeft?.();
            }
          }
          
          if (Math.abs(vy) > 0.5) {
            if (dy > 50) {
              onSwipeDown?.();
            } else if (dy < -50) {
              onSwipeUp?.();
            }
          }
        },
        
        onPanResponderTerminate: () => {
          setShowVolumeIndicator(false);
          setShowBrightnessIndicator(false);
        }
  });

  // 处理双击
  const handleDoubleTap = useCallback(() => {
    onDoubleTap?.();
    togglePlayPause();
  }, [onDoubleTap, togglePlayPause]);

  // 处理长按
  const handleLongPress = useCallback(() => {
    onLongPress?.();
  }, [onLongPress]);

  return (
    <View
      className="flex-1"
      {...panResponder.panHandlers}
    >
      {children}
      
      {/* 音量指示器 */}
      {showVolumeIndicator && (
        <View className="absolute left-1/4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 rounded-lg p-4 items-center">
          <Animated.View
            className="w-16 h-32 bg-gray-600 rounded-full overflow-hidden"
          >
            <Animated.View
              className="w-full bg-blue-500 rounded-full"
              style={{
                height: volumeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }}
            />
          </Animated.View>
          <Text className="text-white mt-2">
            {Math.round(volume * 100)}%
          </Text>
        </View>
      )}
      
      {/* 亮度指示器 */}
      {showBrightnessIndicator && (
        <View className="absolute left-3/4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 rounded-lg p-4 items-center">
          <Animated.View
            className="w-16 h-32 bg-gray-600 rounded-full overflow-hidden"
          >
            <Animated.View
              className="w-full bg-yellow-500 rounded-full"
              style={{
                height: brightnessAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }}
            />
          </Animated.View>
          <Text className="text-white mt-2">
            {Math.round(brightness * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
};
```

## 3. 状态管理

### 3.1 播放状态管理
```typescript
// src/stores/playback.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlaybackState {
  currentVideoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  quality: 'high' | 'medium' | 'low';
  isFullscreen: boolean;
  isMuted: boolean;
  subtitles: {
    enabled: boolean;
    language: string;
    tracks: Array<{
      language: string;
      label: string;
      src: string;
    }>;
  };
  playlist: {
    currentPlaylistId: string | null;
    currentIndex: number;
    repeatMode: 'off' | 'one' | 'all';
    shuffleMode: boolean;
  };
  
  // Actions
  setCurrentVideoId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setQuality: (quality: 'high' | 'medium' | 'low') => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setSubtitles: (subtitles: PlaybackState['subtitles']) => void;
  setPlaylist: (playlist: PlaybackState['playlist']) => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  seekTo: (time: number) => void;
  reset: () => void;
  saveProgress: () => void;
}

export const usePlaybackStore = create<PlaybackState>()(
  persist(
    (set, get) => ({
      currentVideoId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      playbackRate: 1,
      quality: 'high',
      isFullscreen: false,
      isMuted: false,
      subtitles: {
        enabled: false,
        language: 'zh',
        tracks: []
      },
      playlist: {
        currentPlaylistId: null,
        currentIndex: 0,
        repeatMode: 'off',
        shuffleMode: false
      },

      setCurrentVideoId: (id) => set({ currentVideoId: id }),
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      setCurrentTime: (time) => set({ currentTime: time }),
      
      setDuration: (duration) => set({ duration }),
      
      setVolume: (volume) => set({ volume }),
      
      setPlaybackRate: (rate) => set({ playbackRate: rate }),
      
      setQuality: (quality) => set({ quality }),
      
      setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
      
      setIsMuted: (muted) => set({ isMuted: muted }),
      
      setSubtitles: (subtitles) => set({ subtitles }),
      
      setPlaylist: (playlist) => set({ playlist }),
      
      togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      
      seekTo: (time) => set({ currentTime: time }),
      
      reset: () => set({
        currentVideoId: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        playbackRate: 1,
        quality: 'high',
        isFullscreen: false,
        isMuted: false,
        subtitles: {
          enabled: false,
          language: 'zh',
          tracks: []
        },
        playlist: {
          currentPlaylistId: null,
          currentIndex: 0,
          repeatMode: 'off',
          shuffleMode: false
        }
      }),
      
      saveProgress: () => {
        const { currentVideoId, currentTime } = get();
        if (currentVideoId) {
          // 保存播放进度到数据库
          // 这里可以调用数据库服务保存进度
        }
      }
    }),
    {
      name: 'playback-store',
      partialize: (state) => ({
        volume: state.volume,
        playbackRate: state.playbackRate,
        quality: state.quality,
        subtitles: state.subtitles
      })
    }
  )
);
```

## 4. 性能优化

### 4.1 视频预加载
```typescript
// src/services/video/preload.service.ts
import { Video } from '../../database/schema';

export class VideoPreloadService {
  private preloadQueue: string[] = [];
  private preloadedVideos: Map<string, boolean> = new Map();
  private maxPreloadSize = 3; // 最多预加载3个视频

  // 添加到预加载队列
  addToPreloadQueue(videoId: string): void {
    if (!this.preloadQueue.includes(videoId) && !this.preloadedVideos.has(videoId)) {
      this.preloadQueue.push(videoId);
      this.processPreloadQueue();
    }
  }

  // 处理预加载队列
  private async processPreloadQueue(): Promise<void> {
    while (this.preloadQueue.length > 0 && this.preloadedVideos.size < this.maxPreloadSize) {
      const videoId = this.preloadQueue.shift()!;
      await this.preloadVideo(videoId);
    }
  }

  // 预加载视频
  private async preloadVideo(videoId: string): Promise<void> {
    try {
      const video = await db.videos.get(videoId);
      if (!video) {
        return;
      }

      // 这里可以实现视频预加载逻辑
      // 例如：预加载视频的头部数据，准备缩略图等
      
      this.preloadedVideos.set(videoId, true);
      console.log(`Video preloaded: ${video.title}`);
    } catch (error) {
      console.error(`Failed to preload video ${videoId}:`, error);
    }
  }

  // 清理预加载缓存
  clearPreloadCache(): void {
    this.preloadedVideos.clear();
    this.preloadQueue = [];
  }

  // 获取预加载状态
  isPreloaded(videoId: string): boolean {
    return this.preloadedVideos.has(videoId);
  }
}
```

### 4.2 内存管理
```typescript
// src/services/video/memory.service.ts
export class VideoMemoryService {
  private static instance: VideoMemoryService;
  private activePlayers: Set<string> = new Set();
  private maxActivePlayers = 2;

  static getInstance(): VideoMemoryService {
    if (!VideoMemoryService.instance) {
      VideoMemoryService.instance = new VideoMemoryService();
    }
    return VideoMemoryService.instance;
  }

  // 注册活跃播放器
  registerPlayer(videoId: string): boolean {
    if (this.activePlayers.size >= this.maxActivePlayers) {
      return false; // 超过最大数量
    }
    
    this.activePlayers.add(videoId);
    return true;
  }

  // 注销播放器
  unregisterPlayer(videoId: string): void {
    this.activePlayers.delete(videoId);
  }

  // 检查是否可以创建新的播放器
  canCreatePlayer(): boolean {
    return this.activePlayers.size < this.maxActivePlayers;
  }

  // 获取活跃播放器数量
  getActivePlayerCount(): number {
    return this.activePlayers.size;
  }

  // 清理所有播放器
  cleanupAllPlayers(): void {
    this.activePlayers.clear();
  }
}
```

## 5. 测试计划

### 5.1 单元测试
```typescript
// src/__tests__/components/video/VideoPlayer.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VideoPlayer } from '../../../components/video/VideoPlayer';
import { usePlaybackStore } from '../../../stores/playback.store';

// Mock dependencies
jest.mock('react-native-video', () => 'Video');
jest.mock('../../../stores/playback.store');

const mockVideo = {
  id: '1',
  title: 'Test Video',
  originalName: 'test.mp4',
  filePath: '/path/to/test.mp4',
  fileSize: 1024 * 1024,
  duration: 120,
  resolution: { width: 1920, height: 1080 },
  format: 'mp4',
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
  viewCount: 0,
  playbackProgress: 0,
  quality: 'high' as const
};

describe('VideoPlayer', () => {
  beforeEach(() => {
    (usePlaybackStore as jest.Mock).mockReturnValue({
      currentVideoId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      playbackRate: 1,
      quality: 'high',
      isFullscreen: false,
      isMuted: false,
      subtitles: {
        enabled: false,
        language: 'zh',
        tracks: []
      },
      setCurrentVideoId: jest.fn(),
      setIsPlaying: jest.fn(),
      setCurrentTime: jest.fn(),
      setDuration: jest.fn()
    });
  });

  it('应该正确渲染视频播放器', () => {
    const { getByTestId } = render(<VideoPlayer video={mockVideo} />);
    expect(getByTestId('video-player')).toBeTruthy();
  });

  it('应该处理播放/暂停', () => {
    const mockTogglePlayPause = jest.fn();
    (usePlaybackStore as jest.Mock).mockReturnValue({
      ...usePlaybackStore(),
      togglePlayPause: mockTogglePlayPause
    });

    const { getByTestId } = render(<VideoPlayer video={mockVideo} />);
    const playButton = getByTestId('play-pause-button');
    
    fireEvent.press(playButton);
    expect(mockTogglePlayPause).toHaveBeenCalled();
  });

  it('应该处理播放结束', () => {
    const mockOnPlaybackEnd = jest.fn();
    const { getByTestId } = render(
      <VideoPlayer video={mockVideo} onPlaybackEnd={mockOnPlaybackEnd} />
    );

    // 模拟播放结束事件
    const videoPlayer = getByTestId('video-player');
    fireEvent(videoPlayer, 'onEnd');
    
    expect(mockOnPlaybackEnd).toHaveBeenCalled();
  });
});
```

## 6. 总结

视频播放模块提供了完整的视频播放体验，包括：

1. **基础播放**: 播放、暂停、进度控制
2. **高级控制**: 音量、亮度、倍速播放
3. **播放列表**: 播放队列管理和控制
4. **字幕支持**: 多语言字幕加载和显示
5. **手势控制**: 直观的触摸手势操作
6. **性能优化**: 预加载和内存管理
7. **状态持久化**: 保存播放偏好设置

该模块设计考虑了移动端的用户体验，提供了流畅的播放体验和丰富的控制选项。