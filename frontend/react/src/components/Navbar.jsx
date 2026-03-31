import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const loc = useLocation()
  const active = (path) => loc.pathname === path ? 'active' : ''
  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="brand">
          <div className="brand-badge">🏀</div>
          <span>StaxNYC Predictor</span>
        </div>
        <nav className="nav-links">
          <Link to="/" className={active('/')}>Home</Link>
          <a href="/#players">Players</a>
          <Link to="/standings" className={active('/standings')}>Standings</Link>
          <Link to="/live" className={active('/live')}>Live Games</Link>
        </nav>
      </div>
    </header>
  )
}
