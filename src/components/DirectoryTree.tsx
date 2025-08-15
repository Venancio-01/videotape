/**
 * 目录树组件
 * 用于展示媒体文件目录结构并支持多选
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { MediaFileService } from "@/services/mediaFileService";
import type { DirectoryNode } from "@/services/mediaFileService";
import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from "lucide-react-native";

const { width: screenWidth } = Dimensions.get("window");

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
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onNodeSelect, onNodeExpand }) => {
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

  const getIndentation = () => ({
    marginLeft: level * 20,
  });

  const getIcon = () => {
    if (isDirectory) {
      if (node.isExpanded && hasChildren) {
        return <FolderOpen size={16} className="text-blue-500" />;
      } else {
        return <Folder size={16} className="text-blue-500" />;
      }
    } else {
      return <File size={16} className="text-gray-500" />;
    }
  };

  const getExpandIcon = () => {
    if (!isDirectory || !hasChildren) {
      return <View style={styles.expandIconPlaceholder} />;
    }
    
    return node.isExpanded ? (
      <ChevronDown size={14} className="text-gray-400" />
    ) : (
      <ChevronRight size={14} className="text-gray-400" />
    );
  };

  const getSubtitle = () => {
    if (isDirectory) {
      const fileCount = node.itemCount;
      const sizeText = node.totalSize ? mediaService.formatFileSize(node.totalSize) : "";
      const durationText = node.totalDuration ? mediaService.formatDuration(node.totalDuration) : "";
      
      const parts = [];
      if (fileCount > 0) parts.push(`${fileCount} 项`);
      if (sizeText) parts.push(sizeText);
      if (durationText) parts.push(durationText);
      
      return parts.join(" • ");
    } else if (node.mediaFile) {
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

  return (
    <View style={styles.nodeContainer}>
      <TouchableOpacity
        style={[styles.nodeContent, getIndentation()]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <View style={styles.expandIcon}>
            {getExpandIcon()}
          </View>
          <View style={styles.icon}>
            {getIcon()}
          </View>
          <View style={styles.checkbox}>
            <Checkbox
              checked={node.isSelected}
              onCheckedChange={(checked) => {
                if (onNodeSelect) {
                  // 创建副本以避免直接修改状态
                  const nodeCopy = { ...node, isSelected: checked as boolean };
                  onNodeSelect(nodeCopy);
                }
              }}
              onPress={() => {
                // 阻止 Checkbox 的 onPress 事件冒泡
                return false;
              }}
            />
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text
            style={styles.nodeName}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {node.name}
          </Text>
          {getSubtitle() ? (
            <Text style={styles.nodeSubtitle} numberOfLines={1}>
              {getSubtitle()}
            </Text>
          ) : null}
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
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set(["root"]));
  const [selectedNodes, setSelectedNodes] = React.useState<Set<string>>(new Set());

  const mediaService = MediaFileService.getInstance();

  const handleNodeExpand = (node: DirectoryNode) => {
    setExpandedNodes(prev => {
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
    // 更新节点选中状态
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(node.id)) {
      newSelected.delete(node.id);
    } else {
      newSelected.add(node.id);
    }
    setSelectedNodes(newSelected);

    // 通知父组件选中状态变化
    if (onSelectionChange) {
      const selectedFiles = mediaService.getSelectedFiles({
        ...treeData,
        isSelected: true,
      });
      onSelectionChange(selectedFiles);
    }
  };

  const renderTree = (node: DirectoryNode, level: number = 0): React.ReactNode => {
    if (level > maxDepth) return null;

    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodes.has(node.id);

    // 更新节点状态
    const updatedNode = {
      ...node,
      isExpanded,
      isSelected,
    };

    return (
      <View key={node.id}>
        <TreeNode
          node={updatedNode}
          level={level}
          onNodeSelect={handleNodeSelect}
          onNodeExpand={handleNodeExpand}
        />
        
        {isExpanded && node.children && (
          <View>
            {node.children.map(child => renderTree(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderTree(treeData)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  nodeContainer: {
    backgroundColor: "#ffffff",
  },
  nodeContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  expandIcon: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  expandIconPlaceholder: {
    width: 20,
  },
  icon: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  nodeName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  nodeSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
});

export default DirectoryTree;