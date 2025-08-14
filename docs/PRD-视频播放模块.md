# 视频播放模块 PRD 文档

## 1. 功能概述

### 1.1 模块简介
视频播放模块是本地视频播放应用的核心播放功能模块，提供完整的视频播放、控制和交互体验。该模块基于 Expo AV API 构建，支持多种视频格式和高级播放功能，为用户提供流畅的视频播放体验。

### 1.2 业务价值
- **用户体验**: 提供类似抖音的流畅播放体验
- **技术先进性**: 采用现代化的视频播放技术栈
- **平台兼容性**: 支持 iOS 和 Android 双平台

### 1.3 目标用户
- **主要用户**: 需要观看视频的开发者
- **使用场景**: 日常观看、娱乐、信息获取

## 2. 功能需求

### 2.1 核心播放功能

#### 2.1.1 基础播放控制
**功能描述**: 提供完整的视频播放基础控制功能

**详细功能**:
- **播放/暂停**: 点击播放/暂停视频
- **停止**: 停止当前播放并重置进度
- **进度控制**: 拖拽进度条调整播放位置
- **音量控制**: 调节播放音量，支持静音
- **全屏播放**: 支持全屏模式播放
- **屏幕锁定**: 播放时防止屏幕自动锁定

**技术要求**:
- 使用 Expo AV API 实现视频播放
- 支持硬件加速解码
- 播放控制响应时间 < 100ms
- 支持后台播放

**验收标准**:
- [ ] 播放控制响应及时，无延迟感
- [ ] 进度条拖拽精确，误差 < 1秒
- [ ] 音量调节平滑，无爆音
- [ ] 全屏切换流畅，无黑屏

#### 2.1.2 高级播放功能
**功能描述**: 提供专业的视频播放高级功能

**详细功能**:
- **倍速播放**: 支持 0.25x - 4.0x 倍速调节
- **快进/快退**: 支持 5s/10s/30s 快进快退
- **AB 循环**: 设置片段循环播放
- **章节跳转**: 支持视频章节导航
- **画面缩放**: 支持画面缩放和裁剪
- **画面旋转**: 支持 90°/180°/270° 画面旋转

**技术要求**:
- 倍速播放保持音调不变
- 快进快退支持手势操作
- 循环播放无缝衔接
- 画面缩放保持清晰度

**验收标准**:
- [ ] 倍速播放音频清晰无失真
- [ ] 快进快退定位准确
- [ ] 循环播放无卡顿
- [ ] 画面缩放流畅清晰

#### 2.1.3 播放列表管理
**功能描述**: 提供智能的播放列表管理功能

**详细功能**:
- **自动播放**: 播放完成自动播放下一个
- **队列管理**: 添加、移除、排序播放队列
- **循环模式**: 单曲循环、列表循环、随机播放
- **历史记录**: 保存播放历史和进度
- **智能推荐**: 基于播放历史推荐视频
- **播放统计**: 统计播放时长和次数

**技术要求**:
- 播放列表状态持久化
- 支持大规模播放列表（1000+ 视频）
- 播放切换无延迟
- 智能推荐算法准确

**验收标准**:
- [ ] 播放列表切换流畅
- [ ] 自动播放成功率 > 95%
- [ ] 播放历史记录完整
- [ ] 推荐准确率 > 70%

### 2.2 字幕和音轨功能

#### 2.2.1 字幕支持
**功能描述**: 提供完整的字幕支持和显示功能

**详细功能**:
- **内嵌字幕**: 支持视频内嵌字幕
- **外挂字幕**: 支持 SRT、ASS、VTT 等格式字幕
- **字幕样式**: 自定义字幕字体、大小、颜色
- **字幕同步**: 调整字幕时间偏移
- **多语言字幕**: 支持多语言字幕切换
- **字幕搜索**: 在字幕内容中搜索

**技术要求**:
- 支持主流字幕格式解析
- 字幕渲染性能优化
- 字幕时间同步精确
- 支持复杂字幕样式

**验收标准**:
- [ ] 字幕显示准确无误
- [ ] 字幕时间同步精确
- [ ] 字幕样式自定义完整
- [ ] 支持至少 5 种字幕格式

#### 2.2.2 音轨选择
**功能描述**: 支持多音轨视频的音轨选择

