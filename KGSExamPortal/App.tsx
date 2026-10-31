import React from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { AuthProvider } from './src/context/AuthContext';
import { ExamProvider } from './src/context/ExamContext';
import { RootNavigator } from './src/navigation/RootNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#F8FAFC"
      />
      <AuthProvider>
        <ExamProvider>
          <View style={tw`flex-1 bg-slate-50`}>
            <RootNavigator />
          </View>
        </ExamProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
