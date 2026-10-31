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
        tw`absolute bottom-5 left-5 right-5 z-50 bg-white rounded-full p-2 flex-row justify-around items-center border border-slate-200 shadow-xl`,
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
              tw`flex-row items-center px-4 py-2.5 rounded-full`,
              isActive ? tw`bg-blue-600 shadow-md` : tw`bg-transparent`,
            ]}
          >
            <Text style={tw`text-base mr-1.5`}>{tab.icon}</Text>
            <Text
              style={[
                tw`text-xs font-extrabold`,
                isActive ? tw`text-white` : tw`text-slate-600`,
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
