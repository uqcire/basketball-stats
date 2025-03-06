import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    games: []
  }),

  actions: {
    async fetchGames() {
      // 模拟从后端获取数据
      // 实际项目中这里应该是一个 API 调用
      this.games = [
        {
          id: 1,
          name: '测试比赛 1',
          date: '2024-03-20',
          teamStats: {
            PTS: 89,
            FGM: 32,
            FGA: 70,
            threePM: 8,
            threePA: 22,
            FTM: 17,
            FTA: 25,
            OREB: 12,
            DREB: 28,
            AST: 15,
            STL: 8,
            BLK: 4,
            TOV: 13
          },
          playerStats: []
        },
        {
          id: 2,
          name: '测试比赛 2',
          date: '2024-03-22',
          teamStats: {
            PTS: 95,
            FGM: 35,
            FGA: 75,
            threePM: 10,
            threePA: 26,
            FTM: 15,
            FTA: 20,
            OREB: 10,
            DREB: 30,
            AST: 18,
            STL: 6,
            BLK: 5,
            TOV: 11
          },
          playerStats: []
        }
      ]
    },

    addGame(gameData) {
      const newGame = {
        id: Date.now(),
        teamStats: {},
        playerStats: [],
        ...gameData
      }
      this.games.push(newGame)
      return newGame.id
    },

    updateGame(gameId, gameData) {
      const index = this.games.findIndex(g => g.id === gameId)
      if (index !== -1) {
        this.games[index] = { ...this.games[index], ...gameData }
      }
    },

    updateGameStats(gameId, playerStats) {
      const game = this.games.find(g => g.id === gameId)
      if (game) {
        game.playerStats = playerStats

        // 计算球队统计数据
        game.teamStats = playerStats.reduce((team, player) => {
          Object.keys(player).forEach(key => {
            if (typeof player[key] === 'number') {
              team[key] = (team[key] || 0) + player[key]
            }
          })
          return team
        }, {})
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
        teamStats: game.teamStats,
        playerStats: game.playerStats
      } : null
    }
  }
})
