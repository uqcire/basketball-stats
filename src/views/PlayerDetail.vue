<script setup>
import PlayerStatsTable from '@/components/PlayerStatsTable.vue';
import RecordForm from '@/components/RecordForm.vue';
import { usePlayersStore } from '@/stores/players';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const store = usePlayersStore()
const showAddRecord = ref(false)

// 获取当前球员数据（增加空值保护）
const player = computed(() => {
  const currentPlayer = store.players.find(p => p.id === Number(route.params.id))
  if (!currentPlayer) {
    router.push('/players?error=player_not_found')
    return null
  }
  return currentPlayer
})

// 确保数据加载
onMounted(async () => {
  if (store.players.length === 0) {
    await store.fetchPlayers()
  }
})

// 计算平均数据（增加类型安全）
const averageStats = computed(() => {
  if (!player.value || !player.value.stats.length) return {
    PTS: 0,
    FGM: 0,
    FGA: 0,
    threePM: 0,
    threePA: 0,
    FTM: 0,
    FTA: 0
  }
  const stats = store.averageStats(Number(route.params.id))
  return {
    ...stats,
    PTS: ((stats.FGM || 0) * 2) + ((stats.threePM || 0) * 3) + (stats.FTM || 0)
  }
})

// 处理添加记录
const handleAddRecord = (record) => {
  if (player.value) {
    store.addGameRecord(player.value.id, {
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
            <span class="font-bold">{{ player.stats.length }}</span>
          </div>
          <div class="flex justify-between">
            <span>场均得分:</span>
            <span class="font-bold">{{ averageStats.PTS?.toFixed(1) || '0.0' }}</span>
          </div>
          <div class="flex justify-between">
            <span>命中率:</span>
            <span class="font-bold">
              {{
                averageStats.FGA > 0
                  ? ((averageStats.FGM / averageStats.FGA) * 100).toFixed(1) + '%'
                  : 'N/A'
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- 详细数据表格 -->
      <div class="p-4 border rounded bg-white shadow">
        <h3 class="text-lg font-semibold mb-4">比赛记录详情</h3>
        <PlayerStatsTable :stats="player.stats" class="max-h-[500px] overflow-auto" />
      </div>
    </div>

    <!-- 添加记录弹窗 -->
    <RecordForm v-if="showAddRecord" @submit="handleAddRecord" @cancel="showAddRecord = false" />
  </div>
  <div v-else class="p-4">
    <div class="text-center text-gray-500">加载中...</div>
  </div>
</template>
