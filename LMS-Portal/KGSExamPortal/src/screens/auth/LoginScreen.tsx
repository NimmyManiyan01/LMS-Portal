import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import tw from 'twrnc';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  onNavigateRegister: () => void;
  onNavigateOtp: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateRegister,
  onNavigateOtp,
}) => {
  const { requestOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cinematic Animated Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-24)).current;

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

  const badgeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence Entrance Animation
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
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
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
      ]),
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRequestOtp = async () => {
    if (
      !email ||
      !/^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/.test(email.trim())
    ) {
      setError('Please enter a valid registered email address');
      return;
    }
    setError(null);
    setLoading(true);

    const res = await requestOtp(email.trim().toLowerCase());
    setLoading(false);

    if (res.success) {
      onNavigateOtp();
    } else {
      setError(
        res.error || 'Failed to request OTP. Ensure email is registered.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-slate-50`}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={tw`flex-1 bg-slate-50`}
        contentContainerStyle={tw`p-5 pt-12 pb-10 min-h-full justify-center`}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <Animated.View
          style={[
            tw`items-center mb-6`,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View style={tw`w-16 h-16 rounded-full bg-white items-center justify-center mb-3 border-2 border-blue-600 shadow-md`}>
            <Text style={tw`text-3xl`}>🎓</Text>
          </View>
          <Text style={tw`text-2xl font-extrabold text-slate-900 tracking-wider`}>KGS EXAM PORTAL</Text>
          <View style={tw`w-12 h-1 bg-blue-600 rounded my-2`} />
          <Text style={tw`text-xs text-slate-500 font-medium tracking-wide`}>Candidate Mobile Authentication</Text>
        </Animated.View>

        {/* Light Glassmorphism Card */}
        <Animated.View
          style={[
            tw`bg-white rounded-2xl p-5 border border-slate-200 shadow-lg`,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <Text style={tw`text-lg font-extrabold text-slate-900 mb-1`}>Sign In with Email OTP</Text>
          <Text style={tw`text-xs text-slate-500 leading-4 mb-4.5`}>
            Enter your registered email address to receive a 6-digit verification code.
          </Text>

          {error ? (
            <View style={tw`bg-red-50 border border-red-200 rounded-xl p-3 mb-4`}>
              <Text style={tw`text-red-600 text-xs text-center font-bold mb-1.5`}>{error}</Text>
              {error.toLowerCase().includes('register') ? (
                <TouchableOpacity
                  onPress={onNavigateRegister}
                  activeOpacity={0.8}
                  style={tw`self-center bg-blue-600 px-3.5 py-1.5 rounded-lg mt-1`}
                >
                  <Text style={tw`text-white text-xs font-bold`}>Click here to Register ➔</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <Input
            label="Registered Email Address"
            placeholder="e.g. student@college.edu"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Button
            title="SEND VERIFICATION OTP"
            onPress={handleRequestOtp}
            loading={loading}
            style={tw`mt-4`}
          />
        </Animated.View>

        {/* Bottom Navigation & Security Badge */}
        <Animated.View style={[tw`items-center mt-7`, { opacity: badgeOpacity }]}>
          <View style={tw`flex-row items-center mb-4`}>
            <Text style={tw`text-sm text-slate-500 mr-1.5`}>New candidate?</Text>
            <TouchableOpacity onPress={onNavigateRegister} activeOpacity={0.8}>
              <Text style={tw`text-sm font-extrabold text-blue-600`}>Register Student Account</Text>
            </TouchableOpacity>
          </View>

          <View style={tw`bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200`}>
            <Text style={tw`text-xs text-blue-700 font-bold`}>🔒 End-to-End Encrypted Session</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
