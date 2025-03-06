import { supabase } from '@/lib/supabase'
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    games: []
  }),

  actions: {
    async fetchGames() {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error
        this.games = data || []
      } catch (error) {
        console.error('Error fetching games:', error)
      }
    },

    async addGame(gameData) {
      try {
        const { data, error } = await supabase
          .from('games')
          .insert([{
            name: gameData.name,
            date: gameData.date,
            team_stats: gameData.teamStats,
            player_stats: gameData.playerStats || []
          }])
          .select()
          .single()

        if (error) throw error
        this.games.unshift(data)
        return data.id
      } catch (error) {
        console.error('Error adding game:', error)
        throw error
      }
    },

    async updateGame(gameId, gameData) {
      try {
        const { data, error } = await supabase
          .from('games')
          .update({
            name: gameData.name,
            date: gameData.date,
            team_stats: gameData.teamStats,
            player_stats: gameData.playerStats
          })
          .eq('id', gameId)
          .select()
          .single()

        if (error) throw error
        const index = this.games.findIndex(g => g.id === gameId)
        if (index !== -1) {
          this.games[index] = data
        }
      } catch (error) {
        console.error('Error updating game:', error)
        throw error
      }
    },

    async updateGameStats(gameId, playerStats) {
      try {
        // 计算球队统计数据
        const teamStats = playerStats.reduce((team, player) => {
          Object.keys(player).forEach(key => {
            if (typeof player[key] === 'number') {
              team[key] = (team[key] || 0) + player[key]
            }
          })
          return team
        }, {})

        const { data, error } = await supabase
          .from('games')
          .update({
            team_stats: teamStats,
            player_stats: playerStats
          })
          .eq('id', gameId)
          .select()
          .single()

        if (error) throw error
        const index = this.games.findIndex(g => g.id === gameId)
        if (index !== -1) {
          this.games[index] = data
        }
      } catch (error) {
        console.error('Error updating game stats:', error)
        throw error
      }
    }
  },

  getters: {
    getGameById: (state) => (id) => {
      return state.games.find(game => game.id === id)
    },

    getGameStats: (state) => (id) => {
      const game = state.games.find(game => game.id === id)
      return game ? {
        teamStats: game.team_stats,
        playerStats: game.player_stats
      } : null
    }
  }
})
