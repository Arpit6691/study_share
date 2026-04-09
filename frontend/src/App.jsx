import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import MyFiles from './pages/MyFiles';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="page-wrapper">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            <Route 
              path="/*" 
              element={
                <PrivateRoute>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="upload" element={<Upload />} />
                    <Route path="my-files" element={<MyFiles />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="leaderboard" element={<Leaderboard />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </PrivateRoute>
              } 
            />
          </Routes>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
