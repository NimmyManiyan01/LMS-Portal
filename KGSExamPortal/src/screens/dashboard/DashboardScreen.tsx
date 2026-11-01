import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  AppState,
  Animated,
  Easing,
} from 'react-native';
import tw from 'twrnc';
import { Exam } from '../../types';
import * as examApi from '../../api/examApi';
import { useAuth } from '../../context/AuthContext';

interface DashboardScreenProps {
  onSelectExam: (exam: Exam) => void;
  onNavigateProfile?: () => void;
  onNavigateResults?: () => void;
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
        return { label: 'IN PROGRESS', style: tw`bg-blue-50 border border-blue-200 px-2 py-1 rounded-md`, textStyle: tw`text-blue-600 text-xs font-extrabold` };
      case 'AVAILABLE':
        return { label: 'AVAILABLE', style: tw`bg-green-100 border border-green-300 px-2 py-1 rounded-md`, textStyle: tw`text-green-700 text-xs font-extrabold` };
      case 'UPCOMING':
        return { label: 'UPCOMING', style: tw`bg-amber-100 border border-amber-300 px-2 py-1 rounded-md`, textStyle: tw`text-amber-700 text-xs font-extrabold` };
      default:
        return { label: 'AVAILABLE', style: tw`bg-green-100 border border-green-300 px-2 py-1 rounded-md`, textStyle: tw`text-green-700 text-xs font-extrabold` };
    }
  };

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      {/* Top Welcome Bar */}
      <Animated.View
        style={[
          tw`bg-white p-5 pt-12 flex-row justify-between items-center border-b border-slate-200 shadow-sm`,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View style={tw`flex-1`}>
          <Text style={tw`text-xs text-slate-500`}>Welcome back,</Text>
          <Text style={tw`text-xl font-extrabold text-slate-900 tracking-wide`}>{student?.fullName || 'Candidate'}</Text>
          <View style={tw`bg-blue-50 px-2 py-0.5 rounded border border-blue-200 self-start mt-1`}>
            <Text style={tw`text-xs text-blue-600 font-extrabold`}>{student?.studentId || 'KGS-STUDENT'}</Text>
          </View>
        </View>

        {/* Quick Navigation Action Buttons */}
        <View style={tw`flex-row items-center gap-2`}>
          {onNavigateResults && (
            <TouchableOpacity
              style={tw`w-10 h-10 rounded-xl bg-slate-100 items-center justify-center border border-slate-200`}
              onPress={onNavigateResults}
              activeOpacity={0.7}
            >
              <Text style={tw`text-lg`}>📊</Text>
            </TouchableOpacity>
          )}
          {onNavigateProfile && (
            <TouchableOpacity
              style={tw`w-10 h-10 rounded-xl bg-slate-100 items-center justify-center border border-slate-200`}
              onPress={onNavigateProfile}
              activeOpacity={0.7}
            >
              <Text style={tw`text-lg`}>👤</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Text style={tw`text-lg font-extrabold text-slate-900 mx-4.5 mt-5 mb-2.5 tracking-wide`}>My Examinations</Text>

      {loading ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={tw`text-slate-500 text-xs mt-3`}>Fetching assigned assessment papers...</Text>
        </View>
      ) : error ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Text style={tw`text-red-600 text-sm text-center mb-3.5`}>{error}</Text>
          <TouchableOpacity style={tw`bg-blue-600 px-4.5 py-2.5 rounded-lg`} onPress={fetchExams} activeOpacity={0.8}>
            <Text style={tw`text-white font-bold text-xs`}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : exams.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Text style={tw`text-slate-500 text-sm text-center leading-5`}>
            No active or assigned examinations found for your account.
          </Text>
        </View>
      ) : (
        <Animated.View style={[tw`flex-1`, { opacity: listOpacity }]}>
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
            contentContainerStyle={tw`px-4 pb-28`}
            renderItem={({ item }) => {
              const badge = getStatusBadge((item as any).status);
              const isResume = (item as any).status === 'IN_PROGRESS';

              return (
                <View style={tw`bg-white rounded-2xl p-4.5 mb-3.5 border border-slate-200 shadow-sm`}>
                  {/* Card Header */}
                  <View style={tw`flex-row justify-between items-start mb-3.5`}>
                    <View style={tw`flex-1 mr-2.5`}>
                      <Text style={tw`text-base font-extrabold text-slate-900 mb-0.5`}>{item.title}</Text>
                      <Text style={tw`text-xs text-slate-500 font-semibold`}>Code: {item.code}</Text>
                    </View>
                    <View style={badge.style}>
                      <Text style={badge.textStyle}>{badge.label}</Text>
                    </View>
                  </View>

                  {/* Meta Stats Row */}
                  <View style={tw`flex-row justify-around items-center bg-slate-50 rounded-xl py-2.5 px-1.5 mb-4 border border-slate-200`}>
                    <View style={tw`items-center flex-1`}>
                      <Text style={tw`text-xs text-slate-500 font-semibold`}>Duration</Text>
                      <Text style={tw`text-xs font-extrabold text-slate-900 mt-0.5`}>{item.durationMinutes} Mins</Text>
                    </View>
                    <View style={tw`w-px h-6 bg-slate-200`} />
                    <View style={tw`items-center flex-1`}>
                      <Text style={tw`text-xs text-slate-500 font-semibold`}>Questions</Text>
                      <Text style={tw`text-xs font-extrabold text-slate-900 mt-0.5`}>{item.totalQuestions}</Text>
                    </View>
                    <View style={tw`w-px h-6 bg-slate-200`} />
                    <View style={tw`items-center flex-1`}>
                      <Text style={tw`text-xs text-slate-500 font-semibold`}>Max Marks</Text>
                      <Text style={tw`text-xs font-extrabold text-slate-900 mt-0.5`}>{item.totalMarks}</Text>
                    </View>
                  </View>

                  {/* Launch / Resume Button */}
                  <TouchableOpacity
                    style={[tw`bg-blue-600 rounded-xl py-3 items-center`, isResume ? tw`bg-sky-600` : null]}
                    onPress={() => onSelectExam(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={tw`text-white text-xs font-black tracking-wide`}>
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
