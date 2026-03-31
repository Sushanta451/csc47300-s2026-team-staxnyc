import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function PlayerSlot({ player, onRemove, onSearch }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('player_stats')
        .select('player_id,player_name,team')
        .ilike('player_name', '*' + query.trim() + '*')
        .limit(5)
      if (data) setResults(data)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (player) {
    return (
      <div className="card" style={{padding:'1.2rem',flex:1,minWidth:'280px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <div>
            <h3 style={{fontSize:'1.2rem',fontWeight:800}}>{player.player_name}</h3>
            <p style={{color:'var(--muted)',fontSize:'0.85rem'}}>{player.team} • {player.position}</p>
          </div>
          <button onClick={onRemove} className="btn" style={{fontSize:'0.8rem',padding:'0.4rem 0.7rem'}}>Remove</button>
        </div>
        <div className="stats-grid" style={{gridTemplateColumns:'repeat(2, 1fr)',gap:'0.6rem'}}>
          {[
            { label: 'PPG', val: player.ppg },
            { label: 'RPG', val: player.rpg },
            { label: 'APG', val: player.apg },
            { label: 'FG%', val: player.fg_pct + '%' },
          ].map(({ label, val }) => (
            <div key={label} className="stat-box">
              <p className="stat-label">{label}</p>
              <p className="stat-value">{val}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:'0.8rem',display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
          <span className="pill">Height: {player.height}</span>
          <span className="pill">Weight: {player.weight} lbs</span>
          <span className="pill">#{player.jersey_number}</span>
          <span className="pill">GPG: {player.games_played}</span>
          <span className="pill">MPG: {player.mpg}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{padding:'1.2rem',flex:1,minWidth:'280px'}}>
      <p style={{color:'var(--muted)',marginBottom:'0.8rem',fontSize:'0.9rem'}}>Search for a player to compare</p>
      <div className="search-box" style={{marginTop:0}}>
        <input
          className="search-input"
          type="text"
          placeholder="Search player..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>
      {results.length > 0 && (
        <div className="suggestions" style={{marginTop:'0.5rem'}}>
          {results.map(p => (
            <div key={p.player_id} className="suggestion-item"
              onClick={() => { onSearch(p.player_id); setQuery(''); setResults([]) }}>
              {p.player_name} <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>— {p.team}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatBar({ label, val1, val2, name1, name2 }) {
  const max = Math.max(val1, val2, 1)
  const pct1 = Math.round((val1 / max) * 100)
  const pct2 = Math.round((val2 / max) * 100)
  const winner1 = val1 > val2
  const winner2 = val2 > val1

  return (
    <div style={{marginBottom:'1rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.4rem'}}>
        <span style={{fontWeight: winner1 ? 800 : 400, color: winner1 ? 'var(--success)' : 'var(--text)',fontSize:'0.95rem'}}>{val1}</span>
        <span style={{color:'var(--muted)',fontSize:'0.85rem',fontWeight:600}}>{label}</span>
        <span style={{fontWeight: winner2 ? 800 : 400, color: winner2 ? 'var(--success)' : 'var(--text)',fontSize:'0.95rem'}}>{val2}</span>
      </div>
      <div style={{display:'flex',gap:'0.3rem',height:'8px'}}>
        <div style={{flex:1,borderRadius:'4px',background:'rgba(255,255,255,0.08)',overflow:'hidden',display:'flex',justifyContent:'flex-end'}}>
          <div style={{width: pct1 + '%',background: winner1 ? 'var(--success)' : 'var(--accent)',borderRadius:'4px',transition:'width 0.3s ease'}} />
        </div>
        <div style={{flex:1,borderRadius:'4px',background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
          <div style={{width: pct2 + '%',background: winner2 ? 'var(--success)' : 'var(--accent)',borderRadius:'4px',transition:'width 0.3s ease'}} />
        </div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [player1, setPlayer1] = useState(null)
  const [player2, setPlayer2] = useState(null)

  async function loadPlayer(id, setFn) {
    const { data } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', id)
      .single()
    if (data) setFn(data)
  }

  return (
    <main className="container">
      <section className="page-header">
        <p className="breadcrumb">Tools / <span>Compare Players</span></p>
      </section>

      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontSize:'clamp(1.25rem,2.3vw,1.65rem)',fontWeight:800,marginBottom:'0.3rem'}}>Compare Players</h1>
        <p style={{color:'var(--muted)',fontSize:'0.9rem'}}>Select two players to compare their stats side by side</p>
      </div>

      <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginBottom:'1.5rem'}}>
        <PlayerSlot
          player={player1}
          onRemove={() => setPlayer1(null)}
          onSearch={id => loadPlayer(id, setPlayer1)}
        />
        <PlayerSlot
          player={player2}
          onRemove={() => setPlayer2(null)}
          onSearch={id => loadPlayer(id, setPlayer2)}
        />
      </div>

      {player1 && player2 && (
        <section className="card" style={{padding:'1.5rem',marginBottom:'1.5rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1.2rem'}}>
            <h2 style={{fontSize:'1rem',fontWeight:700}}>{player1.player_name}</h2>
            <span style={{color:'var(--muted)',fontSize:'0.9rem',fontWeight:600}}>Head to Head</span>
            <h2 style={{fontSize:'1rem',fontWeight:700}}>{player2.player_name}</h2>
          </div>
          <StatBar label="PPG" val1={player1.ppg} val2={player2.ppg} />
          <StatBar label="RPG" val1={player1.rpg} val2={player2.rpg} />
          <StatBar label="APG" val1={player1.apg} val2={player2.apg} />
          <StatBar label="FG%" val1={player1.fg_pct} val2={player2.fg_pct} />
          <StatBar label="MPG" val1={player1.mpg} val2={player2.mpg} />
          <StatBar label="Games" val1={player1.games_played} val2={player2.games_played} />
        </section>
      )}

      <footer className="footer">StaxNYC Predictor - Compare Players</footer>
    </main>
  )
}
