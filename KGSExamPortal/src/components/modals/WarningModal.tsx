import React from 'react';
import { View, Text, Modal } from 'react-native';
import tw from 'twrnc';
import { Button } from '../common/Button';

interface WarningModalProps {
  visible: boolean;
  message: string | null;
  onDismiss: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  visible,
  message,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tw`flex-1 bg-slate-900/80 justify-center items-center p-5`}>
        <View style={tw`bg-white rounded-2xl p-6 w-full items-center shadow-xl`}>
          <Text style={tw`text-4xl mb-2.5`}>⚠️</Text>
          <Text style={tw`text-lg font-extrabold text-red-800 mb-2`}>
            Integrity Incident Alert
          </Text>
          <Text style={tw`text-sm text-slate-600 text-center leading-5 mb-5`}>
            {message}
          </Text>
          <Button
            title="Acknowledge & Resume"
            onPress={onDismiss}
            variant="danger"
            style={tw`w-full`}
          />
        </View>
      </View>
    </Modal>
  );
};
