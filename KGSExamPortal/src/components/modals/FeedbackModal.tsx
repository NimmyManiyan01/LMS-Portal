import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Button } from '../common/Button';

interface FeedbackModalProps {
  visible: boolean;
  onSubmit: (rating: number, comment?: string) => Promise<boolean>;
  onSkip: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onSubmit,
  onSkip,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const success = await onSubmit(rating, comment.trim());
    setSubmitting(false);

    if (!success) {
      setError('Unable to save feedback. Unsent feedback retained for retry.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Exam Feedback</Text>
          <Text style={styles.subtitle}>
            How was your examination experience?
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Star Rating Bar */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  setRating(star);
                  setError(null);
                }}
                style={styles.starBtn}
              >
                <Text style={[styles.starText, star <= rating && styles.activeStar]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Comments Input */}
          <Text style={styles.commentLabel}>Additional Comments</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share any additional comments or technical feedback (optional)"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            maxLength={1000}
            value={comment}
            onChangeText={(val) => {
              setComment(val);
              setError(null);
            }}
          />

          <View style={styles.btnRow}>
            <Button
              title="Skip"
              onPress={onSkip}
              variant="outline"
              disabled={submitting}
              style={styles.skipBtn}
            />
            <Button
              title="SUBMIT FEEDBACK"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || rating < 1}
              style={styles.submitBtn}
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    width: '100%',
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
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starBtn: {
    padding: 6,
  },
  starText: {
    fontSize: 38,
    color: '#CBD5E1',
  },
  activeStar: {
    color: '#F59E0B',
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
    height: 90,
    marginBottom: 18,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipBtn: {
    flex: 1,
    marginRight: 8,
  },
  submitBtn: {
    flex: 1,
    marginLeft: 8,
  },
});
