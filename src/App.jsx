import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import PageSafe from './components/PageSafe';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Buildings from './pages/Buildings';
import Research from './pages/Research';
import Barracks from './pages/Barracks';
import Airbase from './pages/Airbase';
import Shipyard from './pages/Shipyard';
import Expeditions from './pages/Expeditions';
import Intelligence from './pages/Intelligence';
import Trade from './pages/Trade';
import Market from './pages/Market';
import Diplomacy from './pages/Diplomacy';
import Reports from './pages/Reports';
import MapPage from './pages/MapPage';
import Profile from './pages/Profile';
import Rankings from './pages/Rankings';
import SeasonQuests from './pages/SeasonQuests';
import FounderCrisis from './pages/FounderCrisis';
import AdminLog from './pages/AdminLog';
import Messages from './pages/Messages';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/giris" element={<AuthPage />} />
          <Route
            path="/"
            element={(
              <RequireAuth>
                <Layout />
              </RequireAuth>
            )}
          >
            <Route index element={<PageSafe><Home /></PageSafe>} />
            <Route path="binalar" element={<PageSafe><Buildings /></PageSafe>} />
            <Route path="arastirma" element={<PageSafe><Research /></PageSafe>} />
            <Route path="kisla" element={<PageSafe><Barracks /></PageSafe>} />
            <Route path="hava" element={<PageSafe><Airbase /></PageSafe>} />
            <Route path="tersane" element={<PageSafe><Shipyard /></PageSafe>} />
            <Route path="seferler" element={<PageSafe><Expeditions /></PageSafe>} />
            <Route path="istihbarat" element={<PageSafe><Intelligence /></PageSafe>} />
            <Route path="pazar" element={<PageSafe><Market /></PageSafe>} />
            <Route path="ticaret" element={<PageSafe><Trade /></PageSafe>} />
            <Route path="diplomasi" element={<PageSafe><Diplomacy /></PageSafe>} />
            <Route path="raporlar" element={<PageSafe><Reports /></PageSafe>} />
            <Route path="harita" element={<PageSafe><MapPage /></PageSafe>} />
            <Route path="siralama" element={<PageSafe><Rankings /></PageSafe>} />
            <Route path="sezon-gorevler" element={<PageSafe><SeasonQuests /></PageSafe>} />
            <Route path="kurucu-kriz" element={<PageSafe><FounderCrisis /></PageSafe>} />
            <Route path="admin-log" element={<PageSafe><AdminLog /></PageSafe>} />
            <Route path="profil" element={<PageSafe><Profile /></PageSafe>} />
            <Route path="mesajlar" element={<PageSafe><Messages /></PageSafe>} />
          </Route>
          <Route path="*" element={<Navigate to="/giris" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
