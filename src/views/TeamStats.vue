<script setup>
import TeamStatsTable from '@/components/TeamStatsTable.vue';
import { useGameStore } from '@/stores/game';
import { usePlayerStore } from '@/stores/player';
import { useTeamStore } from '@/stores/team';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const playerStore = usePlayerStore()
const teamStore = useTeamStore()
const gameStore = useGameStore()
const router = useRouter()

const editingGameId = ref(null)
const editingGameName = ref('')

// 添加新比赛
const addNewGame = async () => {
  try {
    const gameData = {
      name: `比赛 ${gameStore.games.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      team_stats: {},
      player_stats: []
    }
    const gameId = await gameStore.addGame(gameData)
    router.push(`/game/${gameId}`)
  } catch (error) {
    console.error('Error creating new game:', error)
    alert('创建新比赛失败，请重试')
  }
}

// 确保数据加载
onMounted(async () => {
  try {
    await Promise.all([
      playerStore.fetchPlayers(),
      gameStore.fetchGames()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})

// 获取团队比赛数据
const teamGameStats = computed(() => {
  return gameStore.games.map(game => {
    // 解构响应式对象
    const rawGame = {
      id: game.id,
      name: game.name,
      date: game.date,
      team_stats: game.team_stats ? { ...game.team_stats } : {},
      player_stats: game.player_stats ? [...game.player_stats] : []
    }

    console.log('Processing game raw data:', rawGame)

    let stats = rawGame.team_stats
    const playerStats = rawGame.player_stats

    // 如果team_stats为空，从player_stats计算
    if (Object.keys(stats).length === 0 && playerStats.length > 0) {
      stats = playerStats.reduce((acc, player) => {
        ['MIN', 'FGM', 'FGA', 'threePM', 'threePA', 'FTM', 'FTA',
          'OREB', 'DREB', 'AST', 'TOV', 'STL', 'BLK', 'PF'].forEach(key => {
            acc[key] = (acc[key] || 0) + (Number(player[key]) || 0)
          })
        return acc
      }, {})
      stats.GR = '-'
      stats.GT = '-'
    }

    // 计算得分
    const pts = ((Number(stats.FGM) || 0) * 2) +
      ((Number(stats.threePM) || 0) * 3) +
      (Number(stats.FTM) || 0)

    return {
      id: rawGame.id,
      name: rawGame.name,
      date: rawGame.date,
      GR: stats.GR || '-',
      GT: stats.GT || '-',
      FGM: Number(stats.FGM) || 0,
      FGA: Number(stats.FGA) || 0,
      threePM: Number(stats.threePM) || 0,
      threePA: Number(stats.threePA) || 0,
      FTM: Number(stats.FTM) || 0,
      FTA: Number(stats.FTA) || 0,
      OREB: Number(stats.OREB) || 0,
      DREB: Number(stats.DREB) || 0,
      AST: Number(stats.AST) || 0,
      STL: Number(stats.STL) || 0,
      BLK: Number(stats.BLK) || 0,
      TOV: Number(stats.TOV) || 0,
      PF: Number(stats.PF) || 0,
      PTS: pts
    }
  })
})

// 获取团队平均数据
const teamAverageStats = computed(() => {
  const games = teamGameStats.value
  if (!games.length) return null

  const totalGames = games.length
  const totals = games.reduce((acc, game) => {
    Object.keys(game).forEach(key => {
      if (typeof game[key] === 'number') {
        acc[key] = (acc[key] || 0) + game[key]
      }
    })
    return acc
  }, {})

  const averages = {}
  Object.keys(totals).forEach(key => {
    if (key === 'id') return // 跳过id字段
    averages[key] = totals[key] / totalGames
  })

  return averages
})

// 开始编辑比赛名称
const startEditGameName = (game) => {
  editingGameId.value = game.id
  editingGameName.value = game.name
}

// 保存比赛名称
const saveGameName = () => {
  if (editingGameId.value && editingGameName.value.trim()) {
    gameStore.updateGame(editingGameId.value, {
      name: editingGameName.value.trim()
    })
    editingGameId.value = null
    editingGameName.value = ''
  }
}

// 取消编辑
const cancelEdit = () => {
  editingGameId.value = null
  editingGameName.value = ''
}

// 计算命中率
const calculatePercentage = (made, attempted) => {
  if (!attempted) return 'N/A'
  return ((made / attempted) * 100).toFixed(1) + '%'
}
</script>

<template>
  <div class="container mx-auto">
    <div class="flex flex-col gap-6">
      <!-- 标题和添加按钮 -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold mb-2">球队数据统计</h1>
          <p class="text-gray-600">共计 {{ teamGameStats.length }} 场比赛</p>
        </div>
        <button @click="addNewGame" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          添加新比赛
        </button>
      </div>

      <!-- 平均数据卡片 -->
      <div v-if="teamAverageStats" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">球队场均数据</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card">
            <div class="text-gray-600">场均得分</div>
            <div class="text-2xl font-bold">{{ teamAverageStats.PTS?.toFixed(1) || '0.0' }}</div>
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
              {{ ((teamAverageStats.OREB || 0) + (teamAverageStats.DREB || 0)).toFixed(1) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均助攻</div>
            <div class="text-2xl font-bold">{{ teamAverageStats.AST?.toFixed(1) || '0.0' }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均抢断</div>
            <div class="text-2xl font-bold">{{ teamAverageStats.STL?.toFixed(1) || '0.0' }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均盖帽</div>
            <div class="text-2xl font-bold">{{ teamAverageStats.BLK?.toFixed(1) || '0.0' }}</div>
          </div>
        </div>
      </div>

      <!-- 比赛数据表格 -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <h2 class="text-xl font-semibold p-4 border-b">比赛详细数据</h2>
        <div class="overflow-x-auto">
          <TeamStatsTable :stats="teamGameStats" :editing-game-id="editingGameId" :editing-game-name="editingGameName"
            @start-edit="startEditGameName" @save-edit="saveGameName" @cancel-edit="cancelEdit"
            @update:editing-game-name="editingGameName = $event" />
        </div>
      </div>
    </div>
  </div>
</template>
