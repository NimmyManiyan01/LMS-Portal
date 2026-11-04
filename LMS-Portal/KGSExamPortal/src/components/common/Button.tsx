import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import tw from 'twrnc';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  // Dynamic inline Tailwind CSS utility string resolver
  const getContainerClasses = () => {
    if (disabled) return 'bg-slate-200 border-slate-300';
    switch (variant) {
      case 'secondary':
        return 'bg-slate-600';
      case 'danger':
        return 'bg-red-600';
      case 'outline':
        return 'bg-transparent border-2 border-blue-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getTextClasses = () => {
    if (disabled) return 'text-slate-400';
    switch (variant) {
      case 'outline':
        return 'text-blue-600';
      default:
        return 'text-white';
    }
  };

  const spinnerColor = disabled
    ? '#94A3B8'
    : variant === 'outline'
    ? '#2563EB'
    : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[
        tw`h-12 px-5 py-3 rounded-xl flex-row items-center justify-center my-1.5 ${getContainerClasses()}`,
        disabled && tw`opacity-70`,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text
          style={[
            tw`text-base font-bold tracking-wide text-center ${getTextClasses()}`,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
