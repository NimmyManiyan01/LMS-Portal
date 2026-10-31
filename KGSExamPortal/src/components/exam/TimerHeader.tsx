import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.headerContentRow}>
        <View style={styles.leftCol}>
          <Text style={styles.title} numberOfLines={1}>
            {examTitle}
          </Text>
          <View style={styles.subRow}>
            {currentQuestionNum && totalQuestions ? (
              <Text style={styles.questionCounter}>
                Q {currentQuestionNum} / {totalQuestions}
              </Text>
            ) : null}

            {/* Sync Status Badge */}
            <View style={styles.syncBadge}>
              <Text
                style={[
                  styles.syncText,
                  syncError
                    ? styles.syncErrorText
                    : isSaving
                    ? styles.savingText
                    : styles.savedText,
                ]}
              >
                {syncError
                  ? 'Not synced'
                  : isSaving
                  ? 'Saving...'
                  : 'Saved'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.statusBadges}>
            <View style={styles.statusDotBox}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Network</Text>
            </View>
            {cameraActive && (
              <View style={styles.statusDotBox}>
                <View style={styles.greenDot} />
                <Text style={styles.statusText}>Cam</Text>
              </View>
            )}
          </View>

          <View style={[styles.timerBadge, isLowTime && styles.lowTimeBadge]}>
            <Text style={[styles.timerText, isLowTime && styles.lowTimeText]}>
              ⏱ {formatTime(remainingSeconds)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftCol: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  questionCounter: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  syncBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
  },
  savingText: {
    color: '#D97706',
  },
  savedText: {
    color: '#16A34A',
  },
  syncErrorText: {
    color: '#DC2626',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadges: {
    flexDirection: 'row',
    marginRight: 6,
  },
  statusDotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 3,
  },
  statusText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  timerBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  lowTimeBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  timerText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  lowTimeText: {
    color: '#DC2626',
  },
});
