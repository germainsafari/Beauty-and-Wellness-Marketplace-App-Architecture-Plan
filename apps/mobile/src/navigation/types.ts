export type RootStackParamList = {
  Welcome: undefined;
  Main: { screen?: keyof MainTabParamList } | undefined;
  ItemDetail: { id: number };
  CreateListing: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Marketplace: undefined;
  Bookings: undefined;
  AI: undefined;
  Profile: undefined;
};
