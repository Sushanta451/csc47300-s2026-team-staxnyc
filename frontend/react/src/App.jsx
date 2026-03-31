import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PlayerPage from './pages/PlayerPage'
import LiveGamesPage from './pages/LiveGamesPage'
import StandingsPage from './pages/StandingsPage'
import ComparePage from './pages/ComparePage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="/live-games" element={<LiveGamesPage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </>
  )
}
