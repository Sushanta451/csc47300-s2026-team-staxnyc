import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PlayerPage() {
  const { id } = useParams()
  const [stats, setStats] = useState(null)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

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
          .limit(5)
        if (s) setStats(s)
        if (g) setGames(g)
      } catch (err) {
        console.log('Error loading player:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <main className="container">
      <p style={{ color: 'var(--muted)', padding: '4rem 0', textAlign: 'center' }}>Loading...</p>
    </main>
  )

  if (!stats) return (
    <main className="container">
      <p style={{ color: 'var(--muted)', padding: '4rem 0', textAlign: 'center' }}>
        Player not found. <Link to="/">Go home</Link>
      </p>
    </main>
  )

  const name = stats.player_name
  const team = stats.team
  const position = stats.position
  const height = stats.height
  const weight = stats.weight
  const number = stats.jersey_number
  const ppg = stats.ppg
  const rpg = stats.rpg
  const apg = stats.apg
  const fgp = stats.fg_pct + '%'
  const maxPts = Math.max(...games.map(g => g.pts || 0), 1)

  return (
    <main className="container">
      <section className="page-header">
        <p className="breadcrumb">
          <Link to="/" style={{color:'var(--muted)'}}>Players</Link> / <span>{name}</span>
        </p>
      </section>

      <section className="profile-layout">
        <article className="card player-hero">
          <div className="hero-top" />
          <div className="hero-body">
            <div className="player-main">
              <div className="player-avatar">
                <div style={{width:'100%',height:'100%',display:'grid',placeItems:'center',fontSize:'2rem',color:'var(--muted)'}}>
                  {name.charAt(0)}
                </div>
              </div>
              <div className="player-info">
                <div className="player-name-row">
                  <h1 className="player-name">{name}</h1>
                  <span className="team-pill">{team}</span>
                </div>
                <div className="player-meta">
                  <span>{position}</span>
                  <span>{height}</span>
                  <span>{weight} lbs</span>
                  <span>#{number}</span>
                </div>
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
            <p style={{color:'var(--muted)',fontSize:'0.8rem',marginTop:'0.5rem'}}>
              Season: {stats.season} | Games: {stats.games_played} | MPG: {stats.mpg}
            </p>
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
                { title: 'Points Per Game', value: ppg },
                { title: 'Rebounds Per Game', value: rpg },
                { title: 'Assists Per Game', value: apg },
                { title: 'Field Goal %', value: fgp },
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

      {games.length > 0 && (
        <section className="lower-grid">
          <article className="card section-card">
            <div className="section-header">
              <div>
                <h2 className="section-title">Recent Points Trend</h2>
                <p className="section-note">Last {games.length} games</p>
              </div>
              <span className="pill">Avg {ppg}</span>
            </div>
            <div className="chart" style={{gridTemplateColumns: 'repeat(' + games.length + ', 1fr)'}}>
              {games.slice().reverse().map((g, i) => {
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
      )}

      <footer className="footer">{name} Player Profile</footer>
    </main>
  )
}
