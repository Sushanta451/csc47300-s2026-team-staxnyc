import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import './ComparePage.css'

const STAT_KEYS = ['ppg', 'rpg', 'apg', 'fg_pct']

function statLabel(key) {
  if (key === 'ppg') return 'PPG'
  if (key === 'rpg') return 'RPG'
  if (key === 'apg') return 'APG'
  return 'FG%'
}

function statTooltip(key) {
  if (key === 'ppg') return 'Points per game'
  if (key === 'rpg') return 'Rebounds per game'
  if (key === 'apg') return 'Assists per game'
  return 'Field goal percentage'
}

function formatStat(key, value) {
  if (key === 'fg_pct') return value + '%'
  return value
}

function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return '#5b8cff'
  const h = hex.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    return '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]
  }
  return '#5b8cff'
}

function radarPoint(cx, cy, radius, angle, norm) {
  return {
    x: cx + radius * norm * Math.cos(angle),
    y: cy + radius * norm * Math.sin(angle),
  }
}

/* ─── Radar Chart Component ─── */
function MultiStatRadar({ series, axisLabels, axisTooltips, emptyMessage }) {
  const size = 300
  const pad = 44
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - pad
  const n = STAT_KEYS.length
  const rings = [0.33, 0.66, 1]

  // Grid polygons
  const gridPolys = rings.map((rr, idx) => {
    const pts = []
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
      const pt = radarPoint(cx, cy, R, angle, rr)
      pts.push(pt.x.toFixed(2) + ',' + pt.y.toFixed(2))
    }
    return <polygon key={'grid-' + idx} points={pts.join(' ')} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
  })

  // Axis lines
  const axisLines = []
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
    const outer = radarPoint(cx, cy, R, angle, 1)
    axisLines.push(<line key={'axis-' + i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />)
  }

  // Axis labels
  const labelEls = []
  const labelR = R + 16
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
    const pt = radarPoint(cx, cy, labelR, angle, 1)
    labelEls.push(
      <text key={'lbl-' + i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fill="var(--muted)" fontSize={11} fontWeight={700} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <title>{axisTooltips[i]}</title>
        {axisLabels[i]}
      </text>
    )
  }

  // Player polygons (visible only)
  const drawn = series.filter(s => s.visible && s.normValues && s.normValues.length === n)
  drawn.sort((a, b) => {
    const sumA = a.normValues.reduce((s, v) => s + (v || 0), 0)
    const sumB = b.normValues.reduce((s, v) => s + (v || 0), 0)
    return sumA - sumB
  })

  const playerPolys = drawn.map(ser => {
    const pts = []
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
      const nv = Math.max(0, Math.min(1, ser.normValues[i] || 0))
      const pt = radarPoint(cx, cy, R, angle, nv)
      pts.push(pt.x.toFixed(2) + ',' + pt.y.toFixed(2))
    }
    return (
      <polygon key={'player-' + ser.playerId} points={pts.join(' ')} fill={ser.color} fillOpacity={0.22} stroke={ser.color} strokeWidth={2.5} strokeLinejoin="round">
        <title>{ser.name}</title>
      </polygon>
    )
  })

  return (
    <div className="radar-wrap radar-wrap--hero">
      {emptyMessage && drawn.length === 0 && <p className="radar-empty-hint">{emptyMessage}</p>}
      <svg className="radar-svg radar-svg--hero" width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} role="img" aria-label="Radar chart comparing players">
        {gridPolys}
        {axisLines}
        {playerPolys}
        {labelEls}
      </svg>
    </div>
  )
}

