/**
 * 媒体权限管理 Hook
 * 统一处理权限请求和状态管理
 */

import { AudioModule } from "expo-audio";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useState } from "react";

export interface PermissionStatus {
  media: "granted" | "denied" | "undetermined" | "limited";
  audio: "granted" | "denied" | "undetermined";
}

export function useMediaPermissions() {
  const [status, setStatus] = useState<PermissionStatus>({
    media: "undetermined",
    audio: "undetermined",
  });
  const [loading, setLoading] = useState(false);

  // 检查权限状态
  const checkPermissions = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const [mediaStatus, audioStatus] = await Promise.all([
        MediaLibrary.getPermissionsAsync(),
        AudioModule.getRecordingPermissionsAsync(),
      ]);

      return {
        media: mediaStatus.status,
        audio: audioStatus.status,
      };
    } catch (error) {
      // 检查权限失败
      return {
        media: "denied",
        audio: "denied",
      };
    }
  }, []);

  // 请求媒体权限
  const requestMediaPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();

      setStatus((prev) => ({ ...prev, media: status }));
      return status === "granted";
    } catch (error) {
      // 请求媒体权限失败
      setStatus((prev) => ({ ...prev, media: "denied" }));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 请求音频权限
  const requestAudioPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      const { status } = await AudioModule.requestRecordingPermissionsAsync();

      setStatus((prev) => ({ ...prev, audio: status }));
      return status === "granted";
    } catch (error) {
      // 请求音频权限失败
      setStatus((prev) => ({ ...prev, audio: "denied" }));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 请求所有权限
  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      const [mediaGranted, audioGranted] = await Promise.all([
        requestMediaPermissions(),
        requestAudioPermissions(),
      ]);

      return mediaGranted && audioGranted;
    } finally {
      setLoading(false);
    }
  }, [requestMediaPermissions, requestAudioPermissions]);

  // 初始化检查权限
  useEffect(() => {
    const initializePermissions = async () => {
      const currentStatus = await checkPermissions();
      setStatus(currentStatus);
    };

    initializePermissions();
  }, [checkPermissions]);

  return {
    status,
    loading,
    requestMediaPermissions,
    requestAudioPermissions,
    requestAllPermissions,
    checkPermissions,
  };
}
