import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={[
            styles.iconCircle,
            { transform: [{ scale: iconScale }] },
          ]}
        >
          <Text style={styles.iconText}>✓</Text>
        </Animated.View>

        <Text style={styles.title}>Exam Submitted</Text>
        <Text style={styles.subtitle}>
          Your examination has been successfully submitted.
        </Text>

        <Animated.View style={[{ width: '100%' }, { opacity: cardOpacity }]}>
          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
          ) : result?.releaseStatus === 'RELEASED' && result.marksScored !== null ? (
            /* Scenario 1 — Marks published */
            <Card style={styles.statusCard}>
              <Text style={styles.examNameText}>{result.examName}</Text>
              <Text style={styles.marksLabel}>Your Marks</Text>
              <Text style={styles.marksValue}>
                {result.marksScored} / {result.maximumMarks ?? 'N/A'}
              </Text>
            </Card>
          ) : (
            /* Scenario 2 — Marks not published */
            <Card style={styles.statusCard}>
              <Text style={styles.pendingHeading}>Results Pending</Text>
              <Text style={styles.pendingInfo}>
                Your marks will be available after the administrator publishes the results.
              </Text>
            </Card>
          )}

          <Button
            title="NEXT ➔"
            onPress={handleNext}
            style={styles.nextBtn}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    paddingTop: 60,
  },
  loader: {
    marginVertical: 20,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  iconText: {
    fontSize: 38,
    color: '#15803D',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  statusCard: {
    width: '100%',
    padding: 22,
    alignItems: 'center',
    marginBottom: 28,
  },
  examNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  marksLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  marksValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#15803D',
  },
  pendingHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 8,
  },
  pendingInfo: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  nextBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
  },
});
