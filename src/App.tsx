import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ResidenceProvider } from './context/ResidenceContext'
import { Layout } from './components/Layout'
import { Landing } from './pages/Landing'
import { ResidentHome } from './pages/ResidentHome'
import { CheckIn } from './pages/CheckIn'
import { Passes } from './pages/Passes'
import { Grievance } from './pages/Grievance'
import { Documents } from './pages/Documents'
import { Dashboard } from './pages/staff/Dashboard'
import { Beds } from './pages/staff/Beds'
import { Waitlist } from './pages/staff/Waitlist'
import { PassQueue } from './pages/staff/PassQueue'
import { Payments } from './pages/staff/Payments'
import { GrievanceQueue } from './pages/staff/GrievanceQueue'
import { NewResidence } from './pages/admin/NewResidence'

export default function App() {
  return (
    <ResidenceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/resident" element={<ResidentHome />} />
            <Route path="/resident/checkin" element={<CheckIn />} />
            <Route path="/resident/passes" element={<Passes />} />
            <Route path="/resident/grievance" element={<Grievance />} />
            <Route path="/resident/documents" element={<Documents />} />
            <Route path="/staff" element={<Dashboard />} />
            <Route path="/staff/beds" element={<Beds />} />
            <Route path="/staff/waitlist" element={<Waitlist />} />
            <Route path="/staff/passes" element={<PassQueue />} />
            <Route path="/staff/payments" element={<Payments />} />
            <Route path="/staff/grievances" element={<GrievanceQueue />} />
            <Route path="/admin/new-residence" element={<NewResidence />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ResidenceProvider>
  )
}
