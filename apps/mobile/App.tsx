import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>Worktime Mobile</Text>
        <Text style={styles.subtitle}>Expo + TypeScript bootstrap</Text>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '600'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8
  }
});
