import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlaylistQuickActions } from "../PlaylistQuickActions";
import { vi } from "vitest";

describe("PlaylistQuickActions", () => {
  const mockOnPlaylistCreated = vi.fn();
  const mockOnCreateNew = vi.fn();
  const mockOnViewAll = vi.fn();
  const mockOnViewFavorites = vi.fn();
  const mockOnViewRecent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该正确渲染快速操作组件", () => {
    render(
      <PlaylistQuickActions
        onPlaylistCreated={mockOnPlaylistCreated}
        onCreateNew={mockOnCreateNew}
        onViewAll={mockOnViewAll}
        onViewFavorites={mockOnViewFavorites}
        onViewRecent={mockOnViewRecent}
      />
    );

    expect(screen.getByText("新建播放列表")).toBeTruthy();
    expect(screen.getByText("收藏夹")).toBeTruthy();
    expect(screen.getByText("最近播放")).toBeTruthy();
    expect(screen.getByText("所有播放列表")).toBeTruthy();
    expect(screen.getByText("快速提示")).toBeTruthy();
  });

  it("应该点击新建播放列表按钮时打开对话框", () => {
    render(
      <PlaylistQuickActions
        onPlaylistCreated={mockOnPlaylistCreated}
        onCreateNew={mockOnCreateNew}
        onViewAll={mockOnViewAll}
        onViewFavorites={mockOnViewFavorites}
        onViewRecent={mockOnViewRecent}
      />
    );

    const createButton = screen.getByText("新建播放列表");
    fireEvent.press(createButton);

    // 对话框应该显示
    expect(screen.getByText("创建播放列表")).toBeTruthy();
  });

  it("应该点击其他操作按钮时调用相应的回调", () => {
    render(
      <PlaylistQuickActions
        onPlaylistCreated={mockOnPlaylistCreated}
        onCreateNew={mockOnCreateNew}
        onViewAll={mockOnViewAll}
        onViewFavorites={mockOnViewFavorites}
        onViewRecent={mockOnViewRecent}
      />
    );

    fireEvent.press(screen.getByText("收藏夹"));
    expect(mockOnViewFavorites).toHaveBeenCalled();

    fireEvent.press(screen.getByText("最近播放"));
    expect(mockOnViewRecent).toHaveBeenCalled();

    fireEvent.press(screen.getByText("所有播放列表"));
    expect(mockOnViewAll).toHaveBeenCalled();
  });

  it("应该显示快速提示信息", () => {
    render(
      <PlaylistQuickActions
        onPlaylistCreated={mockOnPlaylistCreated}
        onCreateNew={mockOnCreateNew}
        onViewAll={mockOnViewAll}
        onViewFavorites={mockOnViewFavorites}
        onViewRecent={mockOnViewRecent}
      />
    );

    expect(screen.getByText("创建播放列表来组织您的视频内容")).toBeTruthy();
    expect(screen.getByText("将播放列表设为公开以与其他用户分享")).toBeTruthy();
    expect(screen.getByText("使用描述字段来帮助识别播放列表内容")).toBeTruthy();
  });
});