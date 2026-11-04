import React from 'react';
import { View, ViewStyle } from 'react-native';
import tw from 'twrnc';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <View style={[tw`bg-white rounded-2xl p-4 my-1.5 border border-slate-200 shadow-sm`, style]}>
      {children}
    </View>
  );
};
