declare const React: any;
declare const ReactDOM: any;

interface PlayerStats {
  ppg: string;
  rpg: string;
  apg: string;
  fgp: string;
}

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  teamColor: string;
  teamGlow: string;
  stats: PlayerStats;
}

type StatKey = "ppg" | "rpg" | "apg" | "fgp";

interface CompareCard {
  slotId: number;
  playerId: string;
}

function parseStat(key: StatKey, value: string): number {
  if (key === "fgp") {
    var cleaned: string = value.replace("%", "");
    var n: number = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  var n2: number = parseFloat(value);
  return isNaN(n2) ? 0 : n2;
}

function formatStat(key: StatKey, value: string): string {
  if (key === "fgp") return value.indexOf("%") >= 0 ? value : value + "%";
  return value;
}

function statLabel(key: StatKey): string {
  if (key === "ppg") return "PPG";
  if (key === "rpg") return "RPG";
  if (key === "apg") return "APG";
  return "FG%";
}

function statTooltip(key: StatKey): string {
  if (key === "ppg") return "Points per game — average points scored per game";
  if (key === "rpg") return "Rebounds per game — average rebounds per game";
  if (key === "apg") return "Assists per game — average assists per game";
  return "Field goal percentage — share of field goals made per attempt";
}

const STAT_KEYS: StatKey[] = ["ppg", "rpg", "apg", "fgp"];

function normalizeHexForInput(hex: string | undefined): string {
  if (!hex || typeof hex !== "string") return "#888888";
  var h: string = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h;
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    return "#" + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2) + h.charAt(3) + h.charAt(3);
  }
  return "#888888";
}

function calcMax(players: Player[], key: StatKey): number {
  var max: number = 0;
  for (var i: number = 0; i < players.length; i++) {
    var n: number = parseStat(key, players[i].stats[key]);
    if (n > max) max = n;
  }
  return max || 1;
}

/** For radar normalization: compare group if 2+, else full roster so a solo card isn’t always a full shape. */
function baselineMax(compareGroup: Player[], roster: Player[], key: StatKey): number {
  if (compareGroup.length >= 2) return calcMax(compareGroup, key);
  return calcMax(roster, key);
}

function radarPoint(cx: number, cy: number, radius: number, t: number, norm: number): { x: number; y: number } {
  return {
    x: cx + radius * norm * Math.cos(t),
    y: cy + radius * norm * Math.sin(t)
  };
}

interface RadarSeries {
  playerId: string;
  name: string;
  normValues: number[];
  color: string;
  visible: boolean;
}

function sumNorms(vals: number[]): number {
  var s: number = 0;
  for (var i: number = 0; i < vals.length; i++) s += vals[i] || 0;
  return s;
}

