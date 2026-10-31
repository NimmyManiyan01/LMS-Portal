import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import tw from 'twrnc';
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
    <View style={tw`flex-1 bg-slate-50`}>
      <Header title="Examination Details" subtitle={exam.title} onBack={onBack} />

      <ScrollView contentContainerStyle={tw`p-4 pb-9`}>
        {loading ? (
          <View style={tw`py-20 items-center`}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={tw`text-slate-500 text-xs mt-3`}>Loading exam parameters & rules...</Text>
          </View>
        ) : (
          <Animated.View
            style={[
              { opacity: cardOpacity },
              { transform: [{ translateY: cardTranslateY }] },
            ]}
          >
            {/* Examination Overview Specs Card */}
            <View style={tw`bg-white rounded-2xl p-4.5 mb-3.5 border border-slate-200 shadow-sm`}>
              <Text style={tw`text-xl font-black text-slate-900 mb-1`}>
                {instructionsData?.examName || exam.title}
              </Text>
              <View style={tw`bg-blue-50 px-2 py-1 rounded border border-blue-200 self-start mb-4`}>
                <Text style={tw`text-xs color-blue-600 font-extrabold`}>
                  Code: {instructionsData?.examId || exam.code}
                </Text>
              </View>

              {/* Parameter Grid */}
              <View style={tw`flex-row flex-wrap justify-between bg-slate-50 rounded-xl p-3 mb-3.5 border border-slate-200`}>
                <View style={tw`w-[48%] mb-2 items-center`}>
                  <Text style={tw`text-xs text-slate-500 font-semibold`}>Questions</Text>
                  <Text style={tw`text-base font-extrabold text-slate-900 mt-0.5`}>
                    {instructionsData?.totalQuestions || exam.totalQuestions}
                  </Text>
                </View>
                <View style={tw`w-[48%] mb-2 items-center`}>
                  <Text style={tw`text-xs text-slate-500 font-semibold`}>Duration</Text>
                  <Text style={tw`text-base font-extrabold text-slate-900 mt-0.5`}>
                    {instructionsData?.durationMinutes || exam.durationMinutes} Mins
                  </Text>
                </View>
                <View style={tw`w-[48%] mb-2 items-center`}>
                  <Text style={tw`text-xs text-slate-500 font-semibold`}>Max Marks</Text>
                  <Text style={tw`text-base font-extrabold text-slate-900 mt-0.5`}>
                    {instructionsData?.maximumMarks || exam.totalMarks}
                  </Text>
                </View>
                <View style={tw`w-[48%] mb-2 items-center`}>
                  <Text style={tw`text-xs text-slate-500 font-semibold`}>Negative Mark</Text>
                  <Text
                    style={[
                      tw`text-base font-extrabold mt-0.5`,
                      instructionsData?.negativeMarking ? tw`text-red-600` : tw`text-green-600`,
                    ]}
                  >
                    {instructionsData?.negativeMarking
                      ? `-${instructionsData.negativeMarking}`
                      : 'None'}
                  </Text>
                </View>
              </View>

              <View style={tw`flex-row justify-between py-2 border-b border-slate-100`}>
                <Text style={tw`text-xs text-slate-500`}>Maximum Attempts Allowed</Text>
                <Text style={tw`text-xs font-extrabold text-slate-900`}>
                  {instructionsData?.maximumAttempts || exam.maxAttempts || 1}
                </Text>
              </View>
            </View>

            {/* Monitoring Requirements Card */}
            <View style={tw`bg-white rounded-2xl p-4.5 mb-3.5 border border-slate-200 shadow-sm`}>
              <Text style={tw`text-base font-extrabold text-slate-900 mb-3`}>Monitoring Requirements</Text>

              <View style={tw`flex-row justify-between py-2 border-b border-slate-100`}>
                <Text style={tw`text-xs text-slate-500`}>Camera Monitoring</Text>
                <Text style={tw`text-xs font-extrabold text-blue-600`}>
                  {readiness.cameraRequired !== false ? 'Required' : 'Optional'}
                </Text>
              </View>

              <View style={tw`flex-row justify-between py-2 border-b border-slate-100`}>
                <Text style={tw`text-xs text-slate-500`}>Microphone / Audio</Text>
                <Text style={tw`text-xs font-extrabold text-blue-600`}>
                  {readiness.audioRequired ? 'Required' : 'Standard'}
                </Text>
              </View>

              <View style={tw`flex-row justify-between py-2 border-b border-slate-100`}>
                <Text style={tw`text-xs text-slate-500`}>Secure Application Mode</Text>
                <Text style={tw`text-xs font-extrabold text-blue-600`}>Required (No App Unfocus)</Text>
              </View>
            </View>

            {/* Rules & Guidelines Card */}
            <View style={tw`bg-white rounded-2xl p-4.5 mb-3.5 border border-slate-200 shadow-sm`}>
              <Text style={tw`text-base font-extrabold text-slate-900 mb-3`}>Guidelines & Rules</Text>
              {instructionsData?.instructions &&
              instructionsData.instructions.length > 0 ? (
                instructionsData.instructions.map((inst, index) => (
                  <View key={index} style={tw`flex-row mb-2.5 pr-2.5`}>
                    <Text style={tw`text-xs font-extrabold text-blue-600 w-5.5`}>{index + 1}.</Text>
                    <Text style={tw`text-xs text-slate-700 leading-4.5 flex-1`}>{inst}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={tw`flex-row mb-2.5 pr-2.5`}>
                    <Text style={tw`text-xs font-extrabold text-blue-600 w-5.5`}>1.</Text>
                    <Text style={tw`text-xs text-slate-700 leading-4.5 flex-1`}>
                      Read every question carefully before choosing an option.
                    </Text>
                  </View>
                  <View style={tw`flex-row mb-2.5 pr-2.5`}>
                    <Text style={tw`text-xs font-extrabold text-blue-600 w-5.5`}>2.</Text>
                    <Text style={tw`text-xs text-slate-700 leading-4.5 flex-1`}>
                      Select one answer for each multiple-choice question.
                    </Text>
                  </View>
                  <View style={tw`flex-row mb-2.5 pr-2.5`}>
                    <Text style={tw`text-xs font-extrabold text-blue-600 w-5.5`}>3.</Text>
                    <Text style={tw`text-xs text-slate-700 leading-4.5 flex-1`}>
                      Your answers are saved automatically on the server.
                    </Text>
                  </View>
                  <View style={tw`flex-row mb-2.5 pr-2.5`}>
                    <Text style={tw`text-xs font-extrabold text-blue-600 w-5.5`}>4.</Text>
                    <Text style={tw`text-xs text-slate-700 leading-4.5 flex-1`}>
                      The examination timer cannot be paused.
                    </Text>
                  </View>
                  <View style={tw`flex-row mb-2.5 pr-2.5`}>
                    <Text style={tw`text-xs font-extrabold text-blue-600 w-5.5`}>5.</Text>
                    <Text style={tw`text-xs text-slate-700 leading-4.5 flex-1`}>
                      Camera monitoring and secure mode are required.
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Confirmation Checkbox */}
            <TouchableOpacity
              style={[
                tw`flex-row items-center bg-white p-4 rounded-xl border border-slate-300 my-3 shadow-sm`,
                accepted ? tw`border-blue-600 bg-blue-50` : null,
              ]}
              onPress={() => setAccepted(!accepted)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  tw`w-5.5 h-5.5 rounded border-2 border-slate-400 items-center justify-center mr-3 bg-white`,
                  accepted ? tw`bg-blue-600 border-blue-600` : null,
                ]}
              >
                {accepted ? <Text style={tw`text-white text-xs font-bold`}>✓</Text> : null}
              </View>
              <Text style={tw`text-xs font-bold text-slate-900 flex-1`}>
                I have read and understood the examination instructions.
              </Text>
            </TouchableOpacity>

            <Button
              title="CONTINUE ➔"
              onPress={onProceedReadiness}
              disabled={!accepted}
              style={tw`mt-2 mb-6`}
            />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};
