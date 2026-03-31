import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import players from '../data/players'

// ── Stat change badge ──────────────────────────────────────
function StatChange({ change }) {
  if (typeof change === 'object') {
    return <p className={`stat-change${change.down ? ' down' : ''}`}>{change.text}</p>
  }
  return <p className="stat-change">{change}</p>
}

// ── Bar chart ──────────────────────────────────────────────
function PointsChart({ chartPoints, avgPoints }) {
  const maxPts = Math.max(...chartPoints)
  return (
    <article className="card section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Points Trend</h2>
          <p className="section-note">Last 10 games (mock data for design preview)</p>
        </div>
        <span className="pill">Avg {avgPoints}</span>
      </div>
      <div className="chart" aria-label="Recent points trend chart">
        {chartPoints.map((pts, i) => {
          const pct = Math.round((pts / maxPts) * 100)
          return (
            <div key={i} className="bar-wrap">
              <div className="bar" style={{ height: `${pct}%` }} />
              <div className="bar-value">{pts}</div>
              <div className="bar-label">G{i + 1}</div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

// ── Game log table ─────────────────────────────────────────
function GameLog({ games }) {
  return (
    <article className="card section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Games</h2>
          <p className="section-note">Last 5 games</p>
        </div>
      </div>
      <div className="table-wrap">
        <table aria-label="Recent games table">
          <thead>
            <tr>
              <th>Date</th><th>Opp</th><th>PTS</th>
              <th>REB</th><th>AST</th><th>Result</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => (
              <tr key={i}>
                <td>{g.date}</td>
                <td>{g.opp}</td>
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

// ── Main PlayerPage ────────────────────────────────────────
export default function PlayerPage() {
  const { id } = useParams()
  const p = players.find(pl => pl.id === id)

  // Update browser tab title
  useEffect(() => {
    if (p) document.title = `${p.name} | Player Profile | NBA Predictor`
    return () => { document.title = 'StaxNYC Predictor' }
  }, [p])

  if (!p) {
    return (
      <main className="container">
        <p style={{ color: 'var(--muted)', padding: '4rem 0', textAlign: 'center' }}>
          Player not found. <Link to="/" style={{ color: 'var(--accent)' }}>Go home</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="container" id="player-content">
      {/* ── Breadcrumb ── */}
      <section className="page-header">
        <p className="breadcrumb">
          Players / {p.conference} Conference / <span>{p.name}</span>
        </p>
      </section>

      {/* ── Profile layout: hero card + side panels ── */}
      <section className="profile-layout">

        {/* Left — hero card */}
        <article className="card player-hero">
          <div className="hero-top" />
          <div className="hero-body">
            <div className="player-main">
              {/* Avatar */}
              <div className="player-avatar">
                <img src={p.image} alt={`${p.name} profile picture`} />
              </div>

              {/* Name / team / meta */}
              <div className="player-info">
                <div className="player-name-row">
                  <h1 className="player-name">{p.name}</h1>
                  <span className="team-pill">
                    <span
                      className="team-dot"
                      style={{ background: p.teamColor, boxShadow: `0 0 12px ${p.teamGlow}` }}
                    />
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

            {/* Stats row */}
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

        {/* Right — prediction + context */}
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
              <div className="progress" aria-label="Model confidence progress bar">
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

      {/* ── Lower section: chart + game log ── */}
      <section className="lower-grid">
        <PointsChart chartPoints={p.chartPoints} avgPoints={p.avgPoints} />
        <GameLog games={p.games} />
      </section>

      <footer className="footer">{p.name} Player Prediction Page</footer>
    </main>
  )
}
