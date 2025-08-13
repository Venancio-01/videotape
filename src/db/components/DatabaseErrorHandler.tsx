import { useDatabaseInitialization } from "@/db/hooks/useDatabaseInitialization";
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DatabaseErrorHandlerProps {
  children: React.ReactNode;
}

export function DatabaseErrorHandler({ children }: DatabaseErrorHandlerProps) {
  const { isInitialized, isInitializing, error, retryCount, reinitialize } =
    useDatabaseInitialization();
  const MAX_RETRIES = 3;

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            正在初始化数据库 ({retryCount + 1}/{MAX_RETRIES})
          </Text>
        </View>
      </View>
    );
  }

  if (error && retryCount >= MAX_RETRIES) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>数据库初始化失败</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Text style={styles.errorDetails}>
            这可能是由于权限问题或存储空间不足导致的。请确保应用有足够的权限访问存储空间。
          </Text>
          <TouchableOpacity onPress={reinitialize} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>重试初始化</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  errorDetails: {
    fontSize: 14,
    color: "#888",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
