
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PlanTrip from "./pages/PlanTrip";
import TripDetails from "./pages/TripDetails";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import FlightBooking from "./pages/FlightBooking";
import TrainBooking from "./pages/TrainBooking";
import BusBooking from "./pages/BusBooking";
import HotelBooking from "./pages/HotelBooking";
import CruiseBooking from "./pages/CruiseBooking";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Explore is the default landing page */}
        <Route path="/" element={<Navigate to="/explore" replace />} />
        <Route path="/explore" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/plan-trip"
          element={
            <ProtectedRoute>
              <PlanTrip />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trip/:tripId"
          element={
            <ProtectedRoute>
              <TripDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/flights"
          element={
            <ProtectedRoute>
              <FlightBooking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trains"
          element={
            <ProtectedRoute>
              <TrainBooking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buses"
          element={
            <ProtectedRoute>
              <BusBooking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hotels"
          element={
            <ProtectedRoute>
              <HotelBooking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cruises"
          element={
            <ProtectedRoute>
              <CruiseBooking />
            </ProtectedRoute>
          }
        />

        {/* Unknown URLs return to Explore */}
        <Route path="*" element={<Navigate to="/explore" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
