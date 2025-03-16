<script setup>
import { useGameStore } from '@/stores/game';
import { usePlayerStore } from '@/stores/player';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const gameStore = useGameStore()

const playerId = computed(() => Number(route.params.id))
const player = computed(() => playerStore.players.find(p => p.id === playerId.value))
const playerStats = computed(() => playerStore.getPlayerStats(playerId.value))
const playerAverageStats = computed(() => playerStore.getPlayerAverageStats(playerId.value))

// 编辑状态管理
const isEditing = ref(false)
const editingName = ref('')
const editingNumber = ref('')

// 开始编辑
const startEdit = () => {
  editingName.value = player.value.name
  editingNumber.value = player.value.number
  isEditing.value = true
}

// 保存编辑
const saveEdit = async () => {
  if (!editingName.value.trim()) {
    alert('Please enter a player name')
    return
  }

  try {
    await playerStore.updatePlayer(player.value.id, {
      ...player.value,
      name: editingName.value.trim(),
      number: String(editingNumber.value)
    })
    isEditing.value = false
  } catch (error) {
    console.error('Error updating player:', error)
    alert('Error updating player, please try again')
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editingName.value = ''
  editingNumber.value = ''
}

// 确保数据加载
onMounted(async () => {
  if (playerStore.players.length === 0) {
    await playerStore.fetchPlayers()
  }
})

// 计算命中率
const calculatePercentage = (made, attempted) => {
  if (!attempted) return 'N/A'
  return ((made / attempted) * 100).toFixed(1) + '%'
}

// 计算得分
const calculatePoints = (stat) => {
  return (stat.FGM * 2) + (stat.threePM * 3) + stat.FTM
}

// 返回团队统计页面
const goBack = () => {
  router.push('/players')
}

// 删除球员
const deletePlayer = async () => {
  if (confirm('Are you sure you want to delete this player? This action will also delete all of this player\'s game records and cannot be undone.')) {
    try {
      await playerStore.deletePlayer(player.value.id)
      router.push('/players')
    } catch (error) {
      console.error('Error deleting player:', error)
      alert('Error deleting player, please try again')
    }
  }
}

// 删除比赛记录
const deleteGameRecord = async (gameId) => {
  if (!confirm('Are you sure you want to delete this game record? This action cannot be undone.')) return

  try {
    // 先删除比赛记录
    await gameStore.deleteGame(gameId)

    // 更新球员的统计数据
    const updatedStats = player.value.stats.filter(stat => stat.gameId !== gameId)
    await playerStore.updatePlayer(player.value.id, {
      ...player.value,
      stats: updatedStats
    })

    // 重新获取数据
    await Promise.all([
      gameStore.fetchGames(),
      playerStore.fetchPlayers()
    ])
  } catch (error) {
    console.error('delete game record error:', error)
    alert('delete game record error, please try again')
  }
}

</script>

<template>
  <div v-if="player" class="p-4">
    <div class="flex flex-col gap-4">
      <!-- 返回按钮修正路径 -->
      <div>
        <button @click="goBack" class="btn btn-soft btn-sm">
          ← Players
        </button>
      </div>

      <!-- 球员信息头 -->
      <div class="flex flex-col gap-4 mb-6">
        <div v-if="!isEditing" class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-4xl font-bold text-gray-600">#{{ player.number || '-' }}</span>
            <h1 class="text-4xl font-bold">{{ player.name }}</h1>
          </div>
        </div>
        <div v-else class="flex items-center gap-2">
          <div class="flex gap-2">
            <input v-model.number="editingNumber" type="number" min="0" placeholder="Player number"
              class="px-2 py-1 border rounded w-24" />
            <input v-model="editingName" type="text" placeholder="Player name" class="px-2 py-1 border rounded" />
          </div>
          <div class="flex gap-2">
            <button @click="saveEdit" class="btn btn-primary btn-sm">
              Save
            </button>
            <button @click="cancelEdit" class="btn btn-soft btn-sm">
              Cancel
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="startEdit" class="btn btn-primary btn-sm">
            Edit information
          </button>
          <button @click="deletePlayer" class="btn btn-soft btn-sm">
            Delete Player
          </button>
        </div>

      </div>
      <!-- 数据展示 -->
      <div class="flex flex-col gap-4">
        <!-- 生涯数据总览 -->
        <div class="p-4 border rounded shadow-lg">
          <div class="flex flex-col gap-4">
            <!-- Header -->
            <div class="border-b p-4">
              <h2 class="text-xl font-bold">Career Data Overview</h2>
            </div>
            <!-- 数据卡片 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">GP</div>
                <div class="stat-value">{{ playerStats.length }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">AP</div>
                <div class="stat-value">{{ playerAverageStats?.PTS?.toFixed(1) || '0.0' }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">FG%</div>
                <div class="stat-value">
                  {{ calculatePercentage(playerAverageStats?.FGM, playerAverageStats?.FGA) }}
                </div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">3P%</div>
                <div class="stat-value">
                  {{ calculatePercentage(playerAverageStats?.threePM, playerAverageStats?.threePA) }}
                </div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">FT%</div>
                <div class="stat-value">
                  {{ calculatePercentage(playerAverageStats?.FTM, playerAverageStats?.FTA) }}
                </div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">REB</div>
                <div class="stat-value">
                  {{ ((playerAverageStats?.OREB || 0) + (playerAverageStats?.DREB || 0)).toFixed(1) }}
                </div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">AST</div>
                <div class="stat-value">{{ playerAverageStats?.AST?.toFixed(1) || '0.0' }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">STL</div>
                <div class="stat-value">{{ playerAverageStats?.STL?.toFixed(1) || '0.0' }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">BLK</div>
                <div class="stat-value">{{ playerAverageStats?.BLK?.toFixed(1) || '0.0' }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">TOV</div>
                <div class="stat-value">{{ playerAverageStats?.TOV?.toFixed(1) || '0.0' }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">PF</div>
                <div class="stat-value">{{ playerAverageStats?.PF?.toFixed(1) || '0.0' }}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- 比赛数据表格 -->
        <div class="overflow-hidden rounded-lg shadow-lg border p-4">
          <div class="flex justify-between items-center p-4 border-b">
            <h2 class="text-xl font-bold">Game Records</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full table-md">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">Game</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">Result</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">Type</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">MIN</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">PTS</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">FG</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">3P</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">FT</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">REB</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">AST</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">STL</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">BLK</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">TOV</th>
                  <th class="px-6 py-3 text-left text-md font-medium text-gray-600">PF</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stat in playerStats" :key="stat.gameId" class="hover:bg-gray-100 cursor-pointer"
                  @click="router.push(`/game/${stat.gameId}`)">
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.team_stats?.GR || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.team_stats?.GT || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.MIN || 0 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ calculatePoints(stat) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ stat.FGM || 0 }}/{{ stat.FGA || 0 }}
                    <span class="text-gray-500 text-sm">
                      ({{ calculatePercentage(stat.FGM, stat.FGA) }})
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ stat.threePM || 0 }}/{{ stat.threePA || 0 }}
                    <span class="text-gray-500 text-sm">
                      ({{ calculatePercentage(stat.threePM, stat.threePA) }})
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ stat.FTM || 0 }}/{{ stat.FTA || 0 }}
                    <span class="text-gray-500 text-sm">
                      ({{ calculatePercentage(stat.FTM, stat.FTA) }})
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ (stat.OREB || 0) + (stat.DREB || 0) }}
                    <span class="text-gray-500 text-sm">
                      ({{ stat.OREB || 0 }}/{{ stat.DREB || 0 }})
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.AST || 0 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.STL || 0 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.BLK || 0 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.TOV || 0 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ stat.PF || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="p-4">
    <div class="text-center text-gray-500">Loading</div>
  </div>
</template>
