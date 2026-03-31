import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllPlayers } from '../lib/api'
import players as mockPlayers from '../data/players'

export default function HomePage() {
  const [players, setPlayers] = useState([])
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const formRef = useRef(null)
  const navigate = useNavigate()

  // Load players from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await getAllPlayers()
        setPlayers(data.length ? data : mockPlayers)
      } catch {
        setPlayers(mockPlayers)
      }
    }
    load()
  }, [])

  // Search suggestions
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const q = query.trim().toLowerCase()
    const matches = players.filter(p => {
      const name = p.player_name || p.name || ''
      return name.toLowerCase().includes(q)
    })
    setSuggestions(matches)
  }, [query, players])

  useEffect(() => {
    function handleClick(e) {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  function getPlayerId(p) { return p.player_id || p.id }
  function getPlayerName(p) { return p.player_name || p.name }
  function getPlayerTeam(p) { return p.team }
  function getPlayerPosition(p) { return p.position }
  function getPlayerImage(p) {
    // match Supabase player_id to local image
    const mock = mockPlayers.find(m => m.id === getPlayerId(p))
    return mock?.image || p.image || ''
  }

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim().toLowerCase()
    const found = players.find(p => getPlayerName(p).toLowerCase() === q)
    if (found) {
      navigate(`/player/${getPlayerId(found)}`)
    } else {
      setMessage('Player not found. Try selecting a suggested player.')
      setSuggestions([])
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <div className="hero-card">
          <h1>NBA Player Performance Predictor</h1>
          <p>Browse player profiles and mock prediction pages.</p>

          <form className="search" ref={formRef} onSubmit={handleSubmit}>
            <div className="search-box">
              <span className="search-icon">🔎</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search players (e.g., LeBron James, Kyrie Irving)…"
                autoComplete="off"
                value={query}
                onChange={e => { setQuery(e.target.value); setMessage('') }}
              />
              <button className="search-btn" type="submit">Search</button>
            </div>

            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map(p => (
                  <div key={getPlayerId(p)} className="suggestion-item"
                    onClick={() => { setSuggestions([]); navigate(`/player/${getPlayerId(p)}`) }}>
                    {getPlayerName(p)}
                  </div>
                ))}
              </div>
            )}

            <p className="search-hint">Search for a featured player to open their prediction page.</p>
            {message && <p className="search-message">{message}</p>}
          </form>
        </div>
      </section>

      <section id="players" className="players-section">
        <h2 className="section-title-home">Featured Players</h2>
        <div className="player-grid">
          {players.map(player => (
            <article key={getPlayerId(player)} className="player-card">
              <div className="player-image">
                <img src={getPlayerImage(player)} alt={getPlayerName(player)} />
              </div>
              <div className="player-content">
                <h3>{getPlayerName(player)}</h3>
                <p>{getPlayerTeam(player)} • {getPlayerPosition(player)}</p>
                <div className="btn-row">
                  <button className="btn primary"
                    onClick={() => navigate(`/player/${getPlayerId(player)}`)}>
                    View Profile
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">StaxNYC Predictor • Player Search Feature</footer>
    </main>
  )
}
