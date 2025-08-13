import { CreatePlaylistDialog } from "@/playlist/components/CreatePlaylistDialog";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

// Mock the database service
const mockCreatePlaylist = vi.fn();
vi.mock("@/db/database-service", () => ({
  databaseService: {
    createPlaylist: mockCreatePlaylist,
  },
}));

// Mock schema types
const mockPlaylist = {
  id: "test-playlist-id",
  name: "测试播放列表",
  description: "这是一个测试播放列表",
  videoCount: 0,
  totalDuration: 0,
  isPublic: false,
  isDefault: false,
  sortOrder: 0,
  playCount: 0,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("CreatePlaylistDialog", () => {
  const mockOnSuccess = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该正确渲染对话框", () => {
    render(
      <CreatePlaylistDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByText("创建播放列表")).toBeTruthy();
    expect(screen.getByText("创建一个新的播放列表来组织您的视频")).toBeTruthy();
    expect(screen.getByPlaceholderText("输入播放列表名称")).toBeTruthy();
    expect(screen.getByPlaceholderText("输入播放列表描述")).toBeTruthy();
  });

  it("应该验证必填字段", async () => {
    render(
      <CreatePlaylistDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
    );

    const createButton = screen.getByText("创建");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText("播放列表名称不能为空")).toBeTruthy();
    });
  });

  it("应该在输入有效数据时成功创建播放列表", async () => {
    mockCreatePlaylist.mockResolvedValue(mockPlaylist);

    render(
      <CreatePlaylistDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
    );

    // 输入播放列表名称
    const nameInput = screen.getByPlaceholderText("输入播放列表名称");
    fireEvent.change(nameInput, { target: { value: "测试播放列表" } });

    // 输入描述
    const descriptionInput = screen.getByPlaceholderText("输入播放列表描述");
    fireEvent.change(descriptionInput, {
      target: { value: "这是一个测试播放列表" },
    });

    // 点击创建按钮
    const createButton = screen.getByText("创建");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreatePlaylist).toHaveBeenCalledWith({
        name: "测试播放列表",
        description: "这是一个测试播放列表",
        isPublic: false,
        tags: [],
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(mockPlaylist);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("应该在点击取消时关闭对话框", () => {
    render(
      <CreatePlaylistDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
    );

    const cancelButton = screen.getByText("取消");
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
