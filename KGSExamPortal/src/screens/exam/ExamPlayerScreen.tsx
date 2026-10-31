import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
} from 'react-native';
import tw from 'twrnc';
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
      <View style={tw`flex-1 justify-center items-center bg-slate-900`}>
        <Text style={tw`text-sky-400 text-base font-bold`}>Loading question paper...</Text>
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
    <View style={tw`flex-1 bg-slate-50`}>
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
      <View style={tw`h-15 bg-white border-t border-slate-200 flex-row items-center justify-between px-3 shadow-md`}>
        <TouchableOpacity
          style={[
            tw`bg-blue-600 px-4 py-2.5 rounded-xl`,
            currentQuestionIndex === 0 ? tw`bg-slate-300` : null,
          ]}
          onPress={handlePrev}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={tw`text-white text-sm font-bold`}>← Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-slate-100 border border-slate-300 px-3.5 py-2.5 rounded-xl`}
          onPress={() => setPaletteVisible(true)}
        >
          <Text style={tw`text-slate-800 text-xs font-bold`}>
            📋 Grid ({currentQuestionIndex + 1}/{questions.length})
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex < questions.length - 1 ? (
          <TouchableOpacity style={tw`bg-blue-600 px-4 py-2.5 rounded-xl`} onPress={handleNext}>
            <Text style={tw`text-white text-sm font-bold`}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={tw`bg-green-600 px-4 py-2.5 rounded-xl`}
            onPress={() => setSubmitModalVisible(true)}
          >
            <Text style={tw`text-white text-sm font-bold`}>Submit Exam</Text>
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
