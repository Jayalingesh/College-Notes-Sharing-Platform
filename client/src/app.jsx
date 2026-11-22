import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import StaffRoute from "./components/StaffRoute.jsx";
import StaffReview from "./pages/StaffReview.jsx";
import Requests from "./pages/Requests.jsx";
import NewRequest from "./pages/NewRequest.jsx";
import RequestDetail from "./pages/RequestDetail.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import UploadNote from "./pages/UploadNote.jsx";
import NoteDetail from "./pages/NoteDetail.jsx";
import Profile from "./pages/Profile.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notes/:id" element={<NoteDetail />} />
        <Route path="/requests" element={<Requests />} />
        <Route
          path="/requests/new"
          element={
            <PrivateRoute>
              <NewRequest />
            </PrivateRoute>
          }
        />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route
          path="/upload"
          element={
            <PrivateRoute>
              <UploadNote />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <StaffRoute>
              <StaffReview />
            </StaffRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
