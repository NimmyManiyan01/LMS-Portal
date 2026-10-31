import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Header } from '../../components/common/Header';
import { ReadinessChecklist } from '../../components/exam/ReadinessChecklist';
import { Exam } from '../../types';
import * as examApi from '../../api/examApi';
import { useExam } from '../../context/ExamContext';

interface ReadinessScreenProps {
  exam: Exam;
  onBack: () => void;
  onExamStarted: () => void;
}

export const ReadinessScreen: React.FC<ReadinessScreenProps> = ({
  exam,
  onBack,
  onExamStarted,
}) => {
  const { loadAttemptQuestions } = useExam();
  const [starting, setStarting] = useState(false);

  const handleLaunch = async () => {
    setStarting(true);
    const startRes = await examApi.startExam(exam._id);

    if (startRes.data?.attemptId) {
      const loaded = await loadAttemptQuestions(startRes.data.attemptId);
      setStarting(false);
      if (loaded) {
        onExamStarted();
      }
    } else {
      setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="System Readiness Check" subtitle={exam.title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <ReadinessChecklist
          cameraRequired={true}
          onProceed={handleLaunch}
          loading={starting}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
});
