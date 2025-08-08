import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Slider, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/store/store';
import { useSettingsStore } from '@/stores/settingsStore';

interface PlayerControlsProps {
  style?: any;
  showControls?: boolean;
  onTogglePlayPause?: () => void;
  onSeek?: (position: number) => void;
  onVolumeChange?: (volume: number) => void;
  onSpeedChange?: (speed: number) => void;
  onToggleLoop?: () => void;
  onToggleShuffle?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

/**
 * 播放器控制组件
 */
export const PlayerControls: React.FC<PlayerControlsProps> = ({
  style,
  showControls = true,
  onTogglePlayPause,
  onSeek,
  onVolumeChange,
  onSpeedChange,
  onToggleLoop,
  onToggleShuffle,
  onNext,
  onPrevious,
}) => {
  const { playerState, setPlayerState, nextVideo, previousVideo } = useStore();
  const { settings } = useSettingsStore();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number) => {
    const position = (value / 100) * playerState.duration;
    setPlayerState({ position });
    onSeek?.(position);
  };

  const handleVolumeChange = (value: number) => {
    const volume = value / 100;
    setPlayerState({ volume });
    onVolumeChange?.(volume);
  };

  const handleSpeedChange = (value: number) => {
    const speed = 0.25 + (value / 100) * 2.75; // 0.25x to 3x
    setPlayerState({ playbackRate: speed });
    onSpeedChange?.(speed);
  };

  const handleTogglePlayPause = () => {
    if (playerState.isPlaying) {
      setPlayerState({ isPlaying: false });
    } else {
      setPlayerState({ isPlaying: true });
    }
    onTogglePlayPause?.();
  };

  const handleToggleLoop = () => {
    setPlayerState({ isLooping: !playerState.isLooping });
    onToggleLoop?.();
  };

  const handleToggleShuffle = () => {
    setPlayerState({ isShuffle: !playerState.isShuffle });
    onToggleShuffle?.();
  };

  const handleNext = () => {
    nextVideo();
    onNext?.();
  };

  const handlePrevious = () => {
    previousVideo();
    onPrevious?.();
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 20,
    },
    hidden: {
      display: 'none',
    },
    timeInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    timeText: {
      color: 'white',
      fontSize: 12,
    },
    progressContainer: {
      marginBottom: 15,
    },
    slider: {
      width: '100%',
      height: 4,
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: 15,
    },
    controlButton: {
      padding: 10,
    },
    volumeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    volumeSlider: {
      flex: 1,
      marginLeft: 10,
    },
    speedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    speedText: {
      color: 'white',
      fontSize: 12,
      marginLeft: 10,
    },
  });

  if (!showControls || !playerState.currentVideo) {
    return null;
  }

  return (
    <View style={[styles.container, !showControls && styles.hidden, style]}>
      {/* 时间信息 */}
      <View style={styles.timeInfo}>
        <Text style={styles.timeText}>
          {formatTime(playerState.position)}
        </Text>
        <Text style={styles.timeText}>
          {formatTime(playerState.duration)}
        </Text>
      </View>

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={playerState.duration > 0 ? (playerState.position / playerState.duration) * 100 : 0}
          onValueChange={handleSeek}
          minimumTrackTintColor="#ffffff"
          maximumTrackTintColor="#666666"
          thumbStyle={{ width: 12, height: 12 }}
        />
      </View>

      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleToggleShuffle}
        >
          <Ionicons
            name="shuffle"
            size={24}
            color={playerState.isShuffle ? '#ffffff' : '#666666'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handlePrevious}
        >
          <Ionicons name="play-skip-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleTogglePlayPause}
        >
          <Ionicons
            name={playerState.isPlaying ? 'pause' : 'play'}
            size={32}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleNext}
        >
          <Ionicons name="play-skip-forward" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleToggleLoop}
        >
          <Ionicons
            name="repeat"
            size={24}
            color={playerState.isLooping ? '#ffffff' : '#666666'}
          />
        </TouchableOpacity>
      </View>

      {/* 音量控制 */}
      <View style={styles.volumeContainer}>
        <Ionicons name="volume-medium" size={20} color="white" />
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={100}
          value={playerState.volume * 100}
          onValueChange={handleVolumeChange}
          minimumTrackTintColor="#ffffff"
          maximumTrackTintColor="#666666"
          thumbStyle={{ width: 12, height: 12 }}
        />
      </View>

      {/* 播放速度控制 */}
      <View style={styles.speedContainer}>
        <Ionicons name="speedometer" size={20} color="white" />
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={100}
          value={((playerState.playbackRate - 0.25) / 2.75) * 100}
          onValueChange={handleSpeedChange}
          minimumTrackTintColor="#ffffff"
          maximumTrackTintColor="#666666"
          thumbStyle={{ width: 12, height: 12 }}
        />
        <Text style={styles.speedText}>
          {playerState.playbackRate.toFixed(2)}x
        </Text>
      </View>
    </View>
  );
};