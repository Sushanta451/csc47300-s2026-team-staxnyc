declare const React: any;
declare const ReactDOM: any;

type ConferenceFilter = "All" | "East" | "West";

interface StandingRow {
  rank: number;
  conference: "East" | "West";
  team: string;
  wins: number;
  losses: number;
  pct: number;
  gb: number;
  streak: string;
  last10: string;
}

function formatPct(pct: number): string {
  return pct.toFixed(3);
}

function formatGb(gb: number): string {
  return gb === 0 ? "—" : gb.toString();
}

const StandingsApp = (): any => {
  const { useEffect, useState } = React;

  const [rows, setRows] = useState(null as StandingRow[] | null);
  const [error, setError] = useState(null as string | null);
  const [filter, setFilter] = useState("All" as ConferenceFilter);

  useEffect(() => {
    fetch("data/standings.json")
      .then((res: Response) => res.json())
      .then((data: StandingRow[]) => {
        setRows(data || []);
      })
      .catch(() => {
        setError("Failed to load standings data.");
      });
  }, []);

  const filtered = React.useMemo(() => {
    if (!rows) return [];
    let list = rows;
    if (filter !== "All") {
      list = list.filter((r: StandingRow) => r.conference === filter);
    }
    return list
      .slice()
      .sort((a: StandingRow, b: StandingRow) => {
        if (a.conference !== b.conference) return a.conference < b.conference ? -1 : 1;
        if (a.rank !== b.rank) return a.rank - b.rank;
        return b.pct - a.pct;
      });
  }, [rows, filter]);

  const renderBody = (): any => {
    if (error) {
      return (
        <tr>
          <td colSpan={8} style={{ color: "var(--danger)", padding: "1.2rem 0.9rem" }}>
            {error}
          </td>
        </tr>
      );
    }

    if (!rows) {
      return (
        <tr>
          <td colSpan={8} style={{ color: "var(--muted)", padding: "1.2rem 0.9rem" }}>
            Loading standings…
          </td>
        </tr>
      );
    }

    if (!filtered.length) {
      return (
        <tr>
          <td colSpan={8} style={{ color: "var(--muted)", padding: "1.2rem 0.9rem" }}>
            No standings found for this filter.
          </td>
        </tr>
      );
    }

    return (
      <>
        {filtered.map((r: StandingRow) => (
          <tr key={r.conference + "-" + r.rank}>
            <td>{r.rank}</td>
            <td>
              {r.team} <span className="muted">• {r.conference}</span>
            </td>
            <td>{r.wins}</td>
            <td>{r.losses}</td>
            <td>{formatPct(r.pct)}</td>
            <td>{formatGb(r.gb)}</td>
            <td>{r.streak}</td>
            <td>{r.last10}</td>
          </tr>
        ))}
      </>
    );
  };

  return (
    <>
      <section className="page-header">
        <p className="breadcrumb">
          League / <span>Team Standings</span>
        </p>
      </section>

      <section className="card panel standings-header">
        <div className="header-left">
          <h1 className="page-title">NBA Team Standings</h1>
          <p className="page-subtitle">Conference standings (mock data for design preview).</p>
        </div>

        <div className="header-right" aria-label="Conference filter">
          {(["All", "East", "West"] as ConferenceFilter[]).map((conf) => (
            <button
              key={conf}
              type="button"
              className={"pill-btn" + (filter === conf ? " active" : "")}
              onClick={(): void => setFilter(conf)}
            >
              {conf}
            </button>
          ))}
        </div>
      </section>

      <section className="card panel">
        <div className="table-wrap">
          <table aria-label="NBA team standings table">
            <thead>
              <tr>
                <th title="Position in the conference standings">Rank</th>
                <th title="NBA franchise">Team</th>
                <th title="Wins">W</th>
                <th title="Losses">L</th>
                <th title="Win percentage (wins divided by games played)">PCT</th>
                <th title="Games behind the first-place team in the conference">GB</th>
                <th title="Current winning (W) or losing (L) streak">Streak</th>
                <th title="Win–loss record over the last 10 games">Last 10</th>
              </tr>
            </thead>
            <tbody>{renderBody()}</tbody>
          </table>
        </div>
      </section>

      <footer className="footer">StaxNYC Predictor • Standings</footer>
    </>
  );
};

const rootEl = document.getElementById("standings-root");
if (rootEl && typeof ReactDOM !== "undefined") {
  // React 18 UMD bundles may not expose createRoot; render keeps it simple.
  ReactDOM.render(<StandingsApp />, rootEl);
}

export {};
