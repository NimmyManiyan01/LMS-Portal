import React from 'react';
import { View, Text, Modal } from 'react-native';
import tw from 'twrnc';
import { Button } from '../common/Button';
import { Question, Answer } from '../../types';

interface SubmitConfirmModalProps {
  visible: boolean;
  questions: Question[];
  answers: Map<string, Answer>;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  visible,
  questions,
  answers,
  onConfirm,
  onCancel,
  loading = false,
  error = null,
}) => {
  let answered = 0;
  let marked = 0;
  let unanswered = 0;

  questions.forEach((q) => {
    const ans = answers.get(q.id);
    if (ans?.isMarkedForReview) {
      marked++;
    } else if (ans?.selectedOptionId) {
      answered++;
    } else {
      unanswered++;
    }
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tw`flex-1 bg-slate-900/50 justify-center items-center p-5`}>
        <View style={tw`bg-white rounded-2xl p-6 w-full shadow-xl`}>
          <Text style={tw`text-xl font-extrabold text-slate-900 mb-1 text-center`}>
            Submit Examination?
          </Text>
          <Text style={tw`text-xs text-slate-500 mb-4 text-center`}>
            Review your summary before final submission.
          </Text>

          {/* Stats Box */}
          <View style={tw`bg-slate-50 rounded-xl p-3.5 mb-3.5 border border-slate-200`}>
            <View style={tw`flex-row justify-between py-1.5 border-b border-slate-100`}>
              <Text style={tw`text-sm font-semibold text-slate-700`}>Answered Questions:</Text>
              <Text style={tw`text-sm font-extrabold text-green-600`}>
                {String(answered).padStart(2, '0')}
              </Text>
            </View>
            <View style={tw`flex-row justify-between py-1.5 border-b border-slate-100`}>
              <Text style={tw`text-sm font-semibold text-slate-700`}>Unanswered Questions:</Text>
              <Text style={tw`text-sm font-extrabold text-red-600`}>
                {String(unanswered).padStart(2, '0')}
              </Text>
            </View>
            <View style={tw`flex-row justify-between py-1.5`}>
              <Text style={tw`text-sm font-semibold text-slate-700`}>Marked for Review:</Text>
              <Text style={tw`text-sm font-extrabold text-purple-600`}>
                {String(marked).padStart(2, '0')}
              </Text>
            </View>
          </View>

          {error ? (
            <View style={tw`bg-red-50 border border-red-200 p-3 rounded-xl mb-3.5`}>
              <Text style={tw`text-xs text-red-600 font-bold text-center leading-4`}>
                {error}
              </Text>
            </View>
          ) : (
            <Text style={tw`text-xs text-red-600 font-semibold mb-4 text-center`}>
              You cannot change answers after final submission.
            </Text>
          )}

          <View style={tw`flex-row justify-between`}>
            <Button
              title="CANCEL"
              onPress={onCancel}
              variant="outline"
              disabled={loading}
              style={tw`flex-1 mr-2`}
            />
            <Button
              title="SUBMIT EXAM"
              onPress={onConfirm}
              loading={loading}
              disabled={loading}
              style={tw`flex-1 ml-2`}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
