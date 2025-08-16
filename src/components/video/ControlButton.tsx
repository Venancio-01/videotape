import { Text } from "@/components/ui/text";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface ControlButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  text?: string;
  isActive?: boolean;
  className?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  onPress,
  icon,
  text,
  isActive = false,
  className = "",
}) => {
  return (
    <TouchableOpacity onPress={onPress} className="items-center z-20" activeOpacity={0.8}>
      <View 
        className={`
          bg-black/50 rounded-full p-3 mb-1 transition-colors
          ${isActive ? 'bg-blue-500/50' : ''}
          ${className}
        `}
      >
        {icon}
      </View>
      {text && <Text className="text-white text-xs">{text}</Text>}
    </TouchableOpacity>
  );
};