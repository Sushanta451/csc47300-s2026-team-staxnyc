interface StatChange {
  text: string;
  down?: boolean;
}

interface Game {
  date: string;
  opp: string;
  pts: number;
  reb: number;
  ast: number;
  result: string;
}

interface ContextItem {
  title: string;
  sub: string;
  value: string;
}

interface Prediction {
  points: number | null;
  range: string;
  confidence: number;
}

interface Player {
  id: string;
  name: string;
  conference: string;
  image: string;
  team: string;
  teamColor: string;
  teamGlow: string;
  position: string;
  age: number;
  height: string;
  weight: string;
  number: number;
  tags: string[];
  stats: { ppg: string; rpg: string; apg: string; fgp: string };
  statChanges: { [key: string]: string | StatChange };
  chartPoints: number[];
  avgPoints: number;
  games: Game[];
  context: ContextItem[];
  prediction: Prediction;
}

var container: HTMLElement = document.getElementById("player-content") as HTMLElement;
var params: URLSearchParams = new URLSearchParams(window.location.search);
var playerId: string | null = params.get("id");

if (!playerId) {
  container.innerHTML = '<p style="color:var(--muted);padding:4rem 0;text-align:center;">No player specified.</p>';
} else {
  fetch("data/players.json")
    .then(function (res: Response): Promise<Player[]> { return res.json(); })
    .then(function (players: Player[]): void {
      var player: Player | undefined = players.find(function (p: Player): boolean { return p.id === playerId; });

      if (!player) {
        container.innerHTML = '<p style="color:var(--muted);padding:4rem 0;text-align:center;">Player not found.</p>';
        return;
      }

      document.title = player.name + " | Player Profile | NBA Predictor";
      renderPlayer(player);
    })
    .catch(function (): void {
      container.innerHTML = '<p style="color:var(--danger);padding:4rem 0;text-align:center;">Failed to load player data.</p>';
    });
}

