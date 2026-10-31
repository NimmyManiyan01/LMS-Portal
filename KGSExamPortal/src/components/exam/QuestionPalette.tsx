import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Question, Answer } from '../../types';
import { Button } from '../common/Button';

interface QuestionPaletteProps {
  visible: boolean;
  questions: Question[];
  answers: Map<string, Answer>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  visible,
  questions,
  answers,
  currentIndex,
  onSelectQuestion,
  onClose,
}) => {
  let answeredCount = 0;
  let markedCount = 0;
  let unansweredCount = 0;
  let unvisitedCount = 0;

  questions.forEach((q) => {
    const ans = answers.get(q.id);
    if (ans?.isMarkedForReview) {
      markedCount++;
    } else if (ans?.selectedOptionId) {
      answeredCount++;
    } else if (ans?.visited) {
      unansweredCount++;
    } else {
      unvisitedCount++;
    }
  });

  const getQuestionStyle = (qId: string, index: number) => {
    const isCurrent = index === currentIndex;
    const ans = answers.get(qId);

    let bg = '#F8FAFC'; // Not Visited - Neutral Light
    let border = '#CBD5E1';
    let textColor = '#475569';

    if (ans?.isMarkedForReview) {
      bg = '#9333EA'; // Marked for Review - Purple
      border = '#7E22CE';
      textColor = '#FFFFFF';
    } else if (ans?.selectedOptionId) {
      bg = '#16A34A'; // Answered - Green
      border = '#15803D';
      textColor = '#FFFFFF';
    } else if (ans?.visited) {
      bg = '#D97706'; // Visited Unanswered - Amber
      border = '#B45309';
      textColor = '#FFFFFF';
    }

    return {
      style: [
        styles.gridBox,
        { backgroundColor: bg, borderColor: border },
        isCurrent && styles.currentBox,
      ],
      textColor,
    };
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Questions Palette</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} activeOpacity={0.8}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Legend Summary */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.legendLabel}>Answered: {answeredCount}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.legendLabel}>Not Answered: {unansweredCount}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#9333EA' }]} />
              <Text style={styles.legendLabel}>Marked for Review: {markedCount}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1' }]} />
              <Text style={styles.legendLabel}>Not Visited: {unvisitedCount}</Text>
            </View>
          </View>

          {/* Question Grid */}
          <ScrollView contentContainerStyle={styles.gridContainer}>
            {questions.map((q, idx) => {
              const { style, textColor } = getQuestionStyle(q.id, idx);
              const numStr = String(idx + 1).padStart(2, '0');
              return (
                <TouchableOpacity
                  key={q.id}
                  style={style}
                  onPress={() => {
                    onSelectQuestion(idx);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.gridText, { color: textColor }]}>
                    {numStr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Button title="CLOSE" onPress={onClose} variant="secondary" style={styles.closeBtn} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeIconBtn: {
    padding: 6,
  },
  closeIconText: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: 'bold',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 14,
    justifyContent: 'flex-start',
  },
  gridBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  currentBox: {
    borderWidth: 3,
    borderColor: '#2563EB',
  },
  gridText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  closeBtn: {
    marginTop: 10,
  },
});
