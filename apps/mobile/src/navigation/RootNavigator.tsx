import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import type { RootStackParamList } from "./types";

import WelcomeScreen from "../screens/WelcomeScreen";
import HomeScreen from "../screens/HomeScreen";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import BookingsScreen from "../screens/BookingsScreen";
import AIChatScreen from "../screens/AIChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ItemDetailScreen from "../screens/ItemDetailScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import MerchantDashboardScreen from "../screens/merchant/MerchantDashboardScreen";
import MerchantCalendarScreen from "../screens/merchant/MerchantCalendarScreen";
import MerchantListingsScreen from "../screens/merchant/MerchantListingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const ClientTab = createBottomTabNavigator();
const MerchantTab = createBottomTabNavigator();

function ClientTabs() {
  return (
    <ClientTab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.purple,
      tabBarInactiveTintColor: colors.gray400,
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Home: "home", Marketplace: "bag-handle", Bookings: "calendar", AI: "sparkles", Profile: "person",
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}>
      <ClientTab.Screen name="Home" component={HomeScreen} />
      <ClientTab.Screen name="Marketplace" component={MarketplaceScreen} options={{ tabBarLabel: "Market" }} />
      <ClientTab.Screen name="Bookings" component={BookingsScreen} />
      <ClientTab.Screen name="AI" component={AIChatScreen} options={{ tabBarLabel: "Hafi AI" }} />
      <ClientTab.Screen name="Profile" component={ProfileScreen} />
    </ClientTab.Navigator>
  );
}

function MerchantTabs() {
  return (
    <MerchantTab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.gold,
      tabBarInactiveTintColor: colors.gray400,
      tabBarStyle: { backgroundColor: colors.purpleDark },
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Dashboard: "grid", Calendar: "calendar", Listings: "pricetags", Profile: "person",
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}>
      <MerchantTab.Screen name="Dashboard" component={MerchantDashboardScreen} />
      <MerchantTab.Screen name="Calendar" component={MerchantCalendarScreen} />
      <MerchantTab.Screen name="Listings" component={MerchantListingsScreen} />
      <MerchantTab.Screen name="Profile" component={ProfileScreen} />
    </MerchantTab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading, activeRole } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.purpleBg }}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer key={`nav-${activeRole}`}>
      <Stack.Navigator key={`stack-${activeRole}`} screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : activeRole === "provider" ? (
          <>
            <Stack.Screen name="Main" component={MerchantTabs} />
            <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ headerShown: true, headerTitle: "New Listing", headerTintColor: colors.gold }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={ClientTabs} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ headerShown: true, headerTitle: "", headerTintColor: colors.purple }} />
            <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ headerShown: true, headerTitle: "Sell Item", headerTintColor: colors.purple }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
