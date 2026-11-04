import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import tw from 'twrnc';

export type TabName = 'DASHBOARD' | 'RESULTS' | 'PROFILE';

interface FloatingBottomNavbarProps {
  currentTab: TabName;
  onSelectTab: (tab: TabName) => void;
}

export const FloatingBottomNavbar: React.FC<FloatingBottomNavbarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const tabs: { id: TabName; label: string; icon: string }[] = [
    { id: 'DASHBOARD', label: 'Exams', icon: '📝' },
    { id: 'RESULTS', label: 'Marks', icon: '📊' },
    { id: 'PROFILE', label: 'Profile', icon: '👤' },
  ];

  // Animated floating slide-up effect
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        tw`absolute bottom-5 left-6 right-6 z-50 bg-white/95 rounded-3xl py-2 px-3 flex-row justify-around items-center border border-slate-200 shadow-xl`,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.8}
            style={[
              tw`items-center justify-center px-6 py-2 rounded-2xl`,
              isActive ? tw`bg-blue-600 shadow-sm` : tw`bg-transparent`,
            ]}
          >
            <Text style={tw`text-2xl mb-1`}>{tab.icon}</Text>
            <Text
              style={[
                tw`text-xs font-black tracking-wide`,
                isActive ? tw`text-white` : tw`text-slate-500`,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};
