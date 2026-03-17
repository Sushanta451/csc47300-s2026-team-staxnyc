const form = document.getElementById("player-search-form");
const input = document.getElementById("player-search-input");
const message = document.getElementById("search-message");
const suggestions = document.getElementById("suggestions");

function showSuggestions(value) {
  suggestions.innerHTML = "";

  const query = value.trim().toLowerCase();

  if (!query) return;

  const matches = players.filter(player =>
    player.name.toLowerCase().includes(query)
  );

  matches.forEach(player => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = player.name;

    item.addEventListener("click", function () {
      input.value = player.name;
      suggestions.innerHTML = "";
      message.textContent = "";
    });

    suggestions.appendChild(item);
  });
}

input.addEventListener("input", function () {
  message.textContent = "";
  showSuggestions(input.value);
});

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const query = input.value.trim().toLowerCase();

  const foundPlayer = players.find(
    player => player.name.toLowerCase() === query
  );

  if (foundPlayer) {
    window.location.href = foundPlayer.page;
  } else {
    message.textContent = "Player not found. Try selecting a suggested player.";
    suggestions.innerHTML = "";
  }
});

document.addEventListener("click", function (e) {
  if (!form.contains(e.target)) {
    suggestions.innerHTML = "";
  }
});
