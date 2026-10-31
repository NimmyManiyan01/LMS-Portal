import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const { checkAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState<boolean>(true);

  // Animated values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;

  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const shimmerTranslateX = useRef(new Animated.Value(-width * 0.4)).current;
  const statusOpacity = useRef(new Animated.Value(0.5)).current;

  const startCinematicAnimations = () => {
    // 1. Logo Bounce Entrance
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Title Slide & Fade Up
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 3. Subtitle Fade In
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    });

    // Loop 1: Ambient Pulse Glow around Logo
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.4,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.3,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Loop 2: Shimmer Progress Line Animation
    Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: width * 0.4,
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    ).start();

    // Loop 3: Status Text Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(statusOpacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const initSessionCheck = async () => {
    setChecking(true);
    setError(null);

    // Minimum display timer of 10.0s so candidate can enjoy the cinematic sequence
    const minDisplayTimer = new Promise((resolve) => setTimeout(resolve, 10000));

    try {
      await Promise.all([checkAuth(), minDisplayTimer]);
    } catch (err: any) {
      await minDisplayTimer;
      setError(
        err.message || 'Unable to connect to examination server. Please verify connection.'
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    startCinematicAnimations();
    initSessionCheck();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Soft Glow Orbs */}
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Pulsing Outer Ring */}
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />

        {/* Central Cap Badge */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.logoCapIcon}>🎓</Text>
        </Animated.View>

        {/* Animated App Title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.brandTitle}>KGS EXAM PORTAL</Text>
          <View style={styles.brandGlowLine} />
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={{ opacity: subtitleOpacity, alignItems: 'center' }}>
          <Text style={styles.brandSubtitle}>
            Secure Candidate Examination Platform
          </Text>
        </Animated.View>
      </View>

      {/* Footer Progress & Status */}
      <View style={styles.footerSection}>
        {checking ? (
          <View style={styles.loadingWrapper}>
            <View style={styles.shimmerTrack}>
              <Animated.View
                style={[
                  styles.shimmerBar,
                  {
                    transform: [{ translateX: shimmerTranslateX }],
                  },
                ]}
              />
            </View>

            <Animated.Text style={[styles.statusText, { opacity: statusOpacity }]}>
              Initializing Secure Assessment Session...
            </Animated.Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={initSessionCheck} activeOpacity={0.8}>
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.copyrightText}>KGS Assessment Engine v1.0 • Protected</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  bgGlowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logoCapIcon: {
    fontSize: 44,
  },
  brandTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  brandGlowLine: {
    width: 50,
    height: 3,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    marginVertical: 10,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontWeight: '600',
  },
  footerSection: {
    width: '100%',
    alignItems: 'center',
  },
  loadingWrapper: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  shimmerTrack: {
    width: width * 0.5,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  shimmerBar: {
    width: width * 0.25,
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  statusText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  copyrightText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});
