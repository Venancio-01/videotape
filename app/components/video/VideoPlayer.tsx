import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';
import { Video as VideoType } from '@/types';
import { useStore } from '@/stores/store/store';

interface VideoPlayerProps {
  video: VideoType;
  playing?: boolean;
  muted?: boolean;
  showControls?: boolean;
  repeat?: boolean;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: {
    currentTime: number;
    playableDuration: number;
    seekableDuration: number;
  }) => void;
  onLoad?: (load: { duration: number; naturalSize: { width: number; height: number } }) => void;
  style?: any;
}

/**
 * 视频播放器组件
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  playing = false,
  muted = false,
  showControls = false,
  repeat = false,
  onEnd,
  onError,
  onProgress,
  onLoad,
  style,
}) => {
  const { playerState, setPlayerState } = useStore();
  const videoRef = React.useRef<any>(null);

  const handleLoad = (load: any) => {
    setPlayerState({
      duration: load.duration,
      isBuffering: false,
    });
    onLoad?.(load);
  };

  const handleProgress = (progress: any) => {
    setPlayerState({
      position: progress.currentTime,
      isBuffering: false,
    });
    onProgress?.(progress);
  };

  const handleEnd = () => {
    setPlayerState({
      isPlaying: false,
      position: 0,
    });
    onEnd?.();
  };

  const handleError = (error: any) => {
    setPlayerState({
      isPlaying: false,
      isBuffering: false,
    });
    onError?.(error);
  };

  const handleBuffer = (isBuffering: boolean) => {
    setPlayerState({ isBuffering });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    video: {
      flex: 1,
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: video.uri }}
        style={styles.video}
        resizeMode="contain"
        controls={false}
        paused={!playing}
        repeat={repeat}
        volume={muted ? 0 : 1}
        rate={playerState.playbackRate}
        onEnd={handleEnd}
        onError={handleError}
        onProgress={handleProgress}
        onLoad={handleLoad}
        onBuffer={({ isBuffering }) => handleBuffer(isBuffering)}
        onPlaybackRateChange={({ playbackRate }) => setPlayerState({ playbackRate })}
        onVolumeChange={({ volume }) => setPlayerState({ volume })}
        onSeek={({ currentTime }) => setPlayerState({ position: currentTime })}
        ignoreSilentSwitch="ignore"
        playInBackground={false}
        playWhenInactive={false}
        preventsDisplaySleepDuringVideoPlayback={true}
        selectedVideoTrack={
          {
            type: 'auto',
            value: 'auto',
          } as any
        }
      />
    </View>
  );
};
