import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from 'react-native';
import { useExam } from '../../context/ExamContext';
import { TimerHeader } from '../../components/exam/TimerHeader';
import { QuestionCard } from '../../components/exam/QuestionCard';
import { QuestionPalette } from '../../components/exam/QuestionPalette';
import { WarningModal } from '../../components/modals/WarningModal';
import { SubmitConfirmModal } from '../../components/modals/SubmitConfirmModal';

interface ExamPlayerScreenProps {
  onExamSubmitted: () => void;
}

export const ExamPlayerScreen: React.FC<ExamPlayerScreenProps> = ({
  onExamSubmitted,
}) => {
  const {
    attempt,
    questions,
    currentQuestionIndex,
    answers,
    remainingSeconds,
    isSaving,
    isSubmitted,
    warningMessage,
    setCurrentQuestionIndex,
    setWarningMessage,
    selectOption,
    clearSelection,
    toggleMarkForReview,
    reportViolation,
    submitExam,
  } = useExam();

  const [paletteVisible, setPaletteVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // App state listener for detecting app backgrounding / tab switching
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        reportViolation('TAB_HIDDEN');
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // When exam is submitted automatically or manually, trigger navigation
  useEffect(() => {
    if (isSubmitted) {
      onExamSubmitted();
    }
  }, [isSubmitted]);

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading question paper...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    const success = await submitExam(true);
    setSubmitting(false);
    if (success) {
      setSubmitModalVisible(false);
      onExamSubmitted();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Countdown Timer Header */}
      <TimerHeader
        remainingSeconds={remainingSeconds}
        examTitle={attempt?.attemptId ? 'KGS EXAMINATION' : 'Exam'}
        currentQuestionNum={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        cameraActive={true}
        isSaving={isSaving}
      />

      {/* Main Question Display */}
      <QuestionCard
        question={currentQuestion}
        questionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        answer={currentAnswer}
        onSelectOption={(optId) => selectOption(currentQuestion.id, optId)}
        onClearSelection={() => clearSelection(currentQuestion.id)}
        onToggleMarkForReview={() => toggleMarkForReview(currentQuestion.id)}
      />

      {/* Bottom Floating Navigation Toolbar */}
      <View style={styles.bottomToolbar}>
        <TouchableOpacity
          style={[styles.navBtn, currentQuestionIndex === 0 && styles.disabledNav]}
          onPress={handlePrev}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={styles.navBtnText}>← Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paletteBtn}
          onPress={() => setPaletteVisible(true)}
        >
          <Text style={styles.paletteBtnText}>
            📋 Grid ({currentQuestionIndex + 1}/{questions.length})
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex < questions.length - 1 ? (
          <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
            <Text style={styles.navBtnText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.finalSubmitBtn}
            onPress={() => setSubmitModalVisible(true)}
          >
            <Text style={styles.finalSubmitText}>Submit Exam</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Question Palette Grid Modal */}
      <QuestionPalette
        visible={paletteVisible}
        questions={questions}
        answers={answers}
        currentIndex={currentQuestionIndex}
        onSelectQuestion={(idx) => setCurrentQuestionIndex(idx)}
        onClose={() => setPaletteVisible(false)}
      />

      {/* Violation Alert Modal */}
      <WarningModal
        visible={!!warningMessage}
        message={warningMessage}
        onDismiss={() => setWarningMessage(null)}
      />

      {/* Manual Submission Confirmation Modal */}
      <SubmitConfirmModal
        visible={submitModalVisible}
        questions={questions}
        answers={answers}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        loading={submitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#38BDF8',
    fontSize: 16,
  },
  bottomToolbar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  navBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  disabledNav: {
    backgroundColor: '#CBD5E1',
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  paletteBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  paletteBtnText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  finalSubmitBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  finalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
