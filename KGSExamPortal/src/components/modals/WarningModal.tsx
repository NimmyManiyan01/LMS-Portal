import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
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
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Integrity Incident Alert</Text>
          <Text style={styles.message}>{message}</Text>
          <Button
            title="Acknowledge & Resume"
            onPress={onDismiss}
            variant="danger"
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    width: '100%',
  },
});
