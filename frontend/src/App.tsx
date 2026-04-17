import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FillQuiniela from './features/fill-pool/FillQuiniela';
import Scoreboard from './features/scoreboard/Scoreboard';
import AdminPanel from './features/admin/AdminPanel';
import Home from './features/home/Home';
import Login from './features/auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { PhonePromptGlobal } from './components/PhonePromptGlobal';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" theme="dark" />
      <PhonePromptGlobal />
      <div className="min-h-screen bg-black text-white font-sans">
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/fill" element={<ProtectedRoute><FillQuiniela /></ProtectedRoute>} />
          <Route path="/scoreboard" element={<ProtectedRoute><Scoreboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
