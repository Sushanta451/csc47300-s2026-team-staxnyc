import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="brand">
          <div className="brand-badge">🏀</div>
          <span>StaxNYC Predictor</span>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/live-games" className={pathname === '/live-games' ? 'active' : ''}>Live Games</Link>
          <Link to="/standings" className={pathname === '/standings' ? 'active' : ''}>Standings</Link>
          <Link to="/compare" className={pathname === '/compare' ? 'active' : ''}>Compare</Link>
        </nav>
      </div>
    </header>
  )
}
