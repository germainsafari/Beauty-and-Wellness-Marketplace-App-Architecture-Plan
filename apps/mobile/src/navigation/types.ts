export type RootStackParamList = {
  Welcome: undefined;
  Main: { screen?: keyof MainTabParamList } | undefined;
  Discover: undefined;
  ItemDetail: { id: number };
  CreateListing: undefined;
  ChatThread: { conversationId: number; otherUserName?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Marketplace: undefined;
  Bookings: undefined;
  Messages: undefined;
  AI: undefined;
  Profile: undefined;
};
