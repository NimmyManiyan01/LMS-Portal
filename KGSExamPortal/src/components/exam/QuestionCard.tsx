import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import tw from 'twrnc';
import { Question, Option, Answer } from '../../types';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answer?: Answer;
  onSelectOption: (optionId: string) => void;
  onClearSelection: () => void;
  onToggleMarkForReview: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answer,
  onSelectOption,
  onClearSelection,
  onToggleMarkForReview,
}) => {
  const selectedOptionId = answer?.selectedOptionId;
  const isMarked = answer?.isMarkedForReview;

  return (
    <ScrollView style={tw`flex-1 bg-slate-50`} contentContainerStyle={tw`p-4 pb-10`}>
      {/* Question Header Card */}
      <View style={tw`bg-white rounded-2xl p-4.5 mb-4 border border-slate-200 shadow-sm`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={tw`text-xs font-extrabold text-blue-600 tracking-wider`}>
            Question {questionIndex + 1} of {totalQuestions}
          </Text>
          <View style={tw`bg-slate-100 px-2 py-1 rounded-md border border-slate-300`}>
            <Text style={tw`text-xs font-bold text-slate-700`}>
              +{question.marks} / -{question.negativeMarks}
            </Text>
          </View>
        </View>

        <Text style={tw`text-base leading-6 font-bold text-slate-900`}>
          {question.questionText}
        </Text>

        {/* Code Snippet if present */}
        {question.codeSnippet ? (
          <View style={tw`bg-slate-900 rounded-xl p-3 mt-3 border border-slate-700`}>
            <Text
              style={[
                tw`text-sky-400 text-xs`,
                { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
              ]}
            >
              {question.codeSnippet}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Options List */}
      <View style={tw`mb-4`}>
        {question.options.map((opt: Option) => {
          const isSelected =
            String(selectedOptionId || '').trim().toLowerCase() ===
            String(opt.id || '').trim().toLowerCase();
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                tw`flex-row items-center bg-white border-1.5 border-slate-200 rounded-xl p-4 mb-2.5 shadow-sm`,
                isSelected ? tw`border-blue-600 bg-blue-50` : null,
              ]}
              onPress={() => onSelectOption(opt.id)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  tw`w-7.5 h-7.5 rounded-full border-1.5 border-slate-400 items-center justify-center mr-3.5 bg-white`,
                  isSelected ? tw`border-blue-600 bg-blue-600` : null,
                ]}
              >
                <Text
                  style={[
                    tw`text-xs font-extrabold text-slate-500`,
                    isSelected ? tw`text-white` : null,
                  ]}
                >
                  {opt.id}
                </Text>
              </View>
              <Text
                style={[
                  tw`text-sm text-slate-800 flex-1 font-medium`,
                  isSelected ? tw`text-blue-700 font-bold` : null,
                ]}
              >
                {opt.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Controls Row */}
      <View style={tw`flex-row justify-between items-center bg-white rounded-xl p-3 border border-slate-200`}>
        <TouchableOpacity
          style={[
            tw`py-2 px-3 rounded-lg border border-slate-300 bg-slate-50`,
            isMarked ? tw`bg-purple-100 border-purple-400` : null,
          ]}
          onPress={onToggleMarkForReview}
          activeOpacity={0.8}
        >
          <Text
            style={[
              tw`text-xs text-slate-600 font-bold`,
              isMarked ? tw`text-purple-700` : null,
            ]}
          >
            {isMarked ? '★ Marked for Review' : '☆ Mark for Review'}
          </Text>
        </TouchableOpacity>

        {selectedOptionId ? (
          <TouchableOpacity style={tw`py-2 px-3`} onPress={onClearSelection} activeOpacity={0.8}>
            <Text style={tw`text-xs font-bold text-red-600`}>Clear Choice</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
};
