import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock React Native components
vi.mock("react-native", () => ({
  ...require("react-native"),
  // Add any specific mocks needed
}));

// Mock Expo Router
vi.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
}));

// Mock nativewind
vi.mock("nativewind", () => ({
  useColorScheme: () => ({
    colorScheme: "light",
    setColorScheme: vi.fn(),
  }),
}));

// Mock FlashList
vi.mock("@shopify/flash-list", () => ({
  FlashList: ({ data, renderItem }: any) => {
    return data.map((item: any, index: number) => 
      renderItem({ item, index })
    );
  },
}));

// Mock Drizzle SQLite
vi.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: () => ({ data: [] }),
}));

// Mock database service
vi.mock("@/db/database-service", () => ({
  databaseService: {
    createPlaylist: vi.fn(),
  },
}));
