# Videotape 项目测试指南

## 🧪 测试概述

Videotape 项目采用全面的测试策略，包括单元测试、集成测试和端到端测试。使用 Jest 作为测试框架，React Native Testing Library 用于组件测试。

## 📁 测试文件结构

```
tests/
├── setup.ts              # 测试设置文件
├── utils.ts              # 测试工具函数
├── unit/                 # 单元测试
│   ├── useVideoPlayer.test.ts
│   ├── usePlaylist.test.ts
│   ├── useSinglePlaylist.test.ts
│   ├── playlistService.test.ts
│   └── playlistUtils.test.ts
├── integration/          # 集成测试
│   └── playlistIntegration.test.ts
├── e2e/                  # 端到端测试（待实现）
└── jest.config.ts        # Jest 配置文件
```

## 🛠️ 测试工具

### 模拟数据生成器

```typescript
import { createMockVideo, createMockPlaylist } from '@/tests/utils';

// 创建模拟视频
const mockVideo = createMockVideo({
  id: 'test-video-1',
  title: 'Test Video',
  duration: 120,
});

// 创建模拟播放列表
const mockPlaylist = createMockPlaylist({
  id: 'test-playlist-1',
  name: 'Test Playlist',
  videoIds: ['video1', 'video2'],
});
```

### 服务模拟

```typescript
import { mockDatabase, mockStorageService } from '@/tests/utils';

// 在测试中使用模拟服务
jest.mock('@/database', () => mockDatabase);
jest.mock('@/services/storage', () => mockStorageService);
```

## 📋 测试类型

### 1. 单元测试

#### Hook 测试
```typescript
describe('usePlaylist', () => {
  it('should load playlists on mount', async () => {
    const { result } = renderHook(() => usePlaylist());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.playlists).toHaveLength(3);
    });
  });
});
```

#### 服务测试
```typescript
describe('PlaylistService', () => {
  it('should create playlist successfully', async () => {
    const playlist = await playlistService.createPlaylist({
      name: 'New Playlist',
      videoIds: [],
    });
    
    expect(playlist.name).toBe('New Playlist');
  });
});
```

#### 工具函数测试
```typescript
describe('Playlist Utils', () => {
  it('should validate playlist name', () => {
    const result = validatePlaylistName('Valid Name');
    expect(result.isValid).toBe(true);
  });
});
```

### 2. 集成测试

#### 组件集成测试
```typescript
describe('PlaylistList Integration', () => {
  it('should render and interact with playlist list', async () => {
    const { getByText, getByPlaceholderText } = render(
      <PlaylistList onPlaylistPress={jest.fn()} />
    );
    
    expect(getByText('Test Playlist')).toBeTruthy();
    
    fireEvent.changeText(getByPlaceholderText('搜索播放列表...'), 'test');
    
    await waitFor(() => {
      expect(mockHookReturnValue.searchPlaylists).toHaveBeenCalledWith('test');
    });
  });
});
```

### 3. 端到端测试（待实现）

## 🔧 测试配置

### Jest 配置

```typescript
// jest.config.ts
export default {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.test.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### 测试设置

```typescript
// tests/setup.ts
import '@testing-library/jest-native/extend-expect';

// 模拟 React Native 组件
jest.mock('react-native-video', () => 'Video');
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://documents/',
  getInfoAsync: jest.fn(),
}));

