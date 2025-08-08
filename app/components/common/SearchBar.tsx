import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/store';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: any;
  autoFocus?: boolean;
  showClearButton?: boolean;
}

/**
 * 搜索栏组件
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '搜索视频...',
  onSearch,
  onClear,
  onFocus,
  onBlur,
  style,
  autoFocus = false,
  showClearButton = true,
}) => {
  const { searchQuery, setSearchQuery } = useStore();
  const [value, setValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  // 处理文本变化
  const handleChangeText = (text: string) => {
    setValue(text);
    setSearchQuery(text);
    onSearch?.(text);
  };

  // 处理清除
  const handleClear = () => {
    setValue('');
    setSearchQuery('');
    onClear?.();
  };

  // 处理焦点
  const handleFocus = () => {
    setIsFocused(true);
    setShowCancel(true);
    onFocus?.();
  };

  // 处理失去焦点
  const handleBlur = () => {
    setIsFocused(false);
    setShowCancel(false);
    onBlur?.();
  };

  // 处理取消
  const handleCancel = () => {
    setValue('');
    setSearchQuery('');
    setShowCancel(false);
    onClear?.();
  };

  // 监听外部搜索查询变化
  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    containerFocused: {
      backgroundColor: '#e8e8e8',
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: '#333',
      paddingVertical: 4,
    },
    clearButton: {
      marginLeft: 8,
      padding: 4,
    },
    cancelButton: {
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    cancelText: {
      fontSize: 16,
      color: '#007AFF',
    },
  });

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, style]}>
      <Ionicons
        name="search"
        size={20}
        color="#666"
        style={styles.searchIcon}
      />
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={() => onSearch?.(value)}
      />
      
      {showClearButton && value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
        >
          <Ionicons name="close-circle" size={18} color="#999" />
        </TouchableOpacity>
      )}
      
      {showCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};