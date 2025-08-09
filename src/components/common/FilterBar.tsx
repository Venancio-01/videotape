import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterOptions } from '@/types';
import { useStore } from '@/stores/store/store';

interface FilterBarProps {
  filterOptions?: FilterOptions;
  onFilterChange?: (options: FilterOptions) => void;
  style?: any;
}

/**
 * 筛选栏组件
 */
export const FilterBar: React.FC<FilterBarProps> = ({ filterOptions, onFilterChange, style }) => {
  const { currentFilter, setCurrentFilter } = useStore();

  // 排序选项
  const sortOptions = [
    { value: 'date', label: '时间', icon: 'calendar' },
    { value: 'name', label: '名称', icon: 'text' },
    { value: 'duration', label: '时长', icon: 'time' },
    { value: 'size', label: '大小', icon: 'document' },
    { value: 'playCount', label: '播放次数', icon: 'play' },
  ];

  // 筛选选项
  const filterByOptions = [
    { value: 'all', label: '全部', icon: 'grid' },
    { value: 'favorites', label: '收藏', icon: 'heart' },
    { value: 'recent', label: '最近', icon: 'clock' },
  ];

  // 排序方向选项
  const sortOrderOptions = [
    { value: 'desc', label: '降序', icon: 'arrow-down' },
    { value: 'asc', label: '升序', icon: 'arrow-up' },
  ];

  // 处理排序变化
  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    const newFilter = {
      ...currentFilter,
      sortBy,
    };
    setCurrentFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  // 处理筛选变化
  const handleFilterByChange = (filterBy: FilterOptions['filterBy']) => {
    const newFilter = {
      ...currentFilter,
      filterBy,
    };
    setCurrentFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  // 处理排序方向变化
  const handleSortOrderChange = (sortOrder: FilterOptions['sortOrder']) => {
    const newFilter = {
      ...currentFilter,
      sortOrder,
    };
    setCurrentFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    filterSection: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 12,
      color: '#666',
      marginBottom: 8,
      fontWeight: '500',
    },
    optionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    optionButtonActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    optionIcon: {
      marginRight: 4,
    },
    optionText: {
      fontSize: 12,
      color: '#666',
    },
    optionTextActive: {
      color: '#fff',
    },
    divider: {
      height: 1,
      backgroundColor: '#e0e0e0',
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* 排序选项 */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>排序方式</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionsContainer}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                currentFilter.sortBy === option.value && styles.optionButtonActive,
              ]}
              onPress={() => handleSortChange(option.value as FilterOptions['sortBy'])}>
              <Ionicons
                name={option.icon as any}
                size={14}
                style={[
                  styles.optionIcon,
                  currentFilter.sortBy === option.value && { color: '#fff' },
                ]}
                color={currentFilter.sortBy === option.value ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.optionText,
                  currentFilter.sortBy === option.value && styles.optionTextActive,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* 筛选选项 */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>筛选条件</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionsContainer}>
          {filterByOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                currentFilter.filterBy === option.value && styles.optionButtonActive,
              ]}
              onPress={() => handleFilterByChange(option.value as FilterOptions['filterBy'])}>
              <Ionicons
                name={option.icon as any}
                size={14}
                style={[
                  styles.optionIcon,
                  currentFilter.filterBy === option.value && { color: '#fff' },
                ]}
                color={currentFilter.filterBy === option.value ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.optionText,
                  currentFilter.filterBy === option.value && styles.optionTextActive,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* 排序方向 */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>排序方向</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionsContainer}>
          {sortOrderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                currentFilter.sortOrder === option.value && styles.optionButtonActive,
              ]}
              onPress={() => handleSortOrderChange(option.value as FilterOptions['sortOrder'])}>
              <Ionicons
                name={option.icon as any}
                size={14}
                style={[
                  styles.optionIcon,
                  currentFilter.sortOrder === option.value && { color: '#fff' },
                ]}
                color={currentFilter.sortOrder === option.value ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.optionText,
                  currentFilter.sortOrder === option.value && styles.optionTextActive,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};
