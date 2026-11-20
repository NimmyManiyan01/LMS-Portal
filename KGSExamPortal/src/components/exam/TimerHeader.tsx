import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface TimerHeaderProps {
  remainingSeconds: number;
  examTitle: string;
  currentQuestionNum?: number;
  totalQuestions?: number;
  cameraActive?: boolean;
  isSaving?: boolean;
  syncError?: boolean;
}

export const TimerHeader: React.FC<TimerHeaderProps> = ({
  remainingSeconds,
  examTitle,
  currentQuestionNum,
  totalQuestions,
  cameraActive = true,
  isSaving = false,
  syncError = false,
}) => {
  const insets = useSafeAreaInsets();

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isLowTime = remainingSeconds <= 300; // Less than 5 mins

  const getSyncTextClass = () => {
    if (syncError) return 'text-red-600';
    if (isSaving) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <View
      style={[
        tw`bg-white pb-2.5 px-3.5 border-b border-slate-200 shadow-sm`,
        { paddingTop: Math.max(insets.top, 10) },
      ]}
    >
      <View style={tw`flex-row items-center justify-between min-h-11`}>
        <View style={tw`flex-1 mr-2`}>
          <Text style={tw`text-slate-900 text-sm font-extrabold`} numberOfLines={1}>
            {examTitle}
          </Text>
          <View style={tw`flex-row items-center mt-0.5`}>
            {currentQuestionNum && totalQuestions ? (
              <Text style={tw`text-blue-600 text-xs font-bold mr-1.5`}>
                Q {currentQuestionNum} / {totalQuestions}
              </Text>
            ) : null}

            {/* Sync Status Badge */}
            <View style={tw`bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200`}>
              <Text style={tw`text-xs font-bold ${getSyncTextClass()}`}>
                {syncError
                  ? 'Not synced'
                  : isSaving
                  ? 'Saving...'
                  : 'Saved'}
              </Text>
            </View>
          </View>
        </View>

        <View style={tw`flex-row items-center`}>
          <View style={tw`flex-row mr-1.5`}>
            <View style={tw`flex-row items-center bg-slate-50 px-1.5 py-1 rounded ml-1 border border-slate-200`}>
              <View style={tw`w-1.5 h-1.5 rounded-full bg-green-600 mr-1`} />
              <Text style={tw`text-slate-600 text-xs font-semibold`}>Network</Text>
            </View>
            {cameraActive ? (
              <View style={tw`flex-row items-center bg-slate-50 px-1.5 py-1 rounded ml-1 border border-slate-200`}>
                <View style={tw`w-1.5 h-1.5 rounded-full bg-green-600 mr-1`} />
                <Text style={tw`text-slate-600 text-xs font-semibold`}>Cam</Text>
              </View>
            ) : null}
          </View>

          <View
            style={[
              tw`bg-blue-50 px-2 py-1.5 rounded-md border border-blue-200`,
              isLowTime ? tw`bg-red-50 border-red-200` : null,
            ]}
          >
            <Text
              style={[
                tw`text-blue-800 text-xs font-extrabold`,
                isLowTime ? tw`text-red-600` : null,
              ]}
            >
              ⏱ {formatTime(remainingSeconds)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
