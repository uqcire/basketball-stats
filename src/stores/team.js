import { defineStore } from 'pinia'

export const useStatsStore = defineStore('stats', {
  state: () => ({
    records: [ {
      GAME: "Camberwell Dragons U12.3 VS Broadmeadows U12.2",
      GR: "Loss",
      GT: "Grading",
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
    },
   ]
  }),
  actions: {
    addRecord(record) {
      this.records.push(record)
    },
    removeRecord(index) {
      this.records.splice(index, 1)
    }
  },
  getters: {
    totalGP: (state) => state.records.length,
    // 其他总统计计算...
  }
})
