import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import tw from 'twrnc';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { FeedbackModal } from '../../components/modals/FeedbackModal';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';
import { FinalResult } from '../../types';
import * as resultApi from '../../api/resultApi';

interface SubmissionConfirmationScreenProps {
  onReturnDashboard: () => void;
}

export const SubmissionConfirmationScreen: React.FC<
  SubmissionConfirmationScreenProps
> = () => {
  const { attempt, submitFeedback } = useExam();
  const { logoutStudent } = useAuth();

  const [result, setResult] = useState<FinalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  // Animated values
  const iconScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const fetchResult = async () => {
      if (attempt?.attemptId) {
        const res = await resultApi.getResultDetail(attempt.attemptId);
        setLoading(false);
        if (res.data) {
          setResult(res.data);
        }
      } else {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attempt]);

  const handleNext = () => {
    setFeedbackVisible(true);
  };

  const handleFeedbackSubmit = async (rating: number, comment?: string) => {
    const saved = await submitFeedback(rating, comment);
    if (saved) {
      setFeedbackVisible(false);
      // FR-FB-08: Automatically log out after feedback submission
      await logoutStudent();
      return true;
    }
    return false;
  };

  const handleSkipFeedback = async () => {
    setFeedbackVisible(false);
    await logoutStudent();
  };

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <ScrollView contentContainerStyle={tw`p-6 items-center pt-15`}>
        <Animated.View
          style={[
            tw`w-19 h-19 rounded-full bg-green-100 border-2 border-green-600 items-center justify-center mb-4 shadow-md`,
            { transform: [{ scale: iconScale }] },
          ]}
        >
          <Text style={tw`text-4xl text-green-700 font-bold`}>✓</Text>
        </Animated.View>

        <Text style={tw`text-2xl font-extrabold text-slate-900 text-center mb-1.5`}>Exam Submitted</Text>
        <Text style={tw`text-sm text-slate-500 text-center leading-5 mb-6`}>
          Your examination has been successfully submitted.
        </Text>

        <Animated.View style={[tw`w-full`, { opacity: cardOpacity }]}>
          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={tw`my-5`} />
          ) : result?.releaseStatus === 'RELEASED' && result.marksScored !== null ? (
            /* Scenario 1 — Marks published */
            <Card style={tw`w-full p-5.5 items-center mb-7`}>
              <Text style={tw`text-base font-bold text-slate-900 mb-3`}>{result.examName}</Text>
              <Text style={tw`text-xs text-slate-500 mb-1`}>Your Marks</Text>
              <Text style={tw`text-3xl font-black text-green-700`}>
                {result.marksScored} / {result.maximumMarks ?? 'N/A'}
              </Text>
            </Card>
          ) : (
            /* Scenario 2 — Marks not published */
            <Card style={tw`w-full p-5.5 items-center mb-7`}>
              <Text style={tw`text-lg font-extrabold text-amber-700 mb-2`}>Results Pending</Text>
              <Text style={tw`text-xs text-slate-500 text-center leading-4.5`}>
                Your marks will be available after the administrator publishes the results.
              </Text>
            </Card>
          )}

          <Button
            title="NEXT ➔"
            onPress={handleNext}
            style={tw`w-full`}
          />
        </Animated.View>
      </ScrollView>

      {/* Candidate Feedback Modal */}
      <FeedbackModal
        visible={feedbackVisible}
        onSubmit={handleFeedbackSubmit}
        onSkip={handleSkipFeedback}
      />
    </View>
  );
};
