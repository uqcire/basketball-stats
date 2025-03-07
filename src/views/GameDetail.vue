<script setup>
import { useGameStore } from '@/stores/game'
import { usePlayerStore } from '@/stores/player'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const playerStore = usePlayerStore()

const gameId = computed(() => Number(route.params.id))
const game = computed(() => gameStore.getGameById(gameId.value))

// 比赛结果和类型选项
const gameResults = ['Win', 'Loss', 'Tie']
const gameTypes = ['Tournement', 'Grading', 'Regular']

// 编辑比赛基本信息
const editingGameInfo = ref(false)
const editingGameData = ref(null)

// 开始编辑比赛信息
const startEditGameInfo = () => {
  editingGameInfo.value = true
  editingGameData.value = {
    GR: game.value.team_stats?.GR || gameResults[0],
    GT: game.value.team_stats?.GT || gameTypes[0]
  }
}

// 保存比赛信息
const saveGameInfo = async () => {
  try {
    const updatedTeamStats = {
      ...(game.value.team_stats || {}),
      GR: editingGameData.value.GR,
      GT: editingGameData.value.GT
    }

    const updatedGame = {
      id: game.value.id,
      name: game.value.name,
      date: game.value.date,
      team_stats: updatedTeamStats,
      player_stats: game.value.player_stats || []
    }

    console.log('Updating game with:', updatedGame)
    await gameStore.updateGame(gameId.value, updatedGame)

    editingGameInfo.value = false
    editingGameData.value = null

    // 重新获取数据
    await gameStore.fetchGames()
  } catch (error) {
    console.error('Error saving game info:', error)
    alert('保存失败，请重试')
  }
}

// 取消编辑比赛信息
const cancelEditGameInfo = () => {
  editingGameInfo.value = false
  editingGameData.value = null
}

// 添加球员到比赛
const showAddPlayer = ref(false)
const selectedPlayerId = ref(null)
const availablePlayers = computed(() => {
  if (!game.value) return []
  const existingPlayerIds = game.value.player_stats.map(stat => stat.playerId)
  return playerStore.players.filter(player => !existingPlayerIds.includes(player.id))
})

// 编辑状态管理
const editingPlayerId = ref(null)
const editingStats = ref(null)

// 开始编辑球员数据
const startEdit = (stat) => {
  editingPlayerId.value = stat.playerId
  editingStats.value = { ...stat }
}

// 取消编辑
const cancelEdit = () => {
  editingPlayerId.value = null
  editingStats.value = null
}

// 保存球员数据
const savePlayerStats = async (stat) => {
  try {
    // 验证数据
    const stats = {
      ...stat,
      MIN: Number(stat.MIN),
      FGM: Number(stat.FGM),
      FGA: Number(stat.FGA),
      threePM: Number(stat.threePM),
      threePA: Number(stat.threePA),
      FTM: Number(stat.FTM),
      FTA: Number(stat.FTA),
      OREB: Number(stat.OREB),
      DREB: Number(stat.DREB),
      AST: Number(stat.AST),
      TOV: Number(stat.TOV),
      STL: Number(stat.STL),
      BLK: Number(stat.BLK),
      PF: Number(stat.PF)
    }

    // 更新比赛中的球员数据
    const currentStats = [...game.value.player_stats]
    const playerIndex = currentStats.findIndex(s => s.playerId === stat.playerId)
    if (playerIndex !== -1) {
      currentStats[playerIndex] = stats
    }

    // 计算新的团队统计数据
    const newTeamStats = currentStats.reduce((team, player) => {
      ['MIN', 'FGM', 'FGA', 'threePM', 'threePA', 'FTM', 'FTA',
        'OREB', 'DREB', 'AST', 'TOV', 'STL', 'BLK', 'PF'].forEach(key => {
          team[key] = (team[key] || 0) + (Number(player[key]) || 0)
        })
      return team
    }, {})

    // 保持原有的GR和GT值
    newTeamStats.GR = game.value.team_stats?.GR || '-'
    newTeamStats.GT = game.value.team_stats?.GT || '-'

    // 更新比赛数据
    const updatedGame = {
      ...game.value,
      name: game.value.name,
      date: game.value.date,
      team_stats: newTeamStats,
      player_stats: currentStats
    }

    console.log('Updating game with new stats:', updatedGame)
    await gameStore.updateGame(gameId.value, updatedGame)

    // 同步到球员统计数据
    await playerStore.updatePlayerStats(stat.playerId, gameId.value, stats)

    editingPlayerId.value = null
    editingStats.value = null

    // 重新获取数据
    await gameStore.fetchGames()
  } catch (error) {
    console.error('Error saving player stats:', error)
    alert('保存失败，请重试')
  }
}

