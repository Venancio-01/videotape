import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化时长（秒转换为分:秒格式）
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// 格式化分辨率
export function formatResolution(width?: number, height?: number): string {
  if (!width || !height) return "";

  if (width >= 3840) return "4K";
  if (width >= 2560) return "2K";
  if (width >= 1920) return "1080p";
  if (width >= 1280) return "720p";
  if (width >= 854) return "480p";

  return `${width}x${height}`;
}
