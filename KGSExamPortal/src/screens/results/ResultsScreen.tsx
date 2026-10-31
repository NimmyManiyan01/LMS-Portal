import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import tw from 'twrnc';
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
    <View style={tw`flex-1 bg-slate-50`}>
      <Header title="Examination History" onBack={onBack} />

      {loading ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : results.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Text style={tw`text-sm text-slate-500`}>No examination history found.</Text>
        </View>
      ) : (
        <Animated.View style={[tw`flex-1`, { opacity: fadeAnim }]}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.attemptId}
            contentContainerStyle={tw`p-4 pb-10`}
            renderItem={({ item }) => {
              const isReleased = item.releaseStatus === 'RELEASED' && item.marksScored !== null;
              return (
                <Card style={tw`p-4.5 mb-3 rounded-2xl`}>
                  <Text style={tw`text-base font-extrabold text-slate-900 mb-1`}>{item.examName}</Text>
                  <View style={tw`self-start bg-blue-50 border border-blue-200 px-2 py-0.5 rounded mb-1.5`}>
                    <Text style={tw`text-xs font-bold text-blue-600`}>Submitted</Text>
                  </View>
                  <Text style={tw`text-xs text-slate-500 mb-3`}>
                    Submitted on: {new Date(item.submittedAt).toLocaleDateString()}
                  </Text>

                  {isReleased ? (
                    <View style={tw`bg-green-50 border border-green-300 rounded-xl p-3 flex-row items-center justify-between`}>
                      <Text style={tw`text-sm font-extrabold text-green-700`}>
                        Marks: {item.marksScored} / {item.maximumMarks ?? 'N/A'}
                      </Text>
                      <TouchableOpacity style={tw`bg-green-600 px-3 py-1.5 rounded-lg`} activeOpacity={0.8}>
                        <Text style={tw`text-white text-xs font-extrabold`}>VIEW DETAILS</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={tw`bg-amber-50 border border-amber-300 rounded-xl p-3 flex-row items-center justify-between`}>
                      <Text style={tw`text-sm font-bold text-amber-800`}>
                        Results Pending
                      </Text>
                      <TouchableOpacity style={tw`bg-amber-600 px-3 py-1.5 rounded-lg`} activeOpacity={0.8}>
                        <Text style={tw`text-white text-xs font-extrabold`}>VIEW STATUS</Text>
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
