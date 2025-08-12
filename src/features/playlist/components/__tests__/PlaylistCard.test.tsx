import { render, screen, fireEvent } from "@testing-library/react";
import { PlaylistCard, PlaylistGrid } from "@/features/playlist/components/PlaylistCard";
import { vi } from "vitest";

const mockPlaylist = {
  id: "test-playlist-id",
  name: "测试播放列表",
  description: "这是一个测试播放列表的描述",
  videoCount: 10,
  totalDuration: 3600,
  isPublic: true,
  isDefault: false,
  sortOrder: 0,
  playCount: 25,
  tags: ["测试", "示例", "演示"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("PlaylistCard", () => {
  const mockOnPress = vi.fn();
  const mockOnPlay = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggleFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该正确渲染播放列表卡片", () => {
    render(
      <PlaylistCard
        playlist={mockPlaylist}
        onPress={mockOnPress}
        onPlay={mockOnPlay}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText("测试播放列表")).toBeTruthy();
    expect(screen.getByText("这是一个测试播放列表的描述")).toBeTruthy();
    expect(screen.getByText("10 个视频")).toBeTruthy();
    expect(screen.getByText("1:00")).toBeTruthy();
    expect(screen.getByText("25 次播放")).toBeTruthy();
    expect(screen.getByText("公开")).toBeTruthy();
  });

  it("应该显示播放列表标签", () => {
    render(
      <PlaylistCard
        playlist={mockPlaylist}
        onPress={mockOnPress}
        onPlay={mockOnPlay}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText("#测试")).toBeTruthy();
    expect(screen.getByText("#示例")).toBeTruthy();
    expect(screen.getByText("#演示")).toBeTruthy();
  });

  it("应该点击播放按钮时调用onPlay", () => {
    render(
      <PlaylistCard
        playlist={mockPlaylist}
        onPress={mockOnPress}
        onPlay={mockOnPlay}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const playButton = screen.getByText("播放");
    fireEvent.press(playButton);
    expect(mockOnPlay).toHaveBeenCalled();
  });

  it("应该点击收藏按钮时调用onToggleFavorite", () => {
    render(
      <PlaylistCard
        playlist={mockPlaylist}
        onPress={mockOnPress}
        onPlay={mockOnPlay}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const favoriteButton = screen.getByTestId("favorite-button");
    fireEvent.press(favoriteButton);
    expect(mockOnToggleFavorite).toHaveBeenCalled();
  });

  it("应该隐藏操作按钮当showActions为false", () => {
    render(
      <PlaylistCard
        playlist={mockPlaylist}
        onPress={mockOnPress}
        onPlay={mockOnPlay}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        showActions={false}
      />
    );

    expect(screen.queryByTestId("edit-button")).not.toBeTruthy();
    expect(screen.queryByTestId("delete-button")).not.toBeTruthy();
  });

  it("应该正确显示私密播放列表", () => {
    const privatePlaylist = { ...mockPlaylist, isPublic: false };
    render(
      <PlaylistCard
        playlist={privatePlaylist}
        onPress={mockOnPress}
        onPlay={mockOnPlay}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.queryByText("公开")).not.toBeTruthy();
  });
});

describe("PlaylistGrid", () => {
  const mockOnPlaylistPress = vi.fn();
  const mockOnPlaylistPlay = vi.fn();
  const mockOnPlaylistEdit = vi.fn();
  const mockOnPlaylistDelete = vi.fn();
  const mockOnPlaylistToggleFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该正确渲染播放列表网格", () => {
    const playlists = [mockPlaylist];
    render(
      <PlaylistGrid
        playlists={playlists}
        onPlaylistPress={mockOnPlaylistPress}
        onPlaylistPlay={mockOnPlaylistPlay}
        onPlaylistEdit={mockOnPlaylistEdit}
        onPlaylistDelete={mockOnPlaylistDelete}
        onPlaylistToggleFavorite={mockOnPlaylistToggleFavorite}
      />
    );

    expect(screen.getByText("测试播放列表")).toBeTruthy();
  });

  it("应该显示空状态当没有播放列表时", () => {
    render(
      <PlaylistGrid
        playlists={[]}
        onPlaylistPress={mockOnPlaylistPress}
        onPlaylistPlay={mockOnPlaylistPlay}
        onPlaylistEdit={mockOnPlaylistEdit}
        onPlaylistDelete={mockOnPlaylistDelete}
        onPlaylistToggleFavorite={mockOnPlaylistToggleFavorite}
      />
    );

    expect(screen.getByText("暂无播放列表")).toBeTruthy();
    expect(screen.getByText("创建您的第一个播放列表来开始组织视频")).toBeTruthy();
  });

  it("应该渲染多个播放列表", () => {
    const playlists = [
      mockPlaylist,
      { ...mockPlaylist, id: "test-2", name: "第二个播放列表" },
      { ...mockPlaylist, id: "test-3", name: "第三个播放列表" },
    ];
    render(
      <PlaylistGrid
        playlists={playlists}
        onPlaylistPress={mockOnPlaylistPress}
        onPlaylistPlay={mockOnPlaylistPlay}
        onPlaylistEdit={mockOnPlaylistEdit}
        onPlaylistDelete={mockOnPlaylistDelete}
        onPlaylistToggleFavorite={mockOnPlaylistToggleFavorite}
      />
    );

    expect(screen.getByText("测试播放列表")).toBeTruthy();
    expect(screen.getByText("第二个播放列表")).toBeTruthy();
    expect(screen.getByText("第三个播放列表")).toBeTruthy();
  });
});
