// Grab the search form elements
var form = document.getElementById("player-search-form");
var input = document.getElementById("player-search-input");
var message = document.getElementById("search-message");
var suggestions = document.getElementById("suggestions");

// Load player names from JSON so search knows who exists
var players = [];

fetch("data/players.json")
  .then(function (res) { return res.json(); })
  .then(function (data) {
    for (var i = 0; i < data.length; i++) {
      players.push({
        name: data[i].name,
        page: "player.html?id=" + data[i].id
      });
    }
  });

// Show matching player names as the user types
function showSuggestions(value) {
  suggestions.innerHTML = "";

  var query = value.trim().toLowerCase();
  if (!query) return;

  // Filter players that match the search text
  var matches = [];
  for (var i = 0; i < players.length; i++) {
    if (players[i].name.toLowerCase().includes(query)) {
      matches.push(players[i]);
    }
  }

  // Sort so names starting with the query come first
  matches.sort(function (a, b) {
    var aName = a.name.toLowerCase();
    var bName = b.name.toLowerCase();
    var aStartsWith = aName.startsWith(query);
    var bStartsWith = bName.startsWith(query);
    var aFirstName = aName.split(" ")[0].startsWith(query);
    var bFirstName = bName.split(" ")[0].startsWith(query);

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    if (aFirstName && !bFirstName) return -1;
    if (!aFirstName && bFirstName) return 1;
    return aName.indexOf(query) - bName.indexOf(query);
  });

  // Create a clickable suggestion for each match
  for (var i = 0; i < matches.length; i++) {
    var item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = matches[i].name;

    // Use a closure so each click goes to the right player
    item.addEventListener("click", (function (player) {
      return function () {
        suggestions.innerHTML = "";
        message.textContent = "";
        window.location.href = player.page;
      };
    })(matches[i]));

    suggestions.appendChild(item);
  }
}

// Update suggestions as user types
input.addEventListener("input", function () {
  message.textContent = "";
  showSuggestions(input.value);
});

// Handle search form submit
form.addEventListener("submit", function (e) {
  e.preventDefault();

  var query = input.value.trim().toLowerCase();

  // Look for an exact name match
  var foundPlayer = null;
  for (var i = 0; i < players.length; i++) {
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

// Close suggestions when clicking outside the search form
document.addEventListener("click", function (e) {
  if (!form.contains(e.target)) {
    suggestions.innerHTML = "";
  }
});
