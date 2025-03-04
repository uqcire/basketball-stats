import { defineStore } from 'pinia'

export const usePlayersStore = defineStore('players', {
  state: () => ({
    players: [
      {
        id: 1,
        name: "Hao",
        stats: [
          {
            MIN: 36,
            FGM: 8,
            FGA: 15,
            threePM: 2,
            threePA: 5,
            FTM: 4,
            FTA: 4,
            OREB: 2,
            DREB: 7,
            AST: 9,
            TOV: 2,
            STL: 3,
            BLK: 1,
            PF: 1
          }
        ]
      },
      {
        id: 2,
        name: "Jeremy",
        stats: [
          {
            MIN: 20,
            FGM: 2,
            FGA: 12,
            threePM: 3,
            threePA: 4,
            FTM: 5,
            FTA: 8,
            OREB: 1,
            DREB: 1,
            AST: 2,
            TOV: 4,
            STL: 1,
            BLK: 0,
            PF: 2
          }
        ]
      }
    ]
  }),
  actions: {
    addPlayer(player) {
      this.players.push({
        id: Date.now(),
        ...player,
        stats: []
      })
    },
    addGameRecord(playerId, record) {
      const player = this.players.find(p => p.id === playerId)
      player?.stats.push(record)
    },
    async fetchPlayers() {
      // 如果已经有数据，就不需要重新获取
      if (this.players.length > 0) return

      // 这里可以添加从后端API获取数据的逻辑
      // 目前使用模拟数据
      this.players = [
        {
          id: 1,
          name: "Hao",
          stats: [
            {
              MIN: 36,
              FGM: 8,
              FGA: 15,
              threePM: 2,
              threePA: 5,
              FTM: 4,
              FTA: 4,
              OREB: 2,
              DREB: 7,
              AST: 9,
              TOV: 2,
              STL: 3,
              BLK: 1,
              PF: 1
            }
          ]
        },
        {
          id: 2,
          name: "Jeremy",
          stats: [
            {
              MIN: 20,
              FGM: 2,
              FGA: 12,
              threePM: 3,
              threePA: 4,
              FTM: 5,
              FTA: 8,
              OREB: 1,
              DREB: 1,
              AST: 2,
              TOV: 4,
              STL: 1,
              BLK: 0,
              PF: 2
            }
          ]
        }
      ]
    }
  },
  getters: {
    averageStats: (state) => (playerId) => {
      const player = state.players.find(p => p.id === playerId)
      if (!player || !player.stats.length) return null

      const totalGames = player.stats.length
      return Object.keys(player.stats[0]).reduce((acc, key) => {
        acc[key] = Number(
          (player.stats.reduce((sum, stat) => sum + stat[key], 0) / totalGames)
            .toFixed(1) // 保留1位小数
        )
        return acc
      }, {})
    }
  }
})
