import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FillQuiniela from './features/fill-pool/FillQuiniela';
import Scoreboard from './features/scoreboard/Scoreboard';
import AdminPanel from './features/admin/AdminPanel';
import Home from './features/home/Home';

// Placeholders for views
// const FillQuiniela = () => <div className="p-8 text-center text-2xl">Llenar Quiniela (Coming Soon)</div>;
// const Scoreboard = () => <div className="p-8 text-center text-2xl">Tabla General (Coming Soon)</div>;
// const AdminPanel = () => <div className="p-8 text-center text-2xl">Admin Panel (Coming Soon)</div>;

function App() {
  return (
    <BrowserRouter>
      {/* <Toaster /> */}
      <div className="max-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fill" element={<FillQuiniela />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
