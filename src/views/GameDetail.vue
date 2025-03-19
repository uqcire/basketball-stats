<script setup>
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { usePlayerStore } from '@/stores/player'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const playerStore = usePlayerStore()
const authStore = useAuthStore()

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
    date: game.value.date || new Date().toISOString().split('T')[0],
    opponent: game.value.team_stats?.opponent || '-',
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
      date: editingGameData.value.date || game.value.date,
      team_stats: {
        ...game.value.team_stats,
        opponent: editingGameData.value.opponent,
        GR: editingGameData.value.GR,
        GT: editingGameData.value.GT
      },
      player_stats: game.value.player_stats || [] // 保留原有的球员数据
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

// 在 script setup 部分添加排序相关的状态和方法
const sortConfig = ref({
  key: null,
  direction: 'asc'
})

// 排序方法
const sortStats = (key) => {
  if (sortConfig.value.key === key) {
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortConfig.value.key = key
    sortConfig.value.direction = 'asc'
  }
}

// 获取排序后的球员数据
const sortedPlayerStats = computed(() => {
  if (!sortConfig.value.key) return playerStats.value

  return [...playerStats.value].sort((a, b) => {
    let aValue = a[sortConfig.value.key]
    let bValue = b[sortConfig.value.key]

    // 特殊处理球员号码
    if (sortConfig.value.key === 'number') {
      // 将号码转换为数字，如果转换失败则使用最大值
      aValue = Number(aValue) || Number.MAX_SAFE_INTEGER
      bValue = Number(bValue) || Number.MAX_SAFE_INTEGER
    }

    // 特殊处理复合数据
    if (sortConfig.value.key === 'FGM/FGA') {
      aValue = a.FGM / (a.FGA || 1)
      bValue = b.FGM / (b.FGA || 1)
    } else if (sortConfig.value.key === '3PM/3PA') {
      aValue = a.threePM / (a.threePA || 1)
      bValue = b.threePM / (b.threePA || 1)
    } else if (sortConfig.value.key === 'FTM/FTA') {
      aValue = a.FTM / (a.FTA || 1)
      bValue = b.FTM / (b.FTA || 1)
    } else if (sortConfig.value.key === 'OREB/DREB') {
      aValue = a.OREB + a.DREB
      bValue = b.OREB + b.DREB
    } else if (sortConfig.value.key === 'PTS') {
      aValue = calculatePoints(a)
      bValue = calculatePoints(b)
    }

    // 确保数字正确排序
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.value.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    // 字符串排序
    if (aValue < bValue) return sortConfig.value.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.value.direction === 'asc' ? 1 : -1
    return 0
  })
})

// 获取排序图标
const getSortIcon = (key) => {
  if (sortConfig.value.key !== key) return '↕️'
  return sortConfig.value.direction === 'asc' ? '↑' : '↓'
}

// 在 script setup 部分添加计时器相关的状态和方法
const activeTimers = ref({})
const timerIntervals = ref({})

// 开始计时
const startTimer = (playerId) => {
  if (!activeTimers.value[playerId]) {
    activeTimers.value[playerId] = {
      minutes: editingStats.value[playerId]?.MIN || 0,
      seconds: 0,
      isRunning: true
    }
    timerIntervals.value[playerId] = setInterval(() => {
      if (activeTimers.value[playerId].seconds === 59) {
        activeTimers.value[playerId].minutes++
        activeTimers.value[playerId].seconds = 0
      } else {
        activeTimers.value[playerId].seconds++
      }
    }, 1000)
  } else if (!activeTimers.value[playerId].isRunning) {
    // 如果计时器存在但已暂停，重新开始计时
    activeTimers.value[playerId].isRunning = true
    timerIntervals.value[playerId] = setInterval(() => {
      if (activeTimers.value[playerId].seconds === 59) {
        activeTimers.value[playerId].minutes++
        activeTimers.value[playerId].seconds = 0
      } else {
        activeTimers.value[playerId].seconds++
      }
    }, 1000)
  }
}

// 暂停计时
const pauseTimer = (playerId) => {
  if (activeTimers.value[playerId]) {
    clearInterval(timerIntervals.value[playerId])
    activeTimers.value[playerId].isRunning = false
  }
}

