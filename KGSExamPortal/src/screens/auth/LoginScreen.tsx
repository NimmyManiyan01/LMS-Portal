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

        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View style={styles.capBadge}>
            <Text style={styles.capIcon}>🎓</Text>
          </View>
          <Text style={styles.appTitle}>KGS EXAM PORTAL</Text>
          <View style={styles.glowLine} />
          <Text style={styles.appSubtitle}>Candidate Mobile Authentication</Text>
        </Animated.View>

        {/* Light Glassmorphism Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <Text style={styles.cardTitle}>Sign In with Email OTP</Text>
          <Text style={styles.cardDesc}>
            Enter your registered email address to receive a 6-digit verification code.
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
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
            style={styles.submitBtn}
          />
        </Animated.View>

        {/* Bottom Navigation & Security Badge */}
        <Animated.View style={[styles.bottomSection, { opacity: badgeOpacity }]}>
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New candidate?</Text>
            <TouchableOpacity onPress={onNavigateRegister} activeOpacity={0.8}>
              <Text style={styles.registerLink}>Register Student Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.securityBadge}>
            <Text style={styles.securityText}>🔒 End-to-End Encrypted Session</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  capBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  capIcon: {
    fontSize: 32,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  glowLine: {
    width: 50,
    height: 2.5,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    marginVertical: 8,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.5,
    fontWeight: '500',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 18,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 28,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  registerText: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 6,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  securityBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  securityText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
  },
});
