import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Attempt, Question, Answer } from '../types';
import * as attemptApi from '../api/attemptApi';
import * as integrityApi from '../api/integrityApi';

interface ExamContextType {
  attempt: Attempt | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, Answer>;
  remainingSeconds: number;
  isSaving: boolean;
  isSubmitted: boolean;
  warningMessage: string | null;
  setCurrentQuestionIndex: (index: number) => void;
  setWarningMessage: (msg: string | null) => void;
  loadAttemptQuestions: (attemptId: string) => Promise<boolean>;
  selectOption: (questionId: string, optionId: string) => Promise<void>;
  clearSelection: (questionId: string) => Promise<void>;
  toggleMarkForReview: (questionId: string) => Promise<void>;
  reportViolation: (eventType: 'TAB_HIDDEN' | 'FULLSCREEN_EXIT' | 'COPY' | 'PASTE' | 'SCREENSHOT' | 'CAMERA_INTERRUPTED' | 'MULTIPLE_PERSON') => Promise<void>;
  submitExam: (manual?: boolean) => Promise<boolean>;
  submitFeedback: (rating: number, comment?: string) => Promise<boolean>;
  resetExamState: () => void;
}

const ExamContext = createContext<ExamContextType>({
  attempt: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: new Map(),
  remainingSeconds: 0,
  isSaving: false,
  isSubmitted: false,
  warningMessage: null,
  setCurrentQuestionIndex: () => {},
  setWarningMessage: () => {},
  loadAttemptQuestions: async () => false,
  selectOption: async () => {},
  clearSelection: async () => {},
  toggleMarkForReview: async () => {},
  reportViolation: async () => {},
  submitExam: async () => false,
  submitFeedback: async () => false,
  resetExamState: () => {},
});

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const answerVersions = useRef<Map<string, number>>(new Map());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetExamState = () => {
    setAttempt(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
    setRemainingSeconds(0);
    setIsSaving(false);
    setIsSubmitted(false);
    setWarningMessage(null);
    answerVersions.current.clear();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const loadAttemptQuestions = async (attemptId: string) => {
    resetExamState();
    if (!attemptId || attemptId === 'undefined') return false;

    const [attRes, qRes] = await Promise.all([
      attemptApi.getAttempt(attemptId),
      attemptApi.getAttemptQuestions(attemptId),
    ]);

    if (!attRes.data || !qRes.data) {
      return false;
    }

    const att = attRes.data;
    const qData = qRes.data;

    const realAttemptId = String(att.attemptId || (att as any)._id || attemptId);
    att.attemptId = realAttemptId;

    setAttempt(att);
    setQuestions(qData.questions);

    // Initialize answers map
    const ansMap = new Map<string, Answer>();
    if (att.answers && att.answers.length > 0) {
      att.answers.forEach((ans) => {
        ansMap.set(ans.questionId, ans);
        answerVersions.current.set(ans.questionId, ans.version || 1);
      });
    }
    setAnswers(ansMap);

    // Calculate remaining time against server deadline
    const now = new Date(qData.serverTime || Date.now()).getTime();
    const expiry = new Date(att.deadline).getTime();
    const diff = Math.max(0, Math.floor((expiry - now) / 1000));
    setRemainingSeconds(diff);

    if (att.status === 'SUBMITTED' || att.status === 'AUTO_SUBMITTED') {
      setIsSubmitted(true);
    } else {
      // Start countdown timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto submit on 00:00
            submitExam(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return true;
  };

  const persistAnswer = async (
    questionId: string,
    selectedOptionId?: string,
    isMarkedForReview?: boolean,
    visited: boolean = true
  ) => {
    const currentAttemptId = String(attempt?.attemptId || (attempt as any)?._id || '');
    if (!currentAttemptId || currentAttemptId === 'undefined') return;

    setIsSaving(true);

    const currentVer = answerVersions.current.get(questionId) || 0;
    const nextVer = currentVer + 1;

    // Instant Optimistic UI Update
    setAnswers((prev) => {
      const nextMap = new Map(prev);
      nextMap.set(questionId, {
        questionId,
        selectedOptionId,
        isMarkedForReview,
        visited,
        version: nextVer,
      });
      return nextMap;
    });

    answerVersions.current.set(questionId, nextVer);

    try {
      const res = await attemptApi.saveAnswer(currentAttemptId, questionId, {
        selectedOptionId,
        isMarkedForReview,
        visited,
        timeSpentSeconds: 5,
        version: nextVer,
      });

      if (res.data?.version) {
        answerVersions.current.set(questionId, res.data.version);
      }
    } catch {
      // Error handling
    } finally {
      setIsSaving(false);
    }
  };

  const selectOption = async (questionId: string, optionId: string) => {
    const existing = answers.get(questionId);
    await persistAnswer(
      questionId,
      optionId,
      existing?.isMarkedForReview || false,
      true
    );
  };

  const clearSelection = async (questionId: string) => {
    const existing = answers.get(questionId);
    await persistAnswer(
      questionId,
      undefined,
      existing?.isMarkedForReview || false,
      true
    );
  };

  const toggleMarkForReview = async (questionId: string) => {
    const existing = answers.get(questionId);
    await persistAnswer(
      questionId,
      existing?.selectedOptionId,
      !existing?.isMarkedForReview,
      true
    );
  };

  const reportViolation = async (
    eventType: 'TAB_HIDDEN' | 'FULLSCREEN_EXIT' | 'COPY' | 'PASTE' | 'SCREENSHOT' | 'CAMERA_INTERRUPTED' | 'MULTIPLE_PERSON'
  ) => {
    const currentAttemptId = String(attempt?.attemptId || (attempt as any)?._id || '');
    if (!currentAttemptId || currentAttemptId === 'undefined' || isSubmitted) return;

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const res = await integrityApi.reportIntegrityEvent(currentAttemptId, {
      eventId,
      eventType,
      clientTimestamp: new Date().toISOString(),
    });

    if (res.data) {
      if (res.data.action === 'WARNING') {
        setWarningMessage(
          `Integrity Alert (${res.data.confirmedCount}/${res.data.threshold}): Interruption recorded.`
        );
      } else if (res.data.action === 'AUTO_SUBMIT') {
        setWarningMessage('Maximum integrity violations reached. Examination auto-submitting.');
        submitExam(false);
      }
    }
  };

  const submitExam = async (manual: boolean = true) => {
    const currentAttemptId = String(attempt?.attemptId || (attempt as any)?._id || '');
    if (!currentAttemptId || currentAttemptId === 'undefined' || isSubmitted) return false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const currentAnswersArray = Array.from(answers.values());
    const res = await attemptApi.submitAttempt(
      currentAttemptId,
      currentAnswersArray
    );

    if (res.data) {
      setIsSubmitted(true);
      return true;
    }
    return false;
  };

  const submitFeedback = async (rating: number, comment?: string) => {
    const currentAttemptId = String(attempt?.attemptId || (attempt as any)?._id || '');
    if (!currentAttemptId || currentAttemptId === 'undefined') return false;
    const res = await attemptApi.submitExamFeedback(currentAttemptId, {
      rating,
      comment,
    });
    return !!res.data?.saved;
  };

  return (
    <ExamContext.Provider
      value={{
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
        loadAttemptQuestions,
        selectOption,
        clearSelection,
        toggleMarkForReview,
        reportViolation,
        submitExam,
        submitFeedback,
        resetExamState,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);
