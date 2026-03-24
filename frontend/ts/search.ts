interface SearchPlayer {
  name: string;
  page: string;
}

var form: HTMLFormElement = document.getElementById("player-search-form") as HTMLFormElement;
var input: HTMLInputElement = document.getElementById("player-search-input") as HTMLInputElement;
var message: HTMLElement = document.getElementById("search-message") as HTMLElement;
var suggestions: HTMLElement = document.getElementById("suggestions") as HTMLElement;

var players: SearchPlayer[] = [];

fetch("data/players.json")
  .then(function (res: Response): Promise<any[]> { return res.json(); })
  .then(function (data: any[]): void {
    for (var i: number = 0; i < data.length; i++) {
      players.push({
        name: data[i].name,
        page: "player.html?id=" + data[i].id
      });
    }
  });

function showSuggestions(value: string): void {
  suggestions.innerHTML = "";

  var query: string = value.trim().toLowerCase();
  if (!query) return;

  var matches: SearchPlayer[] = [];
  for (var i: number = 0; i < players.length; i++) {
    if (players[i].name.toLowerCase().indexOf(query) !== -1) {
      matches.push(players[i]);
    }
  }

  matches.sort(function (a: SearchPlayer, b: SearchPlayer): number {
    var aName: string = a.name.toLowerCase();
    var bName: string = b.name.toLowerCase();
    var aStartsWith: boolean = aName.indexOf(query) === 0;
    var bStartsWith: boolean = bName.indexOf(query) === 0;
    var aFirstName: boolean = aName.split(" ")[0].indexOf(query) === 0;
    var bFirstName: boolean = bName.split(" ")[0].indexOf(query) === 0;

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    if (aFirstName && !bFirstName) return -1;
    if (!aFirstName && bFirstName) return 1;
    return aName.indexOf(query) - bName.indexOf(query);
  });

  for (var i: number = 0; i < matches.length; i++) {
    var item: HTMLDivElement = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = matches[i].name;

    item.addEventListener("click", (function (player: SearchPlayer): () => void {
      return function (): void {
        suggestions.innerHTML = "";
        message.textContent = "";
        window.location.href = player.page;
      };
    })(matches[i]));

    suggestions.appendChild(item);
  }
}

input.addEventListener("input", function (): void {
  message.textContent = "";
  showSuggestions(input.value);
});

form.addEventListener("submit", function (e: Event): void {
  e.preventDefault();

  var query: string = input.value.trim().toLowerCase();

  var foundPlayer: SearchPlayer | null = null;
  for (var i: number = 0; i < players.length; i++) {
    if (players[i].name.toLowerCase() === query) {
      foundPlayer = players[i];
      break;
    }
  }

  if (foundPlayer) {
    window.location.href = foundPlayer.page;
  } else {
    message.textContent = "Player not found. Try selecting a suggested player.";
    suggestions.innerHTML = "";
  }
});

document.addEventListener("click", function (e: Event): void {
  if (!form.contains(e.target as Node)) {
    suggestions.innerHTML = "";
  }
});
