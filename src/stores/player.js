import { supabase } from '@/lib/supabase'
import { defineStore } from 'pinia'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    players: []
  }),

  actions: {
    async fetchPlayers() {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('name')

        if (error) throw error
        this.players = data || []
      } catch (error) {
        console.error('Error fetching players:', error)
      }
    },

    async addPlayer(playerData) {
      try {
        const { data, error } = await supabase
          .from('players')
          .insert([{
            name: playerData.name,
            number: playerData.number,
            position: playerData.position,
            height: playerData.height,
            weight: playerData.weight
          }])
          .select()
          .single()

        if (error) throw error
        this.players.push(data)
        return data.id
      } catch (error) {
        console.error('Error adding player:', error)
        throw error
      }
    },

    async updatePlayer(playerId, playerData) {
      try {
        const { data, error } = await supabase
          .from('players')
          .update({
            name: playerData.name,
            number: playerData.number,
            position: playerData.position,
            height: playerData.height,
            weight: playerData.weight
          })
          .eq('id', playerId)
          .select()
          .single()

        if (error) throw error
        const index = this.players.findIndex(p => p.id === playerId)
        if (index !== -1) {
          this.players[index] = data
        }
      } catch (error) {
        console.error('Error updating player:', error)
        throw error
      }
    },

    updatePlayerStats(playerId, gameId, stats) {
      const player = this.players.find(p => p.id === playerId)
      if (player) {
        const gameIndex = player.stats.findIndex(s => s.gameId === gameId)
        if (gameIndex !== -1) {
          player.stats[gameIndex] = { ...player.stats[gameIndex], ...stats }
        } else {
          player.stats.push({ gameId, ...stats })
        }
      }
    }
  },

  getters: {
    getPlayerById: (state) => (id) => {
      return state.players.find(player => player.id === id)
    },

    getAllPlayers: (state) => {
      return state.players
    },

    // 获取球员所有比赛数据
    getPlayerStats: (state) => (playerId) => {
      const player = state.players.find(p => p.id === playerId)
      return player ? player.stats : []
    },

    // 计算球员平均数据
    getPlayerAverageStats: (state) => (playerId) => {
      const player = state.players.find(p => p.id === playerId)
      if (!player || !player.stats.length) return null

      const totalGames = player.stats.length
      const averageStats = {
        gamesPlayed: totalGames,
        MIN: 0,
        FGM: 0,
        FGA: 0,
        threePM: 0,
        threePA: 0,
        FTM: 0,
        FTA: 0,
        OREB: 0,
        DREB: 0,
        AST: 0,
        TOV: 0,
        STL: 0,
        BLK: 0,
        PF: 0
      }

      // 计算总和
      player.stats.forEach(game => {
        Object.keys(averageStats).forEach(key => {
          if (key !== 'gamesPlayed' && game[key]) {
            averageStats[key] += game[key]
          }
        })
      })

      // 计算平均值
      Object.keys(averageStats).forEach(key => {
        if (key !== 'gamesPlayed') {
          averageStats[key] = Number((averageStats[key] / totalGames).toFixed(1))
        }
      })

      return averageStats
    }
  }
})
