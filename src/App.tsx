import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import EmployeeList from './pages/EmployeeList'
import EmployeeDetail from './pages/EmployeeDetail'
import TaxCalculation from './pages/TaxCalculation'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<EmployeeList />} />
        <Route path="/employees/:id" element={<EmployeeDetail />} />
        <Route path="/tax" element={<TaxCalculation />} />
      </Route>
    </Routes>
  )
}

export default App
