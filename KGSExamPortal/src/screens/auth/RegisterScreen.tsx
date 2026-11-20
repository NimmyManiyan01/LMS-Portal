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
      style={tw`flex-1 bg-slate-50`}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={tw`flex-1 bg-slate-50`}
        contentContainerStyle={tw`p-5 pt-12 pb-10`}
        keyboardShouldPersistTaps="handled"
      >
        {/* Animated Header */}
        <Animated.View
          style={[
            tw`items-center mb-6`,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <Text style={tw`text-2xl font-extrabold text-slate-900 tracking-wide`}>Student Registration</Text>
          <View style={tw`w-12 h-1 bg-blue-600 rounded my-2`} />
          <Text style={tw`text-xs text-slate-500 text-center leading-4 font-medium`}>
            Register to receive your unique Candidate Student ID (`KGS-STU-XXXXXX`).
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            tw`bg-white rounded-2xl p-5 border border-slate-200 shadow-lg`,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          {error ? (
            <View style={tw`bg-red-50 border border-red-200 rounded-lg p-2.5 mb-4`}>
              <Text style={tw`text-red-600 text-xs text-center font-semibold`}>{error}</Text>
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
            style={tw`flex-row items-center my-2`}
            onPress={() => setPrivacyAccepted(!privacyAccepted)}
            activeOpacity={0.8}
          >
            <View style={[tw`w-5 h-5 rounded border-2 border-slate-400 items-center justify-center mr-2.5 bg-white`, privacyAccepted ? tw`bg-blue-600 border-blue-600` : null]}>
              {privacyAccepted ? <Text style={tw`text-white text-xs font-bold`}>✓</Text> : null}
            </View>
            <Text style={tw`text-xs text-slate-700 flex-1`}>
              I agree to the <Text style={tw`text-blue-600 font-bold`}>Privacy Policy</Text> *
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-row items-center my-2`}
            onPress={() => setMonitoringAccepted(!monitoringAccepted)}
            activeOpacity={0.8}
          >
            <View style={[tw`w-5 h-5 rounded border-2 border-slate-400 items-center justify-center mr-2.5 bg-white`, monitoringAccepted ? tw`bg-blue-600 border-blue-600` : null]}>
              {monitoringAccepted ? <Text style={tw`text-white text-xs font-bold`}>✓</Text> : null}
            </View>
            <Text style={tw`text-xs text-slate-700 flex-1`}>
              I accept <Text style={tw`text-blue-600 font-bold`}>Examination Integrity Rules</Text> *
            </Text>
          </TouchableOpacity>

          <Button
            title="COMPLETE REGISTRATION & SEND OTP"
            onPress={handleRegister}
            loading={loading}
            style={tw`mt-4.5`}
          />
        </Animated.View>

        <View style={tw`flex-row justify-center items-center mt-6`}>
          <Text style={tw`text-sm text-slate-500 mr-1.5`}>Already registered?</Text>
          <TouchableOpacity onPress={onNavigateLogin} activeOpacity={0.8}>
            <Text style={tw`text-sm font-extrabold text-blue-600`}>Sign In Here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
