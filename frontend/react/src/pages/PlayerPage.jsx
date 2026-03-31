import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPlayerById, getPlayerGames } from '../lib/api'
import players from '../data/players' // fallback for images/tags/prediction

function StatChange({ change }) {
  if (!change) return null
  if (typeof change === 'object') {
    return <p className={`stat-change${change.down ? ' down' : ''}`}>{change.text}</p>
  }
  return <p className="stat-change">{change}</p>
}

function PointsChart({ games, avgPoints }) {
  if (!games || games.length === 0) return null
  const pts = games.map(g => g.pts).filter(Boolean)
  const maxPts = Math.max(...pts)
  return (
    <article className="card section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Points Trend</h2>
          <p className="section-note">Last {pts.length} games</p>
        </div>
        <span className="pill">Avg {avgPoints}</span>
      </div>
      <div className="chart" aria-label="Recent points trend chart">
        {games.slice(0, 10).map((g, i) => {
          const pct = Math.round(((g.pts || 0) / maxPts) * 100)
          return (
            <div key={i} className="bar-wrap">
              <div className="bar" style={{ height: `${pct}%` }} />
              <div className="bar-value">{g.pts}</div>
              <div className="bar-label">G{i + 1}</div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

function GameLog({ games }) {
  if (!games || games.length === 0) return null
  return (
    <article className="card section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Games</h2>
          <p className="section-note">Last {games.length} games</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Opp</th><th>PTS</th>
              <th>REB</th><th>AST</th><th>Result</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => (
              <tr key={i}>
                <td>{g.game_date}</td>
                <td>{g.opponent}</td>
                <td>{g.pts}</td>
                <td>{g.reb}</td>
                <td>{g.ast}</td>
                <td className={g.result === 'W' ? 'result-win' : 'result-loss'}>{g.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export default function PlayerPage() {
  const { id } = useParams()
  const [playerData, setPlayerData] = useState(null)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  // Get static data (images, tags, prediction) from local file as fallback
  const staticData = players.find(p => p.id === id)

  useEffect(() => {
    async function load() {
      try {
        const [stats, gameLog] = await Promise.all([
          getPlayerById(id),
          getPlayerGames(id)
        ])
        setPlayerData(stats)
        setGames(gameLog)
      } catch (err) {
        console.error('Supabase error:', err)
        // Fall back to mock data if Supabase fails
        if (staticData) setPlayerData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    const name = playerData?.player_name || staticData?.name
    if (name) document.title = `${name} | Player Profile | NBA Predictor`
    return () => { document.title = 'StaxNYC Predictor' }
  }, [playerData, staticData])

  if (loading) return (
    <main className="container">
      <p style={{ color: 'var(--muted)', padding: '4rem 0', textAlign: 'center' }}>Loading player data…</p>
    </main>
  )

  // Use Supabase data if available, otherwise fall back to mock
  const p = playerData ? {
    name: playerData.player_name,
    team: playerData.team,
    position: playerData.position,
    age: staticData?.age || '—',
    height: playerData.height,
    weight: playerData.weight,
    number: playerData.jersey_number,
    teamColor: staticData?.teamColor || '#5b8cff',
    teamGlow: staticData?.teamGlow || 'rgba(91,140,255,0.75)',
    image: staticData?.image || '',
    tags: staticData?.tags || [],
    stats: {
      ppg: playerData.ppg,
      rpg: playerData.rpg,
      apg: playerData.apg,
      fgp: playerData.fg_pct ? `${playerData.fg_pct}%` : '—'
    },
    statChanges: staticData?.statChanges || {},
    prediction: staticData?.prediction || { points: null, range: '—', confidence: 0 },
    context: staticData?.context || [],
    avgPoints: playerData.ppg,
    conference: 'Western',
  } : staticData

  if (!p) return (
    <main className="container">
      <p style={{ color: 'var(--muted)', padding: '4rem 0', textAlign: 'center' }}>
        Player not found. <Link to="/" style={{ color: 'var(--accent)' }}>Go home</Link>
      </p>
    </main>
  )

  const gameLog = games.length > 0 ? games : staticData?.games || []
  const chartGames = games.length > 0 ? games : staticData?.games?.map(g => ({ pts: g.pts })) || []

  return (
    <main className="container">
      <section className="page-header">
        <p className="breadcrumb">
          Players / {p.conference} Conference / <span>{p.name}</span>
        </p>
      </section>

      <section className="profile-layout">
        <article className="card player-hero">
          <div className="hero-top" />
          <div className="hero-body">
            <div className="player-main">
              <div className="player-avatar">
                <img src={p.image} alt={`${p.name} profile picture`} />
              </div>
              <div className="player-info">
                <div className="player-name-row">
                  <h1 className="player-name">{p.name}</h1>
                  <span className="team-pill">
                    <span className="team-dot" style={{ background: p.teamColor, boxShadow: `0 0 12px ${p.teamGlow}` }} />
                    {p.team}
                  </span>
                </div>
                <div className="player-meta">
                  <span>{p.position}</span>
                  <span>Age {p.age}</span>
                  <span>{p.height} • {p.weight}</span>
                  <span>#{p.number}</span>
                </div>
                <div className="player-tags">
                  {p.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                </div>
              </div>
            </div>

            <div className="stats-grid">
              {[
                { label: 'PPG', key: 'ppg', val: p.stats.ppg },
                { label: 'RPG', key: 'rpg', val: p.stats.rpg },
                { label: 'APG', key: 'apg', val: p.stats.apg },
                { label: 'FG%', key: 'fgp', val: p.stats.fgp },
              ].map(({ label, key, val }) => (
                <div key={key} className="stat-box">
                  <p className="stat-label">{label}</p>
                  <p className="stat-value">{val}</p>
                  <StatChange change={p.statChanges[key]} />
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className="side-stack">
          <section className="card panel prediction-card">
            <h3>Next Game Prediction</h3>
            <p className="prediction-sub">Projected points for next game</p>
            {p.prediction.points !== null && (
              <p className="prediction-number">{p.prediction.points}</p>
            )}
            <p className="prediction-sub">Range: {p.prediction.range} points</p>
            <div className="confidence-row">
              <div className="confidence-label">
                <span>Model Confidence</span>
                <span>{p.prediction.confidence}%</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${p.prediction.confidence}%` }} />
              </div>
            </div>
          </section>

          <section className="card panel">
            <h3>Game Context</h3>
            <div className="matchup-list">
              {p.context.map((c, i) => (
                <div key={i} className="matchup-item">
                  <div>
                    <p className="matchup-title">{c.title}</p>
                    <p className="matchup-sub">{c.sub}</p>
                  </div>
                  <span className="pill">{c.value}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="lower-grid">
        <PointsChart games={chartGames} avgPoints={p.avgPoints} />
        <GameLog games={gameLog} />
      </section>

      <footer className="footer">{p.name} Player Prediction Page</footer>
    </main>
  )
}
