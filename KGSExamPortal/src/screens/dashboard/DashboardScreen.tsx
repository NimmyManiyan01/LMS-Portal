import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  AppState,
  Animated,
  Easing,
} from 'react-native';
import { Exam } from '../../types';
import * as examApi from '../../api/examApi';
import { useAuth } from '../../context/AuthContext';

interface DashboardScreenProps {
  onSelectExam: (exam: Exam) => void;
  onNavigateProfile: () => void;
  onNavigateResults: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSelectExam,
  onNavigateProfile,
  onNavigateResults,
}) => {
  const { student } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animated Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchExams = async () => {
    setError(null);
    const res = await examApi.getExams();
    setLoading(false);
    setRefreshing(false);

    if (res.data) {
      setExams(res.data);
    } else {
      setError(res.error || 'Failed to load assigned examinations');
    }
  };

  useEffect(() => {
    fetchExams();

    // FR-EXAM-07: Refresh examination statuses when application becomes active
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        fetchExams();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'IN PROGRESS', style: styles.progressBadge, textStyle: styles.progressText };
      case 'AVAILABLE':
        return { label: 'AVAILABLE', style: styles.availBadge, textStyle: styles.availText };
      case 'UPCOMING':
        return { label: 'UPCOMING', style: styles.upcomingBadge, textStyle: styles.upcomingText };
      default:
        return { label: 'AVAILABLE', style: styles.availBadge, textStyle: styles.availText };
    }
  };

  return (
    <View style={styles.container}>
      {/* Soft Ambient Background Glows */}
      <View style={styles.ambientOrbTop} />
      <View style={styles.ambientOrbBottom} />

      {/* Top Welcome Bar */}
      <Animated.View
        style={[
          styles.topBar,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.studentName}>{student?.fullName || 'Candidate'}</Text>
          <View style={styles.idPill}>
            <Text style={styles.studentIdBadge}>{student?.studentId || 'KGS-STUDENT'}</Text>
          </View>
        </View>

        <View style={styles.topRightBtns}>
          <TouchableOpacity style={styles.iconBtn} onPress={onNavigateResults} activeOpacity={0.8}>
            <Text style={styles.iconBtnText}>📊 Marks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onNavigateProfile} activeOpacity={0.8}>
            <Text style={styles.iconBtnText}>👤 Profile</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Text style={styles.sectionHeader}>My Examinations</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching assigned assessment papers...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchExams} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : exams.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            No active or assigned examinations found for your account.
          </Text>
        </View>
      ) : (
        <Animated.View style={[{ flex: 1 }, { opacity: listOpacity }]}>
          <FlatList
            data={exams}
            keyExtractor={(item) => item._id || item.code}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2563EB"
              />
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const badge = getStatusBadge((item as any).status);
              const isResume = (item as any).status === 'IN_PROGRESS';

              return (
                <View style={styles.examCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.titleCol}>
                      <Text style={styles.examTitle}>{item.title}</Text>
                      <Text style={styles.codeText}>Code: {item.code}</Text>
                    </View>
                    <View style={badge.style}>
                      <Text style={badge.textStyle}>{badge.label}</Text>
                    </View>
                  </View>

                  {/* Meta Stats Row */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Duration</Text>
                      <Text style={styles.metaValue}>{item.durationMinutes} Mins</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Questions</Text>
                      <Text style={styles.metaValue}>{item.totalQuestions}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Max Marks</Text>
                      <Text style={styles.metaValue}>{item.totalMarks}</Text>
                    </View>
                  </View>

                  {/* Launch / Resume Button */}
                  <TouchableOpacity
                    style={[styles.startBtn, isResume && styles.resumeBtn]}
                    onPress={() => onSelectExam(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startBtnText}>
                      {isResume ? 'RESUME EXAMINATION ➔' : 'START EXAMINATION ➔'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </Animated.View>
      )}
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
  topBar: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  welcomeText: {
    fontSize: 12,
    color: '#64748B',
  },
  studentName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  idPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  studentIdBadge: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '800',
  },
  topRightBtns: {
    flexDirection: 'row',
  },
  iconBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  iconBtnText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  examCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  examTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  codeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  availBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  progressBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
  },
  upcomingBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upcomingText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  startBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resumeBtn: {
    backgroundColor: '#0284C7',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
