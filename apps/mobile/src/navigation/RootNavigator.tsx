import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useT } from "@hafi/i18n";
import { colors } from "../theme";
import type { MerchantTabParamList, RootStackParamList } from "./types";

import WelcomeScreen from "../screens/WelcomeScreen";
import HomeScreen from "../screens/HomeScreen";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import BookingsScreen from "../screens/BookingsScreen";
import AIChatScreen from "../screens/AIChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ChatThreadScreen from "../screens/ChatThreadScreen";
import ItemDetailScreen from "../screens/ItemDetailScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import SavedListingsScreen from "../screens/SavedListingsScreen";
import MerchantDashboardScreen from "../screens/merchant/MerchantDashboardScreen";
import MerchantCalendarScreen from "../screens/merchant/MerchantCalendarScreen";
import MerchantListingsScreen from "../screens/merchant/MerchantListingsScreen";
import MerchantServicesScreen from "../screens/merchant/MerchantServicesScreen";
import MerchantMenuScreen from "../screens/merchant/MerchantMenuScreen";
import MerchantOffersScreen from "../screens/merchant/MerchantOffersScreen";
import MerchantAnalyticsScreen from "../screens/merchant/MerchantAnalyticsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const ClientTab = createBottomTabNavigator();
const MerchantTab = createBottomTabNavigator<MerchantTabParamList>();

function ClientTabs() {
  const t = useT();
  return (
    <ClientTab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.purple,
      tabBarInactiveTintColor: colors.gray400,
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Home: "home", Marketplace: "bag-handle", Bookings: "calendar", Messages: "chatbubble-ellipses", AI: "sparkles", Profile: "person",
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}>
      <ClientTab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t("nav.home") }} />
      <ClientTab.Screen name="Marketplace" component={MarketplaceScreen} options={{ tabBarLabel: t("nav.marketplace") }} />
      <ClientTab.Screen name="Bookings" component={BookingsScreen} options={{ tabBarLabel: t("nav.bookings") }} />
      <ClientTab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: t("nav.messages") }} />
      <ClientTab.Screen name="AI" component={AIChatScreen} options={{ tabBarLabel: t("nav.ai") }} />
      <ClientTab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t("nav.profile") }} />
    </ClientTab.Navigator>
  );
}

function MerchantTabs() {
  const t = useT();
  return (
    <MerchantTab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.gold,
      tabBarInactiveTintColor: colors.gray400,
      tabBarStyle: { backgroundColor: colors.purpleDark },
      tabBarIcon: ({ color, size }) => {
        const icons: Record<keyof MerchantTabParamList, keyof typeof Ionicons.glyphMap> = {
          Dashboard: "grid",
          Calendar: "calendar",
          Services: "briefcase",
          Listings: "pricetags",
          Menu: "menu",
        };
        return <Ionicons name={icons[route.name as keyof MerchantTabParamList]} size={size} color={color} />;
      },
    })}>
      <MerchantTab.Screen name="Dashboard" component={MerchantDashboardScreen} options={{ tabBarLabel: t("merchant.nav.dashboard") }} />
      <MerchantTab.Screen name="Calendar" component={MerchantCalendarScreen} options={{ tabBarLabel: t("merchant.nav.calendar") }} />
      <MerchantTab.Screen name="Services" component={MerchantServicesScreen} options={{ tabBarLabel: t("merchant.nav.services") }} />
      <MerchantTab.Screen name="Listings" component={MerchantListingsScreen} options={{ tabBarLabel: t("merchant.nav.listings") }} />
      <MerchantTab.Screen name="Menu" component={MerchantMenuScreen} options={{ tabBarLabel: t("merchant.nav.menu") }} />
    </MerchantTab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading, activeRole } = useAuth();
  const t = useT();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.purpleBg }}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  const merchantHeader = { headerShown: true as const, headerTintColor: colors.gold, headerStyle: { backgroundColor: colors.purpleDark }, headerTitleStyle: { color: colors.white, fontWeight: "700" as const } };

  return (
    <NavigationContainer key={`nav-${activeRole}`}>
      <Stack.Navigator key={`stack-${activeRole}`} screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : activeRole === "provider" ? (
          <>
            <Stack.Screen name="Main" component={MerchantTabs} />
            <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ ...merchantHeader, headerTitle: t("merchant.createListing") }} />
            <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={({ route }) => ({ ...merchantHeader, headerTitle: route.params.otherUserName ?? "Chat" })} />
            <Stack.Screen name="MerchantOffers" component={MerchantOffersScreen} options={{ ...merchantHeader, headerTitle: t("merchant.nav.offers") }} />
            <Stack.Screen name="MerchantAnalytics" component={MerchantAnalyticsScreen} options={{ ...merchantHeader, headerTitle: t("merchant.nav.analytics") }} />
            <Stack.Screen name="MerchantMessages" component={MessagesScreen} options={{ ...merchantHeader, headerTitle: t("nav.messages") }} />
            <Stack.Screen name="MerchantProfile" component={ProfileScreen} options={{ ...merchantHeader, headerTitle: t("nav.profile") }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={ClientTabs} />
            <Stack.Screen name="Discover" component={DiscoverScreen} options={{ headerShown: true, headerTintColor: colors.purple }} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ headerShown: true, headerTitle: "", headerTintColor: colors.purple }} />
            <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ headerShown: true, headerTintColor: colors.purple, headerTitle: t("marketplace.sellItem") }} />
            <Stack.Screen name="SavedListings" component={SavedListingsScreen} options={{ headerShown: true, headerTintColor: colors.purple, headerTitle: t("marketplace.savedItems") }} />
            <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={({ route }) => ({ headerShown: true, headerTitle: route.params.otherUserName ?? "Chat", headerTintColor: colors.purple })} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
