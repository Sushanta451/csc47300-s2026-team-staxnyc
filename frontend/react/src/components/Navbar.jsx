import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="brand">
          <div className="brand-badge">🏀</div>
          <span>StaxNYC Predictor</span>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/" className={isHome ? 'active' : ''}>Home</Link>
          <Link to="/#players" className={!isHome ? 'active' : ''}>Players</Link>
        </nav>
      </div>
    </header>
  )
}
