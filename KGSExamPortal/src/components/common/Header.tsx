import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        tw`bg-white pb-3 px-4 border-b border-slate-200 shadow-sm`,
        { paddingTop: Math.max(insets.top, 12) },
      ]}
    >
      <View style={tw`flex-row items-center justify-between min-h-11`}>
        <View style={tw`flex-row items-center flex-1 mr-2`}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={tw`mr-2.5 p-1.5`}
              activeOpacity={0.8}
            >
              <Text style={tw`text-blue-600 text-2xl font-extrabold`}>←</Text>
            </TouchableOpacity>
          )}
          <View style={tw`flex-1`}>
            <Text style={tw`text-slate-900 text-lg font-extrabold`} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={tw`text-slate-500 text-xs font-semibold mt-0.5`} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {rightElement && <View>{rightElement}</View>}
      </View>
    </View>
  );
};
