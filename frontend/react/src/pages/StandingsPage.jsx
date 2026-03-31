import { useState, useMemo } from 'react'
import standingsData from '../data/standings'

export default function StandingsPage() {
  const [filter, setFilter] = useState('All')

  const filtered = useMemo(() => {
    let list = standingsData
    if (filter !== 'All') list = list.filter(r => r.conference === filter)
    return list.slice().sort((a, b) => {
      if (a.conference !== b.conference) return a.conference < b.conference ? -1 : 1
      if (a.rank !== b.rank) return a.rank - b.rank
      return b.pct - a.pct
    })
  }, [filter])

  return (
    <main className="container">
      <section className="page-header">
        <p className="breadcrumb">League / <span>Team Standings</span></p>
      </section>

      <section className="card panel" style={{marginBottom:'1rem'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h1 className="page-title">NBA Team Standings</h1>
            <p className="page-subtitle">Conference standings.</p>
          </div>
          <div style={{display:'flex',gap:'0.5rem'}}>
            {['All','East','West'].map(conf => (
              <button key={conf} type="button"
                className={'pill-btn' + (filter === conf ? ' active' : '')}
                onClick={() => setFilter(conf)}>
                {conf}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th><th>Team</th><th>W</th><th>L</th>
                <th>PCT</th><th>GB</th><th>Streak</th><th>Last 10</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.conference + '-' + r.rank}>
                  <td>{r.rank}</td>
                  <td>{r.team} <span style={{color:'var(--muted)'}}>• {r.conference}</span></td>
                  <td>{r.wins}</td>
                  <td>{r.losses}</td>
                  <td>{r.pct.toFixed(3)}</td>
                  <td>{r.gb === 0 ? '—' : r.gb}</td>
                  <td>{r.streak}</td>
                  <td>{r.last10}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <footer className="footer">StaxNYC Predictor • Standings</footer>
    </main>
  )
}
