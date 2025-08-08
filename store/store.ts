import { create } from 'zustand';
import { Video, Playlist, Folder, PlayerState, AppSettings, FilterOptions } from '../app/types';

/**
 * 应用状态管理
 */
export interface AppState {
  // 用户设置
  settings: AppSettings;
  
  // 视频数据
  videos: Video[];
  currentVideo: Video | null;
  
  // 播放列表
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  
  // 文件夹
  folders: Folder[];
  currentFolder: Folder | null;
  
  // 播放器状态
  playerState: PlayerState;
  
  // UI状态
  isLoading: boolean;
  isSearchVisible: boolean;
  searchQuery: string;
  currentFilter: FilterOptions;
  currentViewMode: 'tiktok' | 'list';
  
  // 操作方法
  setSettings: (settings: Partial<AppSettings>) => void;
  setVideos: (videos: Video[]) => void;
  addVideo: (video: Video) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  removeVideo: (id: string) => void;
  setCurrentVideo: (video: Video | null) => void;
  
  setPlaylists: (playlists: Playlist[]) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  removePlaylist: (id: string) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  removeFolder: (id: string) => void;
  setCurrentFolder: (folder: Folder | null) => void;
  
  setPlayerState: (state: Partial<PlayerState>) => void;
  playVideo: (video: Video) => void;
  pauseVideo: () => void;
  resumeVideo: () => void;
  stopVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  
  setLoading: (loading: boolean) => void;
  setSearchVisible: (visible: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCurrentFilter: (filter: FilterOptions) => void;
  setCurrentViewMode: (mode: 'tiktok' | 'list') => void;
  
  // 重置状态
  reset: () => void;
}

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'zh-CN',
  autoPlay: false,
  loop: false,
  shuffle: false,
  volume: 1.0,
  playbackSpeed: 1.0,
  quality: 'auto',
  dataSaver: false,
  backgroundPlay: false,
};

// 默认播放器状态
const defaultPlayerState: PlayerState = {
  currentVideo: null,
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: 0,
  volume: 1.0,
  playbackRate: 1.0,
  isLooping: false,
  isShuffle: false,
  isMuted: false,
  playlist: null,
  playlistIndex: 0,
  queue: [],
  currentIndex: 0,
};

// 默认筛选选项
const defaultFilter: FilterOptions = {
  sortBy: 'date',
  sortOrder: 'desc',
  filterBy: 'all',
};

export const useStore = create<AppState>((set, get) => ({
  // 初始状态
  settings: defaultSettings,
  videos: [],
  currentVideo: null,
  playlists: [],
  currentPlaylist: null,
  folders: [],
  currentFolder: null,
  playerState: defaultPlayerState,
  isLoading: false,
  isSearchVisible: false,
  searchQuery: '',
  currentFilter: defaultFilter,
  currentViewMode: 'tiktok',

  // 设置操作
  setSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  // 视频操作
  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((state) => ({
    videos: [...state.videos, video]
  })),
  updateVideo: (id, updates) => set((state) => ({
    videos: state.videos.map(video => 
      video.id === id ? { ...video, ...updates } : video
    )
  })),
  removeVideo: (id) => set((state) => ({
    videos: state.videos.filter(video => video.id !== id),
    currentVideo: state.currentVideo?.id === id ? null : state.currentVideo,
  })),
  setCurrentVideo: (video) => set({ currentVideo: video }),

  // 播放列表操作
  setPlaylists: (playlists) => set({ playlists }),
  addPlaylist: (playlist) => set((state) => ({
    playlists: [...state.playlists, playlist]
  })),
  updatePlaylist: (id, updates) => set((state) => ({
    playlists: state.playlists.map(playlist => 
      playlist.id === id ? { ...playlist, ...updates } : playlist
    )
  })),
  removePlaylist: (id) => set((state) => ({
    playlists: state.playlists.filter(playlist => playlist.id !== id),
    currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist,
  })),
  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),

  // 文件夹操作
  setFolders: (folders) => set({ folders }),
  addFolder: (folder) => set((state) => ({
    folders: [...state.folders, folder]
  })),
  updateFolder: (id, updates) => set((state) => ({
    folders: state.folders.map(folder => 
      folder.id === id ? { ...folder, ...updates } : folder
    )
  })),
  removeFolder: (id) => set((state) => ({
    folders: state.folders.filter(folder => folder.id !== id),
    currentFolder: state.currentFolder?.id === id ? null : state.currentFolder,
  })),
  setCurrentFolder: (folder) => set({ currentFolder: folder }),

  // 播放器操作
  setPlayerState: (newState) => set((state) => ({
    playerState: { ...state.playerState, ...newState }
  })),
  playVideo: (video) => set((state) => ({
    currentVideo: video,
    playerState: {
      ...state.playerState,
      currentVideo: video,
      isPlaying: true,
      isBuffering: false,
      position: 0,
    }
  })),
  pauseVideo: () => set((state) => ({
    playerState: {
      ...state.playerState,
      isPlaying: false,
    }
  })),
  resumeVideo: () => set((state) => ({
    playerState: {
      ...state.playerState,
      isPlaying: true,
    }
  })),
  stopVideo: () => set((state) => ({
    playerState: {
      ...state.playerState,
      isPlaying: false,
      position: 0,
    }
  })),
  nextVideo: () => set((state) => {
    const { playerState, videos } = state;
    if (!playerState.currentVideo) return;

    const currentIndex = videos.findIndex(v => v.id === playerState.currentVideo!.id);
    const nextIndex = (currentIndex + 1) % videos.length;
    const nextVideo = videos[nextIndex];

    return {
      currentVideo: nextVideo,
      playerState: {
        ...playerState,
        currentVideo: nextVideo,
        isPlaying: true,
        position: 0,
      }
    };
  }),
  previousVideo: () => set((state) => {
    const { playerState, videos } = state;
    if (!playerState.currentVideo) return;

    const currentIndex = videos.findIndex(v => v.id === playerState.currentVideo!.id);
    const prevIndex = currentIndex === 0 ? videos.length - 1 : currentIndex - 1;
    const prevVideo = videos[prevIndex];

    return {
      currentVideo: prevVideo,
      playerState: {
        ...playerState,
        currentVideo: prevVideo,
        isPlaying: true,
        position: 0,
      }
    };
  }),

  // UI状态操作
  setLoading: (isLoading) => set({ isLoading }),
  setSearchVisible: (isSearchVisible) => set({ isSearchVisible }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCurrentFilter: (currentFilter) => set({ currentFilter }),
  setCurrentViewMode: (currentViewMode) => set({ currentViewMode }),

  // 重置状态
  reset: () => set({
    settings: defaultSettings,
    videos: [],
    currentVideo: null,
    playlists: [],
    currentPlaylist: null,
    folders: [],
    currentFolder: null,
    playerState: defaultPlayerState,
    isLoading: false,
    isSearchVisible: false,
    searchQuery: '',
    currentFilter: defaultFilter,
    currentViewMode: 'tiktok',
  }),
}));
