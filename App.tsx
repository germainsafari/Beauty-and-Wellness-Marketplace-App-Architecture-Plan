import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { Route, Switch } from "wouter";

// Pages
import Home from "./pages/Home";
import MarketplaceFeed from "./pages/MarketplaceFeed";
import ItemDetail from "./pages/ItemDetail";
import CreateListing from "./pages/CreateListing";
import SellerHub from "./pages/SellerHub";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Bookings from "./pages/Bookings";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/marketplace" component={MarketplaceFeed} />
      <Route path="/marketplace/listing/:id" component={ItemDetail} />
      <Route path="/create-listing" component={CreateListing} />
      <Route path="/seller-hub" component={SellerHub} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
