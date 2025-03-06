<script setup>
import { usePlayerStore } from '@/stores/player';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const store = usePlayerStore()
const newPlayerName = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// 确保数据加载
onMounted(async () => {
  if (store.players.length === 0) {
    await store.fetchPlayers()
  }
})

// 新增球员方法
const addNewPlayer = async () => {
  if (!newPlayerName.value.trim()) {
    errorMessage.value = '请输入球员姓名'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const playerId = store.addPlayer({
      name: newPlayerName.value.trim(),
      number: '',
      position: '',
      height: '',
      weight: '',
      birthdate: '',
      stats: []
    })

    // 清空输入并跳转
    newPlayerName.value = ''
    router.push(`/players/${playerId}`)
  } catch (error) {
    console.error('添加球员失败:', error)
    errorMessage.value = '添加球员失败，请重试'
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
  <div class="p-4">
    <div class="flex flex-col md:flex-row justify-between mb-4 gap-2">
      <h2 class="text-2xl font-bold">全体球员数据</h2>
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <input v-model="newPlayerName" placeholder="输入新球员姓名" class="px-2 border rounded" :disabled="isLoading"
            @keyup.enter="addNewPlayer" />
          <button @click="addNewPlayer"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            :disabled="isLoading">
            {{ isLoading ? '添加中...' : '添加新球员' }}
          </button>
        </div>
        <div v-if="errorMessage" class="text-red-500 text-sm">
          {{ errorMessage }}
        </div>
      </div>
    </div>

    <!-- 球员列表 -->
    <div v-for="player in store.players" :key="player.id"
      class="mb-4 p-4 border rounded hover:shadow-lg transition-shadow">
      <router-link :to="`/players/${player.id}`" class="block hover:text-blue-500 transition-colors">
        <h3 class="text-xl font-bold">{{ player.name }}</h3>
        <div class="text-sm text-gray-500">
          <span>ID: {{ player.id }}</span>
          <span v-if="player.number" class="ml-2">号码: {{ player.number }}</span>
          <span v-if="player.position" class="ml-2">位置: {{ player.position }}</span>
        </div>
      </router-link>

      <!-- 关键数据速览 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        <div class="p-2 bg-gray-100 rounded">
          <div class="text-sm text-gray-500">比赛场次</div>
          <div class="font-bold">{{ getPlayerStats(player.id).length }}</div>
        </div>

        <div class="p-2 bg-gray-100 rounded">
          <div class="text-sm text-gray-500">场均得分</div>
          <div class="font-bold">
            {{ getPlayerAverageStats(player.id)?.PTS?.toFixed(1) || '0.0' }}
          </div>
        </div>

        <div class="p-2 bg-gray-100 rounded">
          <div class="text-sm text-gray-500">命中率</div>
          <div class="font-bold">
            {{ calculatePercentage(
              getPlayerAverageStats(player.id)?.FGM,
              getPlayerAverageStats(player.id)?.FGA
            ) }}
          </div>
        </div>

        <div class="p-2 bg-gray-100 rounded">
          <div class="text-sm text-gray-500">三分命中率</div>
          <div class="font-bold">
            {{ calculatePercentage(
              getPlayerAverageStats(player.id)?.threePM,
              getPlayerAverageStats(player.id)?.threePA
            ) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-if="store.players.length === 0" class="text-center text-gray-500 mt-8">
      暂无球员数据
    </div>
  </div>
</template>
