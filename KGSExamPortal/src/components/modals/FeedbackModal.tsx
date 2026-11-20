import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import tw from 'twrnc';
import { Button } from '../common/Button';

interface FeedbackModalProps {
  visible: boolean;
  onSubmit: (rating: number, comment?: string) => Promise<boolean>;
  onSkip: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onSubmit,
  onSkip,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const success = await onSubmit(rating, comment.trim());
    setSubmitting(false);

    if (!success) {
      setError('Unable to save feedback. Unsent feedback retained for retry.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tw`flex-1 bg-slate-900/80 justify-center items-center p-5`}>
        <View style={tw`bg-white rounded-2xl p-5.5 w-full shadow-xl`}>
          <Text style={tw`text-xl font-extrabold text-slate-900 mb-1 text-center`}>
            Exam Feedback
          </Text>
          <Text style={tw`text-xs text-slate-500 mb-4 text-center`}>
            How was your examination experience?
          </Text>

          {error ? (
            <View style={tw`bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3`}>
              <Text style={tw`text-red-600 text-xs text-center font-semibold`}>{error}</Text>
            </View>
          ) : null}

          {/* Star Rating Bar */}
          <View style={tw`flex-row justify-center mb-4`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  setRating(star);
                  setError(null);
                }}
                style={tw`p-1.5`}
              >
                <Text style={tw`text-4xl ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Comments Input */}
          <Text style={tw`text-xs font-semibold text-slate-700 mb-1.5`}>Additional Comments</Text>
          <TextInput
            style={tw`border border-slate-300 rounded-xl p-3 text-sm text-slate-900 bg-slate-50 h-22 mb-4.5`}
            placeholder="Share any additional comments or technical feedback (optional)"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            maxLength={1000}
            value={comment}
            onChangeText={(val) => {
              setComment(val);
              setError(null);
            }}
          />

          <View style={tw`flex-row justify-between`}>
            <Button
              title="Skip"
              onPress={onSkip}
              variant="outline"
              disabled={submitting}
              style={tw`flex-1 mr-2`}
            />
            <Button
              title="SUBMIT FEEDBACK"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || rating < 1}
              style={tw`flex-1 ml-2`}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
