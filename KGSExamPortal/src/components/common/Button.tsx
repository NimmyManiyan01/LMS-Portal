import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Tailwind CSS Design Tokens for React Native Button
 * - primary: bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm
 * - secondary: bg-slate-600 text-white rounded-xl
 * - danger: bg-red-600 text-white rounded-xl
 * - outline: bg-transparent border-2 border-blue-600 text-blue-600 rounded-xl
 * - disabled: bg-slate-200 text-slate-400 border-slate-200
 */
const tailwindStyles = StyleSheet.create({
  // Base button: h-12 px-5 py-3 rounded-xl flex-row items-center justify-center my-1.5
  baseButton: {
    height: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12, // rounded-xl
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6, // my-1.5
  },

  // Variants
  primaryButton: {
    backgroundColor: '#2563EB', // bg-blue-600
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  secondaryButton: {
    backgroundColor: '#475569', // bg-slate-600
  },
  dangerButton: {
    backgroundColor: '#DC2626', // bg-red-600
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2, // border-2
    borderColor: '#2563EB', // border-blue-600
  },
  disabledButton: {
    backgroundColor: '#E2E8F0', // bg-slate-200
    borderColor: '#CBD5E1', // border-slate-300
    shadowOpacity: 0,
  },

  // Base text: text-base font-bold tracking-wide
  baseText: {
    fontSize: 15, // text-base
    fontWeight: '800', // font-bold
    letterSpacing: 0.5, // tracking-wide
    textAlign: 'center',
  },

  // Text Variants
  primaryText: {
    color: '#FFFFFF', // text-white
  },
  secondaryText: {
    color: '#FFFFFF', // text-white
  },
  dangerText: {
    color: '#FFFFFF', // text-white
  },
  outlineText: {
    color: '#2563EB', // text-blue-600
  },
  disabledText: {
    color: '#94A3B8', // text-slate-400
  },
});

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    if (disabled) return tailwindStyles.disabledButton;
    switch (variant) {
      case 'secondary':
        return tailwindStyles.secondaryButton;
      case 'danger':
        return tailwindStyles.dangerButton;
      case 'outline':
        return tailwindStyles.outlineButton;
      default:
        return tailwindStyles.primaryButton;
    }
  };

  const getTextStyle = () => {
    if (disabled) return tailwindStyles.disabledText;
    switch (variant) {
      case 'secondary':
        return tailwindStyles.secondaryText;
      case 'danger':
        return tailwindStyles.dangerText;
      case 'outline':
        return tailwindStyles.outlineText;
      default:
        return tailwindStyles.primaryText;
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
        tailwindStyles.baseButton,
        getButtonStyle(),
        disabled && { opacity: 0.7 }, // opacity-70
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
            tailwindStyles.baseText,
            getTextStyle(),
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
