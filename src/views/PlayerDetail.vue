<script setup>
import PlayerStatsTable from '@/components/PlayerStatsTable.vue';
import { usePlayerStore } from '@/stores/player';
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const playerId = computed(() => Number(route.params.id))
const player = computed(() => playerStore.players.find(p => p.id === playerId.value))
const playerStats = computed(() => playerStore.getPlayerStats(playerId.value))
const playerAverageStats = computed(() => playerStore.getPlayerAverageStats(playerId.value))

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

// 返回球员列表
const goBack = () => {
  router.push('/players')
}

// 删除球员
const deletePlayer = async () => {
  if (confirm('确定要删除该球员吗？此操作将同时删除该球员的所有比赛记录，且不可恢复。')) {
    try {
      await playerStore.deletePlayer(player.value.id)
      router.push('/players')
    } catch (error) {
      console.error('Error deleting player:', error)
      alert('删除失败，请重试')
    }
  }
}
</script>

<template>
  <div v-if="player" class="p-4">
    <!-- 返回按钮修正路径 -->
    <router-link to="/players" class="mb-4 inline-block text-blue-500 hover:text-blue-700">
      ← 返回总览
    </router-link>

    <!-- 球员信息头 -->
    <div class="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
      <h1 class="text-2xl font-bold">{{ player.name }}</h1>
      <button @click="deletePlayer" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
        删除球员
      </button>
    </div>

    <!-- 数据展示 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 生涯数据总览 -->
      <div class="p-4 border rounded bg-white shadow">
        <h3 class="text-lg font-semibold mb-4">生涯数据总览</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>比赛场次:</span>
            <span class="font-bold">{{ playerStats.length }}</span>
          </div>
          <div class="flex justify-between">
            <span>场均得分:</span>
            <span class="font-bold">{{ playerAverageStats?.PTS?.toFixed(1) || '0.0' }}</span>
          </div>
          <div class="flex justify-between">
            <span>命中率:</span>
            <span class="font-bold">
              {{ calculatePercentage(playerAverageStats?.FGM, playerAverageStats?.FGA) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 详细数据表格 -->
      <div class="p-4 border rounded bg-white shadow">
        <h3 class="text-lg font-semibold mb-4">比赛记录详情</h3>
        <PlayerStatsTable :stats="playerStats" class="max-h-[500px] overflow-auto" />
      </div>
    </div>
  </div>
  <div v-else class="p-4">
    <div class="text-center text-gray-500">加载中...</div>
  </div>
</template>
