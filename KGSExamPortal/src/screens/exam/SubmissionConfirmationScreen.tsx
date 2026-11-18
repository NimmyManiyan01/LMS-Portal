import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, Easing } from 'react-native';
import tw from 'twrnc';
import { Button } from '../../components/common/Button';
import { FeedbackModal } from '../../components/modals/FeedbackModal';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';

interface SubmissionConfirmationScreenProps {
  onReturnDashboard: () => void;
}

export const SubmissionConfirmationScreen: React.FC<
  SubmissionConfirmationScreenProps
> = () => {
  const { submitFeedback } = useExam();
  const { logoutStudent } = useAuth();

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
  }, []);

  const handleNext = () => {
    setFeedbackVisible(true);
  };

  const handleFeedbackSubmit = async (rating: number, comment?: string) => {
    const saved = await submitFeedback(rating, comment);
    if (saved) {
      setFeedbackVisible(false);
      // Automatically log out after feedback submission
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
    <View style={tw`flex-1 bg-slate-50 justify-center items-center`}>
      <ScrollView contentContainerStyle={tw`p-6 items-center justify-center flex-grow pt-15 w-full max-w-md mx-auto`}>
        {/* Green Success Checkmark Icon */}
        <Animated.View
          style={[
            tw`w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 items-center justify-center mb-6 shadow-md`,
            { transform: [{ scale: iconScale }] },
          ]}
        >
          <Text style={tw`text-4xl text-emerald-600 font-bold`}>✓</Text>
        </Animated.View>

        {/* Thank You! Heading */}
        <Text style={tw`text-3xl font-extrabold text-slate-900 text-center mb-3`}>
          Thank You!
        </Text>

        {/* Confirmation Message */}
        <Text style={tw`text-base text-slate-600 text-center leading-6 mb-8 px-4`}>
          Your examination has been successfully submitted. We will reach out to you soon.
        </Text>

        {/* Action Button */}
        <Animated.View style={[tw`w-full`, { opacity: cardOpacity }]}>
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
