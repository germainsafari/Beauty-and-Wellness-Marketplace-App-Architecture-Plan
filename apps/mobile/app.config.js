const path = require("path");
const { config } = require("dotenv");

config({ path: path.resolve(__dirname, "../../.env") });

const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "Hafi",
    slug: "hafi-beauty",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1A0533",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hafi.beauty",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1A0533",
      },
      package: "com.hafi.beauty",
      usesCleartextTraffic: true,
    },
    extra: {
      apiUrl,
    },
    sdkVersion: "54.0.0",
  },
};
