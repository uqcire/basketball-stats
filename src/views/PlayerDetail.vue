<script setup>
import PlayerStatsTable from '@/components/PlayerStatsTable.vue';
import RecordForm from '@/components/RecordForm.vue';
import { usePlayerStore } from '@/stores/player';
import { useGameStore } from '@/stores/game';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const gameStore = useGameStore()
const showAddRecord = ref(false)

const playerId = computed(() => Number(route.params.id))
const player = computed(() => playerStore.players.find(p => p.id === playerId.value))
const playerStats = computed(() => playerStore.getPlayerStats(playerId.value))
const playerAverageStats = computed(() => playerStore.getPlayerAverageStats(playerId.value))

// 确保数据加载
onMounted(async () => {
  if (playerStore.players.length === 0) {
    await playerStore.fetchPlayers()
  }
  if (gameStore.games.length === 0) {
    await gameStore.fetchGames()
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

// 处理添加记录
const handleAddRecord = (record) => {
  if (player.value) {
    // 创建新比赛
    const gameId = gameStore.addGame({
      name: `Game ${gameStore.games.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      playerStats: []
    })

    // 更新球员数据
    playerStore.updatePlayerStats(player.value.id, gameId, {
      ...record,
      // 自动计算PTS
      PTS: (record.FGM * 2) + (record.threePM * 3) + record.FTM
    })

    showAddRecord.value = false
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
      <button @click="showAddRecord = true" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        添加比赛记录
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

    <!-- 添加记录弹窗 -->
    <RecordForm v-if="showAddRecord" @submit="handleAddRecord" @cancel="showAddRecord = false" />
  </div>
  <div v-else class="p-4">
    <div class="text-center text-gray-500">加载中...</div>
  </div>
</template>
