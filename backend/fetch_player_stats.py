"""
Fetches NBA player stats using nba_api and saves them to Supabase.
Run this script to populate the database with player stats.
"""

from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats, playergamelog, commonplayerinfo
from supabase import create_client
import time

# Supabase config
SUPABASE_URL = "https://nmttryunxgqnhtoofafh.supabase.co"
SUPABASE_KEY = "sb_publishable_IhMBGHF66SR30_yiJ6QBFg_zh6jQJof"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Players to fetch stats for (add more names here)
PLAYER_NAMES = [
    # Top stars
    "LeBron James",
    "Stephen Curry",
    "Kevin Durant",
    "Giannis Antetokounmpo",
    "Nikola Jokic",
    "Luka Doncic",
    "Joel Embiid",
    "Jayson Tatum",
    "Jimmy Butler",
    "Anthony Davis",
    # Guards
    "Kyrie Irving",
    "Ja Morant",
    "James Harden",
    "Damian Lillard",
    "Trae Young",
    "Donovan Mitchell",
    "Shai Gilgeous-Alexander",
    "Tyrese Haliburton",
    "De'Aaron Fox",
    "Jalen Brunson",
    # Forwards / Centers
    "Jaylen Brown",
    "Paul George",
    "Kawhi Leonard",
    "Anthony Edwards",
    "Devin Booker",
    "Zion Williamson",
    "Bam Adebayo",
    "Karl-Anthony Towns",
    "Domantas Sabonis",
    "Tyrese Maxey",
    # Rising stars
    "Victor Wembanyama",
    "Chet Holmgren",
    "Paolo Banchero",
    "Scottie Barnes",
    "Evan Mobley",
    "Lauri Markkanen",
    "Franz Wagner",
    "Jalen Williams",
    "Alperen Sengun",
    "Cade Cunningham",
]


def find_player_id(name):
    """Find a player's NBA ID by their full name."""
    all_players = players.get_players()
    for p in all_players:
        if p["full_name"].lower() == name.lower():
            return p["id"]
    return None


def get_season_averages(player_id):
    """Get a player's current season averages."""
    try:
        career = playercareerstats.PlayerCareerStats(player_id=player_id)
        df = career.get_data_frames()[0]

        if df.empty:
            return None

        # Get the most recent season (last row)
        latest = df.iloc[-1]

        games_played = int(latest["GP"])
        if games_played == 0:
            return None

        return {
            "ppg": round(float(latest["PTS"]) / games_played, 1),
            "rpg": round(float(latest["REB"]) / games_played, 1),
            "apg": round(float(latest["AST"]) / games_played, 1),
            "fg_pct": round(float(latest["FG_PCT"]) * 100, 1),
            "mpg": round(float(latest["MIN"]) / games_played, 1),
            "games_played": games_played,
            "season": str(latest["SEASON_ID"]),
        }
    except Exception as e:
        print(f"  Error getting season averages: {e}")
        return None


def get_player_info(player_id):
    """Get basic player info (team, position, height, weight)."""
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        df = info.get_data_frames()[0]

        if df.empty:
            return None

        row = df.iloc[0]
        return {
            "team": str(row.get("TEAM_NAME", "N/A")),
            "position": str(row.get("POSITION", "N/A")),
            "height": str(row.get("HEIGHT", "N/A")),
            "weight": str(row.get("WEIGHT", "N/A")),
            "jersey_number": str(row.get("JERSEY", "N/A")),
        }
    except Exception as e:
        print(f"  Error getting player info: {e}")
        return None


def get_last_5_games(player_id):
    """Get a player's last 5 game stats."""
    try:
        # Try current season first, fall back to previous
        gamelog = playergamelog.PlayerGameLog(player_id=player_id, season="2025-26")
        df = gamelog.get_data_frames()[0]

        if df.empty:
            print("  No 2025-26 games, trying 2024-25...")
            gamelog = playergamelog.PlayerGameLog(player_id=player_id, season="2024-25")
            df = gamelog.get_data_frames()[0]

        if df.empty:
            return []

        # Get last 5 games (already sorted most recent first)
        games = []
        for i in range(min(5, len(df))):
            row = df.iloc[i]
            # Parse matchup to get opponent
            matchup = str(row["MATCHUP"])
            # Matchup format: "LAL vs. BOS" or "LAL @ BOS"
            parts = matchup.split(" ")
            opponent = parts[-1] if len(parts) >= 3 else "N/A"

            # Determine W or L from WL column
            result = str(row.get("WL", "N/A"))

            games.append({
                "player_id": str(player_id),
                "game_date": str(row["GAME_DATE"]),
                "opponent": opponent,
                "pts": int(row["PTS"]),
                "reb": int(row["REB"]),
                "ast": int(row["AST"]),
                "result": result,
            })

        return games
    except Exception as e:
        print(f"  Error getting game log: {e}")
        return []


def save_to_supabase(player_name, player_id, info, stats, games):
    """Save player data to Supabase."""
    # Save player stats
    player_data = {
        "player_id": str(player_id),
        "player_name": player_name,
        "team": info.get("team", "N/A") if info else "N/A",
        "position": info.get("position", "N/A") if info else "N/A",
        "height": info.get("height", "N/A") if info else "N/A",
        "weight": info.get("weight", "N/A") if info else "N/A",
        "jersey_number": info.get("jersey_number", "N/A") if info else "N/A",
        "ppg": stats.get("ppg", 0) if stats else 0,
        "rpg": stats.get("rpg", 0) if stats else 0,
        "apg": stats.get("apg", 0) if stats else 0,
        "fg_pct": stats.get("fg_pct", 0) if stats else 0,
        "mpg": stats.get("mpg", 0) if stats else 0,
        "games_played": stats.get("games_played", 0) if stats else 0,
        "season": stats.get("season", "N/A") if stats else "N/A",
    }

    print(f"  Saving stats to Supabase...")
    supabase.table("player_stats").upsert(player_data, on_conflict="player_id").execute()

    # Save last 5 games
    if games:
        # Delete old games for this player first
        supabase.table("player_games").delete().eq("player_id", str(player_id)).execute()
        # Insert new games
        print(f"  Saving {len(games)} games to Supabase...")
        supabase.table("player_games").insert(games).execute()


def main():
    print("=== NBA Player Stats Fetcher ===\n")

    for name in PLAYER_NAMES:
        print(f"Fetching: {name}")

        # Find player ID
        player_id = find_player_id(name)
        if not player_id:
            print(f"  Player not found: {name}")
            continue

        print(f"  NBA ID: {player_id}")

        # Get player info
        info = get_player_info(player_id)
        if info:
            print(f"  Team: {info['team']} | Position: {info['position']}")

        # Wait a bit to avoid rate limiting
        time.sleep(1)

        # Get season averages
        stats = get_season_averages(player_id)
        if stats:
            print(f"  PPG: {stats['ppg']} | RPG: {stats['rpg']} | APG: {stats['apg']} | FG%: {stats['fg_pct']}")

        time.sleep(1)

        # Get last 5 games
        games = get_last_5_games(player_id)
        if games:
            print(f"  Last {len(games)} games fetched")

        # Save to Supabase
        save_to_supabase(name, player_id, info, stats, games)
        print(f"  Done!\n")

        # Wait between players to avoid rate limiting
        time.sleep(2)

    print("=== All done! ===")


if __name__ == "__main__":
    main()