/* ─── Main Compare Page ─── */
export default function ComparePage() {
  const [cards, setCards] = useState([])       // [{ slotId, player }]
  const [nextSlotId, setNextSlotId] = useState(1)
  const [justAddedSlotId, setJustAddedSlotId] = useState(null)

  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const [chartVisible, setChartVisible] = useState({})   // { playerId: bool }
  const [playerColors, setPlayerColors] = useState({})    // { playerId: hex }

  // Search Supabase for players
  function handleSearch(q) {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('player_stats')
        .select('player_id,player_name,team')
        .ilike('player_name', '*' + q.trim() + '*')
        .limit(12)
      if (data) setResults(data)
    }, 300)
    return () => clearTimeout(timer)
  }

  // IDs already on the board
  const usedIds = useMemo(() => {
    const used = {}
    cards.forEach(c => { used[c.player.player_id] = true })
    return used
  }, [cards])

  // Players on the board
  const comparedPlayers = useMemo(() => cards.map(c => c.player), [cards])

  // Visible players (on chart checkbox)
  const visiblePlayers = useMemo(() => {
    return comparedPlayers.filter(p => chartVisible[p.player_id] !== false)
  }, [comparedPlayers, chartVisible])

  // Radar series
  const radarSeries = useMemo(() => {
    const scaleGroup = visiblePlayers.length > 0 ? visiblePlayers : comparedPlayers
    return comparedPlayers.map(p => {
      const norms = STAT_KEYS.map(key => {
        const val = parseFloat(p[key]) || 0
        let max = 0
        scaleGroup.forEach(sp => {
          const sv = parseFloat(sp[key]) || 0
          if (sv > max) max = sv
        })
        if (max === 0) max = 1
        return val / max
      })
      return {
        playerId: p.player_id,
        name: p.player_name,
        normValues: norms,
        color: playerColors[p.player_id] || '#5b8cff',
        visible: chartVisible[p.player_id] !== false,
      }
    })
  }, [comparedPlayers, visiblePlayers, chartVisible, playerColors])

  const axisLabels = useMemo(() => STAT_KEYS.map(statLabel), [])
  const axisTooltips = useMemo(() => STAT_KEYS.map(statTooltip), [])

  async function addPlayer(playerId) {
    if (usedIds[playerId]) return
    // Fetch full player data from Supabase
    const { data } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .single()
    if (!data) return

    const slotId = nextSlotId
    setNextSlotId(slotId + 1)
    setCards(prev => [...prev, { slotId, player: data }])
    setChartVisible(prev => ({ ...prev, [playerId]: true }))
    setPlayerColors(prev => ({ ...prev, [playerId]: '#5b8cff' }))
    setJustAddedSlotId(slotId)
    setTimeout(() => setJustAddedSlotId(null), 350)
    setIsPickerOpen(false)
    setQuery('')
    setResults([])
  }

  function removePlayer(playerId) {
    setCards(prev => prev.filter(c => c.player.player_id !== playerId))
  }

  function toggleChartVisible(playerId) {
    setChartVisible(prev => ({ ...prev, [playerId]: prev[playerId] === false ? true : false }))
  }

  function setPlayerColor(playerId, hex) {
    setPlayerColors(prev => ({ ...prev, [playerId]: normalizeHex(hex) }))
  }

  function openPicker() {
    setQuery('')
    setResults([])
    setIsPickerOpen(true)
  }

  return (
    <main className="container">
      <section className="page-header">
        <p className="breadcrumb">Players / <span>Compare</span></p>
      </section>

      {/* Header */}
      <section className="card panel compare-header">
        <div>
          <h1 className="page-title">Compare Players</h1>
          <p className="page-subtitle">
            Add players to see their stats overlaid on one radar chart. Use the color picker and "On chart" toggle to customize.
          </p>
        </div>
      </section>

      {/* Radar Chart */}
      <section className="card panel radar-chart-panel">
        <div className="radar-chart-heading">
          <h2 className="radar-chart-title">Comparison Radar</h2>
          <p className="radar-chart-sub">PPG &middot; RPG &middot; APG &middot; FG%</p>
        </div>
        {comparedPlayers.length === 0 ? (
          <p className="radar-empty-hint radar-empty-hint--solo">Add players below to see overlapping radars.</p>
        ) : (
          <MultiStatRadar
            series={radarSeries}
            axisLabels={axisLabels}
            axisTooltips={axisTooltips}
            emptyMessage={visiblePlayers.length === 0 ? 'Turn on "On chart" for at least one player.' : undefined}
          />
        )}
      </section>

      {/* Player Cards Row */}
      <section className="compare-row">
        {cards.map(c => {
          const p = c.player
          const enterClass = justAddedSlotId === c.slotId ? ' card-enter' : ''
          const onChart = chartVisible[p.player_id] !== false
          const cardColor = normalizeHex(playerColors[p.player_id])

          return (
            <section className={'card panel compare-card' + enterClass} key={'slot-' + c.slotId}>
              <label className="compare-chart-toggle">
                <input type="checkbox" checked={onChart} onChange={() => toggleChartVisible(p.player_id)} />
                <span>On chart</span>
              </label>
              <div className="compare-color-row">
                <label className="compare-color-label">Color</label>
                <input className="compare-color-input" type="color" value={cardColor} onChange={e => setPlayerColor(p.player_id, e.target.value)} />
                <button type="button" className="compare-color-reset" onClick={() => setPlayerColor(p.player_id, '#5b8cff')}>Reset</button>
              </div>
              <div className="compare-card-color" style={{ background: cardColor, boxShadow: '0 0 12px ' + cardColor + '99' }} />
              <div className="compare-card-body">
                <div className="player-name compare-name-sm">{p.player_name}</div>
                <div className="player-sub compare-sub-sm">{p.team} &middot; {p.position}</div>
                <div className="compare-stat-line">
                  {STAT_KEYS.map((sk, i) => (
                    <span key={sk}>
                      <span className="compare-stat-k">{statLabel(sk)}</span>{' '}
                      <span className="compare-stat-v">{formatStat(sk, p[sk])}</span>
                      {i < STAT_KEYS.length - 1 && <span className="compare-stat-sep">|</span>}
                    </span>
                  ))}
                </div>
              </div>
              <button type="button" className="compare-remove-btn" onClick={() => removePlayer(p.player_id)} title="Remove player">&times;</button>
            </section>
          )
        })}

        {/* Add Player Button */}
        <button type="button" className="card panel add-card" onClick={openPicker}>
          <span className="plus">+</span>
          <span className="add-label">Add player</span>
          <span className="add-hint">Search &amp; compare stats</span>
        </button>
      </section>

      {/* Modal Picker */}
      {isPickerOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsPickerOpen(false) }}>
          <div className="modal card panel">
            <div className="modal-header">
              <div>
                <div className="modal-title">Add a player</div>
                <div className="modal-sub">Type a name, then pick a result to add.</div>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsPickerOpen(false)}>&times;</button>
            </div>

            <input
              className="search-input"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search players..."
              autoFocus
            />

            <div className="results">
              {!query.trim() ? (
                <p className="results-hint">Type to search players...</p>
              ) : results.length === 0 ? (
                <p className="results-hint">No matches found.</p>
              ) : (
                results.map(p => {
                  const disabled = !!usedIds[p.player_id]
                  return (
                    <button
                      key={p.player_id}
                      type="button"
                      className={'result-item' + (disabled ? ' disabled' : '')}
                      onClick={() => addPlayer(p.player_id)}
                      disabled={disabled}
                    >
                      <span className="result-name">{p.player_name}</span>
                      <span className="result-sub">{p.team}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">StaxNYC Predictor &bull; Compare Players</footer>
    </main>
  )
}
