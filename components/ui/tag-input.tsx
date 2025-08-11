import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import type { ViewStyle } from "react-native";

interface TagInputProps {
  tags: string[];
  onChangeTags: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  style?: ViewStyle;
}

export function TagInput({
  tags,
  onChangeTags,
  placeholder = "添加标签...",
  className = "",
  style,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChangeTags([...tags, trimmedValue]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChangeTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === "Enter" || e.nativeEvent.key === ",") {
      addTag();
    }
  };

  return (
    <View style={[styles.container, style]} className={className}>
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <Pressable 
              onPress={() => removeTag(tag)} 
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      
      <Input
        value={inputValue}
        onChangeText={setInputValue}
        onSubmitEditing={addTag}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="mt-2"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b7280",
  },
});