import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { colors } from './src/theme';

import HomeScreen from './src/screens/HomeScreen';
import BooksScreen from './src/screens/BooksScreen';
import AddBookScreen from './src/screens/AddBookScreen';
import DragonScreen from './src/screens/DragonScreen';


const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.frostedBlue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.cardBg,
            borderTopColor: colors.border,
            height: 64,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: colors.accentTeal,
          tabBarInactiveTintColor: colors.subText,
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, string> = {
              Home: '🏠',
              Books: '📚',
              AddBook: '➕',
              Dragon: '🐉',
            };
            return <Text style={{ fontSize: size - 4 }}>{icons[route.name]}</Text>;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Books" component={BooksScreen} options={{ title: 'Library' }} />
        <Tab.Screen name="AddBook" component={AddBookScreen} options={{ title: 'Add Book' }} />
        <Tab.Screen name="Dragon" component={DragonScreen} options={{ title: 'Dragon' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