// 模拟存储服务
jest.mock('@/storage/mmkv-storage', () => ({
  mmkvStorage: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

// 全局设置
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.useRealTimers();
});
```

## 📊 测试覆盖率

### 目标覆盖率
- **总体覆盖率**: 70%
- **分支覆盖率**: 70%
- **函数覆盖率**: 70%
- **行覆盖率**: 70%
- **语句覆盖率**: 70%

### 覆盖率报告
```bash
# 生成覆盖率报告
npm run test:coverage

# 查看详细覆盖率报告
open coverage/lcov-report/index.html
```

## 🚀 运行测试

### 运行所有测试
```bash
npm run test
```

### 运行特定测试类型
```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 端到端测试
npm run test:e2e
```

### 监视模式
```bash
# 监视文件变化并重新运行测试
npm run test:watch
```

### 覆盖率测试
```bash
# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 📝 测试最佳实践

### 1. 测试命名约定
```typescript
// 文件命名
usePlaylist.test.ts          # Hook 测试
playlistService.test.ts      # 服务测试
playlistUtils.test.ts        # 工具函数测试
PlaylistList.test.ts         # 组件测试

// 测试描述
describe('usePlaylist', () => {
  it('should load playlists on mount', () => {
    // 测试代码
  });
});
```

### 2. 测试结构
```typescript
describe('Component', () => {
  let mockFunction: jest.Mock;

  beforeEach(() => {
    // 设置测试环境
    mockFunction = jest.fn();
  });

  afterEach(() => {
    // 清理测试环境
    jest.clearAllMocks();
  });

  describe('specific functionality', () => {
    it('should do something', () => {
      // 测试代码
    });
  });
});
```

### 3. 异步测试
```typescript
it('should handle async operations', async () => {
  const { result } = renderHook(() => useHook());
  
  // 执行异步操作
  await act(async () => {
    await result.current.asyncMethod();
  });
  
  // 验证结果
  expect(result.current.state).toBe('expected');
});
```

### 4. 模拟和存根
```typescript
// 模拟服务
jest.mock('@/services/playlistService', () => ({
  playlistService: {
    getPlaylists: jest.fn().mockResolvedValue([]),
    createPlaylist: jest.fn().mockResolvedValue(mockPlaylist),
  },
}));

// 存根函数
const mockFunction = jest.fn()
  .mockResolvedValueOnce(result1)
  .mockResolvedValueOnce(result2);
```

## 🔍 调试测试

### 1. 调试模式
```bash
# 使用 Node.js 调试器
node --inspect-brk ./node_modules/.bin/jest --runInBand

# 使用 VS Code 调试器
# 在 .vscode/launch.json 中配置调试配置
```

### 2. 测试调试工具
```typescript
// 在测试中添加调试信息
console.log('Current state:', result.current.state);
console.log('Mock calls:', mockFunction.mock.calls);

// 使用 jest.fn() 的调试方法
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith('expected arg');
```

## 📚 测试资源

### 官方文档
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library](https://testing-library.com/)

### 相关文章
- [Testing React Hooks](https://react-hooks.org/docs/testing-hooks)
- [Testing React Native Apps](https://reactnative.dev/docs/testing)
- [Jest Best Practices](https://github.com/sapegin/jest-cheat-sheet)

## 🎯 测试检查清单

### 单元测试
- [ ] 所有公共方法都有测试
- [ ] 错误处理路径被测试
- [ ] 边界条件被测试
- [ ] 模拟依赖被正确设置

### 集成测试
- [ ] 组件交互被测试
- [ ] 服务集成被测试
- [ ] 数据流被测试
- [ ] 错误场景被测试

### 端到端测试
- [ ] 用户流程被测试
- [ ] 关键功能被测试
- [ ] 跨平台兼容性被测试
- [ ] 性能测试被运行

## 📈 测试指标

### 当前测试状态
- **单元测试**: 15 个测试文件
- **集成测试**: 1 个测试文件
- **端到端测试**: 待实现
- **总体覆盖率**: 目标 70%

### 测试执行时间
- **单元测试**: ~5 秒
- **集成测试**: ~10 秒
- **完整测试套件**: ~15 秒

## 🔄 持续集成

### GitHub Actions 配置
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:ci
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### 测试自动化
- 每次提交都会运行测试
- 拉取请求会运行完整测试套件
- 覆盖率报告会自动上传到 Codecov
- 测试失败会阻止合并

---

这个测试指南为 Videotape 项目提供了完整的测试策略和实现方案。通过遵循这些指导原则，可以确保项目的代码质量和稳定性。