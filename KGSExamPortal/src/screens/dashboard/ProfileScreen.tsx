import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, Easing } from 'react-native';
import tw from 'twrnc';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

interface ProfileScreenProps {
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { student, logoutStudent } = useAuth();

  const avatarScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(avatarScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <Header title="Candidate Profile" onBack={onBack} />
      <ScrollView contentContainerStyle={tw`p-4 pb-10`}>
        <Card style={tw`items-center py-6 rounded-2xl mb-3`}>
          <Animated.View
            style={[
              tw`w-18 h-18 rounded-full bg-blue-600 items-center justify-center mb-3 shadow-md`,
              { transform: [{ scale: avatarScale }] },
            ]}
          >
            <Text style={tw`text-3xl font-extrabold text-white`}>
              {student?.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
            </Text>
          </Animated.View>
          <Text style={tw`text-xl font-extrabold text-slate-900`}>{student?.fullName}</Text>
          <Text style={tw`text-xs text-blue-600 font-extrabold mt-1.5 bg-blue-50 px-3 py-1 rounded-md border border-blue-200`}>
            {student?.studentId}
          </Text>
        </Card>

        <Animated.View style={[tw`w-full`, { opacity: cardOpacity }]}>
          <Card style={tw`p-4.5 rounded-2xl mb-3`}>
            <Text style={tw`text-base font-extrabold text-slate-900 mb-3.5`}>Account Details</Text>

            <View style={tw`py-2.5 border-b border-slate-100`}>
              <Text style={tw`text-xs text-slate-500 font-semibold mb-0.5`}>Email Address</Text>
              <Text style={tw`text-sm font-bold text-slate-800`}>{student?.email}</Text>
            </View>

            <View style={tw`py-2.5 border-b border-slate-100`}>
              <Text style={tw`text-xs text-slate-500 font-semibold mb-0.5`}>Phone Number</Text>
              <Text style={tw`text-sm font-bold text-slate-800`}>{student?.phone || 'Not provided'}</Text>
            </View>

            <View style={tw`py-2.5 border-b border-slate-100`}>
              <Text style={tw`text-xs text-slate-500 font-semibold mb-0.5`}>College / Institution</Text>
              <Text style={tw`text-sm font-bold text-slate-800`}>{student?.college || 'Independent'}</Text>
            </View>

            <View style={tw`py-2.5 border-b border-slate-100`}>
              <Text style={tw`text-xs text-slate-500 font-semibold mb-0.5`}>Branch / Department</Text>
              <Text style={tw`text-sm font-bold text-slate-800`}>{student?.branch || 'Unspecified'}</Text>
            </View>

            <View style={tw`py-2.5 border-b border-slate-100`}>
              <Text style={tw`text-xs text-slate-500 font-semibold mb-0.5`}>Graduation Year</Text>
              <Text style={tw`text-sm font-bold text-slate-800`}>{student?.passOutYear || 'N/A'}</Text>
            </View>

            <View style={tw`py-2.5`}>
              <Text style={tw`text-xs text-slate-500 font-semibold mb-0.5`}>Account Status</Text>
              <Text style={tw`text-sm font-bold text-green-600`}>
                {student?.accountStatus || 'ACTIVE'}
              </Text>
            </View>
          </Card>

          <Button
            title="Log Out of Mobile App"
            onPress={logoutStudent}
            variant="danger"
            style={tw`mt-2 mb-6`}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
};
