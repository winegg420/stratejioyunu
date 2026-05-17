import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Buildings from './pages/Buildings';
import Research from './pages/Research';
import Barracks from './pages/Barracks';
import Airbase from './pages/Airbase';
import Shipyard from './pages/Shipyard';
import Expeditions from './pages/Expeditions';
import Intelligence from './pages/Intelligence';
import Trade from './pages/Trade';
import Diplomacy from './pages/Diplomacy';
import Reports from './pages/Reports';
import MapPage from './pages/MapPage';
import Profile from './pages/Profile';
import Messages from './pages/Messages';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="binalar" element={<Buildings />} />
          <Route path="arastirma" element={<Research />} />
          <Route path="kisla" element={<Barracks />} />
          <Route path="hava" element={<Airbase />} />
          <Route path="tersane" element={<Shipyard />} />
          <Route path="seferler" element={<Expeditions />} />
          <Route path="istihbarat" element={<Intelligence />} />
          <Route path="ticaret" element={<Trade />} />
          <Route path="diplomasi" element={<Diplomacy />} />
          <Route path="raporlar" element={<Reports />} />
          <Route path="harita" element={<MapPage />} />
          <Route path="profil" element={<Profile />} />
          <Route path="mesajlar" element={<Messages />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
