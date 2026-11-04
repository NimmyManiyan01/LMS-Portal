import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import tw from 'twrnc';
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
    <View style={tw`flex-1 bg-slate-50`}>
      <Header title="System Readiness Check" subtitle={exam.title} onBack={onBack} />
      <ScrollView contentContainerStyle={tw`p-4 pb-10`}>
        <ReadinessChecklist
          cameraRequired={true}
          onProceed={handleLaunch}
          loading={starting}
        />
      </ScrollView>
    </View>
  );
};
