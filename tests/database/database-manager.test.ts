import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../database-manager';
import * as FileSystem from 'expo-file-system';

// Mock expo-file-system
vi.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/com.example.app/files/',
  makeDirectoryAsync: vi.fn(),
  deleteAsync: vi.fn(),
  getInfoAsync: vi.fn(),
}));

// Mock expo-sqlite
vi.mock('expo-sqlite', () => ({
  openDatabaseSync: vi.fn(),
}));

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;
  let mockOpenDatabaseSync: any;
  let mockMakeDirectoryAsync: any;
  let mockDeleteAsync: any;
  let mockGetInfoAsync: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get mock functions
    mockOpenDatabaseSync = require('expo-sqlite').openDatabaseSync;
    mockMakeDirectoryAsync = require('expo-file-system').makeDirectoryAsync;
    mockDeleteAsync = require('expo-file-system').deleteAsync;
    mockGetInfoAsync = require('expo-file-system').getInfoAsync;
    
    // Setup default mock behaviors
    mockMakeDirectoryAsync.mockResolvedValue(undefined);
    mockDeleteAsync.mockResolvedValue(undefined);
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
    
    // Create mock database instance
    const mockExpoDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
    };
    mockOpenDatabaseSync.mockReturnValue(mockExpoDb);
    
    // Create new instance for each test
    dbManager = DatabaseManager.getInstance();
  });

  afterEach(() => {
    // Reset instance
    (DatabaseManager as any).instance = null;
  });

  describe('initialize', () => {
    it('should initialize database successfully', async () => {
      // Mock successful database operations
      const mockExpoDb = {
        execAsync: vi.fn().mockResolvedValue(undefined),
      };
      mockOpenDatabaseSync.mockReturnValue(mockExpoDb);

      const result = await dbManager.initialize();

      expect(result).toBeDefined();
      expect(mockOpenDatabaseSync).toHaveBeenCalledWith('videotape.db', {
        enableChangeListener: true,
      });
      expect(mockExpoDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
      expect(mockExpoDb.execAsync).toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');
      expect(mockExpoDb.execAsync).toHaveBeenCalledWith('SELECT 1;');
    });

    it('should handle initialization failure and retry', async () => {
      // Mock initial failure
      mockOpenDatabaseSync.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Mock successful cleanup and retry
      mockDeleteAsync.mockResolvedValue(undefined);
      mockMakeDirectoryAsync.mockResolvedValue(undefined);
      
      // Mock successful database on retry
      const mockExpoDb = {
        execAsync: vi.fn().mockResolvedValue(undefined),
      };
      mockOpenDatabaseSync.mockReturnValue(mockExpoDb);

      try {
        await dbManager.initialize();
        // Should not reach here due to retry logic
      } catch (error) {
        expect(error).toBeDefined();
        expect(mockDeleteAsync).toHaveBeenCalled();
      }
    });

    it('should ensure document directory exists', async () => {
      const mockExpoDb = {
        execAsync: vi.fn().mockResolvedValue(undefined),
      };
      mockOpenDatabaseSync.mockReturnValue(mockExpoDb);

      await dbManager.initialize();

      expect(mockMakeDirectoryAsync).toHaveBeenCalledWith(
        'data/user/0/com.example.app/files/',
        { intermediates: true }
      );
    });
  });

  describe('getDatabase', () => {
    it('should return database instance when initialized', async () => {
      const mockExpoDb = {
        execAsync: vi.fn().mockResolvedValue(undefined),
      };
      mockOpenDatabaseSync.mockReturnValue(mockExpoDb);

      await dbManager.initialize();
      const db = dbManager.getDatabase();

      expect(db).toBeDefined();
    });

    it('should throw error when not initialized', () => {
      expect(() => {
        dbManager.getDatabase();
      }).toThrow('Database not initialized. Call initialize() first.');
    });
  });

  describe('cleanupAndReinitialize', () => {
    it('should cleanup and reinitialize database', async () => {
      const mockExpoDb = {
        execAsync: vi.fn().mockResolvedValue(undefined),
      };
      mockOpenDatabaseSync.mockReturnValue(mockExpoDb);

      // Access private method for testing
      const cleanupMethod = (dbManager as any).cleanupAndReinitialize.bind(dbManager);
      
      await cleanupMethod();

      expect(mockDeleteAsync).toHaveBeenCalledWith('file:///data/user/0/com.example.app/files/videotape.db');
      expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(2); // Once for cleanup, once for reinit
    });
  });
});