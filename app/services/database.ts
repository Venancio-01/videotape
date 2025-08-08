import Dexie, { Table } from 'dexie';
import { Video, Playlist, Folder, PlayHistory, AppSettings } from '../types';

/**
 * 数据库接口定义
 */
export interface AppDatabase extends Dexie {
  videos: Table<Video, string>;
  playlists: Table<Playlist, string>;
  folders: Table<Folder, string>;
  playHistory: Table<PlayHistory, string>;
  settings: Table<AppSettings, string>;
}

/**
 * 初始化数据库
 */
export const db = new Dexie('VideotapeDB') as AppDatabase;

// 定义数据库结构
db.version(2).stores({
  videos: `
    id,
    title,
    description,
    uri,
    thumbnailUri,
    duration,
    size,
    mimeType,
    createdAt,
    updatedAt,
    isFavorite,
    playCount,
    likeCount,
    lastPlayedAt,
    folderId,
    tags
  `,
  playlists: `
    id,
    name,
    description,
    thumbnailUri,
    createdAt,
    updatedAt,
    videoIds,
    isPrivate
  `,
  folders: `
    id,
    name,
    description,
    parentId,
    createdAt,
    updatedAt,
    videoCount,
    isPrivate
  `,
  playHistory: `
    id,
    videoId,
    playedAt,
    position,
    duration,
    completed
  `,
  settings: `
    theme,
    language,
    autoPlay,
    loop,
    shuffle,
    volume,
    playbackSpeed,
    quality,
    dataSaver,
    backgroundPlay
  `,
});

// 数据库升级处理
db.version(1).upgrade(async (trans) => {
  // 初始版本，无需升级
});

db.version(2).upgrade(async (trans) => {
  // 添加likeCount字段到现有视频记录
  const videos = await trans.table('videos').toArray();
  for (const video of videos) {
    await trans.table('videos').update(video.id, { likeCount: 0 });
  }
});

// 创建索引以提高查询性能
db.videos.hook('creating', (primKey, obj) => {
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
  obj.playCount = 0;
  obj.likeCount = 0;
  obj.isFavorite = false;
  obj.tags = [];
});

db.playlists.hook('creating', (primKey, obj) => {
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
  obj.videoIds = [];
  obj.isPrivate = false;
});

db.folders.hook('creating', (primKey, obj) => {
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
  obj.videoCount = 0;
  obj.isPrivate = false;
});

export default db;