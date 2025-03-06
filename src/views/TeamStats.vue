<script setup>
import TeamStatsTable from '@/components/TeamStatsTable.vue';
import { usePlayerStore } from '@/stores/player';
import { useTeamStore } from '@/stores/team';
import { useGameStore } from '@/stores/game';
import { computed, onMounted, ref } from 'vue';

const playerStore = usePlayerStore()
const teamStore = useTeamStore()
const gameStore = useGameStore()

const editingGameId = ref(null)
const editingGameName = ref('')

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
  return gameStore.games.map(game => ({
    id: game.id,
    name: game.name,
    date: game.date,
    GR: game.GR || '-',
    GT: game.GT || '-',
    ...game.teamStats
  }))
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

  return Object.keys(totals).reduce((acc, key) => {
    acc[key] = totals[key] / totalGames
    return acc
  }, {})
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
