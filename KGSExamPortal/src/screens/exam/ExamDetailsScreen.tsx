import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Exam } from '../../types';
import * as examApi from '../../api/examApi';

interface ExamDetailsScreenProps {
  exam: Exam;
  onBack: () => void;
  onProceedReadiness: () => void;
}

export const ExamDetailsScreen: React.FC<ExamDetailsScreenProps> = ({
  exam,
  onBack,
  onProceedReadiness,
}) => {
  const [instructionsData, setInstructionsData] =
    useState<examApi.InstructionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  // Animated values
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const fetchInstructions = async () => {
      const res = await examApi.getExamInstructions(exam._id);
      setLoading(false);
      if (res.data) {
        setInstructionsData(res.data);
      }
      // Start card entrance animation after data loads
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };
    fetchInstructions();
  }, [exam]);

  const readiness = instructionsData?.readinessRequirements || {};

  return (
    <View style={styles.container}>
      {/* Soft Ambient Background Glows */}
      <View style={styles.ambientOrbTop} />
      <View style={styles.ambientOrbBottom} />

      <Header title="Examination Details" subtitle={exam.title} onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading exam parameters & rules...</Text>
          </View>
        ) : (
          <Animated.View
            style={[
              { opacity: cardOpacity },
              { transform: [{ translateY: cardTranslateY }] },
            ]}
          >
            {/* Examination Overview Specs Card */}
            <View style={styles.glassCard}>
              <Text style={styles.examTitle}>
                {instructionsData?.examName || exam.title}
              </Text>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>
                  Code: {instructionsData?.examId || exam.code}
                </Text>
              </View>

              {/* Parameter Grid */}
              <View style={styles.paramGrid}>
                <View style={styles.paramBox}>
                  <Text style={styles.paramLabel}>Questions</Text>
                  <Text style={styles.paramValue}>
                    {instructionsData?.totalQuestions || exam.totalQuestions}
                  </Text>
                </View>
                <View style={styles.paramBox}>
                  <Text style={styles.paramLabel}>Duration</Text>
                  <Text style={styles.paramValue}>
                    {instructionsData?.durationMinutes || exam.durationMinutes} Mins
                  </Text>
                </View>
                <View style={styles.paramBox}>
                  <Text style={styles.paramLabel}>Max Marks</Text>
                  <Text style={styles.paramValue}>
                    {instructionsData?.maximumMarks || exam.totalMarks}
                  </Text>
                </View>
                <View style={styles.paramBox}>
                  <Text style={styles.paramLabel}>Negative Mark</Text>
                  <Text
                    style={[
                      styles.paramValue,
                      {
                        color: instructionsData?.negativeMarking
                          ? '#DC2626'
                          : '#16A34A',
                      },
                    ]}
                  >
                    {instructionsData?.negativeMarking
                      ? `-${instructionsData.negativeMarking}`
                      : 'None'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Maximum Attempts Allowed</Text>
                <Text style={styles.value}>
                  {instructionsData?.maximumAttempts || exam.maxAttempts || 1}
                </Text>
              </View>
            </View>

            {/* Monitoring Requirements Card */}
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Monitoring Requirements</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Camera Monitoring</Text>
                <Text style={styles.reqValue}>
                  {readiness.cameraRequired !== false ? 'Required' : 'Optional'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Microphone / Audio</Text>
                <Text style={styles.reqValue}>
                  {readiness.audioRequired ? 'Required' : 'Standard'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Secure Application Mode</Text>
                <Text style={styles.reqValue}>Required (No App Unfocus)</Text>
              </View>
            </View>

            {/* Rules & Guidelines Card */}
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Guidelines & Rules</Text>
              {instructionsData?.instructions &&
              instructionsData.instructions.length > 0 ? (
                instructionsData.instructions.map((inst, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bulletNum}>{index + 1}.</Text>
                    <Text style={styles.bulletText}>{inst}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletNum}>1.</Text>
                    <Text style={styles.bulletText}>
                      Read every question carefully before choosing an option.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletNum}>2.</Text>
                    <Text style={styles.bulletText}>
                      Select one answer for each multiple-choice question.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletNum}>3.</Text>
                    <Text style={styles.bulletText}>
                      Your answers are saved automatically on the server.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletNum}>4.</Text>
                    <Text style={styles.bulletText}>
                      The examination timer cannot be paused.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletNum}>5.</Text>
                    <Text style={styles.bulletText}>
                      Camera monitoring and secure mode are required.
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Confirmation Checkbox */}
            <TouchableOpacity
              style={[styles.confirmRow, accepted && styles.confirmRowActive]}
              onPress={() => setAccepted(!accepted)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, accepted && styles.checkedBox]}>
                {accepted && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.confirmText}>
                I have read and understood the examination instructions.
              </Text>
            </TouchableOpacity>

            <Button
              title="CONTINUE ➔"
              onPress={onProceedReadiness}
              disabled={!accepted}
              style={styles.proceedBtn}
            />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  ambientOrbTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  ambientOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  centerContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
  },
  glassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  codeText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '800',
  },
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paramBox: {
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  paramValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  reqValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 10,
  },
  bulletNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
    width: 22,
  },
  bulletText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  confirmRowActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  checkedBox: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  proceedBtn: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#2563EB',
  },
});
