import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input } from '../../components/common/Input';
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
    ]).start();
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

  // Render 6 visual digit boxes based on typed code
  const codeChars = code.split('');

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Soft Ambient Glow Orbs */}
        <View style={styles.ambientOrbTop} />
        <View style={styles.ambientOrbBottom} />

        {/* Top Mail Badge */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📩</Text>
          </View>
        </Animated.View>

        {/* Light Glass Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to{' '}
            <Text style={styles.emailHighlight}>{loginEmail}</Text>.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* 6 Digit Display Boxes */}
          <View style={styles.digitBoxesRow}>
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const char = codeChars[idx] || '';
              const isFilled = char !== '';
              return (
                <View
                  key={idx}
                  style={[styles.digitBox, isFilled && styles.filledDigitBox]}
                >
                  <Text style={[styles.digitText, isFilled && styles.filledDigitText]}>
                    {char || '•'}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Actual Hidden/Focused Input */}
          <Input
            label="6-Digit Verification Code"
            placeholder="Enter 6-digit code"
            value={code}
            onChangeText={(val) => {
              setCode(val);
              setError(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
          />

          <Button
            title="VERIFY OTP & SIGN IN"
            onPress={handleVerify}
            loading={loading}
            style={styles.verifyBtn}
          />

          {/* Resend Cooldown Section */}
          <View style={styles.resendContainer}>
            {resendCooldown > 0 ? (
              <View style={styles.timerBadge}>
                <Text style={styles.cooldownText}>
                  ⏱ Resend available in {String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:
                  {String(resendCooldown % 60).padStart(2, '0')}
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleResend} style={styles.resendBtn} activeOpacity={0.8}>
                <Text style={styles.resendLink}>Resend OTP Code</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.changeEmailBtn} onPress={onBack} activeOpacity={0.8}>
              <Text style={styles.changeEmailText}>← Change Email Address</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
    minHeight: '100%',
    justifyContent: 'center',
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  iconText: {
    fontSize: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  emailHighlight: {
    color: '#2563EB',
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  digitBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  digitBox: {
    width: 44,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledDigitBox: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  digitText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#94A3B8',
  },
  filledDigitText: {
    color: '#0F172A',
  },
  verifyBtn: {
    marginTop: 14,
    backgroundColor: '#2563EB',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cooldownText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  resendBtn: {
    paddingVertical: 6,
  },
  resendLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '800',
  },
  changeEmailBtn: {
    marginTop: 16,
    padding: 6,
  },
  changeEmailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
