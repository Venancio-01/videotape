/**
 * 目录树组件
 * 用于展示媒体文件目录结构并支持多选
 */

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MediaFileService } from "@/services/mediaFileService";
import type { DirectoryNode } from "@/services/mediaFileService";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderClosed,
  FolderOpen,
  Minus,
  Music,
  Video,
} from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DirectoryTreeProps {
  treeData: DirectoryNode;
  onSelectionChange?: (selectedFiles: any[]) => void;
  maxDepth?: number;
}

interface TreeNodeProps {
  node: DirectoryNode;
  level: number;
  onNodeSelect?: (node: DirectoryNode) => void;
  onNodeExpand?: (node: DirectoryNode) => void;
  checkboxState?: "checked" | "unchecked" | "indeterminate";
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onNodeSelect,
  onNodeExpand,
  checkboxState = "unchecked",
}) => {
  const mediaService = MediaFileService.getInstance();
  const isDirectory = node.type === "directory";
  const hasChildren = isDirectory && node.children && node.children.length > 0;

  const handlePress = () => {
    if (isDirectory && hasChildren) {
      onNodeExpand?.(node);
    } else {
      onNodeSelect?.(node);
    }
  };

  const getIcon = () => {
    if (isDirectory) {
      if (node.isExpanded && hasChildren) {
        return <FolderOpen size={16} className="text-primary" />;
      }
      return <FolderOpen size={16} className="text-primary" />;
    }
    // 根据媒体文件类型显示不同的图标
    if (node.mediaFile) {
      switch (node.mediaFile.mediaType) {
        case "video":
          return <Video size={16} className="text-primary" />;
        case "audio":
          return <Music size={16} className="text-primary" />;
        default:
          return <File size={16} className="text-muted-foreground" />;
      }
    }

    return <File size={16} className="text-muted-foreground" />;
  };

  const getExpandIcon = () => {
    if (!isDirectory) {
      return <View className="w-5" />;
    }

    if (!hasChildren) {
      return <View className="w-5" />;
    }

    return node.isExpanded ? (
      <ChevronDown size={14} className="text-muted-foreground" />
    ) : (
      <ChevronRight size={14} className="text-muted-foreground" />
    );
  };

  const getSubtitle = () => {
    if (isDirectory) {
      const fileCount = node.itemCount;
      const sizeText = node.totalSize
        ? mediaService.formatFileSize(node.totalSize)
        : "";
      const durationText = node.totalDuration
        ? mediaService.formatDuration(node.totalDuration)
        : "";

      const parts = [];
      if (fileCount > 0) parts.push(`${fileCount} 项`);
      if (sizeText) parts.push(sizeText);
      if (durationText) parts.push(durationText);

      return parts.join(" • ");
    }
    if (node.mediaFile) {
      const parts = [];
      if (node.mediaFile.fileSize) {
        parts.push(mediaService.formatFileSize(node.mediaFile.fileSize));
      }
      if (node.mediaFile.duration > 0) {
        parts.push(mediaService.formatDuration(node.mediaFile.duration));
      }
      if (node.mediaFile.width && node.mediaFile.height) {
        parts.push(`${node.mediaFile.width}×${node.mediaFile.height}`);
      }
      return parts.join(" • ");
    }
    return "";
  };

  const isChecked = checkboxState === "checked";
  const isIndeterminate = checkboxState === "indeterminate";

  return (
    <View className="bg-card">
      <TouchableOpacity
        className={cn(
          "flex-row items-center py-3 px-4 min-h-[48px] active:bg-accent/50",
        )}
        style={{ marginLeft: level * 20 }}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center mr-3">
          <View className="w-5 items-center justify-center">
            {getExpandIcon()}
          </View>
          <View className="w-5 items-center justify-center">{getIcon()}</View>
        </View>

        <View className="flex-1 justify-center">
          <Text
            className="text-base font-medium text-foreground"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {node.name}
          </Text>
          {getSubtitle() ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {getSubtitle()}
            </Text>
          ) : null}
        </View>

        <View className="w-6 items-center justify-center ml-2">
          {isIndeterminate ? (
            <View className="w-5 border-2 border-primary rounded-sm items-center justify-center bg-primary">
              <Minus
                size={16}
                className="text-primary-foreground"
                strokeWidth={3}
              />
            </View>
          ) : (
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => {
                if (onNodeSelect) {
                  const nodeCopy = { ...node, isSelected: checked as boolean };
                  onNodeSelect(nodeCopy);
                }
              }}
              onPress={() => {
                return false;
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  treeData,
  onSelectionChange,
  maxDepth = 10,
}) => {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    new Set(["root"]),
  );
  const [selectedNodes, setSelectedNodes] = React.useState<Set<string>>(
    new Set(),
  );

  const mediaService = MediaFileService.getInstance();

  // 获取节点的所有子节点ID（包括递归的子节点）
  const getAllDescendantIds = (node: DirectoryNode): string[] => {
    const ids: string[] = [];

    if (node.children) {
      for (const child of node.children) {
        ids.push(child.id);
        if (child.type === "directory") {
          ids.push(...getAllDescendantIds(child));
        }
      }
    }

    return ids;
  };

  // 获取节点的所有文件子节点ID
  const getAllFileDescendantIds = (node: DirectoryNode): string[] => {
    const ids: string[] = [];

    if (node.children) {
      for (const child of node.children) {
        if (child.type === "file") {
          ids.push(child.id);
        } else if (child.type === "directory") {
          ids.push(...getAllFileDescendantIds(child));
        }
      }
    }

    return ids;
  };

  // 计算节点的checkbox状态
  const calculateCheckboxState = (
    node: DirectoryNode,
  ): "checked" | "unchecked" | "indeterminate" => {
    if (node.type === "file") {
      return selectedNodes.has(node.id) ? "checked" : "unchecked";
    }

    // 对于目录，检查所有子文件的选择状态
    const allFileIds = getAllFileDescendantIds(node);
    if (allFileIds.length === 0) {
      return "unchecked";
    }

    const selectedFileIds = allFileIds.filter((id) => selectedNodes.has(id));

    if (selectedFileIds.length === 0) {
      return "unchecked";
    }
    if (selectedFileIds.length === allFileIds.length) {
      return "checked";
    }
    return "indeterminate";
  };

  // 更新节点及其所有子节点的选择状态
  const updateNodeAndChildrenSelection = (
    node: DirectoryNode,
    isSelected: boolean,
    selectedSet: Set<string>,
  ): Set<string> => {
    const newSet = new Set(selectedSet);

    if (isSelected) {
      // 选中节点：如果是目录，选中所有文件子节点；如果是文件，只选中自己
      if (node.type === "file") {
        newSet.add(node.id);
      } else {
        const allFileIds = getAllFileDescendantIds(node);
        allFileIds.forEach((id) => newSet.add(id));
      }
    } else {
      // 取消选中：移除节点及其所有子节点
      const allDescendantIds = getAllDescendantIds(node);
      allDescendantIds.forEach((id) => newSet.delete(id));
      if (node.type === "file") {
        newSet.delete(node.id);
      }
    }

    return newSet;
  };

  const handleNodeExpand = (node: DirectoryNode) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
  };

  const handleNodeSelect = (node: DirectoryNode) => {
    // 计算新的选择状态（取反）
    const currentState = calculateCheckboxState(node);
    const newState = currentState !== "checked";

    // 更新节点及其子节点的选择状态
    const newSelected = updateNodeAndChildrenSelection(
      node,
      newState,
      selectedNodes,
    );
    setSelectedNodes(newSelected);

    // 通知父组件选中状态变化
    if (onSelectionChange) {
      const selectedFiles = mediaService.getSelectedFiles(
        {
          ...treeData,
          isSelected: true,
        },
        newSelected,
      );
      onSelectionChange(selectedFiles);
    }
  };

  const renderTree = (node: DirectoryNode, level = 0): React.ReactNode => {
    if (level > maxDepth) return null;

    const isExpanded = expandedNodes.has(node.id);
    const checkboxState = calculateCheckboxState(node);

    // 更新节点状态
    const updatedNode = {
      ...node,
      isExpanded,
      isSelected: checkboxState === "checked",
    };

    return (
      <View key={node.id}>
        <TreeNode
          node={updatedNode}
          level={level}
          onNodeSelect={handleNodeSelect}
          onNodeExpand={handleNodeExpand}
          checkboxState={checkboxState}
        />

        {isExpanded && node.children && (
          <View>
            {node.children.map((child) => renderTree(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return <View className="flex-1">{renderTree(treeData)}</View>;
};

export default DirectoryTree;