**详细功能**:
- **音轨切换**: 在多个音轨间切换
- **音轨信息**: 显示音轨语言、格式信息
- **音频设置**: 音频均衡器、音效增强
- **声道选择**: 立体声、单声道切换
- **音频延迟**: 调整音频延迟同步
- **音量归一化**: 不同视频音量自动平衡

**技术要求**:
- 音轨切换无延迟
- 音频设置实时生效
- 音频同步精确
- 支持多种音频格式

**验收标准**:
- [ ] 音轨切换流畅
- [ ] 音频设置功能完整
- [ ] 音频同步准确
- [ ] 音质清晰无杂音

### 2.3 手势控制功能

#### 2.3.1 播放手势
**功能描述**: 提供直观的手势控制功能

**详细功能**:
- **单击**: 播放/暂停切换
- **双击**: 暂停/播放，或点赞功能
- **长按**: 倍速选择菜单
- **左右滑动**: 快进/快退
- **上下滑动**: 音量/亮度调节
- **双指缩放**: 画面缩放

**技术要求**:
- 手势识别准确率 > 95%
- 手势响应时间 < 100ms
- 支持多手势同时识别
- 手势冲突处理机制

**验收标准**:
- [ ] 手势识别准确
- [ ] 手势响应及时
- [ ] 手势操作流畅
- [ ] 无误触情况

#### 2.3.2 触感反馈
**功能描述**: 提供操作触感反馈增强用户体验

**详细功能**:
- **播放控制反馈**: 播放/暂停操作震动反馈
- **手势操作反馈**: 手势操作震动反馈
- **按钮点击反馈**: 按钮点击震动反馈
- **错误提示反馈**: 错误操作震动提示
- **自定义反馈**: 用户自定义反馈强度

**技术要求**:
- 使用 Expo Haptics API
- 反馈强度可调节
- 支持不同反馈模式
- 反馈时机准确

**验收标准**:
- [ ] 反馈时机准确
- [ ] 反馈强度适中
- [ ] 反馈模式丰富
- [ ] 可自定义设置

## 3. 技术规格

### 3.1 系统架构

#### 3.1.1 播放器架构
```
VideoPlayerModule/
├── Core/
│   ├── VideoPlayer.tsx           # 主播放器组件
│   ├── PlaybackController.tsx   # 播放控制器
│   ├── GestureHandler.tsx       # 手势处理器
│   └── SubtitleRenderer.tsx     # 字幕渲染器
├── Services/
│   ├── PlaybackService.ts        # 播放服务
│   ├── QueueService.ts          # 播放队列服务
│   ├── SubtitleService.ts       # 字幕服务
│   └── GestureService.ts        # 手势服务
├── Stores/
│   ├── PlaybackStore.ts         # 播放状态管理
│   ├── QueueStore.ts            # 队列状态管理
│   └── SettingsStore.ts         # 播放设置管理
├── Components/
│   ├── VideoControls.tsx        # 播放控制组件
│   ├── ProgressBar.tsx          # 进度条组件
│   ├── VolumeSlider.tsx         # 音量滑块组件
│   └── SpeedSelector.tsx        # 倍速选择器
└── Utils/
    ├── VideoUtils.ts            # 视频工具函数
    ├── SubtitleUtils.ts         # 字幕工具函数
    └── GestureUtils.ts          # 手势工具函数
```

#### 3.1.2 数据流设计
```
用户操作 → 手势识别 → 播放控制 → Expo AV → 视频渲染
    ↑                                              ↓
    └─────────── 状态更新 ← 播放状态 ← 音频处理 ←─────┘
```

### 3.2 接口设计

#### 3.2.1 播放控制接口
```typescript
interface PlaybackService {
  // 基础播放控制
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  
  // 位置控制
  seekTo(position: number): Promise<void>;
  seekForward(seconds: number): Promise<void>;
  seekBackward(seconds: number): Promise<void>;
  
  // 音量控制
  setVolume(volume: number): Promise<void>;
  getVolume(): Promise<number>;
  
  // 播放速度控制
  setPlaybackRate(rate: number): Promise<void>;
  getPlaybackRate(): Promise<number>;
  
  // 循环控制
  setLooping(enabled: boolean): Promise<void>;
  getLooping(): Promise<boolean>;
  
  // 状态监听
  addPlaybackListener(listener: PlaybackListener): () => void;
  removePlaybackListener(listener: PlaybackListener): void;
}
```

