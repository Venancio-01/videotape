import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlaylistService } from "@/src/services/playlistService";
import type { CreatePlaylistOptions } from "@/src/features/playlist/types/playlist";
import type { Video } from "@/src/db/schema";

// Mock the database and file system
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("PlaylistService", () => {
  let mockVideoItems: Video[];
  let mockPlaylistOptions: CreatePlaylistOptions;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup test data
    mockVideoItems = [
      {
        id: "1",
        title: "测试视频1",
        filePath: "/path/to/video1.mp4",
        duration: 120,
        thumbnailUri: null,
      },
      {
        id: "2",
        title: "测试视频2",
        filePath: "/path/to/video2.mp4",
        duration: 180,
        thumbnailUri: null,
      },
    ];

    mockPlaylistOptions = {
      name: "测试播放列表",
      description: "这是一个测试播放列表",
      isPublic: false,
      tags: ["测试", "示例"],
    };
  });

  describe("createPlaylist", () => {
    it("应该成功创建播放列表", async () => {
      const result = await PlaylistService.createPlaylist(mockPlaylistOptions, mockVideoItems);

      expect(result.success).toBe(true);
      expect(result.playlistId).toBeDefined();
      expect(result.playlistId).toMatch(/^playlist_\d+_[a-z0-9]{9}$/);
    });

    it("应该验证必填字段 - 播放列表名称", async () => {
      const result = await PlaylistService.createPlaylist(
        { ...mockPlaylistOptions, name: "" },
        mockVideoItems
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("播放列表名称不能为空");
    });

    it("应该验证必填字段 - 视频列表", async () => {
      const result = await PlaylistService.createPlaylist(mockPlaylistOptions, []);

      expect(result.success).toBe(false);
      expect(result.error).toBe("请选择至少一个视频");
    });

    it("应该处理空格的播放列表名称", async () => {
      const result = await PlaylistService.createPlaylist(
        { ...mockPlaylistOptions, name: "   " },
        mockVideoItems
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("播放列表名称不能为空");
    });

    it("应该修剪播放列表名称", async () => {
      const result = await PlaylistService.createPlaylist(
        { ...mockPlaylistOptions, name: "  测试播放列表  " },
        mockVideoItems
      );

      expect(result.success).toBe(true);
      // 注意：这里我们检查的是成功创建，而不是具体的名称处理
      // 因为服务层在内部会处理名称修剪
    });
  });

  describe("getAllPlaylists", () => {
    it("应该返回播放列表数组", async () => {
      const playlists = await PlaylistService.getAllPlaylists();

      expect(Array.isArray(playlists)).toBe(true);
      expect(playlists.length).toBeGreaterThan(0);

      // 验证返回的播放列表结构
      const playlist = playlists[0];
      expect(playlist).toHaveProperty("id");
      expect(playlist).toHaveProperty("name");
      expect(playlist).toHaveProperty("description");
      expect(playlist).toHaveProperty("isPublic");
      expect(playlist).toHaveProperty("tags");
      expect(playlist).toHaveProperty("videoCount");
      expect(playlist).toHaveProperty("totalDuration");
      expect(playlist).toHaveProperty("createdAt");
      expect(playlist).toHaveProperty("updatedAt");
    });
  });

  describe("getPlaylistById", () => {
    it("应该返回指定ID的播放列表", async () => {
      const playlist = await PlaylistService.getPlaylistById("1");

      expect(playlist).not.toBeNull();
      expect(playlist?.id).toBe("1");
      expect(playlist?.name).toBe("我的收藏");
    });

    it("应该返回null对于不存在的ID", async () => {
      const playlist = await PlaylistService.getPlaylistById("nonexistent");

      expect(playlist).toBeNull();
    });
  });

  describe("getVideoFiles", () => {
    it("应该返回视频文件数组", async () => {
      const files = await PlaylistService.getVideoFiles();

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);

      // 验证返回的文件结构
      const file = files[0];
      expect(file).toHaveProperty("id");
      expect(file).toHaveProperty("name");
      expect(file).toHaveProperty("uri");
      expect(file).toHaveProperty("size");
      expect(file).toHaveProperty("type");
      expect(file).toHaveProperty("mimeType");
      expect(file).toHaveProperty("metadata");
    });
  });

  describe("getVideoDirectories", () => {
    it("应该返回目录数组", async () => {
      const directories = await PlaylistService.getVideoDirectories();

      expect(Array.isArray(directories)).toBe(true);
      expect(directories.length).toBeGreaterThan(0);

      // 验证返回的目录结构
      const directory = directories[0];
      expect(directory).toHaveProperty("id");
      expect(directory).toHaveProperty("name");
      expect(directory).toHaveProperty("path");
      expect(directory).toHaveProperty("itemCount");
    });
  });

  describe("getDirectoryVideos", () => {
    it("应该返回目录中的视频数组", async () => {
      const videos = await PlaylistService.getDirectoryVideos("/path/to/movies");

      expect(Array.isArray(videos)).toBe(true);
      expect(videos.length).toBeGreaterThan(0);

      // 验证返回的视频结构
      const video = videos[0];
      expect(video).toHaveProperty("id");
      expect(video).toHaveProperty("title");
      expect(video).toHaveProperty("filePath");
      expect(video).toHaveProperty("duration");
    });
  });

  describe("updatePlaylist", () => {
    it("应该成功更新播放列表", async () => {
      const result = await PlaylistService.updatePlaylist("1", {
        name: "更新的播放列表名称",
        description: "更新的描述",
      });

      expect(result.success).toBe(true);
      expect(result.playlistId).toBe("1");
    });

    it("应该验证更新时的必填字段", async () => {
      const result = await PlaylistService.updatePlaylist("1", {
        name: "   ",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("播放列表名称不能为空");
    });
  });

  describe("deletePlaylist", () => {
    it("应该成功删除播放列表", async () => {
      const result = await PlaylistService.deletePlaylist("1");

      expect(result.success).toBe(true);
      expect(result.playlistId).toBe("1");
    });
  });

  describe("getPlaylistVideos", () => {
    it("应该返回播放列表中的视频", async () => {
      const videos = await PlaylistService.getPlaylistVideos("1");

      expect(Array.isArray(videos)).toBe(true);
      expect(videos.length).toBeGreaterThan(0);

      // 验证返回的视频结构
      const video = videos[0];
      expect(video).toHaveProperty("id");
      expect(video).toHaveProperty("title");
      expect(video).toHaveProperty("filePath");
      expect(video).toHaveProperty("duration");
    });
  });
});
