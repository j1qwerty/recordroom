import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { RoomsPage } from './pages/RoomsPage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { FilesPage } from './pages/FilesPage';
import { FileDetailPage } from './pages/FileDetailPage';
import { NewFilePage } from './pages/NewFilePage';
import { IssuePage } from './pages/IssuePage';
import { ReturnPage } from './pages/ReturnPage';
import { MovementPage } from './pages/MovementPage';
import { BarcodesPage } from './pages/BarcodesPage';
import { DigitizationPage } from './pages/DigitizationPage';
import { DigitizationBatchPage } from './pages/DigitizationBatchPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { LocationsAdminPage } from './pages/LocationsAdminPage';
import { AuditPage } from './pages/AuditPage';
import { MediaPage } from './pages/MediaPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/files/new" element={<NewFilePage />} />
          <Route path="/files/:fileId" element={<FileDetailPage />} />
          <Route path="/issue" element={<IssuePage />} />
          <Route path="/return" element={<ReturnPage />} />
          <Route path="/movement" element={<MovementPage />} />
          <Route path="/barcodes" element={<BarcodesPage />} />
          <Route path="/digitization" element={<DigitizationPage />} />
          <Route path="/digitization/:batchId" element={<DigitizationBatchPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/locations" element={<LocationsAdminPage />} />
          <Route path="/admin/audit" element={<AuditPage />} />
          <Route path="/admin/media" element={<MediaPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
