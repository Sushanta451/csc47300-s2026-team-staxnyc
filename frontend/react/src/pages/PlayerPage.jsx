import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import mockPlayers from '../data/players'

export default function PlayerPage() {
  const { id } = useParams()
  const [stats, setStats] = useState(null)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const staticPlayer = mockPlayers.find(p => p.id === id)

  useEffect(() => {
    async function load() {
      try {
        const { data: s } = await supabase
          .from('player_stats')
          .select('*')
          .eq('player_id', id)
          .single()
        const { data: g } = await supabase
          .from('player_games')
          .select('*')
          .eq('player_id', id)
          .order('game_date', { ascending: false })
          .limit(10)
        if (s) setStats(s)
        if (g) setGames(g)
      } catch (err) {
        console.log('fallback', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <main className="container">
      <p style={{ color: 'var(--muted)', padding: '4rem 0', textAlign: 'center' }}>
        Loading...
      </p>
    </main>
  )

  if (!staticPlayer && !stats) return (
    <main className="container">
      <p style={{ color: 'var(--muted)', padding: '4rem 0', textAlign: 'center' }}>
        Player not found. <Link to="/">Go home</Link>
      </p>
    </main>
  )

  const name      = stats?.player_name   || staticPlayer?.name       || 'Unknown'
  const team      = stats?.team          || staticPlayer?.team       || ''
  const position  = stats?.position      || staticPlayer?.position   || ''
  const height    = stats?.height        || staticPlayer?.height     || ''
  const weight    = stats?.weight        || staticPlayer?.weight     || ''
  const number    = stats?.jersey_number || staticPlayer?.number     || ''
  const ppg       = stats?.ppg           || staticPlayer?.stats?.ppg || '--'
  const rpg       = stats?.rpg           || staticPlayer?.stats?.rpg || '--'
  const apg       = stats?.apg           || staticPlayer?.stats?.apg || '--'
  const fgp       = stats?.fg_pct ? stats.fg_pct + '%' : staticPlayer?.stats?.fgp || '--'
  const image     = staticPlayer?.image     || ''
  const teamColor = staticPlayer?.teamColor || '#5b8cff'
  const teamGlow  = staticPlayer?.teamGlow  || 'rgba(91,140,255,0.75)'
  const gameLog   = games.length > 0 ? games : (staticPlayer?.games || [])
  const maxPts    = Math.max(...gameLog.map(g => g.pts || 0), 1)

  return (
    <main className="container">
      <section className="page-header">
        <p className="breadcrumb">
          Players / Western Conference / <span>{name}</span>
        </p>
      </section>

      <section className="profile-layout">
        <article className="card player-hero">
          <div className="hero-top" />
          <div className="hero-body">
            <div className="player-main">
              <div className="player-avatar">
                <img src={image} alt={name} />
              </div>
              <div className="player-info">
                <div className="player-name-row">
                  <h1 className="player-name">{name}</h1>
                  <span className="team-pill">
                    <span className="team-dot"
                      style={{ background: teamColor, boxShadow: '0 0 12px ' + teamGlow }} />
                    {team}
                  </span>
                </div>
                <div className="player-meta">
                  <span>{position}</span>
                  <span>{height}</span>
                  <span>{weight}</span>
                  <span>#{number}</span>
                </div>
                {staticPlayer?.tags && (
                  <div className="player-tags">
                    {staticPlayer.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="stats-grid">
              {[
                { label: 'PPG', val: ppg },
                { label: 'RPG', val: rpg },
                { label: 'APG', val: apg },
                { label: 'FG%', val: fgp },
              ].map(({ label, val }) => (
                <div key={label} className="stat-box">
                  <p className="stat-label">{label}</p>
                  <p className="stat-value">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className="side-stack">
          <section className="card panel prediction-card">
            <h3>Next Game Prediction</h3>
            <p className="prediction-sub">Projected points for next game</p>
            <p className="prediction-sub" style={{ marginTop: '0.5rem' }}>Coming soon</p>
          </section>
          <section className="card panel">
            <h3>Season Stats</h3>
            <div className="matchup-list">
              {[
                { title: 'Points Per Game',   value: ppg },
                { title: 'Rebounds Per Game', value: rpg },
                { title: 'Assists Per Game',  value: apg },
                { title: 'Field Goal %',      value: fgp },
              ].map((item, i) => (
                <div key={i} className="matchup-item">
                  <p className="matchup-title">{item.title}</p>
                  <span className="pill">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="lower-grid">
        <article className="card section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Points Trend</h2>
              <p className="section-note">Last {gameLog.length} games</p>
            </div>
            <span className="pill">Avg {ppg}</span>
          </div>
          <div className="chart">
            {gameLog.slice(0, 10).map((g, i) => {
              const pts = g.pts || 0
              const pct = Math.round((pts / maxPts) * 100)
              return (
                <div key={i} className="bar-wrap">
                  <div className="bar" style={{ height: pct + '%' }} />
                  <div className="bar-value">{pts}</div>
                  <div className="bar-label">G{i + 1}</div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="card section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Games</h2>
              <p className="section-note">Last {gameLog.length} games</p>
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
                {gameLog.map((g, i) => (
                  <tr key={i}>
                    <td>{g.game_date || g.date}</td>
                    <td>{g.opponent  || g.opp}</td>
                    <td>{g.pts}</td>
                    <td>{g.reb}</td>
                    <td>{g.ast}</td>
                    <td className={g.result === 'W' ? 'result-win' : 'result-loss'}>
                      {g.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <footer className="footer">{name} Player Prediction Page</footer>
    </main>
  )
}
