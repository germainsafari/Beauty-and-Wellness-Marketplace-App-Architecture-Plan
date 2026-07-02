import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { LocaleProvider, type LocaleStorage } from "@hafi/i18n";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";

const mobileLocaleStorage: LocaleStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value).then(() => undefined),
};

export default function App() {
  return (
    <SafeAreaProvider>
      <LocaleProvider storage={mobileLocaleStorage}>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
