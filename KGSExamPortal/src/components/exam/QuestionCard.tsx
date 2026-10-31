import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Question, Option, Answer } from '../../types';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answer?: Answer;
  onSelectOption: (optionId: string) => void;
  onClearSelection: () => void;
  onToggleMarkForReview: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answer,
  onSelectOption,
  onClearSelection,
  onToggleMarkForReview,
}) => {
  const selectedOptionId = answer?.selectedOptionId;
  const isMarked = answer?.isMarkedForReview;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Question Header Card */}
      <View style={styles.questionContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.questionNum}>
            Question {questionIndex + 1} of {totalQuestions}
          </Text>
          <View style={styles.marksBadge}>
            <Text style={styles.marksText}>+{question.marks} / -{question.negativeMarks}</Text>
          </View>
        </View>

        <Text style={styles.questionText}>{question.questionText}</Text>

        {/* Code Snippet if present */}
        {question.codeSnippet ? (
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{question.codeSnippet}</Text>
          </View>
        ) : null}
      </View>

      {/* Options List */}
      <View style={styles.optionsContainer}>
        {question.options.map((opt: Option) => {
          const isSelected =
            String(selectedOptionId || '').trim().toLowerCase() ===
            String(opt.id || '').trim().toLowerCase();
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
              onPress={() => onSelectOption(opt.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
                <Text style={[styles.radioText, isSelected && styles.selectedRadioText]}>
                  {opt.id}
                </Text>
              </View>
              <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                {opt.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Controls Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, isMarked && styles.activeMarkBtn]}
          onPress={onToggleMarkForReview}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, isMarked && styles.activeMarkText]}>
            {isMarked ? '★ Marked for Review' : '☆ Mark for Review'}
          </Text>
        </TouchableOpacity>

        {selectedOptionId ? (
          <TouchableOpacity style={styles.clearBtn} onPress={onClearSelection} activeOpacity={0.8}>
            <Text style={styles.clearBtnText}>Clear Choice</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  marksBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  marksText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  codeContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
    fontSize: 13,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedOptionCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: '#FFFFFF',
  },
  selectedRadio: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  radioText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  selectedRadioText: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 15,
    color: '#1E293B',
    flex: 1,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  activeMarkBtn: {
    backgroundColor: '#F3E8FF',
    borderColor: '#C084FC',
  },
  actionBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  activeMarkText: {
    color: '#7E22CE',
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearBtnText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '700',
  },
});