#### 3.2.2 播放队列接口
```typescript
interface QueueService {
  // 队列管理
  addToQueue(video: Video): Promise<void>;
  addToQueueNext(video: Video): Promise<void>;
  removeFromQueue(videoId: string): Promise<void>;
  clearQueue(): Promise<void>;
  
  // 队列控制
  playNext(): Promise<void>;
  playPrevious(): Promise<void>;
  shuffleQueue(): Promise<void>;
  repeatQueue(mode: RepeatMode): Promise<void>;
  
  // 队列查询
  getQueue(): Promise<Video[]>;
  getCurrentQueueIndex(): Promise<number>;
  getNextVideo(): Promise<Video | null>;
  getPreviousVideo(): Promise<Video | null>;
}
```

#### 3.2.3 字幕服务接口
```typescript
interface SubtitleService {
  // 字幕加载
  loadSubtitle(subtitlePath: string): Promise<Subtitle>;
  loadEmbeddedSubtitle(videoPath: string): Promise<Subtitle>;
  
  // 字幕控制
  setSubtitleEnabled(enabled: boolean): void;
  setSubtitleDelay(delay: number): void;
  setSubtitleStyle(style: SubtitleStyle): void;
  
  // 字幕查询
  getAvailableSubtitles(): Promise<SubtitleTrack[]>;
  getCurrentSubtitle(): Promise<Subtitle | null>;
  
  // 字幕搜索
  searchInSubtitles(query: string): Promise<SubtitleEntry[]>;
}
```

### 3.3 数据模型

#### 3.3.1 播放状态模型
```typescript
interface PlaybackState {
  // 基础状态
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  
  // 位置信息
  position: number; // 当前播放位置（秒）
  duration: number; // 总时长（秒）
  bufferedPosition: number; // 缓冲位置
  
  // 播放设置
  volume: number; // 0-1
  playbackRate: number; // 播放速度
  isLooping: boolean;
  isMuted: boolean;
  
  // 错误状态
  error: string | null;
  errorCode: string | null;
  
  // 设备状态
  deviceType: 'speaker' | 'headphone' | 'bluetooth';
  isBackgroundPlayback: boolean;
}
```

#### 3.3.2 字幕数据模型
```typescript
interface Subtitle {
  id: string;
  language: string;
  displayName: string;
  format: 'srt' | 'ass' | 'vtt' | 'embedded';
  isDefault: boolean;
  entries: SubtitleEntry[];
  style: SubtitleStyle;
}

interface SubtitleEntry {
  id: string;
  startTime: number; // 毫秒
  endTime: number; // 毫秒
  text: string;
  position?: {
    x: number;
    y: number;
  };
  style?: Partial<SubtitleStyle>;
}
```

### 3.4 性能要求

#### 3.4.1 播放性能
- **启动时间**: 视频首次加载 < 2秒
- **缓冲时间**: 网络视频缓冲 < 1秒
- **切换延迟**: 视频切换 < 1秒
- **内存使用**: 播放器内存使用 < 100MB
- **CPU使用**: 播放时 CPU 使用 < 30%

#### 3.4.2 渲染性能
- **帧率**: 播放帧率稳定在 30fps
- **延迟**: 手势操作到响应 < 100ms
- **电池**: 播放时电池消耗 < 10%/小时
- **发热**: 设备温度控制在合理范围

### 3.5 兼容性要求

#### 3.5.1 格式兼容性
- **视频格式**: MP4、MOV、AVI、MKV、WebM、FLV、WMV
- **音频格式**: AAC、MP3、WAV、FLAC、OGG
- **字幕格式**: SRT、ASS、VTT、SSA
- **编码格式**: H.264、H.265、VP8、VP9

#### 3.5.2 设备兼容性
- **iOS**: 支持 iOS 12+ 系统
- **Android**: 支持 Android 8.0+ 系统
- **屏幕**: 适配不同屏幕尺寸和分辨率
- **性能**: 适配不同性能设备

## 4. 用户界面设计

### 4.1 播放器界面

