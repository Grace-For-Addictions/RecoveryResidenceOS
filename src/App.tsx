import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ResidentHome } from './pages/ResidentHome'
import { Passes } from './pages/Passes'
import { Grievance } from './pages/Grievance'
import { Documents } from './pages/Documents'
import { StaffDashboard } from './pages/StaffDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/resident" replace />} />
          <Route path="/resident" element={<ResidentHome />} />
          <Route path="/resident/passes" element={<Passes />} />
          <Route path="/resident/grievance" element={<Grievance />} />
          <Route path="/resident/documents" element={<Documents />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