/** One shared radar: grid + overlaid player polygons. */
const MultiStatRadar = (props: {
  series: RadarSeries[];
  axisLabels: string[];
  axisTooltips: string[];
  emptyMessage?: string;
}): any => {
  var size: number = 300;
  var pad: number = 44;
  var cx: number = size / 2;
  var cy: number = size / 2;
  var R: number = size / 2 - pad;
  var n: number = STAT_KEYS.length;
  var rings: number[] = [0.33, 0.66, 1];

  var gridPolys: any[] = [];
  for (var r: number = 0; r < rings.length; r++) {
    var rr: number = rings[r];
    var pts: string[] = [];
    for (var i: number = 0; i < n; i++) {
      var t0: number = -Math.PI / 2 + (2 * Math.PI * i) / n;
      var pt0: { x: number; y: number } = radarPoint(cx, cy, R, t0, rr);
      pts.push(pt0.x.toFixed(2) + "," + pt0.y.toFixed(2));
    }
    gridPolys.push(
      <polygon
        key={"grid-" + r}
        points={pts.join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1}
      />
    );
  }

  var axisLines: any[] = [];
  for (var a: number = 0; a < n; a++) {
    var ta: number = -Math.PI / 2 + (2 * Math.PI * a) / n;
    var outer: { x: number; y: number } = radarPoint(cx, cy, R, ta, 1);
    axisLines.push(
      <line
        key={"axis-" + a}
        x1={cx}
        y1={cy}
        x2={outer.x}
        y2={outer.y}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
    );
  }

  var labelEls: any[] = [];
  var labelR: number = R + 16;
  for (var k: number = 0; k < n; k++) {
    var tk: number = -Math.PI / 2 + (2 * Math.PI * k) / n;
    var lk: { x: number; y: number } = radarPoint(cx, cy, labelR, tk, 1);
    labelEls.push(
      <text
        key={"lbl-" + k}
        x={lk.x}
        y={lk.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="radar-label"
        fill="var(--muted)"
        fontSize={11}
        fontWeight={700}
      >
        <title>{props.axisTooltips[k]}</title>
        {props.axisLabels[k]}
      </text>
    );
  }

  var drawn: RadarSeries[] = [];
  for (var s: number = 0; s < props.series.length; s++) {
    var ser: RadarSeries = props.series[s];
    if (ser.visible && ser.normValues && ser.normValues.length === n) drawn.push(ser);
  }
  drawn.sort(function (a: RadarSeries, b: RadarSeries): number {
    return sumNorms(a.normValues) - sumNorms(b.normValues);
  });

  var playerPolys: any[] = [];
  for (var d: number = 0; d < drawn.length; d++) {
    var serD: RadarSeries = drawn[d];
    var polyPts: string[] = [];
    for (var j: number = 0; j < n; j++) {
      var tj: number = -Math.PI / 2 + (2 * Math.PI * j) / n;
      var nv: number = Math.max(0, Math.min(1, serD.normValues[j] || 0));
      var pj: { x: number; y: number } = radarPoint(cx, cy, R, tj, nv);
      polyPts.push(pj.x.toFixed(2) + "," + pj.y.toFixed(2));
    }
    playerPolys.push(
      <polygon
        key={"player-" + serD.playerId}
        points={polyPts.join(" ")}
        fill={serD.color}
        fillOpacity={0.22}
        stroke={serD.color}
        strokeWidth={2.5}
        strokeLinejoin="round"
      >
        <title>{serD.name}</title>
      </polygon>
    );
  }

  return (
    <div className="radar-wrap radar-wrap--hero">
      {props.emptyMessage && drawn.length === 0 ? (
        <p className="radar-empty-hint">{props.emptyMessage}</p>
      ) : null}
      <svg
        className="radar-svg radar-svg--hero"
        width={size}
        height={size}
        viewBox={"0 0 " + size + " " + size}
        role="img"
        aria-label="Combined radar chart comparing selected players"
      >
        {gridPolys}
        {axisLines}
        {playerPolys}
        {labelEls}
      </svg>
    </div>
  );
};

const CompareApp = (): any => {
  const { useEffect, useMemo, useState } = React;

  const [players, setPlayers] = useState(null as Player[] | null);
  const [error, setError] = useState(null as string | null);

  const [cards, setCards] = useState([] as CompareCard[]);
  const [nextSlotId, setNextSlotId] = useState(1 as number);
  const [justAddedSlotId, setJustAddedSlotId] = useState(null as number | null);

  const [isPickerOpen, setIsPickerOpen] = useState(false as boolean);
  const [query, setQuery] = useState("" as string);
  const [chartVisible, setChartVisible] = useState({} as { [playerId: string]: boolean });
  const [playerColors, setPlayerColors] = useState({} as { [playerId: string]: string });

  useEffect(() => {
    fetch("data/players.json")
      .then((res: Response) => res.json())
      .then((data: Player[]) => {
        var list: Player[] = (data || []).map(function (p: any): Player {
          return {
            id: p.id,
            name: p.name,
            team: p.team,
            position: p.position,
            teamColor: p.teamColor,
            teamGlow: p.teamGlow,
            stats: p.stats
          };
        });

        list.sort(function (a: Player, b: Player): number {
          return a.name.localeCompare(b.name);
        });

        setPlayers(list);
      })
      .catch(() => setError("Failed to load player data."));
  }, []);

  const playerById = useMemo(() => {
    var map: { [key: string]: Player } = {};
    if (!players) return map;
    for (var i: number = 0; i < players.length; i++) {
      map[players[i].id] = players[i];
    }
    return map;
  }, [players]);

  const usedIds = useMemo(() => {
    var used: { [key: string]: boolean } = {};
    for (var i: number = 0; i < cards.length; i++) used[cards[i].playerId] = true;
    return used;
  }, [cards]);

  const comparedPlayers = useMemo(() => {
    var list: Player[] = [];
    for (var i: number = 0; i < cards.length; i++) {
      var pl: Player | undefined = playerById[cards[i].playerId];
      if (pl) list.push(pl);
    }
    return list;
  }, [cards, playerById]);

  const visibleCompared = useMemo(() => {
    return comparedPlayers.filter(function (pl: Player): boolean {
      return chartVisible[pl.id] !== false;
    });
  }, [comparedPlayers, chartVisible]);

  const radarSeries = useMemo((): RadarSeries[] => {
    var scaleGroup: Player[] =
      visibleCompared.length > 0 ? visibleCompared : comparedPlayers;
    return comparedPlayers.map(function (pl: Player): RadarSeries {
      var norms: number[] = [];
      for (var si: number = 0; si < STAT_KEYS.length; si++) {
        var sk: StatKey = STAT_KEYS[si];
        var mx: number =
          scaleGroup.length > 0 ? baselineMax(scaleGroup, players, sk) : 1;
        var val: number = parseStat(sk, pl.stats[sk]);
        norms.push(mx > 0 ? val / mx : 0);
      }
      return {
        playerId: pl.id,
        name: pl.name,
        normValues: norms,
        color: playerColors[pl.id] || pl.teamColor,
        visible: chartVisible[pl.id] !== false
      };
    });
  }, [comparedPlayers, visibleCompared, players, chartVisible, playerColors]);

  const axisLabels = useMemo(() => STAT_KEYS.map(statLabel), []);
  const axisTooltips = useMemo(() => STAT_KEYS.map(statTooltip), []);

  const results = useMemo(() => {
    if (!players) return [];
    var q: string = query.trim().toLowerCase();
    if (!q) return [];

    var out: Player[] = [];
    for (var i: number = 0; i < players.length; i++) {
      var name: string = players[i].name.toLowerCase();
      if (name.indexOf(q) !== -1) out.push(players[i]);
      if (out.length >= 12) break;
    }
    return out;
  }, [players, query]);

  function openPicker(): void {
    setQuery("");
    setIsPickerOpen(true);
  }

  function closePicker(): void {
    setIsPickerOpen(false);
  }

  function toggleChartVisible(playerId: string): void {
    setChartVisible(function (prev: { [key: string]: boolean }): { [key: string]: boolean } {
      var next: { [key: string]: boolean } = Object.assign({}, prev);
      var on: boolean = next[playerId] !== false;
      next[playerId] = !on;
      return next;
    });
  }

  function setPlayerColor(playerId: string, hex: string): void {
    setPlayerColors(function (prev: { [key: string]: string }): { [key: string]: string } {
      var next: { [key: string]: string } = Object.assign({}, prev);
      next[playerId] = normalizeHexForInput(hex);
      return next;
    });
  }

  function resetPlayerColor(playerId: string): void {
    var pl: Player | undefined = playerById[playerId];
    if (!pl) return;
    setPlayerColors(function (prev: { [key: string]: string }): { [key: string]: string } {
      var next: { [key: string]: string } = Object.assign({}, prev);
      next[playerId] = pl.teamColor;
      return next;
    });
  }

  function addPlayer(playerId: string): void {
    if (!players) return;
    if (!playerId) return;
    if (usedIds[playerId]) return;

    var slotId: number = nextSlotId;
    setNextSlotId(slotId + 1);

    setCards(function (prev: CompareCard[]): CompareCard[] {
      return prev.concat([{ slotId: slotId, playerId: playerId }]);
    });

    setChartVisible(function (prev: { [key: string]: boolean }): { [key: string]: boolean } {
      var next: { [key: string]: boolean } = Object.assign({}, prev);
      next[playerId] = true;
      return next;
    });

    var defaultColor: string = "#5b8cff";
    for (var ci: number = 0; ci < players.length; ci++) {
      if (players[ci].id === playerId) {
        defaultColor = players[ci].teamColor;
        break;
      }
    }
    setPlayerColors(function (prev: { [key: string]: string }): { [key: string]: string } {
      var next: { [key: string]: string } = Object.assign({}, prev);
      next[playerId] = normalizeHexForInput(defaultColor);
      return next;
    });

    setJustAddedSlotId(slotId);
    setTimeout(function (): void {
      setJustAddedSlotId(null);
    }, 350);

    closePicker();
  }

  if (error) {
    return (
      <>
        <section className="page-header">
          <p className="breadcrumb">
            Players / <span>Compare</span>
          </p>
        </section>
        <section className="card panel">
          <p style={{ color: "var(--danger)" }}>{error}</p>
        </section>
      </>
    );
  }

  if (!players) {
    return (
      <>
        <section className="page-header">
          <p className="breadcrumb">
            Players / <span>Compare</span>
          </p>
        </section>
        <section className="card panel">
          <p style={{ color: "var(--muted)" }}>Loading players…</p>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-header">
        <p className="breadcrumb">
          Players / <span>Compare</span>
        </p>
      </section>

      <section className="card panel compare-header">
        <div>
          <h1 className="page-title">Compare Players</h1>
          <p className="page-subtitle">
            One radar overlays every added player. Uncheck “On chart” to hide a shape, or use Color to
            customize the outline. Axes rescale from checked players (two or more), or the roster when
            only one is visible.
          </p>
        </div>
      </section>

      <section className="card panel radar-chart-panel">
        <div className="radar-chart-heading">
          <h2 className="radar-chart-title">Comparison radar</h2>
          <p className="radar-chart-sub">
            PPG · RPG · APG · FG% — line colors follow each card’s Color picker (default: team color).
          </p>
        </div>
        {comparedPlayers.length === 0 ? (
          <p className="radar-empty-hint radar-empty-hint--solo">Add players below to see overlapping radars.</p>
        ) : (
          <MultiStatRadar
            series={radarSeries}
            axisLabels={axisLabels}
            axisTooltips={axisTooltips}
            emptyMessage={
              visibleCompared.length === 0
                ? 'Turn on "On chart" for at least one player to show their shape.'
                : undefined
            }
          />
        )}
      </section>

      <section className="compare-row" aria-label="Comparison cards">
        {cards.map(function (c: CompareCard, idx: number): any {
          var p: Player | null = c.playerId && playerById[c.playerId] ? playerById[c.playerId] : null;
          var enterClass: string = justAddedSlotId === c.slotId ? " card-enter" : "";
          var onChart: boolean = p ? chartVisible[p.id] !== false : true;
          var cardColor: string = p ? normalizeHexForInput(playerColors[p.id] || p.teamColor) : "#888888";

          return (
            <section className={"card panel compare-card" + enterClass} key={"slot-" + c.slotId}>
              {!p ? null : (
                <>
                  <label className="compare-chart-toggle">
                    <input
                      type="checkbox"
                      checked={onChart}
                      onChange={(): void => toggleChartVisible(p.id)}
                      aria-label={"Show " + p.name + " on radar chart"}
                    />
                    <span>On chart</span>
                  </label>
                  <div className="compare-color-row">
                    <label className="compare-color-label" htmlFor={"compare-color-" + p.id}>
                      Color
                    </label>
                    <input
                      id={"compare-color-" + p.id}
                      className="compare-color-input"
                      type="color"
                      value={cardColor}
                      onChange={(e: any): void => setPlayerColor(p.id, e.target.value)}
                      aria-label={"Radar and accent color for " + p.name}
                    />
                    <button
                      type="button"
                      className="compare-color-reset"
                      onClick={(): void => resetPlayerColor(p.id)}
                      title="Reset to team color"
                    >
                      Reset
                    </button>
                  </div>
                  <div
                    className="compare-card-color"
                    style={{
                      background: cardColor,
                      boxShadow: "0 0 12px " + cardColor + "99"
                    }}
                    aria-hidden="true"
                  ></div>
                  <div className="compare-card-body">
                    <div className="player-name compare-name-sm">{p.name}</div>
                    <div className="player-sub compare-sub-sm">{p.team}</div>
                    <div className="compare-stat-line" title="PPG · RPG · APG · FG%">
                      {STAT_KEYS.map(function (sk: StatKey, li: number): any {
                        return (
                          <span key={sk}>
                            <span className="compare-stat-k">{statLabel(sk)}</span>{" "}
                            <span className="compare-stat-v">{formatStat(sk, p.stats[sk])}</span>
                            {li < STAT_KEYS.length - 1 ? <span className="compare-stat-sep">|</span> : null}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </section>
          );
        })}

        <button type="button" className="card panel add-card" onClick={openPicker} aria-label="Add player to compare">
          <span className="plus">+</span>
          <span className="add-label">Add player</span>
          <span className="add-hint">Search & compare stats</span>
        </button>
      </section>

      {isPickerOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add player dialog">
          <div className="modal card panel">
            <div className="modal-header">
              <div>
                <div className="modal-title">Add a player</div>
                <div className="modal-sub">Type a name, then pick a result to add.</div>
              </div>
              <button type="button" className="modal-close" onClick={closePicker} aria-label="Close">
                ✕
              </button>
            </div>

            <input
              className="search-input"
              value={query}
              onChange={(e: any): void => setQuery(e.target.value)}
              placeholder="Search players…"
              autoFocus
            />

            <div className="results" role="listbox" aria-label="Search results">
              {!query.trim() ? (
                <p className="results-hint">Type to search your roster…</p>
              ) : results.length === 0 ? (
                <p className="results-hint">No matches. Try another spelling.</p>
              ) : (
                results.map(function (p: Player): any {
                  var disabled: boolean = !!usedIds[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={"result-item" + (disabled ? " disabled" : "")}
                      onClick={(): void => addPlayer(p.id)}
                      disabled={disabled}
                      aria-label={"Add " + p.name}
                    >
                      <span className="result-name">{p.name}</span>
                      <span className="result-sub">{p.team}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      <footer className="footer">StaxNYC Predictor • Compare</footer>
    </>
  );
};

const rootEl = document.getElementById("compare-root");
if (rootEl && typeof ReactDOM !== "undefined") {
  // React 18 UMD bundles may not expose createRoot; render keeps it simple.
  ReactDOM.render(<CompareApp />, rootEl);
}

export {};

