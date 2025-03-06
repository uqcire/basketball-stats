import { defineStore } from 'pinia'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    players: []
  }),

  actions: {
    async fetchPlayers() {
      // 模拟从后端获取数据
      // 实际项目中这里应该是一个 API 调用
      this.players = [
        {
          id: 1,
          name: '张三',
          number: '23',
          position: 'SF',
          height: '198cm',
          weight: '88kg',
          birthdate: '2000-01-01',
          stats: []
        }
      ]
    },

    addPlayer(playerData) {
      const newPlayer = {
        id: Date.now(),
        stats: [],
        ...playerData
      }
      this.players.push(newPlayer)
      return newPlayer.id
    },

    updatePlayer(playerId, playerData) {
      const index = this.players.findIndex(p => p.id === playerId)
      if (index !== -1) {
        this.players[index] = { ...this.players[index], ...playerData }
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
