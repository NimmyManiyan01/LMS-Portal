import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
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
    <View style={styles.container}>
      <Header title="Candidate Profile" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <Animated.View
            style={[
              styles.avatarCircle,
              { transform: [{ scale: avatarScale }] },
            ]}
          >
            <Text style={styles.avatarText}>
              {student?.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
            </Text>
          </Animated.View>
          <Text style={styles.name}>{student?.fullName}</Text>
          <Text style={styles.studentIdBadge}>{student?.studentId}</Text>
        </Card>

        <Animated.View style={[{ width: '100%' }, { opacity: cardOpacity }]}>
          <Card style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>{student?.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.value}>{student?.phone || 'Not provided'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>College / Institution</Text>
              <Text style={styles.value}>{student?.college || 'Independent'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Branch / Department</Text>
              <Text style={styles.value}>{student?.branch || 'Unspecified'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Graduation Year</Text>
              <Text style={styles.value}>{student?.passOutYear || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Account Status</Text>
              <Text style={[styles.value, { color: '#16A34A', fontWeight: '700' }]}>
                {student?.accountStatus || 'ACTIVE'}
              </Text>
            </View>
          </Card>

          <Button
            title="Log Out of Mobile App"
            onPress={logoutStudent}
            variant="danger"
            style={styles.logoutBtn}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentIdBadge: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '800',
    marginTop: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  logoutBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
});
