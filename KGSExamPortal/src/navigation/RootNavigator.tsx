import React, { useState } from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ProfileScreen } from '../screens/dashboard/ProfileScreen';
import { ExamDetailsScreen } from '../screens/exam/ExamDetailsScreen';
import { ReadinessScreen } from '../screens/exam/ReadinessScreen';
import { ExamPlayerScreen } from '../screens/exam/ExamPlayerScreen';
import { SubmissionConfirmationScreen } from '../screens/exam/SubmissionConfirmationScreen';
import { ResultsScreen } from '../screens/results/ResultsScreen';
import { FloatingBottomNavbar, TabName } from '../components/common/FloatingBottomNavbar';
import { Exam } from '../types';

type ScreenName =
  | 'SPLASH'
  | 'LOGIN'
  | 'REGISTER'
  | 'OTP'
  | 'DASHBOARD'
  | 'PROFILE'
  | 'EXAM_DETAILS'
  | 'READINESS'
  | 'EXAM_PLAYER'
  | 'SUBMITTED'
  | 'RESULTS';

export const RootNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('LOGIN');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  if (isLoading) {
    return <SplashScreen />;
  }

  // Unauthenticated Flow
  if (!isAuthenticated) {
    if (currentScreen === 'REGISTER') {
      return (
        <RegisterScreen
          onNavigateLogin={() => setCurrentScreen('LOGIN')}
          onNavigateOtp={() => setCurrentScreen('OTP')}
        />
      );
    }
    if (currentScreen === 'OTP') {
      return (
        <OtpScreen onBack={() => setCurrentScreen('LOGIN')} />
      );
    }
    return (
      <LoginScreen
        onNavigateRegister={() => setCurrentScreen('REGISTER')}
        onNavigateOtp={() => setCurrentScreen('OTP')}
      />
    );
  }

  // Render floating navbar on Dashboard, Examination History (Results), and Profile
  const showNavbar =
    currentScreen === 'DASHBOARD' ||
    currentScreen === 'RESULTS' ||
    currentScreen === 'PROFILE';

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'PROFILE':
        return <ProfileScreen onBack={() => setCurrentScreen('DASHBOARD')} />;

      case 'RESULTS':
        return <ResultsScreen onBack={() => setCurrentScreen('DASHBOARD')} />;

      case 'EXAM_DETAILS':
        if (!selectedExam) {
          return (
            <DashboardScreen
              onSelectExam={setSelectedExam}
              onNavigateProfile={() => setCurrentScreen('PROFILE')}
              onNavigateResults={() => setCurrentScreen('RESULTS')}
            />
          );
        }
        return (
          <ExamDetailsScreen
            exam={selectedExam}
            onBack={() => {
              setSelectedExam(null);
              setCurrentScreen('DASHBOARD');
            }}
            onProceedReadiness={() => setCurrentScreen('READINESS')}
          />
        );

      case 'READINESS':
        if (!selectedExam) {
          return (
            <DashboardScreen
              onSelectExam={setSelectedExam}
              onNavigateProfile={() => setCurrentScreen('PROFILE')}
              onNavigateResults={() => setCurrentScreen('RESULTS')}
            />
          );
        }
        return (
          <ReadinessScreen
            exam={selectedExam}
            onBack={() => setCurrentScreen('EXAM_DETAILS')}
            onExamStarted={() => setCurrentScreen('EXAM_PLAYER')}
          />
        );

      case 'EXAM_PLAYER':
        return (
          <ExamPlayerScreen
            onExamSubmitted={() => setCurrentScreen('SUBMITTED')}
          />
        );

      case 'SUBMITTED':
        return (
          <SubmissionConfirmationScreen
            onReturnDashboard={() => {
              setSelectedExam(null);
              setCurrentScreen('DASHBOARD');
            }}
          />
        );

      case 'DASHBOARD':
      default:
        return (
          <DashboardScreen
            onSelectExam={(exam) => {
              setSelectedExam(exam);
              setCurrentScreen('EXAM_DETAILS');
            }}
            onNavigateProfile={() => setCurrentScreen('PROFILE')}
            onNavigateResults={() => setCurrentScreen('RESULTS')}
          />
        );
    }
  };

  return (
    <View style={tw`flex-1 relative bg-slate-50`}>
      {renderActiveScreen()}
    </View>
  );
};
