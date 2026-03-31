import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PlayerPage from './pages/PlayerPage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
      </Routes>
    </>
  )
}
