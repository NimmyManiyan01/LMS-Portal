import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import tw from 'twrnc';
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

    // Optimal 2.0s splash screen display duration
    const minDisplayTimer = new Promise((resolve) => setTimeout(resolve, 2000));

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
    <View style={tw`flex-1 bg-slate-50 items-center justify-between py-12 px-6`}>
      {/* Main Content */}
      <View style={tw`flex-1 items-center justify-center`}>
        {/* Pulsing Outer Ring */}
        <Animated.View
          style={[
            tw`absolute w-28 h-28 rounded-full bg-blue-500/15 border border-blue-200`,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />

        {/* Central Cap Badge */}
        <Animated.View
          style={[
            tw`w-22.5 h-22.5 rounded-full bg-white items-center justify-center mb-5 border-2 border-blue-600 shadow-lg`,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={tw`text-4xl`}>🎓</Text>
        </Animated.View>

        {/* Animated App Title */}
        <Animated.View
          style={[
            tw`items-center`,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={tw`text-2xl font-black text-slate-900 tracking-wider text-center`}>
            KGS EXAM PORTAL
          </Text>
          <View style={tw`w-12 h-1 bg-blue-600 rounded my-2.5`} />
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={[{ opacity: subtitleOpacity }, tw`items-center`]}>
          <Text style={tw`text-xs text-slate-500 tracking-wide text-center font-semibold`}>
            Secure Candidate Examination Platform
          </Text>
        </Animated.View>
      </View>

      {/* Footer Progress & Status */}
      <View style={tw`w-full items-center`}>
        {checking ? (
          <View style={tw`items-center w-full mb-5`}>
            <View style={[tw`h-1 bg-slate-200 rounded-full overflow-hidden mb-3`, { width: width * 0.5 }]}>
              <Animated.View
                style={[
                  tw`h-full bg-blue-600 rounded-full`,
                  {
                    width: width * 0.25,
                    transform: [{ translateX: shimmerTranslateX }],
                  },
                ]}
              />
            </View>

            <Animated.Text style={[tw`text-blue-600 text-xs font-bold tracking-wide`, { opacity: statusOpacity }]}>
              Initializing Secure Assessment Session...
            </Animated.Text>
          </View>
        ) : error ? (
          <View style={tw`items-center mb-5 px-4`}>
            <Text style={tw`text-red-600 text-xs text-center mb-3 leading-4`}>{error}</Text>
            <TouchableOpacity style={tw`bg-blue-600 px-5 py-2.5 rounded-lg`} onPress={initSessionCheck} activeOpacity={0.8}>
              <Text style={tw`text-white font-bold text-xs`}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={tw`text-slate-400 text-xs font-semibold`}>KGS Assessment Engine v1.0 • Protected</Text>
      </View>
    </View>
  );
};
