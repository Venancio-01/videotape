import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function UploadScreen() {
  return (
    <View style={styles.container}>
      <StatusBar hidden={false} style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>上传视频</Text>
        <Text style={styles.description}>这里将显示视频上传界面</Text>
        <Link href="/" asChild>
          <View style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>返回</Text>
          </View>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
});