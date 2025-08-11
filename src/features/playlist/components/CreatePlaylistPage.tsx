import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../components/ui/button";
import { Text } from "../../../components/ui/text";
import { Card } from "../../../components/ui/card";
import { PlaylistBasicInfoForm } from "./PlaylistBasicInfoForm";
import { VideoDirectorySelector } from "./VideoDirectorySelector";
import type { CreatePlaylistForm } from "../types/playlist";

export function CreatePlaylistPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreatePlaylistForm>({
    name: "",
    description: "",
    isPublic: false,
    tags: [],
    selectionMode: "files",
    selectedFiles: [],
    selectedDirectory: null,
    directoryVideos: [],
  });

  const steps = [
    { title: "基本信息", component: PlaylistBasicInfoForm },
    { title: "选择视频", component: VideoDirectorySelector },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSubmit = () => {
    // 这里将实现表单提交逻辑
    console.log("提交播放列表创建表单:", formData);
    // 提交成功后导航回播放列表页面
    router.back();
  };

  const updateFormData = (data: Partial<CreatePlaylistForm>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="title" style={styles.title}>
            创建播放列表
          </Text>
          <Text variant="body" style={styles.stepIndicator}>
            步骤 {currentStep + 1}/{steps.length}: {steps[currentStep].title}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          <CurrentStepComponent
            data={formData}
            onChange={updateFormData}
          />
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 0 && (
            <Button
              variant="outline"
              style={styles.button}
              onPress={handlePrevious}
            >
              上一步
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button style={styles.button} onPress={handleNext}>
              下一步
            </Button>
          ) : (
            <Button style={styles.button} onPress={handleFormSubmit}>
              创建播放列表
            </Button>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    marginBottom: 4,
  },
  stepIndicator: {
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
});