// 停止计时并保存
const stopTimer = (playerId) => {
  if (activeTimers.value[playerId]) {
    clearInterval(timerIntervals.value[playerId])
    editingStats.value[playerId].MIN = activeTimers.value[playerId].minutes
    delete activeTimers.value[playerId]
    delete timerIntervals.value[playerId]
  }
}

// 格式化时间显示
const formatTime = (minutes, seconds) => {
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 格式化显示时间（用于非编辑状态）
const formatDisplayTime = (minutes) => {
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 在组件卸载时清理所有计时器
onUnmounted(() => {
  Object.keys(timerIntervals.value).forEach(playerId => {
    clearInterval(timerIntervals.value[playerId])
  })
})

// 在 script setup 部分添加暂停所有计时器的功能
const pauseAllTimers = () => {
  Object.keys(activeTimers.value).forEach(playerId => {
    pauseTimer(playerId)
  })
}

// 在 script setup 部分添加开始所有计时器的功能
const startAllTimers = () => {
  Object.keys(activeTimers.value).forEach(playerId => {
    startTimer(playerId)
  })
}

// 在 script setup 部分添加停止所有计时器的功能
const stopAllTimers = () => {
  Object.keys(activeTimers.value).forEach(playerId => {
    stopTimer(playerId)
  })
}
</script>

<template>
  <div v-if="game" class="container mx-auto px-4 py-8">
    <div class="flex gap-4 flex-col">
      <!-- 顶部导航和标题 -->
      <div class="flex items-center justify-between">
        <button @click="goBack" class="btn btn-soft btn-sm">
          ← Team
        </button>
        <div class="flex gap-2">
          <div v-if="authStore.isAdmin" class="relative" ref="dropdownRef">
            <button @click.stop="showAddPlayer = !showAddPlayer" class="btn btn-primary btn-sm">
              Add Player
            </button>
            <!-- 下拉菜单 -->
            <div v-if="showAddPlayer" class="absolute right-0 mt-4 w-80 bg-base-100 rounded-lg shadow-xl z-50 ">
              <div class="card bg-white w-96">
                <div class="card-body">
                  <h2 class="card-title text-2xl font-bold pb-4">Add Player</h2>
                  <div class="flex flex-col gap-4">
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
                              class="flex items-center gap-2 p-2 hover:bg-base-100 cursor-pointer">
                              <input type="checkbox" class="checkbox" :value="player.id" v-model="selectedPlayerIds" />
                              <span>#{{ player.number }} {{ player.name }}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div class="card-actions pt-4">
                        <div class="flex gap-2">
                          <button @click.stop="addMultiplePlayers" :disabled="!selectedPlayerIds.length"
                            class="btn btn-primary btn-sm">
                            Add Selected Players ({{ selectedPlayerIds.length }})
                          </button>
                          <button @click.stop="showAddPlayer = false" class="btn btn-soft btn-sm">Cancel</button>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center text-gray-500 py-4">
                      No players available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button v-if="authStore.isAdmin" @click="deleteGame" class="btn btn-error btn-sm">
            Delete Game
          </button>
        </div>
      </div>
      <!-- 比赛基本信息 -->
      <div class=" rounded-lg shadow-lg p-6 mb-8 border">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- 比赛名称 -->
          <div class="flex items-center gap-4">
            <div v-if="!isEditing" class="text-xl font-bold">{{ game.name }}</div>
            <input v-else v-model="editingGameData.name" type="text" placeholder="Game Name"
              class="input input-bordered" />
          </div>
          <!-- 对手名称 -->
          <div class="flex items-center gap-2">
            <div v-if="!isEditing" class="text-xl font-bold">{{ game.team_stats?.opponent || '-' }}</div>
            <input v-else v-model="editingGameData.opponent" type="text" placeholder="Opponent Name"
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
          <div v-if="authStore.isAdmin" class="flex items-center gap-2">
            <template v-if="isEditing">
              <button @click="saveGameInfo" class="btn btn-primary btn-sm">Save</button>
              <button @click="cancelEdit" class="btn btn-soft btn-sm">Cancel</button>
            </template>
            <button v-else @click="startEditGameInfo" class="btn btn-primary btn-sm">Edit</button>
          </div>
        </div>
      </div>

      <div class="tabs tabs-border">
        <!-- 球队数据卡片 Team Statistics-->
        <input type="radio" name="my_tabs_2" class="tab" aria-label="Team Statistics" checked="checked" />
        <div class="tab-content">
          <div class="p-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">PTS</div>
                <div class="stat-value">
                  {{ calculateTeamPoints(teamStats) }}
                </div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">FG</div>
                <div class="stat-value">
                  {{ teamStats.FGM || 0 }}/{{ teamStats.FGA || 0 }}
                  <span class="text-gray-500 text-sm">
                    ({{ calculatePercentage(teamStats.FGM, teamStats.FGA) }})
                  </span>
                </div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">3P</div>
                <div class="stat-value">
                  {{ teamStats.threePM || 0 }}/{{ teamStats.threePA || 0 }}
                  <span class="text-gray-500 text-sm">
                    ({{ calculatePercentage(teamStats.threePM, teamStats.threePA) }})
                  </span>
                </div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">FT</div>
                <div class="stat-value">
                  {{ teamStats.FTM || 0 }}/{{ teamStats.FTA || 0 }}
                  <span class="text-gray-500 text-sm">
                    ({{ calculatePercentage(teamStats.FTM, teamStats.FTA) }})
                  </span>
                </div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">OREB</div>
                <div class="stat-value">{{ teamStats.OREB || 0 }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">DREB</div>
                <div class="stat-value">{{ teamStats.DREB || 0 }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">REB</div>
                <div class="stat-value">
                  {{ (teamStats.OREB || 0) + (teamStats.DREB || 0) }}
                  <span class="text-gray-500 text-sm">
                    ({{ teamStats.OREB || 0 }}/{{ teamStats.DREB || 0 }})
                  </span>
                </div>
              </div>

              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">AST</div>
                <div class="stat-value">{{ teamStats.AST || 0 }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">STL</div>
                <div class="stat-value">{{ teamStats.STL || 0 }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">BLK</div>
                <div class="stat-value">{{ teamStats.BLK || 0 }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">TOV</div>
                <div class="stat-value">{{ teamStats.TOV || 0 }}</div>
              </div>
              <div class="stat rounded-lg shadow-lg">
                <div class="stat-title">PF</div>
                <div class="stat-value">{{ teamStats.PF || 0 }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 球员数据表格 Box Score -->
        <input type="radio" name="my_tabs_2" class="tab" aria-label="Box Score" />
        <div class="tab-content">
          <div class="overflow-x-auto p-6">
            <div class="flex flex-col gap-4">
              <div class="flex justify-between items-center">
                <div v-if="authStore.isAdmin" class="flex gap-2">
                  <template v-if="editingMode">
                    <div class="flex gap-2 mr-4">
                      <button @click="pauseAllTimers" class="btn btn-warning btn-sm">
                        ⏸️ Pause All
                      </button>
                      <button @click="startAllTimers" class="btn btn-success btn-sm">
                        ▶️ Start All
                      </button>
                      <button @click="stopAllTimers" class="btn btn-error btn-sm">
                        ⏹️ Stop All
                      </button>
                    </div>
                    <button @click="saveBatchStats" class="btn btn-primary btn-sm">Save All</button>
                    <button @click="cancelBatchEdit" class="btn btn-soft btn-sm">Cancel</button>
                  </template>
                  <button v-else @click="startBatchEdit" class="btn btn-primary btn-sm">Edit All</button>
                </div>
              </div>
              <div class="overflow-x-auto rounded-lg shadow-lg">
                <table class="table-md table-pin-cols">
                  <thead>
                    <tr>
                      <th
                        class="sticky left-0 bg-base-200 z-10 px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer"
                        @click="sortStats('name')">
                        Player {{ getSortIcon('name') }}
                      </th>
                      <th class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('number')">
                        # {{ getSortIcon('number') }}
                      </th>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('PTS')">
                        PTS {{ getSortIcon('PTS') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('MIN')">
                        MIN {{ getSortIcon('MIN') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('FGM/FGA')">
                        FGM/FGA {{ getSortIcon('FGM/FGA') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('3PM/3PA')">
                        3PM/3PA {{ getSortIcon('3PM/3PA') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('FTM/FTA')">
                        FTM/FTA {{ getSortIcon('FTM/FTA') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('OREB/DREB')">
                        OREB/DREB {{ getSortIcon('OREB/DREB') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('AST')">
                        AST {{ getSortIcon('AST') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('STL')">
                        STL {{ getSortIcon('STL') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('BLK')">
                        BLK {{ getSortIcon('BLK') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('TOV')">
                        TOV {{ getSortIcon('TOV') }}
                      </td>
                      <td class="px-6 py-3 text-left text-md font-medium text-gray-600 cursor-pointer  "
                        @click="sortStats('PF')">
                        PF {{ getSortIcon('PF') }}
                      </td>
                      <td v-if="authStore.isAdmin" class="px-6 py-3 text-left text-md font-medium text-gray-600">
                        Action
                      </td>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="stat in sortedPlayerStats" :key="stat.playerId" class="hover:bg-base-100"
                      :class="{ 'bg-blue-50': editingMode }">
                      <th class="sticky left-0 bg-base-200 z-10 px-6 py-4 whitespace-nowrap text-start">
                        {{ stat.name }}
                      </th>
                      <td class="px-6 py-4 whitespace-nowrap">
                        {{ stat.number }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap font-semibold">
                        {{ calculatePoints(stat) }}
                      </td>
                      <td class="px-6 py-2 whitespace-nowrap">
                        <template v-if="editingMode">
                          <div class="flex items-center gap-2">
                            <template v-if="activeTimers[stat.playerId]">
                              <span class="font-mono">{{ formatTime(activeTimers[stat.playerId].minutes,
                                activeTimers[stat.playerId].seconds) }}</span>
                              <div class="flex gap-1">
                                <button v-if="activeTimers[stat.playerId].isRunning" @click="pauseTimer(stat.playerId)"
                                  class="btn btn-xs btn-soft">
                                  ⏸️
                                </button>
                                <button v-else @click="startTimer(stat.playerId)" class="btn btn-xs btn-soft">
                                  ▶️
                                </button>
                                <button @click="stopTimer(stat.playerId)" class="btn btn-xs btn-soft">
                                  ⏹️
                                </button>
                              </div>
                            </template>
                            <template v-else>
                              <input v-model="editingStats[stat.playerId].MIN" type="number" min="0" step="0.1"
                                class="w-16 px-2 py-1 border rounded">
                              <button @click="startTimer(stat.playerId)" class="btn btn-xs btn-soft">
                                ▶️
                              </button>
                            </template>
                          </div>
                        </template>
                        <template v-else>
                          <span class="font-mono">{{ formatDisplayTime(stat.MIN) }}</span>
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
                      <td v-if="authStore.isAdmin" class="px-6 py-4 whitespace-nowrap">
                        <template v-if="editingMode">
                          <div class="flex gap-2">
                            <button @click="saveBatchStats" class="btn btn-primary btn-sm">
                              Save
                            </button>
                            <button @click="cancelBatchEdit" class="btn btn-soft btn-sm">
                              Cancel
                            </button>
                          </div>
                        </template>
                        <template v-else>
                          <div class="flex gap-2">
                            <button @click="startBatchEdit" class="btn btn-primary btn-sm">
                              Edit
                            </button>
                            <button @click="removePlayer(stat.playerId)" class="btn btn-error btn-sm">
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

        <!-- 比赛视频 Game Videos-->
        <input type="radio" name="my_tabs_2" class="tab" aria-label="Game Videos" />
        <div class="tab-content">
          <div class="flex flex-col lg:flex-row gap-6 p-4 justify-start">
            <!-- 视频容器 -->
            <div class="w-full lg:w-[560px]">
              <div class="relative w-full pt-[56.25%]">
                <iframe class="absolute inset-0 w-full h-full rounded-lg shadow-lg"
                  src="https://www.youtube.com/embed/ZfXGbj61HYQ?si=ZIf-r0X9NdT_4Qt0" title="YouTube video player"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                </iframe>
              </div>
            </div>

            <!-- 第二个视频 -->
            <div class="w-full lg:w-[560px]">
              <div class="relative w-full pt-[56.25%]">
                <iframe class="absolute inset-0 w-full h-full rounded-lg shadow-lg"
                  src="https://www.youtube.com/embed/ZfXGbj61HYQ?si=ZIf-r0X9NdT_4Qt0" title="YouTube video player"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                </iframe>
              </div>
            </div>

            <!-- 第三个视频 -->
            <div class="w-full lg:w-[560px]">
              <div class="relative w-full pt-[56.25%]">
                <iframe class="absolute inset-0 w-full h-full rounded-lg shadow-lg"
                  src="https://www.youtube.com/embed/ZfXGbj61HYQ?si=ZIf-r0X9NdT_4Qt0" title="YouTube video player"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                </iframe>
              </div>
            </div>
          </div>
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
