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

const STAT_KEYS: StatKey[] = ["ppg", "rpg", "apg", "fgp"];

function calcMax(players: Player[], key: StatKey): number {
  var max: number = 0;
  for (var i: number = 0; i < players.length; i++) {
    var n: number = parseStat(key, players[i].stats[key]);
    if (n > max) max = n;
  }
  return max || 1;
}

const CompareApp = (): any => {
  const { useEffect, useMemo, useState } = React;

  const [players, setPlayers] = useState(null as Player[] | null);
  const [error, setError] = useState(null as string | null);

  const [cards, setCards] = useState([] as CompareCard[]);
  const [nextSlotId, setNextSlotId] = useState(1 as number);
  const [justAddedSlotId, setJustAddedSlotId] = useState(null as number | null);

  const [isPickerOpen, setIsPickerOpen] = useState(false as boolean);
  const [query, setQuery] = useState("" as string);

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

  function addPlayer(playerId: string): void {
    if (!players) return;
    if (!playerId) return;
    if (usedIds[playerId]) return;

    var slotId: number = nextSlotId;
    setNextSlotId(slotId + 1);

    setCards(function (prev: CompareCard[]): CompareCard[] {
      return prev.concat([{ slotId: slotId, playerId: playerId }]);
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
          <p className="page-subtitle">Add players to compare their stat bars.</p>
        </div>
      </section>

      <section className="compare-row" aria-label="Comparison cards">
        {cards.map(function (c: CompareCard, idx: number): any {
          var p: Player | null = c.playerId && playerById[c.playerId] ? playerById[c.playerId] : null;
          var enterClass: string = justAddedSlotId === c.slotId ? " card-enter" : "";
          return (
            <section className={"card panel compare-card" + enterClass} key={"slot-" + c.slotId}>
              <div className="slot-header">
                <div className="slot-title">Player {idx + 1}</div>
              </div>

              {!p ? null : (
                <>
                  <div className="player-top">
                    <div>
                      <div className="player-name">{p.name}</div>
                      <div className="player-sub">
                        {p.team} • {p.position}
                      </div>
                    </div>
                    <span className="team-pill" title={p.team}>
                      <span
                        className="team-dot"
                        style={{ background: p.teamColor, boxShadow: "0 0 12px " + p.teamGlow }}
                      ></span>
                      {p.team}
                    </span>
                  </div>

                  <div className="stat-list">
                    {STAT_KEYS.map(function (key: StatKey): any {
                      var max: number = calcMax(players, key);
                      var n: number = parseStat(key, p.stats[key]);
                      var pct: number = Math.round((n / max) * 100);
                      return (
                        <div className="stat-row" key={key}>
                          <div className="stat-label">{statLabel(key)}</div>
                          <div className="progress" aria-label={statLabel(key) + " progress bar"}>
                            <div className="progress-bar" style={{ width: pct + "%" }}></div>
                          </div>
                          <div className="stat-value">{formatStat(key, p.stats[key])}</div>
                        </div>
                      );
                    })}
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