// 添加球员统计
const addPlayerStats = async (playerId) => {
  if (!game.value || !playerId) return

  try {
    console.log('Current game:', game.value)
    console.log('Adding player:', playerId)

    // 确保 player_stats 是数组
    const currentStats = Array.isArray(game.value.player_stats) ? [...game.value.player_stats] : []
    console.log('Current stats:', currentStats)

    const newPlayerStats = {
      playerId: Number(playerId),
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

    const updatedStats = [...currentStats, newPlayerStats]
    console.log('Updated stats:', updatedStats)

    // 计算新的团队统计数据
    const newTeamStats = updatedStats.reduce((team, player) => {
      ['MIN', 'FGM', 'FGA', 'threePM', 'threePA', 'FTM', 'FTA',
        'OREB', 'DREB', 'AST', 'TOV', 'STL', 'BLK', 'PF'].forEach(key => {
          team[key] = (team[key] || 0) + (Number(player[key]) || 0)
        })
      return team
    }, {})

    // 保持原有的GR和GT值
    newTeamStats.GR = game.value.team_stats?.GR || '-'
    newTeamStats.GT = game.value.team_stats?.GT || '-'

    const updatedGame = {
      id: game.value.id,
      name: game.value.name,
      date: game.value.date,
      team_stats: newTeamStats,
      player_stats: updatedStats
    }

    console.log('Updating game with:', updatedGame)
    await gameStore.updateGame(gameId.value, updatedGame)
    console.log('Game updated successfully')

    // 重新获取游戏数据
    await gameStore.fetchGames()

    selectedPlayerId.value = null
    showAddPlayer.value = false
  } catch (error) {
    console.error('Error adding player to game:', error)
    alert('添加球员失败，请重试')
  }
}

// 获取该场比赛的所有球员数据
const playerStats = computed(() => {
  if (!game.value) return []

  return game.value.player_stats.map(stat => {
    const player = playerStore.players.find(p => p.id === stat.playerId)
    return {
      ...stat,
      name: player?.name || 'Unknown Player',
      number: player?.number || '-'
    }
  })
})

// 计算上场人数
const playerCount = computed(() => playerStats.value.length)

// 计算命中率
const calculatePercentage = (made, attempted) => {
  if (!attempted) return 'N/A'
  return ((made / attempted) * 100).toFixed(1) + '%'
}

// 计算得分
const calculatePoints = (stat) => {
  return (stat.FGM * 2) + (stat.threePM * 3) + stat.FTM
}

// 计算球队总数据
const teamStats = computed(() => {
  if (!playerStats.value.length) return {}

  return playerStats.value.reduce((total, player) => {
    Object.keys(player).forEach(key => {
      if (typeof player[key] === 'number') {
        total[key] = (total[key] || 0) + player[key]
      }
    })
    return total
  }, {})
})

// 计算得分
const calculateTeamPoints = (stats) => {
  return ((stats.FGM || 0) * 2) + ((stats.threePM || 0) * 3) + (stats.FTM || 0)
}

// 返回团队统计页面
const goBack = () => {
  router.push('/')
}

// 跳转到球员详情页
const goToPlayerDetail = (playerId) => {
  router.push(`/players/${playerId}`)
}

// 删除比赛记录
const deleteGame = async () => {
  if (confirm('确定要删除这场比赛记录吗？此操作不可恢复。')) {
    try {
      await gameStore.deleteGame(gameId.value)
      router.push('/')
    } catch (error) {
      console.error('Error deleting game:', error)
      alert('删除失败，请重试')
    }
  }
}
</script>

<template>
  <div v-if="game" class="container mx-auto px-4 py-8">
    <!-- 顶部导航和标题 -->
    <div class="mb-8 flex items-center justify-between">
      <button @click="goBack" class="text-blue-600 hover:text-blue-800 flex items-center">
        <span class="mr-2">←</span> 返回团队统计
      </button>
      <h1 class="text-3xl font-bold text-center flex-1">{{ game.name }}</h1>
      <div class="flex gap-2">
        <button @click="showAddPlayer = true" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          添加球员
        </button>
        <button @click="deleteGame" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          删除比赛
        </button>
      </div>
    </div>

    <!-- 添加球员弹窗 -->
    <div v-if="showAddPlayer" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-xl font-bold mb-4">添加球员</h3>
        <div v-if="availablePlayers.length > 0">
          <select v-model="selectedPlayerId" class="w-full p-2 border rounded mb-4">
            <option value="">选择球员</option>
            <option v-for="player in availablePlayers" :key="player.id" :value="player.id">
              {{ player.name }} ({{ player.number }})
            </option>
          </select>
          <div class="flex justify-end gap-2">
            <button @click="showAddPlayer = false" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              取消
            </button>
            <button @click="addPlayerStats(selectedPlayerId)" :disabled="!selectedPlayerId"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300">
              添加
            </button>
          </div>
        </div>
        <div v-else class="text-center text-gray-500">
          没有可添加的球员
        </div>
      </div>
    </div>

    <!-- 比赛基本信息 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-gray-600">比赛结果</div>
          <div v-if="!editingGameInfo" class="text-2xl font-bold">{{ game.team_stats?.GR || '-' }}</div>
          <select v-else v-model="editingGameData.GR" class="mt-1 w-full p-2 border rounded text-lg">
            <option v-for="result in gameResults" :key="result" :value="result">{{ result }}</option>
          </select>
        </div>
        <div class="text-center">
          <div class="text-gray-600">比赛类型</div>
          <div v-if="!editingGameInfo" class="text-2xl font-bold">{{ game.team_stats?.GT || '-' }}</div>
          <select v-else v-model="editingGameData.GT" class="mt-1 w-full p-2 border rounded text-lg">
            <option v-for="type in gameTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div class="text-center">
          <div class="text-gray-600">比赛日期</div>
          <div class="text-2xl font-bold">{{ game.date }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-600">上场人数</div>
          <div class="text-2xl font-bold">{{ playerCount }}</div>
        </div>
      </div>
      <!-- 编辑按钮 -->
      <div class="flex justify-end mt-4">
        <template v-if="editingGameInfo">
          <button @click="cancelEditGameInfo" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 mr-2">
            取消
          </button>
          <button @click="saveGameInfo" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            保存
          </button>
        </template>
        <template v-else>
          <button @click="startEditGameInfo" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            编辑比赛信息
          </button>
        </template>
      </div>
    </div>

    <!-- 球队数据卡片 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">球队数据</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card">
          <div class="text-gray-600">得分</div>
          <div class="text-2xl font-bold">
            {{ calculateTeamPoints(teamStats) }}
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">投篮</div>
          <div class="text-2xl font-bold">
            {{ teamStats.FGM || 0 }}/{{ teamStats.FGA || 0 }}
            <span class="text-gray-500 text-sm">
              ({{ calculatePercentage(teamStats.FGM, teamStats.FGA) }})
            </span>
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">三分</div>
          <div class="text-2xl font-bold">
            {{ teamStats.threePM || 0 }}/{{ teamStats.threePA || 0 }}
            <span class="text-gray-500 text-sm">
              ({{ calculatePercentage(teamStats.threePM, teamStats.threePA) }})
            </span>
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">罚球</div>
          <div class="text-2xl font-bold">
            {{ teamStats.FTM || 0 }}/{{ teamStats.FTA || 0 }}
            <span class="text-gray-500 text-sm">
              ({{ calculatePercentage(teamStats.FTM, teamStats.FTA) }})
            </span>
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">篮板</div>
          <div class="text-2xl font-bold">
            {{ (teamStats.OREB || 0) + (teamStats.DREB || 0) }}
            <span class="text-gray-500 text-sm">
              ({{ teamStats.OREB || 0 }}/{{ teamStats.DREB || 0 }})
            </span>
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">助攻</div>
          <div class="text-2xl font-bold">{{ teamStats.AST || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">抢断</div>
          <div class="text-2xl font-bold">{{ teamStats.STL || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">盖帽</div>
          <div class="text-2xl font-bold">{{ teamStats.BLK || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 球员数据表格 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <h2 class="text-xl font-semibold p-4 border-b">球员数据</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                球员
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                号码
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                得分
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                时间
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                投篮
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                三分
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                罚球
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                篮板
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                助攻
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                抢断
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                盖帽
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="stat in playerStats" :key="stat.playerId" class="hover:bg-gray-50"
              :class="{ 'bg-blue-50': editingPlayerId === stat.playerId }">
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap font-semibold">
                {{ calculatePoints(stat) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <input v-model="editingStats.MIN" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                </template>
                <template v-else>
                  {{ stat.MIN }}
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <input v-model="editingStats.FGM" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                  /
                  <input v-model="editingStats.FGA" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                </template>
                <template v-else>
                  {{ stat.FGM }}/{{ stat.FGA }}
                  <span class="text-gray-500 text-sm">
                    ({{ calculatePercentage(stat.FGM, stat.FGA) }})
                  </span>
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <input v-model="editingStats.threePM" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                  /
                  <input v-model="editingStats.threePA" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                </template>
                <template v-else>
                  {{ stat.threePM }}/{{ stat.threePA }}
                  <span class="text-gray-500 text-sm">
                    ({{ calculatePercentage(stat.threePM, stat.threePA) }})
                  </span>
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <input v-model="editingStats.FTM" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                  /
                  <input v-model="editingStats.FTA" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                </template>
                <template v-else>
                  {{ stat.FTM }}/{{ stat.FTA }}
                  <span class="text-gray-500 text-sm">
                    ({{ calculatePercentage(stat.FTM, stat.FTA) }})
                  </span>
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <input v-model="editingStats.OREB" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                  /
                  <input v-model="editingStats.DREB" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                </template>
                <template v-else>
                  {{ stat.OREB + stat.DREB }}
                  <span class="text-gray-500 text-sm">
                    ({{ stat.OREB }}/{{ stat.DREB }})
                  </span>
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <input v-model="editingStats.AST" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                </template>
                <template v-else>
                  {{ stat.AST }}
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <input v-model="editingStats.STL" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                </template>
                <template v-else>
                  {{ stat.STL }}
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <input v-model="editingStats.BLK" type="number" min="0" class="w-16 px-2 py-1 border rounded">
                </template>
                <template v-else>
                  {{ stat.BLK }}
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <template v-if="editingPlayerId === stat.playerId">
                  <div class="flex gap-2">
                    <button @click="savePlayerStats(editingStats)"
                      class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                      保存
                    </button>
                    <button @click="cancelEdit" class="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
                      取消
                    </button>
                  </div>
                </template>
                <template v-else>
                  <button @click="startEdit(stat)" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                    编辑
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-else class="container mx-auto px-4 py-8 text-center">
    <p class="text-gray-600">找不到该比赛的数据</p>
    <button @click="goBack" class="mt-4 text-blue-600 hover:text-blue-800">
      返回团队统计
    </button>
  </div>
</template>
