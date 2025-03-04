<script setup>
import TeamStatsTable from '@/components/TeamStatsTable.vue';
import { usePlayersStore } from '@/stores/players';
import { computed, onMounted } from 'vue';

const store = usePlayersStore()

// 确保数据加载
onMounted(async () => {
  if (store.players.length === 0) {
    await store.fetchPlayers()
  }
})

// 计算每场比赛的团队数据
const teamGameStats = computed(() => {
  const gameMap = new Map() // 用于存储每场比赛的数据

  // 遍历所有球员的比赛数据
  store.players.forEach(player => {
    player.stats.forEach((stat, index) => {
      const gameKey = stat.GAME || \`Game \${index + 1}\`
      if (!gameMap.has(gameKey)) {
        // 初始化该场比赛的数据
        gameMap.set(gameKey, {
          GAME: gameKey,
          GR: stat.GR || '-',
          GT: stat.GT || '-',
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
          PF: 0,
          playerCount: 0 // 记录参与该场比赛的球员数
        })
      }

      // 累加该场比赛的数据
      const gameStats = gameMap.get(gameKey)
      Object.keys(stat).forEach(key => {
        if (key !== 'GAME' && key !== 'GR' && key !== 'GT') {
          gameStats[key] = (gameStats[key] || 0) + (stat[key] || 0)
        }
      })
      gameStats.playerCount++
    })
  })

  return Array.from(gameMap.values())
})

// 计算团队平均数据
const teamAverageStats = computed(() => {
  if (teamGameStats.value.length === 0) return null

  const totalGames = teamGameStats.value.length
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
    PF: 0,
    PTS: 0
  }

  // 计算总和
  teamGameStats.value.forEach(game => {
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

  // 计算场均得分
  averageStats.PTS = (averageStats.FGM * 2) + (averageStats.threePM * 3) + averageStats.FTM

  return averageStats
})

// 计算命中率
const calculatePercentage = (made, attempted) => {
  if (!attempted) return 'N/A'
  return ((made / attempted) * 100).toFixed(1) + '%'
}
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-col gap-6">
      <!-- 标题 -->
      <div>
        <h1 class="text-3xl font-bold mb-2">球队数据统计</h1>
        <p class="text-gray-600">共计 {{ teamGameStats.length }} 场比赛</p>
      </div>

      <!-- 平均数据卡片 -->
      <div v-if="teamAverageStats" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">球队场均数据</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card">
            <div class="text-gray-600">场均得分</div>
            <div class="text-2xl font-bold">{{ teamAverageStats.PTS.toFixed(1) }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">投篮命中率</div>
            <div class="text-2xl font-bold">
              {{ calculatePercentage(teamAverageStats.FGM, teamAverageStats.FGA) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">三分命中率</div>
            <div class="text-2xl font-bold">
              {{ calculatePercentage(teamAverageStats.threePM, teamAverageStats.threePA) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">罚球命中率</div>
            <div class="text-2xl font-bold">
              {{ calculatePercentage(teamAverageStats.FTM, teamAverageStats.FTA) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均篮板</div>
            <div class="text-2xl font-bold">
              {{ (teamAverageStats.OREB + teamAverageStats.DREB).toFixed(1) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均助攻</div>
            <div class="text-2xl font-bold">{{ teamAverageStats.AST.toFixed(1) }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均抢断</div>
            <div class="text-2xl font-bold">{{ teamAverageStats.STL.toFixed(1) }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均盖帽</div>
            <div class="text-2xl font-bold">{{ teamAverageStats.BLK.toFixed(1) }}</div>
          </div>
        </div>
      </div>

      <!-- 比赛数据表格 -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <h2 class="text-xl font-semibold p-4 border-b">比赛详细数据</h2>
        <div class="overflow-x-auto">
          <TeamStatsTable :stats="teamGameStats" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  @apply p-4 bg-gray-50 rounded-lg;
}
</style>
