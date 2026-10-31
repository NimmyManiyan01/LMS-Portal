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

interface RegisterScreenProps {
  onNavigateLogin: () => void;
  onNavigateOtp: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateLogin,
  onNavigateOtp,
}) => {
  const { register, requestOtp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [passOutYear, setPassOutYear] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [monitoringAccepted, setMonitoringAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cinematic Animated Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

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

  const handleRegister = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Full Name must be at least 2 characters.');
      return;
    }
    if (
      !email ||
      !/^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/.test(email.trim())
    ) {
      setError('Please provide a valid email address.');
      return;
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Phone number must be a 10-digit Indian phone number.');
      return;
    }
    if (!privacyAccepted || !monitoringAccepted) {
      setError('You must accept both Privacy Policy and Examination Monitoring Policy.');
      return;
    }

    setError(null);
    setLoading(true);

    const regRes = await register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      college: college.trim() || undefined,
      branch: branch.trim() || undefined,
      passOutYear: passOutYear ? Number(passOutYear) : undefined,
      privacyAccepted,
      monitoringAccepted,
    });

    if (!regRes.success) {
      setLoading(false);
      setError(regRes.error || 'Registration failed. Please try again.');
      return;
    }

    // Immediately request OTP after successful registration
    const otpRes = await requestOtp(email.trim().toLowerCase());
    setLoading(false);

    if (otpRes.success) {
      onNavigateOtp();
    } else {
      onNavigateLogin();
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

        {/* Animated Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>Student Registration</Text>
          <View style={styles.glowLine} />
          <Text style={styles.subtitle}>
            Register to receive your unique Candidate Student ID (`KGS-STU-XXXXXX`).
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            required
          />

          <Input
            label="Email Address"
            placeholder="student@domain.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Input
            label="Phone Number (Optional)"
            placeholder="10-digit mobile number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Input
            label="College / Institution (Optional)"
            placeholder="e.g. KGS Engineering College"
            value={college}
            onChangeText={setCollege}
          />

          <Input
            label="Branch / Department (Optional)"
            placeholder="e.g. Computer Science"
            value={branch}
            onChangeText={setBranch}
          />

          <Input
            label="Graduation / Pass-out Year (Optional)"
            placeholder="e.g. 2025"
            value={passOutYear}
            onChangeText={setPassOutYear}
            keyboardType="number-pad"
            maxLength={4}
          />

          {/* Policy Checkboxes */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setPrivacyAccepted(!privacyAccepted)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, privacyAccepted && styles.checkedBox]}>
              {privacyAccepted && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.checkText}>
              I agree to the <Text style={styles.linkText}>Privacy Policy</Text> *
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setMonitoringAccepted(!monitoringAccepted)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, monitoringAccepted && styles.checkedBox]}>
              {monitoringAccepted && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.checkText}>
              I accept <Text style={styles.linkText}>Examination Integrity Rules</Text> *
            </Text>
          </TouchableOpacity>

          <Button
            title="COMPLETE REGISTRATION & SEND OTP"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
          />
        </Animated.View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already registered?</Text>
          <TouchableOpacity onPress={onNavigateLogin} activeOpacity={0.8}>
            <Text style={styles.loginLink}>Sign In Here</Text>
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  glowLine: {
    width: 50,
    height: 2.5,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkedBox: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  linkText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 18,
    backgroundColor: '#2563EB',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 6,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
});
