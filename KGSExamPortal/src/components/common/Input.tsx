import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
} from 'react-native';
import tw from 'twrnc';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required,
  style,
  ...props
}) => {
  return (
    <View style={tw`my-2`}>
      <Text style={tw`text-sm font-semibold text-slate-700 mb-1.5`}>
        {label} {required && <Text style={tw`text-red-500`}>*</Text>}
      </Text>
      <TextInput
        style={[
          tw`h-12 border border-slate-300 rounded-xl px-3.5 text-base text-slate-900 bg-white`,
          error ? tw`border-red-500 bg-red-50` : null,
          style,
        ]}
        placeholderTextColor="#64748B"
        {...props}
      />
      {error ? (
        <Text style={tw`text-xs font-semibold text-red-500 mt-1`}>{error}</Text>
      ) : null}
    </View>
  );
};
