import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function GameCard({ game }) {
  const status = (game.status || '').toLowerCase()
  const isLive = status === 'live'
  const isFinal = status === 'final'
  const isScheduled = status === 'scheduled' || status === 'upcoming'

  return (
    <div className="card" style={{padding:'1.2rem',transition:'transform 0.18s ease,border-color 0.18s ease'}}
      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(91,140,255,0.35)'}
      onMouseLeave={e => e.currentTarget.style.borderColor=''}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.8rem'}}>
        <span style={{fontSize:'0.8rem',fontWeight:700,padding:'0.25rem 0.6rem',borderRadius:'999px',
          background: isLive ? 'rgba(45,212,191,0.15)' : isScheduled ? 'rgba(91,140,255,0.15)' : 'rgba(255,255,255,0.06)',
          color: isLive ? 'var(--success)' : isScheduled ? 'var(--accent)' : 'var(--muted)',
          border: `1px solid ${isLive ? 'rgba(45,212,191,0.3)' : isScheduled ? 'rgba(91,140,255,0.3)' : 'rgba(255,255,255,0.08)'}`}}>
          {isLive ? '🔴 LIVE' : isFinal ? 'Final' : 'Scheduled'}
        </span>
        {isLive && game.quarter && (
          <span style={{fontSize:'0.8rem',color:'var(--accent)',fontWeight:600}}>
            {game.quarter} {game.time_remaining}
          </span>
        )}
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
        <div style={{flex:1,textAlign:'center'}}>
          <p style={{fontWeight:700,fontSize:'1rem',marginBottom:'0.3rem'}}>{game.away_team}</p>
          <p style={{fontSize:'2rem',fontWeight:800,color:'var(--text)'}}>{game.away_score !== null ? game.away_score : '-'}</p>
        </div>

        <div style={{textAlign:'center',padding:'0 0.5rem'}}>
          <p style={{fontSize:'1.2rem',color:'var(--muted)'}}>@</p>
        </div>

        <div style={{flex:1,textAlign:'center'}}>
          <p style={{fontWeight:700,fontSize:'1rem',marginBottom:'0.3rem'}}>{game.home_team}</p>
          <p style={{fontSize:'2rem',fontWeight:800,color:'var(--text)'}}>{game.home_score !== null ? game.home_score : '-'}</p>
        </div>
      </div>
    </div>
  )
}

export default function LiveGamesPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  async function loadGames() {
    try {
      const today = new Date()
      const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0')
      const dayAfter = new Date(today)
      dayAfter.setDate(dayAfter.getDate() + 2)
      const endStr = dayAfter.getFullYear() + '-' + String(dayAfter.getMonth()+1).padStart(2,'0') + '-' + String(dayAfter.getDate()).padStart(2,'0')

      const { data } = await supabase
        .from('live_games')
        .select('*')
        .gte('game_date', todayStr)
        .lt('game_date', endStr)
        .order('game_id', { ascending: true })

      if (data && data.length > 0) {
        setGames(data)
      } else {
        setGames([])
      }
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      setLastUpdated(new Date().toLocaleTimeString())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
    const interval = setInterval(loadGames, 10000)
    return () => clearInterval(interval)
  }, [])

  const liveGames = games.filter(g => (g.status || '').toLowerCase() === 'live')
  const finalGames = games.filter(g => (g.status || '').toLowerCase() === 'final')
  const scheduledGames = games.filter(g => (g.status || '').toLowerCase() === 'scheduled')

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return (
    <main className="container">
      <p style={{color:'var(--muted)',padding:'4rem 0',textAlign:'center'}}>Loading live games...</p>
    </main>
  )

  return (
    <main className="container">
      <section className="page-header">
        <p className="breadcrumb">League / <span>Live Games</span></p>
      </section>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{fontSize:'clamp(1.25rem,2.3vw,1.65rem)',fontWeight:800,marginBottom:'0.3rem'}}>Today's Games</h1>
          <p style={{color:'var(--muted)',fontSize:'0.9rem'}}>{dateStr}</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          {lastUpdated && <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>Updated {lastUpdated}</span>}
          <button onClick={loadGames} className="btn primary" style={{padding:'0.5rem 1rem',fontSize:'0.85rem'}}>
            Refresh
          </button>
        </div>
      </div>

      {liveGames.length > 0 && (
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontSize:'0.85rem',fontWeight:700,color:'var(--success)',letterSpacing:'0.1em',marginBottom:'0.75rem',textTransform:'uppercase'}}>
            Live Now
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {liveGames.map(g => <GameCard key={g.game_id} game={g} />)}
          </div>
        </section>
      )}

      {scheduledGames.length > 0 && (
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontSize:'0.85rem',fontWeight:700,color:'var(--accent)',letterSpacing:'0.1em',marginBottom:'0.75rem',textTransform:'uppercase'}}>
            Scheduled
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {scheduledGames.map(g => <GameCard key={g.game_id} game={g} />)}
          </div>
        </section>
      )}

      {finalGames.length > 0 && (
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontSize:'0.85rem',fontWeight:700,color:'var(--muted)',letterSpacing:'0.1em',marginBottom:'0.75rem',textTransform:'uppercase'}}>
            Final
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {finalGames.map(g => <GameCard key={g.game_id} game={g} />)}
          </div>
        </section>
      )}

      {games.length === 0 && (
        <div className="card" style={{padding:'3rem',textAlign:'center'}}>
          <p style={{color:'var(--muted)'}}>No games scheduled for today.</p>
        </div>
      )}

      <footer className="footer">StaxNYC Predictor - Live Games</footer>
    </main>
  )
}
