import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddBookScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🤖</Text>
      <Text style={styles.title}>Add Books</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 6 },
});

