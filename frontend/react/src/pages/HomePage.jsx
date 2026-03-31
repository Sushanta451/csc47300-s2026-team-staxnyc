import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Featured players - just images and IDs for display cards
const FEATURED = [
  { id: '2544', name: 'LeBron James', image: '/images/lebron.png' },
  { id: '202681', name: 'Kyrie Irving', image: '/images/kyrie.png' },
  { id: '1629630', name: 'Ja Morant', image: '/images/JaMorant.png' },
  { id: '201935', name: 'James Harden', image: '/images/JamesHarden.png' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const [featured, setFeatured] = useState(FEATURED)
  const searchTimer = useRef(null)
  const formRef = useRef(null)
  const navigate = useNavigate()

  // Load featured players with team/position from Supabase
  useEffect(() => {
    async function loadFeatured() {
      const ids = FEATURED.map(p => p.id)
      const { data } = await supabase
        .from('player_stats')
        .select('player_id,player_name,team,position')
        .in('player_id', ids)
      if (data) {
        setFeatured(FEATURED.map(f => {
          const db = data.find(d => d.player_id === f.id)
          return { ...f, team: db?.team || '', position: db?.position || '' }
        }))
      }
    }
    loadFeatured()
  }, [])

  // Search Supabase with debounce
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('player_stats')
        .select('player_id,player_name,team')
        .ilike('player_name', '*' + query.trim() + '*')
        .limit(8)
      if (data) {
        setSuggestions(data.map(p => ({ id: p.player_id, name: p.player_name, team: p.team })))
      }
    }, 300)
  }, [query])

  useEffect(() => {
    function handleClick(e) {
      if (formRef.current && !formRef.current.contains(e.target)) setSuggestions([])
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (suggestions.length > 0) {
      navigate('/player/' + suggestions[0].id)
    } else {
      setMessage('Player not found. Try a different name.')
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <div className="hero-card">
          <h1>NBA Player Performance Predictor</h1>
          <p>Browse player profiles and live game scores.</p>
          <form className="search" ref={formRef} onSubmit={handleSubmit}>
            <div className="search-box">
              <span className="search-icon">🔎</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search players (e.g., LeBron James, Kyrie Irving)..."
                autoComplete="off"
                value={query}
                onChange={e => { setQuery(e.target.value); setMessage('') }}
              />
              <button className="search-btn" type="submit">Search</button>
            </div>
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map(p => (
                  <div key={p.id} className="suggestion-item"
                    onClick={() => { setSuggestions([]); setQuery(''); navigate('/player/' + p.id) }}>
                    {p.name} <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>— {p.team}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="search-hint">Search for any player to open their profile.</p>
            {message && <p className="search-message">{message}</p>}
          </form>
        </div>
      </section>

      <section id="players" className="players-section">
        <h2 className="section-title-home">Featured Players</h2>
        <div className="player-grid">
          {featured.map(player => (
            <article key={player.id} className="player-card">
              <div className="player-image">
                <img src={player.image} alt={player.name} />
              </div>
              <div className="player-content">
                <h3>{player.name}</h3>
                {player.team && <p style={{color:'var(--muted)',fontSize:'0.9rem',marginBottom:'0.5rem'}}>{player.team} • {player.position}</p>}
                <div className="btn-row">
                  <button className="btn primary"
                    onClick={() => navigate('/player/' + player.id)}>
                    View Profile
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">StaxNYC Predictor</footer>
    </main>
  )
}
