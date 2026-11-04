import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import tw from 'twrnc';
import { Question, Answer } from '../../types';
import { Button } from '../common/Button';

interface QuestionPaletteProps {
  visible: boolean;
  questions: Question[];
  answers: Map<string, Answer>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  visible,
  questions,
  answers,
  currentIndex,
  onSelectQuestion,
  onClose,
}) => {
  let answeredCount = 0;
  let markedCount = 0;
  let unansweredCount = 0;
  let unvisitedCount = 0;

  questions.forEach((q) => {
    const ans = answers.get(q.id);
    if (ans?.isMarkedForReview) {
      markedCount++;
    } else if (ans?.selectedOptionId) {
      answeredCount++;
    } else if (ans?.visited) {
      unansweredCount++;
    } else {
      unvisitedCount++;
    }
  });

  const getQuestionClasses = (qId: string, index: number) => {
    const isCurrent = index === currentIndex;
    const ans = answers.get(qId);

    let containerClass = 'bg-slate-50 border-slate-300';
    let textClass = 'text-slate-600';

    if (ans?.isMarkedForReview) {
      containerClass = 'bg-purple-600 border-purple-700'; // Marked - Purple
      textClass = 'text-white';
    } else if (ans?.selectedOptionId) {
      containerClass = 'bg-green-600 border-green-700'; // Answered - Green
      textClass = 'text-white';
    } else if (ans?.visited) {
      containerClass = 'bg-amber-600 border-amber-700'; // Visited Unanswered - Amber
      textClass = 'text-white';
    }

    return {
      boxClass: `${containerClass} ${isCurrent ? 'border-2 border-blue-600' : ''}`,
      textClass,
    };
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={tw`flex-1 bg-slate-900/60 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl max-h-4/5 p-5 shadow-lg`}>
          {/* Header */}
          <View style={tw`flex-row justify-between items-center pb-3 border-b border-slate-200`}>
            <Text style={tw`text-lg font-extrabold text-slate-900`}>Questions Palette</Text>
            <TouchableOpacity onPress={onClose} style={tw`p-1.5`} activeOpacity={0.8}>
              <Text style={tw`text-xl text-slate-500 font-bold`}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Legend Summary */}
          <View style={tw`flex-row flex-wrap justify-between py-3 border-b border-slate-100`}>
            <View style={tw`flex-row items-center w-1/2 mb-2`}>
              <View style={tw`w-3 h-3 rounded-full bg-green-600 mr-2`} />
              <Text style={tw`text-xs text-slate-700 font-semibold`}>Answered: {answeredCount}</Text>
            </View>
            <View style={tw`flex-row items-center w-1/2 mb-2`}>
              <View style={tw`w-3 h-3 rounded-full bg-amber-600 mr-2`} />
              <Text style={tw`text-xs text-slate-700 font-semibold`}>Not Answered: {unansweredCount}</Text>
            </View>
            <View style={tw`flex-row items-center w-1/2 mb-2`}>
              <View style={tw`w-3 h-3 rounded-full bg-purple-600 mr-2`} />
              <Text style={tw`text-xs text-slate-700 font-semibold`}>Marked for Review: {markedCount}</Text>
            </View>
            <View style={tw`flex-row items-center w-1/2 mb-2`}>
              <View style={tw`w-3 h-3 rounded-full bg-slate-100 border border-slate-300 mr-2`} />
              <Text style={tw`text-xs text-slate-700 font-semibold`}>Not Visited: {unvisitedCount}</Text>
            </View>
          </View>

          {/* Question Grid */}
          <ScrollView contentContainerStyle={tw`flex-row flex-wrap py-3.5 justify-start`}>
            {questions.map((q, idx) => {
              const { boxClass, textClass } = getQuestionClasses(q.id, idx);
              const numStr = String(idx + 1).padStart(2, '0');
              return (
                <TouchableOpacity
                  key={q.id}
                  style={tw`w-12 h-12 rounded-xl border-1.5 items-center justify-center m-1 ${boxClass}`}
                  onPress={() => {
                    onSelectQuestion(idx);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={tw`text-sm font-extrabold ${textClass}`}>
                    {numStr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Button title="CLOSE" onPress={onClose} variant="secondary" style={tw`mt-2.5`} />
        </View>
      </View>
    </Modal>
  );
};