#### 4.1.1 主播放界面
- **视频区域**: 全屏视频显示
- **控制条**: 底部播放控制条（自动隐藏）
- **顶部栏**: 视频标题、返回按钮
- **进度条**: 可拖拽的进度条
- **控制按钮**: 播放/暂停、音量、全屏等

#### 4.1.2 控制界面
- **播放控制**: 播放/暂停、停止、上一曲/下一曲
- **进度控制**: 进度条、时间显示
- **音量控制**: 音量滑块、静音按钮
- **播放设置**: 倍速、循环、字幕等

#### 4.1.3 设置界面
- **播放设置**: 默认播放速度、音量、循环模式
- **字幕设置**: 字幕样式、语言、延迟
- **音轨设置**: 音轨选择、音频设置
- **手势设置**: 手势开关、灵敏度调节

### 4.2 交互设计

#### 4.2.1 手势交互
- **单击**: 显示/隐藏控制条
- **双击**: 播放/暂停或点赞
- **长按**: 显示倍速选择菜单
- **左右滑动**: 快进/快退
- **上下滑动**: 音量/亮度调节

#### 4.2.2 键盘交互
- **空格**: 播放/暂停
- **方向键左右**: 快进/快退
- **方向键上下**: 音量调节
- **F**: 全屏切换
- **M**: 静音切换

## 5. 测试计划

### 5.1 功能测试
- 播放控制功能测试
- 手势控制功能测试
- 字幕功能测试
- 音轨功能测试

### 5.2 性能测试
- 播放性能测试
- 内存使用测试
- 电池消耗测试
- 发热控制测试

### 5.3 兼容性测试
- 格式兼容性测试
- 设备兼容性测试
- 系统版本兼容性测试
- 分辨率适配测试

### 5.4 用户体验测试
- 操作流畅度测试
- 界面美观度测试
- 功能完整性测试
- 易用性测试

## 6. 风险评估

### 6.1 技术风险
- **格式兼容性**: 某些特殊格式可能无法正常播放
- **性能问题**: 高码率视频可能出现卡顿
- **内存泄漏**: 长时间播放可能出现内存泄漏
- **电池消耗**: 视频播放可能过度消耗电池

### 6.2 业务风险
- **用户体验**: 复杂的控制界面可能影响用户体验
- **功能缺失**: 某些高级功能可能无法实现
- **性能瓶颈**: 大量视频处理可能存在性能瓶颈
- **兼容性问题**: 不同设备可能存在兼容性问题

### 6.3 风险缓解措施
- 实现格式转换功能
- 优化播放算法和性能
- 实现内存管理机制
- 提供性能优化选项

## 7. 成功标准

### 7.1 功能标准
- [ ] 支持至少 10 种视频格式播放
- [ ] 播放控制功能完整可用
- [ ] 手势控制准确率 > 95%
- [ ] 字幕功能完整支持

### 7.2 性能标准
- [ ] 视频启动时间 < 2秒
- [ ] 播放帧率稳定在 30fps
- [ ] 内存使用 < 100MB
- [ ] 电池消耗 < 10%/小时

### 7.3 用户满意度标准
- [ ] 用户操作流畅度评分 > 4.5
- [ ] 界面美观度评分 > 4.0
- [ ] 功能完整性评分 > 4.0
- [ ] 整体满意度 > 4.0

## 8. 附录

### 8.1 术语表
- **播放控制**: 控制视频播放的各种操作
- **手势控制**: 通过手势操作控制播放
- **字幕**: 视频的文字说明
- **音轨**: 视频的音频轨道

### 8.2 参考资料
- [Expo AV 文档](https://docs.expo.dev/versions/latest/sdk/av/)
- [React Native Gesture Handler 文档](https://docs.swmansion.com/react-native-gesture-handler/)
- [Expo Haptics 文档](https://docs.expo.dev/versions/latest/sdk/haptics/)

### 8.3 相关工具
- **视频播放**: Expo AV
- **手势处理**: React Native Gesture Handler
- **触感反馈**: Expo Haptics
- **状态管理**: Zustand

---

**文档版本**: 1.0  
**创建日期**: 2025-08-10  
**最后更新**: 2025-08-10  
**负责人**: 蜂群思维系统  
**状态**: 草案