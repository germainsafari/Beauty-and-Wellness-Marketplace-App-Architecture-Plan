export type MerchantTabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Services: undefined;
  Listings: undefined;
  Menu: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Main: { screen?: keyof MainTabParamList | keyof MerchantTabParamList } | undefined;
  Discover: undefined;
  ItemDetail: { id: number };
  CreateListing: undefined;
  ChatThread: { conversationId: number; otherUserName?: string };
  MerchantOffers: undefined;
  MerchantAnalytics: undefined;
  MerchantMessages: undefined;
  MerchantProfile: undefined;
  SavedListings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Marketplace: undefined;
  Bookings: undefined;
  Messages: undefined;
  AI: undefined;
  Profile: undefined;
};
