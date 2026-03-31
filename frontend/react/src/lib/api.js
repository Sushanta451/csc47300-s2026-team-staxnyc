import { supabase } from './supabase'

// Get all players from player_stats table
export async function getAllPlayers() {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
  if (error) throw error
  return data
}

// Get one player by player_id
export async function getPlayerById(playerId) {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .single()
  if (error) throw error
  return data
}

// Get recent games for a player from player_games
export async function getPlayerGames(playerId) {
  const { data, error } = await supabase
    .from('player_games')
    .select('*')
    .eq('player_id', playerId)
    .order('game_date', { ascending: false })
    .limit(10)
  if (error) throw error
  return data
}

// Get all live games
export async function getLiveGames() {
  const { data, error } = await supabase
    .from('live_games')
    .select('*')
    .order('game_date', { ascending: false })
  if (error) throw error
  return data
}
