<script setup>
import { usePlayerStore } from '@/stores/player';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const store = usePlayerStore()
const newPlayerName = ref('')
const newPlayerNumber = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const showAddDialog = ref(false)

// 确保数据加载
onMounted(async () => {
  if (store.players.length === 0) {
    await store.fetchPlayers()
  }
})

// 打开添加球员对话框
const openAddDialog = () => {
  showAddDialog.value = true
  newPlayerName.value = ''
  newPlayerNumber.value = ''
  errorMessage.value = ''
}

// 关闭添加球员对话框
const closeAddDialog = () => {
  showAddDialog.value = false
  newPlayerName.value = ''
  newPlayerNumber.value = ''
  errorMessage.value = ''
}

// 新增球员方法
const addNewPlayer = async () => {
  if (!newPlayerName.value.trim()) {
    errorMessage.value = 'Please enter the player\'s name'
    return
  }

  if (!newPlayerNumber.value) {
    errorMessage.value = 'Please enter the player\'s number'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const playerId = await store.addPlayer({
      name: newPlayerName.value.trim(),
      number: String(newPlayerNumber.value),
      stats: []
    })

    // 清空输入并跳转
    newPlayerName.value = ''
    newPlayerNumber.value = ''
    router.push(`/players/${playerId}`)
  } catch (error) {
    console.error('ADD PLAYER ERROR:', error)
    errorMessage.value = 'Add player failed, please try again'
  } finally {
    isLoading.value = false
  }
}

// 获取球员统计数据
const getPlayerStats = (playerId) => {
  return store.getPlayerStats(playerId) || []
}

// 获取球员平均数据
const getPlayerAverageStats = (playerId) => {
  return store.getPlayerAverageStats(playerId) || {}
}

// 计算命中率
const calculatePercentage = (made, attempted) => {
  if (!attempted) return 'N/A'
  return ((made / attempted) * 100).toFixed(1) + '%'
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-4 border rounded-lg shadow-lg p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 border-b pb-4">
        <h1 class="text-xl font-bold">Player Statistics</h1>
        <button @click="openAddDialog" class="btn btn-primary">Add New Player</button>
      </div>
      <!-- 球员数据表格 -->
      <div class="overflow-hidden rounded-lg shadow-lg">
        <div class="overflow-x-auto">
          <table class="min-w-full table-md">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">Player</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">Number</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">GP</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">MIN</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">AP</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">FG%</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">3P%</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">FT%</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">REB</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">AST</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">STL</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">BLK</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">TOV</th>
                <th class="px-6 py-3 text-left text-md font-medium text-gray-600">PF</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in store.players" :key="player.id" class="hover:bg-gray-100 cursor-pointer"
                @click="router.push(`/players/${player.id}`)">
                <!-- Player Name -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>{{ player.name }}</div>
                </td>
                <!-- Player Number -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>#{{ player.number || '-' }}</div>
                </td>
                <!-- GP -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>{{ getPlayerStats(player.id).length }}</div>
                </td>
                <!-- MIN -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>{{ getPlayerAverageStats(player.id)?.MIN?.toFixed(1) || '0.0' }}
                  </div>
                </td>
                <!-- AP -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>{{ getPlayerAverageStats(player.id)?.AP?.toFixed(1) || '0.0' }}
                  </div>
                </td>
                <!-- FG% -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ calculatePercentage(
                      getPlayerAverageStats(player.id)?.FGM,
                      getPlayerAverageStats(player.id)?.FGA
                    ) }}
                  </div>
                </td>
                <!-- 3P% -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ calculatePercentage(
                      getPlayerAverageStats(player.id)?.threePM,
                      getPlayerAverageStats(player.id)?.threePA
                    ) }}
                  </div>
                </td>
                <!-- FT% -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ calculatePercentage(
                      getPlayerAverageStats(player.id)?.FTM,
                      getPlayerAverageStats(player.id)?.FTA
                    ) }}
                  </div>
                </td>
                <!-- REB -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ ((getPlayerAverageStats(player.id)?.OREB || 0) +
                      (getPlayerAverageStats(player.id)?.DREB || 0)).toFixed(1) }}
                  </div>
                </td>
                <!-- AST -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ getPlayerAverageStats(player.id)?.AST?.toFixed(1) || '0.0' }}
                  </div>
                </td>
                <!-- STL -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ getPlayerAverageStats(player.id)?.STL?.toFixed(1) || '0.0' }}
                  </div>
                </td>
                <!-- BLK -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ getPlayerAverageStats(player.id)?.BLK?.toFixed(1) || '0.0' }}
                  </div>
                </td>
                <!-- TOV -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ getPlayerAverageStats(player.id)?.TOV?.toFixed(1) || '0.0' }}
                  </div>
                </td>
                <!-- PF -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    {{ getPlayerAverageStats(player.id)?.PF?.toFixed(1) || '0.0' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>


    <!-- 添加球员对话框 -->
    <div v-if="showAddDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="card bg-white w-96">
        <div class="card-body">
          <!-- Title -->
          <h2 class="card-title text-2xl font-bold pb-4">Add new player</h2>
          <!-- Form -->
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label class="floating-label">
                <span>Player Name</span>
                <input v-model="newPlayerName" type="text" placeholder="Please enter the player's name"
                  class="input input-lg" :disabled="isLoading" @keyup.enter="addNewPlayer" />
              </label>
            </div>
            <div class="flex flex-col gap-2">
              <label class="floating-label">
                <span>Player Number</span>
                <input v-model.number="newPlayerNumber" type="number" placeholder="Please enter the player's number"
                  class="input input-lg" :disabled="isLoading" @keyup.enter="addNewPlayer" />
              </label>
            </div>
            <div v-if="errorMessage" class="text-red-500 text-sm">
              {{ errorMessage }}
            </div>
            <!-- Actions -->
            <div class="card-actions">
              <div class="flex gap-2">
                <button @click="addNewPlayer" class="btn btn-primary" :disabled="isLoading">
                  {{ isLoading ? 'Adding...' : 'Confirm' }}
                </button>
                <button @click="closeAddDialog" class="btn" :disabled="isLoading">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 无数据提示 -->
    <div v-if="store.players.length === 0" class="text-center text-gray-500 mt-8">
      No player data yet
    </div>
  </div>
</template>
