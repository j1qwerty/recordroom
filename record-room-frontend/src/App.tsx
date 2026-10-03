import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { AdminLayout } from './admin/AdminLayout';
import { RequireAuth, RequirePermission } from './layouts/RouteGuards';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
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
import { ScanPage } from './pages/ScanPage';
import { DigitizationPage } from './pages/DigitizationPage';
import { DigitizationBatchPage } from './pages/DigitizationBatchPage';
import { ReportsPage } from './pages/ReportsPage';
import { MediaPage } from './pages/MediaPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';
import { UsersPage } from './admin/UsersPage';
import { EmployeesPage } from './admin/EmployeesPage';
import { LocationsPage } from './admin/LocationsPage';
import { BulkImportPage } from './admin/BulkImportPage';
import { MapsPage } from './admin/MapsPage';
import { AuditPage } from './admin/AuditPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route
            path="/files/new"
            element={
              <RequirePermission permission="files.create">
                <NewFilePage />
              </RequirePermission>
            }
          />
          <Route path="/files/:fileId" element={<FileDetailPage />} />
          <Route path="/issue" element={<IssuePage />} />
          <Route path="/return" element={<ReturnPage />} />
          <Route path="/movement" element={<MovementPage />} />
          <Route path="/barcodes" element={<BarcodesPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/digitization" element={<DigitizationPage />} />
          <Route path="/digitization/:batchId" element={<DigitizationBatchPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <RequirePermission permission="users.view">
                  <UsersPage />
                </RequirePermission>
              }
            />
            <Route
              path="users"
              element={
                <RequirePermission permission="users.view">
                  <UsersPage />
                </RequirePermission>
              }
            />
            <Route
              path="employees"
              element={
                <RequirePermission permission="employees.view">
                  <EmployeesPage />
                </RequirePermission>
              }
            />
            <Route
              path="locations"
              element={
                <RequirePermission permission="locations.view">
                  <LocationsPage />
                </RequirePermission>
              }
            />
            <Route
              path="bulk-import"
              element={
                <RequirePermission permission="files.bulkImport">
                  <BulkImportPage />
                </RequirePermission>
              }
            />
            <Route
              path="maps"
              element={
                <RequirePermission permission="files.view">
                  <MapsPage />
                </RequirePermission>
              }
            />
            <Route
              path="media"
              element={
                <RequirePermission permission="files.view">
                  <MediaPage />
                </RequirePermission>
              }
            />
            <Route
              path="audit"
              element={
                <RequirePermission permission="audit.view">
                  <AuditPage />
                </RequirePermission>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
