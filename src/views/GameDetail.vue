<script setup>
import { useGameStore } from '@/stores/game'
import { usePlayerStore } from '@/stores/player'
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
const isEditing = ref(false)

// 开始编辑比赛信息
const startEditGameInfo = () => {
  editingGameData.value = {
    name: game.value.name,
    GR: game.value.team_stats?.GR || '-',
    GT: game.value.team_stats?.GT || '-'
  }
  isEditing.value = true
}

// 保存比赛信息
const saveGameInfo = async () => {
  try {
    const updatedGame = {
      name: editingGameData.value.name,
      team_stats: {
        ...game.value.team_stats,
        GR: editingGameData.value.GR,
        GT: editingGameData.value.GT
      }
    }
    console.log('Updating game with:', updatedGame)
    await gameStore.updateGame(game.value.id, updatedGame)
    isEditing.value = false
  } catch (error) {
    console.error('Error updating game:', error)
    alert('Error updating game，please try again')
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editingGameData.value = null
}

// 添加球员到比赛
const showAddPlayer = ref(false)
const selectedPlayerIds = ref([])
const availablePlayers = computed(() => {
  if (!game.value) return []
  const existingPlayerIds = game.value.player_stats.map(stat => stat.playerId)
  return playerStore.players.filter(player => !existingPlayerIds.includes(player.id))
})

// 编辑状态管理
const editingMode = ref(false)
const editingStats = ref({})

// 开始批量编辑
const startBatchEdit = () => {
  editingMode.value = true
  editingStats.value = playerStats.value.reduce((acc, stat) => {
    acc[stat.playerId] = { ...stat }
    return acc
  }, {})
}

// 取消编辑
const cancelBatchEdit = () => {
  editingMode.value = false
  editingStats.value = {}
}

// 批量保存球员数据
const saveBatchStats = async () => {
  try {
    const updatedStats = Object.values(editingStats.value)

    // 更新比赛中的球员数据
    const currentStats = updatedStats.map(stat => ({
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
    }))

    // 计算新的团队统计数据
    const newTeamStats = currentStats.reduce((team, player) => {
      ['MIN', 'FGM', 'FGA', 'threePM', 'threePA', 'FTM', 'FTA',
        'OREB', 'DREB', 'AST', 'TOV', 'STL', 'BLK', 'PF'].forEach(key => {
          team[key] = (team[key] || 0) + Number(player[key])
        })
      return team
    }, {})

    // 保持原有的GR和GT值
    newTeamStats.GR = game.value.team_stats?.GR || '-'
    newTeamStats.GT = game.value.team_stats?.GT || '-'

    const updatedGame = {
      ...game.value,
      team_stats: newTeamStats,
      player_stats: currentStats
    }

    await gameStore.updateGame(gameId.value, updatedGame)

    // 同步到每个球员的统计数据
    await Promise.all(currentStats.map(stat =>
      playerStore.updatePlayerStats(stat.playerId, gameId.value, stat)
    ))

    editingMode.value = false
    editingStats.value = {}

    // 重新获取数据
    await gameStore.fetchGames()
  } catch (error) {
    console.error('Error saving player stats:', error)
    alert('Error saving player stats, please try again')
  }
}

// 批量添加球员统计
const addMultiplePlayers = async () => {
  if (!game.value || !selectedPlayerIds.value.length) return

  try {
    const currentStats = Array.isArray(game.value.player_stats) ? [...game.value.player_stats] : []

    const newPlayersStats = selectedPlayerIds.value.map(playerId => ({
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
    }))

    const updatedStats = [...currentStats, ...newPlayersStats]

    // 计算新的团队统计数据
    const newTeamStats = updatedStats.reduce((team, player) => {
      ['MIN', 'FGM', 'FGA', 'threePM', 'threePA', 'FTM', 'FTA',
        'OREB', 'DREB', 'AST', 'TOV', 'STL', 'BLK', 'PF'].forEach(key => {
          team[key] = (team[key] || 0) + Number(player[key])
        })
      return team
    }, {})

    newTeamStats.GR = game.value.team_stats?.GR || '-'
    newTeamStats.GT = game.value.team_stats?.GT || '-'

    const updatedGame = {
      ...game.value,
      team_stats: newTeamStats,
      player_stats: updatedStats
    }

    await gameStore.updateGame(gameId.value, updatedGame)

    selectedPlayerIds.value = []
    showAddPlayer.value = false

    await gameStore.fetchGames()
  } catch (error) {
    console.error('Error adding players to game:', error)
    alert('Error adding players to game, please try again')
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
  if (confirm('Are you sure you want to delete this game record? This action cannot be undone.')) {
    try {
      await gameStore.deleteGame(gameId.value)
      router.push('/')
    } catch (error) {
      console.error('Error deleting game:', error)
      alert('Error deleting game，please try again')
    }
  }
}

// 全选/取消全选
const toggleAllPlayers = (event) => {
  if (event.target.checked) {
    selectedPlayerIds.value = availablePlayers.value.map(player => player.id)
  } else {
    selectedPlayerIds.value = []
  }
}

// 在 script setup 部分添加
const dropdownRef = ref(null)

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showAddPlayer.value = false
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 移除球员
const removePlayer = async (playerId) => {
  if (!confirm('Are you sure you want to remove this player from this game?')) return

  try {
    // 移除该球员的统计数据
    const updatedStats = game.value.player_stats.filter(stat => stat.playerId !== playerId)

    // 重新计算团队统计数据
    const newTeamStats = updatedStats.reduce((team, player) => {
      ['MIN', 'FGM', 'FGA', 'threePM', 'threePA', 'FTM', 'FTA',
        'OREB', 'DREB', 'AST', 'TOV', 'STL', 'BLK', 'PF'].forEach(key => {
          team[key] = (team[key] || 0) + Number(player[key])
        })
      return team
    }, {})

    // 保持原有的GR和GT值
    newTeamStats.GR = game.value.team_stats?.GR || '-'
    newTeamStats.GT = game.value.team_stats?.GT || '-'

    const updatedGame = {
      ...game.value,
      team_stats: newTeamStats,
      player_stats: updatedStats
    }

    await gameStore.updateGame(gameId.value, updatedGame)
    await gameStore.fetchGames()
  } catch (error) {
    console.error('Error removing player:', error)
    alert('Error removing player, please try again')
  }
}
</script>

<template>

  <div v-if="game" class="container mx-auto px-4 py-8">
    <div class="flex gap-4 flex-col">
      <!-- 顶部导航和标题 -->
      <div class="flex items-center justify-between">
        <button @click="goBack" class="btn btn-primary">
          ← Home
        </button>
        <div class="flex gap-2">
          <div class="relative" ref="dropdownRef">
            <button @click.stop="showAddPlayer = !showAddPlayer" class="btn btn-secondary">
              Add Player
            </button>
            <!-- 下拉菜单 -->
            <div v-if="showAddPlayer" class="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg shadow-xl z-50">
              <div class="p-4">
                <h3 class="text-xl font-bold mb-4">Add Player</h3>
                <div v-if="availablePlayers.length > 0">
                  <div class="form-control w-full">
                    <div class="bg-white border rounded-lg max-h-64 overflow-y-auto">
                      <div class="p-2 border-b sticky top-0 bg-white">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" class="checkbox"
                            :checked="selectedPlayerIds.length === availablePlayers.length"
                            @change="toggleAllPlayers" />
                          <span>Select All</span>
                        </label>
                      </div>
                      <div class="divide-y">
                        <label v-for="player in availablePlayers" :key="player.id"
                          class="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" class="checkbox" :value="player.id" v-model="selectedPlayerIds" />
                          <span>#{{ player.number }} {{ player.name }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-end gap-2 mt-4">
                    <button @click.stop="showAddPlayer = false" class="btn btn-sm">Cancel</button>
                    <button @click.stop="addMultiplePlayers" :disabled="!selectedPlayerIds.length"
                      class="btn btn-primary btn-sm">
                      Add Selected Players ({{ selectedPlayerIds.length }})
                    </button>
                  </div>
                </div>
                <div v-else class="text-center text-gray-500 py-4">
                  No players available
                </div>
              </div>
            </div>
          </div>
          <button @click="deleteGame" class="btn btn-error">
            Delete Game
          </button>
        </div>
      </div>
      <!-- 比赛基本信息 -->
      <div class=" rounded-lg shadow-lg p-6 mb-8">
        <div class="flex items-center justify-between gap-4">
          <!-- 比赛名称 -->
          <div class="flex items-center gap-4">
            <div v-if="!isEditing" class="stat-value">{{ game.name }}</div>
            <input v-else v-model="editingGameData.name" type="text" placeholder="Game Name"
              class="input input-bordered" />
          </div>

          <!-- 比赛结果 -->
          <div class="flex items-center gap-2">
            <div v-if="!isEditing" class="text-xl font-bold">{{ game.team_stats?.GR || '-' }}</div>
            <select v-else v-model="editingGameData.GR" class="select">
              <option value="-">Select Result</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="Tie">Tie</option>
            </select>
          </div>

          <!-- 比赛类型 -->
          <div class="flex items-center gap-2">
            <div v-if="!isEditing" class="text-xl font-bold">{{ game.team_stats?.GT || '-' }}</div>
            <select v-else v-model="editingGameData.GT" class="select">
              <option value="-">Select Type</option>
              <option value="Tournament">Tournament</option>
              <option value="Regular Season">Regular Season</option>
              <option value="Grading">Grading</option>
            </select>
          </div>

          <!-- 比赛日期 -->
          <div class="flex items-center gap-2">
            <div v-if="!isEditing" class="text-xl font-bold">{{ game.date }}</div>
            <input v-else v-model="editingGameData.date" type="date" class="input input-bordered" />
          </div>

          <!-- 球员数量 -->
          <div class="flex items-center gap-2">
            <div class="text-xl font-bold">{{ playerCount }} Players</div>
          </div>

          <!-- 编辑按钮 -->
          <div class="flex items-center gap-2">
            <template v-if="isEditing">
              <button @click="saveGameInfo" class="btn btn-success btn-sm">Save</button>
              <button @click="cancelEdit" class="btn btn-error btn-sm">Cancel</button>
            </template>
            <button v-else @click="startEditGameInfo" class="btn btn-primary btn-sm">Edit</button>
          </div>
        </div>
      </div>

      <!-- 球队数据卡片 -->
      <div class="card rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-bold pb-4">Team Statistics</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat shadow-lg">
            <div class="stat-title">PTS</div>
            <div class="stat-value">
              {{ calculateTeamPoints(teamStats) }}
            </div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">FG</div>
            <div class="stat-value">
              {{ teamStats.FGM || 0 }}/{{ teamStats.FGA || 0 }}
              <span class="text-gray-500 text-sm">
                ({{ calculatePercentage(teamStats.FGM, teamStats.FGA) }})
              </span>
            </div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">3P</div>
            <div class="stat-value">
              {{ teamStats.threePM || 0 }}/{{ teamStats.threePA || 0 }}
              <span class="text-gray-500 text-sm">
                ({{ calculatePercentage(teamStats.threePM, teamStats.threePA) }})
              </span>
            </div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">FT</div>
            <div class="stat-value">
              {{ teamStats.FTM || 0 }}/{{ teamStats.FTA || 0 }}
              <span class="text-gray-500 text-sm">
                ({{ calculatePercentage(teamStats.FTM, teamStats.FTA) }})
              </span>
            </div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">OREB</div>
            <div class="stat-value">{{ teamStats.OREB || 0 }}</div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">DREB</div>
            <div class="stat-value">{{ teamStats.DREB || 0 }}</div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">REB</div>
            <div class="stat-value">
              {{ (teamStats.OREB || 0) + (teamStats.DREB || 0) }}
              <span class="text-gray-500 text-sm">
                ({{ teamStats.OREB || 0 }}/{{ teamStats.DREB || 0 }})
              </span>
            </div>
          </div>

          <div class="stat shadow-lg">
            <div class="stat-title">AST</div>
            <div class="stat-value">{{ teamStats.AST || 0 }}</div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">STL</div>
            <div class="stat-value">{{ teamStats.STL || 0 }}</div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">BLK</div>
            <div class="stat-value">{{ teamStats.BLK || 0 }}</div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">TOV</div>
            <div class="stat-value">{{ teamStats.TOV || 0 }}</div>
          </div>
          <div class="stat shadow-lg">
            <div class="stat-title">PF</div>
            <div class="stat-value">{{ teamStats.PF || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- 球员数据表格 -->
      <div class="rounded-lg shadow-lg overflow-hidden">
        <div class="flex justify-between items-center p-4 border-b">
          <h2 class="text-xl font-semibold">Box Score</h2>
          <div class="flex gap-2">
            <template v-if="editingMode">
              <button @click="saveBatchStats" class="btn btn-success btn-sm">Save All</button>
              <button @click="cancelBatchEdit" class="btn btn-error btn-sm">Cancel</button>
            </template>
            <button v-else @click="startBatchEdit" class="btn btn-primary btn-sm">Edit All</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="table-MD min-w-full">
            <thead>
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PTS
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MIN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FGM/FGA
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  3PM/3PA
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FTM/FTA
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OREB/DREB
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AST
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STL
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BLK
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TOV
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PF
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="stat in playerStats" :key="stat.playerId" class="hover:bg-gray-50"
                :class="{ 'bg-blue-50': editingMode }">
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
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].MIN" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.MIN }}
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].FGM" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                    /
                    <input v-model="editingStats[stat.playerId].FGA" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.FGM }}/{{ stat.FGA }}
                    <span class="text-gray-500 text-sm">
                      ({{ calculatePercentage(stat.FGM, stat.FGA) }})
                    </span>
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].threePM" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                    /
                    <input v-model="editingStats[stat.playerId].threePA" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.threePM }}/{{ stat.threePA }}
                    <span class="text-gray-500 text-sm">
                      ({{ calculatePercentage(stat.threePM, stat.threePA) }})
                    </span>
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].FTM" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                    /
                    <input v-model="editingStats[stat.playerId].FTA" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.FTM }}/{{ stat.FTA }}
                    <span class="text-gray-500 text-sm">
                      ({{ calculatePercentage(stat.FTM, stat.FTA) }})
                    </span>
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].OREB" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                    /
                    <input v-model="editingStats[stat.playerId].DREB" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.OREB + stat.DREB }}
                    <span class="text-gray-500 text-sm">
                      ({{ stat.OREB }}/{{ stat.DREB }})
                    </span>
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].AST" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.AST }}
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].STL" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.STL }}
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].BLK" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.BLK }}
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].TOV" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.TOV }}
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <input v-model="editingStats[stat.playerId].PF" type="number" min="0"
                      class="w-16 px-2 py-1 border rounded">
                  </template>
                  <template v-else>
                    {{ stat.PF }}
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <template v-if="editingMode">
                    <div class="flex gap-2">
                      <button @click="saveBatchStats"
                        class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                        Save
                      </button>
                      <button @click="cancelBatchEdit" class="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
                        Cancel
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex gap-2">
                      <button @click="startBatchEdit"
                        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Edit
                      </button>
                      <button @click="removePlayer(stat.playerId)"
                        class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                        Remove
                      </button>
                    </div>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
  <div v-else class="container mx-auto px-4 py-8 text-center">
    <div class="flex flex-col items-center gap-4">
      <span class="loading loading-dots loading-xs"></span>
      <p class="stat-title">No data found for this game</p>
      <button @click="goBack" class="btn btn-warning">
        Back to Home
      </button>
    </div>
  </div>
</template>
