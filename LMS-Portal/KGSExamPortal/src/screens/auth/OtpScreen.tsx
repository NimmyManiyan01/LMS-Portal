import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import tw from 'twrnc';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

interface OtpScreenProps {
  onBack: () => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({ onBack }) => {
  const { loginEmail, verifyOtp, requestOtp } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);

  const inputRef = useRef<TextInput>(null);

  // Cinematic Animated Values
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    // Sequence Entrance Animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
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
    ]).start(() => {
      // Auto-focus the input after animation finishes
      setTimeout(() => inputRef.current?.focus(), 100);
    });
  }, []);

  const handleVerify = async () => {
    if (!code || code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError(null);
    setLoading(true);

    const res = await verifyOtp(loginEmail, code.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    const res = await requestOtp(loginEmail);
    if (res.success) {
      setResendCooldown(res.cooldownSeconds || 45);
    } else {
      setError(res.error || 'Failed to resend OTP code.');
    }
  };

  const codeChars = code.split('');

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
        {/* Top Mail Badge */}
        <Animated.View
          style={[
            tw`items-center mb-5`,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <View style={tw`w-17 h-17 rounded-full bg-white items-center justify-center border-2 border-blue-600 shadow-md`}>
            <Text style={tw`text-3xl`}>📩</Text>
          </View>
        </Animated.View>

        {/* Light Glass Card */}
        <Animated.View
          style={[
            tw`bg-white rounded-2xl p-5.5 border border-slate-200 shadow-lg`,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <Text style={tw`text-xl font-extrabold text-slate-900 mb-1.5 text-center tracking-wide`}>Verify Email</Text>
          <Text style={tw`text-xs text-slate-500 leading-4 mb-6 text-center`}>
            Enter the 6-digit verification code sent to{' '}
            <Text style={tw`text-blue-600 font-bold`}>{loginEmail}</Text>.
          </Text>

          {error ? (
            <View style={tw`bg-red-50 border border-red-200 rounded-lg p-2.5 mb-4`}>
              <Text style={tw`text-red-600 text-xs text-center font-semibold`}>{error}</Text>
            </View>
          ) : null}

          {/* Interactive 6-Digit OTP Box Grid (ONLY INPUT ON SCREEN) */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={tw`relative mb-6`}
          >
            <View style={tw`flex-row justify-between`}>
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const char = codeChars[idx] || '';
                const isFilled = char !== '';
                const isCurrent = code.length === idx || (idx === 5 && code.length === 6);

                return (
                  <View
                    key={idx}
                    style={[
                      tw`w-11 h-13 rounded-xl bg-slate-50 border-2 border-slate-200 items-center justify-center`,
                      isFilled ? tw`border-blue-600 bg-blue-50` : null,
                      isCurrent && !isFilled ? tw`border-blue-500 bg-blue-50/40` : null,
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-2xl font-black text-slate-400`,
                        isFilled ? tw`text-blue-700` : null,
                      ]}
                    >
                      {char || ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Hidden Input overlaid on top of the 6 digit boxes */}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(val) => {
                const cleaned = val.replace(/[^0-9]/g, '').slice(0, 6);
                setCode(cleaned);
                setError(null);
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              style={tw`absolute inset-0 opacity-0`}
            />
          </TouchableOpacity>

          <Button
            title="VERIFY OTP & SIGN IN"
            onPress={handleVerify}
            loading={loading}
            disabled={code.length !== 6}
            style={tw`mt-2`}
          />

          {/* Resend Cooldown Section */}
          <View style={tw`items-center mt-5`}>
            {resendCooldown > 0 ? (
              <View style={tw`bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200`}>
                <Text style={tw`text-xs text-blue-700 font-bold`}>
                  ⏱ Resend available in {String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:
                  {String(resendCooldown % 60).padStart(2, '0')}
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleResend} style={tw`py-1.5`} activeOpacity={0.8}>
                <Text style={tw`text-sm text-blue-600 font-extrabold`}>Resend OTP Code</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={tw`mt-4 p-1.5`} onPress={onBack} activeOpacity={0.8}>
              <Text style={tw`text-xs text-slate-500 font-semibold`}>← Change Email Address</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