function renderPlayer(p: Player): void {
  var maxPts: number = Math.max.apply(null, p.chartPoints);

  function getStatChangeHTML(key: string): string {
    var change: string | StatChange = p.statChanges[key];
    if (typeof change === "object") {
      var downClass: string = change.down ? " down" : "";
      return '<p class="stat-change' + downClass + '">' + change.text + '</p>';
    }
    return '<p class="stat-change">' + change + '</p>';
  }

  var barsHTML: string = "";
  for (var i: number = 0; i < p.chartPoints.length; i++) {
    var pts: number = p.chartPoints[i];
    var pct: number = Math.round((pts / maxPts) * 100);
    barsHTML += '<div class="bar-wrap">' +
      '<div class="bar" style="height: ' + pct + '%;"></div>' +
      '<div class="bar-value">' + pts + '</div>' +
      '<div class="bar-label">G' + (i + 1) + '</div>' +
      '</div>';
  }

  var rowsHTML: string = "";
  for (var i: number = 0; i < p.games.length; i++) {
    var g: Game = p.games[i];
    var resultClass: string = g.result === "W" ? "result-win" : "result-loss";
    rowsHTML += '<tr>' +
      '<td>' + g.date + '</td>' +
      '<td>' + g.opp + '</td>' +
      '<td>' + g.pts + '</td>' +
      '<td>' + g.reb + '</td>' +
      '<td>' + g.ast + '</td>' +
      '<td class="' + resultClass + '">' + g.result + '</td>' +
      '</tr>';
  }

  var tagsHTML: string = "";
  for (var i: number = 0; i < p.tags.length; i++) {
    tagsHTML += '<span class="tag">' + p.tags[i] + '</span>';
  }

  var contextHTML: string = "";
  for (var i: number = 0; i < p.context.length; i++) {
    var c: ContextItem = p.context[i];
    contextHTML += '<div class="matchup-item">' +
      '<div><p class="matchup-title">' + c.title + '</p><p class="matchup-sub">' + c.sub + '</p></div>' +
      '<span class="pill">' + c.value + '</span></div>';
  }

  var predNumberHTML: string = "";
  if (p.prediction.points !== null) {
    predNumberHTML = '<p class="prediction-number">' + p.prediction.points + '</p>';
  }

  container.innerHTML =
    '<section class="page-header">' +
      '<p class="breadcrumb">Players / ' + p.conference + ' Conference / <span>' + p.name + '</span></p>' +
    '</section>' +

    '<section class="profile-layout">' +
      '<article class="card player-hero">' +
        '<div class="hero-top"></div>' +
        '<div class="hero-body">' +
          '<div class="player-main">' +
            '<div class="player-avatar">' +
              '<img src="' + p.image + '" alt="' + p.name + ' profile picture" />' +
            '</div>' +
            '<div class="player-info">' +
              '<div class="player-name-row">' +
                '<h1 class="player-name">' + p.name + '</h1>' +
                '<span class="team-pill">' +
                  '<span class="team-dot" style="background: ' + p.teamColor + '; box-shadow: 0 0 12px ' + p.teamGlow + ';"></span>' +
                  p.team +
                '</span>' +
              '</div>' +
              '<div class="player-meta">' +
                '<span>' + p.position + '</span>' +
                '<span>Age ' + p.age + '</span>' +
                '<span>' + p.height + ' • ' + p.weight + '</span>' +
                '<span>#' + p.number + '</span>' +
              '</div>' +
              '<div class="player-tags">' +
                tagsHTML +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="stats-grid">' +
            '<div class="stat-box"><p class="stat-label">PPG</p><p class="stat-value">' + p.stats.ppg + '</p>' + getStatChangeHTML("ppg") + '</div>' +
            '<div class="stat-box"><p class="stat-label">RPG</p><p class="stat-value">' + p.stats.rpg + '</p>' + getStatChangeHTML("rpg") + '</div>' +
            '<div class="stat-box"><p class="stat-label">APG</p><p class="stat-value">' + p.stats.apg + '</p>' + getStatChangeHTML("apg") + '</div>' +
            '<div class="stat-box"><p class="stat-label">FG%</p><p class="stat-value">' + p.stats.fgp + '</p>' + getStatChangeHTML("fgp") + '</div>' +
          '</div>' +
        '</div>' +
      '</article>' +

      '<aside class="side-stack">' +
        '<section class="card panel prediction-card">' +
          '<h3>Next Game Prediction</h3>' +
          '<p class="prediction-sub">Projected points for next game</p>' +
          predNumberHTML +
          '<p class="prediction-sub">Range: ' + p.prediction.range + ' points</p>' +
          '<div class="confidence-row">' +
            '<div class="confidence-label"><span>Model Confidence</span><span>' + p.prediction.confidence + '%</span></div>' +
            '<div class="progress" aria-label="Model confidence progress bar">' +
              '<div class="progress-bar" style="width: ' + p.prediction.confidence + '%;"></div>' +
            '</div>' +
          '</div>' +
        '</section>' +

        '<section class="card panel">' +
          '<h3>Game Context</h3>' +
          '<div class="matchup-list">' +
            contextHTML +
          '</div>' +
        '</section>' +
      '</aside>' +
    '</section>' +

    '<section class="lower-grid">' +
      '<article class="card section-card">' +
        '<div class="section-header">' +
          '<div><h2 class="section-title">Recent Points Trend</h2><p class="section-note">Last 10 games (mock data for design preview)</p></div>' +
          '<span class="pill">Avg ' + p.avgPoints + '</span>' +
        '</div>' +
        '<div class="chart" aria-label="Recent points trend chart">' +
          barsHTML +
        '</div>' +
      '</article>' +

      '<article class="card section-card">' +
        '<div class="section-header">' +
          '<div><h2 class="section-title">Recent Games</h2><p class="section-note">Last 5 games</p></div>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<table aria-label="Recent games table">' +
            '<thead><tr><th>Date</th><th>Opp</th><th>PTS</th><th>REB</th><th>AST</th><th>Result</th></tr></thead>' +
            '<tbody>' +
              rowsHTML +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</article>' +
    '</section>' +

    '<footer class="footer">' +
      p.name + ' Player Prediction Page' +
    '</footer>';
}
