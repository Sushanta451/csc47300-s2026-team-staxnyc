import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const mockGames = [
  { game_id: '1', home_team: 'Lakers', away_team: 'Celtics', home_score: 102, away_score: 108, status: 'Live', quarter: 'Q4', time_remaining: '2:14', game_date: 'Today' },
  { game_id: '2', home_team: 'Bucks', away_team: 'Heat', home_score: 88, away_score: 84, status: 'Live', quarter: 'Q3', time_remaining: '5:39', game_date: 'Today' },
  { game_id: '3', home_team: 'Warriors', away_team: 'Suns', home_score: 110, away_score: 105, status: 'Final', quarter: 'Final', time_remaining: '', game_date: 'Today' },
  { game_id: '4', home_team: 'Nuggets', away_team: 'Clippers', home_score: 0, away_score: 0, status: 'Upcoming', quarter: '', time_remaining: '7:30 PM', game_date: 'Today' },
]

function GameCard({ game }) {
  const isLive = game.status === 'Live'
  const isFinal = game.status === 'Final'
  const isUpcoming = game.status === 'Upcoming'
  return (
    <div className="card" style={{padding:'1.2rem',transition:'transform 0.18s ease,border-color 0.18s ease'}}
      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(91,140,255,0.35)'}
      onMouseLeave={e => e.currentTarget.style.borderColor=''}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.8rem'}}>
        <span style={{fontSize:'0.8rem',fontWeight:700,padding:'0.25rem 0.6rem',borderRadius:'999px',
          background: isLive ? 'rgba(45,212,191,0.15)' : isUpcoming ? 'rgba(91,140,255,0.15)' : 'rgba(255,255,255,0.06)',
          color: isLive ? 'var(--success)' : isUpcoming ? 'var(--accent)' : 'var(--muted)',
          border: `1px solid ${isLive ? 'rgba(45,212,191,0.3)' : isUpcoming ? 'rgba(91,140,255,0.3)' : 'rgba(255,255,255,0.08)'}`}}>
          {isLive ? '🔴 LIVE' : isFinal ? 'Final' : '🕐 ' + game.time_remaining}
        </span>
        <span style={{fontSize:'0.8rem',color:'var(--muted)'}}>{game.game_date}</span>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
        <div style={{flex:1,textAlign:'center'}}>
          <p style={{fontWeight:700,fontSize:'1rem',marginBottom:'0.3rem'}}>{game.away_team}</p>
          {!isUpcoming && <p style={{fontSize:'2rem',fontWeight:800,color:'var(--text)'}}>{game.away_score}</p>}
          <p style={{fontSize:'0.75rem',color:'var(--muted)'}}>Away</p>
        </div>

        <div style={{textAlign:'center',padding:'0 0.5rem'}}>
          {!isUpcoming ? (
            <>
              <p style={{fontSize:'0.85rem',fontWeight:700,color:'var(--accent)'}}>{game.quarter}</p>
              {game.time_remaining && <p style={{fontSize:'0.75rem',color:'var(--muted)'}}>{game.time_remaining}</p>}
            </>
          ) : (
            <p style={{fontSize:'1.2rem',color:'var(--muted)'}}>vs</p>
          )}
        </div>

        <div style={{flex:1,textAlign:'center'}}>
          <p style={{fontWeight:700,fontSize:'1rem',marginBottom:'0.3rem'}}>{game.home_team}</p>
          {!isUpcoming && <p style={{fontSize:'2rem',fontWeight:800,color:'var(--text)'}}>{game.home_score}</p>}
          <p style={{fontSize:'0.75rem',color:'var(--muted)'}}>Home</p>
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
      const { data } = await supabase.from('live_games').select('*').order('game_date', { ascending: false })
      if (data && data.length > 0) {
        setGames(data)
      } else {
        setGames(mockGames)
      }
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      setGames(mockGames)
      setLastUpdated(new Date().toLocaleTimeString())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
    const interval = setInterval(loadGames, 30000)
    return () => clearInterval(interval)
  }, [])

  const liveGames     = games.filter(g => g.status === 'Live')
  const finalGames    = games.filter(g => g.status === 'Final')
  const upcomingGames = games.filter(g => g.status === 'Upcoming' || g.status === 'scheduled')

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
          <p style={{color:'var(--muted)',fontSize:'0.9rem'}}>Live scores and upcoming matchups</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          {lastUpdated && <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>Updated {lastUpdated}</span>}
          <button onClick={loadGames} className="btn primary" style={{padding:'0.5rem 1rem',fontSize:'0.85rem'}}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {liveGames.length > 0 && (
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontSize:'0.85rem',fontWeight:700,color:'var(--success)',letterSpacing:'0.1em',marginBottom:'0.75rem',textTransform:'uppercase'}}>
            🔴 Live Now
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {liveGames.map(g => <GameCard key={g.game_id} game={g} />)}
          </div>
        </section>
      )}

      {upcomingGames.length > 0 && (
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontSize:'0.85rem',fontWeight:700,color:'var(--accent)',letterSpacing:'0.1em',marginBottom:'0.75rem',textTransform:'uppercase'}}>
            🕐 Upcoming
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {upcomingGames.map(g => <GameCard key={g.game_id} game={g} />)}
          </div>
        </section>
      )}

      {finalGames.length > 0 && (
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontSize:'0.85rem',fontWeight:700,color:'var(--muted)',letterSpacing:'0.1em',marginBottom:'0.75rem',textTransform:'uppercase'}}>
            ✓ Final
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

      <footer className="footer">StaxNYC Predictor • Live Games</footer>
    </main>
  )
}
