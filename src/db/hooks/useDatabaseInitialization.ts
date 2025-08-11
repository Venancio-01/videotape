import { useState, useEffect } from 'react';
import { databaseManager } from '../database-manager';

interface DatabaseInitializationState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  retryCount: number;
  initialize: () => Promise<void>;
  reinitialize: () => Promise<void>;
}

export function useDatabaseInitialization(): DatabaseInitializationState {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const initializeDatabase = async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      console.log(`Initializing database (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      
      // 初始化数据库
      await databaseManager.initialize();
      
      // 运行迁移
      await databaseManager.runMigrations();

      console.log('Database initialized and migrations completed successfully');
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error(`Database initialization failed (attempt ${retryCount + 1}):`, err);
      
      if (retryCount < MAX_RETRIES - 1) {
        // 延迟重试
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000 * (retryCount + 1)); // 递增延迟
      } else {
        setError(
          err instanceof Error
            ? err
            : new Error('Database initialization failed after multiple attempts'),
        );
        setIsInitialized(false);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const reinitializeDatabase = async () => {
    setIsInitialized(false);
    setError(null);
    setRetryCount(0);
    
    // 等待状态更新后再初始化
    setTimeout(initializeDatabase, 100);
  };

  useEffect(() => {
    if (!isInitialized && !isInitializing && retryCount < MAX_RETRIES) {
      initializeDatabase();
    }
  }, [isInitialized, isInitializing, retryCount]);

  return {
    isInitialized,
    isInitializing,
    error,
    retryCount,
    initialize: initializeDatabase,
    reinitialize: reinitializeDatabase,
  };
}