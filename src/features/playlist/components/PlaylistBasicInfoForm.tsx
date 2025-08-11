import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "../../../../components/ui/tag-input";
import type { Playlist } from "@/db/schema";

interface PlaylistBasicInfoFormProps {
  initialData?: Partial<Playlist>;
  onSubmit: (data: Partial<Playlist>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PlaylistBasicInfoForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  className = "",
}: PlaylistBasicInfoFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当initialData变化时更新表单状态
  useEffect(() => {
    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setTags((initialData?.tags as string[]) || []);
    setIsPublic(!!(initialData?.isPublic));
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "播放列表名称不能为空";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        name: name.trim(),
        description: description.trim(),
        tags,
        isPublic,
      });
    }
  };

  return (
    <View className={`space-y-6 ${className}`}>
      <View className="space-y-2">
        <Text className="text-base font-medium">播放列表名称</Text>
        <Input
          placeholder="输入播放列表名称"
          value={name}
          onChangeText={setName}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <Text className="text-xs text-red-500">{errors.name}</Text>
        )}
      </View>

      <View className="space-y-2">
        <Text className="text-base font-medium">描述</Text>
        <Textarea
          placeholder="输入播放列表描述（可选）"
          value={description}
          onChangeText={setDescription}
          numberOfLines={4}
        />
      </View>

      <View className="space-y-2">
        <Text className="text-base font-medium">标签</Text>
        <TagInput
          placeholder="添加标签"
          tags={tags}
          onChangeTags={setTags}
        />
        <Text className="text-xs text-muted-foreground">
          添加标签以帮助分类和搜索播放列表
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-medium">公开播放列表</Text>
          <Text className="text-sm text-muted-foreground">
            其他用户可以查看此播放列表
          </Text>
        </View>
        <Switch
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />
      </View>

      <View className="flex-row gap-3 pt-4">
        {onCancel && (
          <Button
            variant="outline"
            onPress={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            <Text>取消</Text>
          </Button>
        )}
        <Button
          onPress={handleSubmit}
          className="flex-1"
          disabled={isLoading}
        >
          <Text>{isLoading ? "保存中..." : "下一步"}</Text>
        </Button>
      </View>
    </View>
  );
}