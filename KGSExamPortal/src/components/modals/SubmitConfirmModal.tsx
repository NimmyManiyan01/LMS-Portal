import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button } from '../common/Button';
import { Question, Answer } from '../../types';

interface SubmitConfirmModalProps {
  visible: boolean;
  questions: Question[];
  answers: Map<string, Answer>;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  visible,
  questions,
  answers,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  let answered = 0;
  let marked = 0;
  let unanswered = 0;

  questions.forEach((q) => {
    const ans = answers.get(q.id);
    if (ans?.isMarkedForReview) {
      marked++;
    } else if (ans?.selectedOptionId) {
      answered++;
    } else {
      unanswered++;
    }
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Submit Examination?</Text>
          <Text style={styles.subtitle}>
            Review your summary before final submission.
          </Text>

          {/* Stats Box */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Answered Questions:</Text>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>
                {String(answered).padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Unanswered Questions:</Text>
              <Text style={[styles.statValue, { color: '#DC2626' }]}>
                {String(unanswered).padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Marked for Review:</Text>
              <Text style={[styles.statValue, { color: '#9333EA' }]}>
                {String(marked).padStart(2, '0')}
              </Text>
            </View>
          </View>

          <Text style={styles.warningText}>
            You cannot change answers after final submission.
          </Text>

          <View style={styles.btnRow}>
            <Button
              title="CANCEL"
              onPress={onCancel}
              variant="outline"
              disabled={loading}
              style={styles.cancelBtn}
            />
            <Button
              title="SUBMIT EXAM"
              onPress={onConfirm}
              loading={loading}
              disabled={loading}
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
  },
  confirmBtn: {
    flex: 1,
    marginLeft: 8,
  },
});
