import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ResidenceProvider } from './context/ResidenceContext'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { Landing } from './pages/Landing'
import { SignIn } from './pages/SignIn'
import { DirectoryHome } from './pages/directory/DirectoryHome'
import { GraceHouseProfile } from './pages/directory/GraceHouseProfile'
import { EjwrhProfile, JerrysProfile } from './pages/directory/ResidenceProfiles'
import { ApplyGraceHouse } from './pages/directory/ApplyGraceHouse'
import { Applications } from './pages/staff/Applications'
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
    <AuthProvider>
      <ResidenceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DirectoryHome />} />
            <Route path="/platform" element={<Landing />} />
            <Route path="/residences/grace-house" element={<GraceHouseProfile />} />
            <Route path="/residences/ejwrh" element={<EjwrhProfile />} />
            <Route path="/residences/jerrys-house" element={<JerrysProfile />} />
            <Route path="/apply/grace-house" element={<ApplyGraceHouse />} />
            <Route path="/signin" element={<SignIn />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/resident" element={<ResidentHome />} />
                <Route path="/resident/checkin" element={<CheckIn />} />
                <Route path="/resident/passes" element={<Passes />} />
                <Route path="/resident/grievance" element={<Grievance />} />
                <Route path="/resident/documents" element={<Documents />} />
                <Route path="/staff" element={<Dashboard />} />
                <Route path="/staff/applications" element={<Applications />} />
                <Route path="/staff/beds" element={<Beds />} />
                <Route path="/staff/waitlist" element={<Waitlist />} />
                <Route path="/staff/passes" element={<PassQueue />} />
                <Route path="/staff/payments" element={<Payments />} />
                <Route path="/staff/grievances" element={<GrievanceQueue />} />
                <Route path="/admin/new-residence" element={<NewResidence />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ResidenceProvider>
    </AuthProvider>
  )
}
