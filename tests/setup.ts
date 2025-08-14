import { afterEach, vi } from "vitest";

// Mock React Native modules
vi.mock("react-native/Libraries/Utilities/Platform", () => ({
  OS: "android",
  select: () => "android",
}));

vi.mock("react-native/Libraries/Utilities/Dimensions", () => ({
  get: () => ({ width: 375, height: 667 }),
}));

vi.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    mergeItem: vi.fn(),
    clear: vi.fn(),
    getAllKeys: vi.fn(),
    multiGet: vi.fn(),
    multiSet: vi.fn(),
    multiRemove: vi.fn(),
    multiMerge: vi.fn(),
  },
}));

// Mock MMKV
vi.mock("react-native-mmkv", () => ({
  default: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    getAllKeys: vi.fn(),
    clearAll: vi.fn(),
    contains: vi.fn(),
    recrypt: vi.fn(),
  })),
}));

// Mock SafeAreaContext
vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo-router
vi.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    canGoBack: () => false,
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  useNavigation: () => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
  }),
}));

// Mock NativeWind
vi.mock("nativewind", () => ({
  useColorScheme: () => "light",
}));

// Mock database
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: vi.fn(),
  },
}));

// Global test setup
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};

// Setup global test timeout
vi.setConfig({
  testTimeout: 10000,
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
