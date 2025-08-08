import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Video as VideoType } from '../../app/types';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/store';

interface VideoThumbnailProps {
  video: VideoType;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  showTitle?: boolean;
  showDuration?: boolean;
  showPlayIcon?: boolean;
  showFavoriteIcon?: boolean;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * 视频缩略图组件
 */
export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  video,
  onPress,
  onLongPress,
  style,
  showTitle = true,
  showDuration = true,
  showPlayIcon = true,
  showFavoriteIcon = false,
  isSelected = false,
  size = 'medium',
}) => {
  const { updateVideo } = useStore();

  const handleToggleFavorite = () => {
    updateVideo(video.id, { isFavorite: !video.isFavorite });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 120, height: 80 },
          thumbnail: { width: 120, height: 80 },
          title: { fontSize: 12 },
        };
      case 'large':
        return {
          container: { width: 200, height: 150 },
          thumbnail: { width: 200, height: 150 },
          title: { fontSize: 16 },
        };
      default:
        return {
          container: { width: 160, height: 120 },
          thumbnail: { width: 160, height: 120 },
          title: { fontSize: 14 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: isSelected ? 2 : 0,
      borderColor: isSelected ? '#007AFF' : 'transparent',
      ...sizeStyles.container,
    },
    thumbnailContainer: {
      position: 'relative',
      ...sizeStyles.thumbnail,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
    },
    playIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -15 }, { translateY: -15 }],
    },
    durationBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    durationText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '500',
    },
    favoriteIcon: {
      position: 'absolute',
      top: 4,
      right: 4,
    },
    titleContainer: {
      padding: 8,
    },
    title: {
      color: '#333',
      fontWeight: '500',
      numberOfLines: 2,
      ...sizeStyles.title,
    },
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    playCount: {
      color: '#666',
      fontSize: 12,
    },
    date: {
      color: '#666',
      fontSize: 12,
    },
    placeholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#e0e0e0',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        {video.thumbnailUri ? (
          <Image
            source={{ uri: video.thumbnailUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="videocam" size={32} color="#666" />
          </View>
        )}

        {showPlayIcon && (
          <View style={styles.playIcon}>
            <Ionicons name="play-circle" size={30} color="rgba(255, 255, 255, 0.9)" />
          </View>
        )}

        {showDuration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(video.duration)}
            </Text>
          </View>
        )}

        {showFavoriteIcon && (
          <TouchableOpacity
            style={styles.favoriteIcon}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={video.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={video.isFavorite ? '#ff4444' : 'white'}
            />
          </TouchableOpacity>
        )}
      </View>

      {showTitle && (
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.playCount}>
          {video.playCount} 次播放
        </Text>
        <Text style={styles.date}>
          {new Date(video.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};