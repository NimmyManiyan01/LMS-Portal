import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { FinalResult } from '../../types';
import * as resultApi from '../../api/resultApi';

interface ResultsScreenProps {
  onBack: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ onBack }) => {
  const [results, setResults] = useState<FinalResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchResults = async () => {
    setLoading(true);
    const res = await resultApi.getResults();
    setLoading(false);
    if (res.data) {
      setResults(res.data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Examination History" onBack={onBack} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No examination history found.</Text>
        </View>
      ) : (
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.attemptId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isReleased = item.releaseStatus === 'RELEASED' && item.marksScored !== null;
              return (
                <Card style={styles.resultCard}>
                  <Text style={styles.examName}>{item.examName}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Submitted</Text>
                  </View>
                  <Text style={styles.dateText}>
                    Submitted on: {new Date(item.submittedAt).toLocaleDateString()}
                  </Text>

                  {isReleased ? (
                    <View style={styles.marksContainer}>
                      <Text style={styles.marksValue}>
                        Marks: {item.marksScored} / {item.maximumMarks ?? 'N/A'}
                      </Text>
                      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                        <Text style={styles.actionText}>VIEW DETAILS</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.pendingContainer}>
                      <Text style={styles.pendingText}>
                        Results Pending
                      </Text>
                      <TouchableOpacity style={styles.pendingBtn} activeOpacity={0.8}>
                        <Text style={styles.actionText}>VIEW STATUS</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              );
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
  },
  resultCard: {
    padding: 18,
    marginBottom: 12,
    borderRadius: 16,
  },
  examName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  marksContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marksValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  pendingContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pendingBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
