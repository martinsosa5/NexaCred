import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/Home';
import Solicitud from './pages/Solicitud';
import Seguimiento from './pages/Seguimiento';
import Manual from './pages/Manual';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Panel from './pages/admin/Panel';
import Solicitudes from './pages/admin/Solicitudes';
import Scoring from './pages/admin/Scoring';
import Verificacion from './pages/admin/Verificacion';
import Cartera from './pages/admin/Cartera';
import Empleados from './pages/admin/Empleados';
import Recuperar from './pages/admin/Recuperar';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="solicitud" element={<Solicitud />} />
        <Route path="seguimiento" element={<Seguimiento />} />
        <Route path="manual" element={<Manual />} />
        <Route path="*" element={<Home />} />
      </Route>
      <Route path="admin/login" element={<Login />} />
      <Route path="admin/recuperar" element={<Recuperar />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Panel />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="scoring" element={<Scoring />} />
        <Route path="verificacion" element={<Verificacion />} />
        <Route path="cartera" element={<Cartera />} />
        <Route path="empleados" element={<Empleados />} />
      </Route>
    </Routes>
  );
}
