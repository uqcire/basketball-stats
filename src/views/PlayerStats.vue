<script setup>

import { usePlayersStore } from '@/stores/players';
import { ref } from 'vue';

const store = usePlayersStore()
const newPlayerName = ref('')

// 新增球员方法
const addNewPlayer = () => {
  if (newPlayerName.value.trim()) {
    store.addPlayer({ name: newPlayerName.value.trim() })
    newPlayerName.value = ''
  }
}

// 计算得分（PTS = 2分球得分 + 3分球得分 + 罚球得分）
const calculatePTS = (stats) => {
  return stats.reduce((sum, curr) => {
    return sum + (curr.FGM * 2) + (curr.threePM * 3) + curr.FTM
  }, 0)
}

// 计算命中率
const calculateFGPercentage = (stats) => {
  if (stats.length === 0) return 0
  const totalFGM = stats.reduce((sum, curr) => sum + curr.FGM, 0)
  const totalFGA = stats.reduce((sum, curr) => sum + curr.FGA, 0)
  return totalFGA === 0 ? 0 : ((totalFGM / totalFGA) * 100).toFixed(1)
}

// 计算效率值（简易公式）
const calculateEfficiency = (stats) => {
  if (stats.length === 0) return 0
  return stats.reduce((sum, curr) => {
    return sum + (curr.PTS + curr.REB + curr.AST + curr.STL + curr.BLK
      - (curr.FGA - curr.FGM) - (curr.FTA - curr.FTM) - curr.TOV)
  }, 0) / stats.length
}

</script>

<template>
  <div class="p-4">
    <div class="flex flex-col md:flex-row justify-between mb-4 gap-2">
      <h2 class="text-2xl font-bold">全体球员数据</h2>
      <div class="flex gap-2">
        <input v-model="newPlayerName" placeholder="输入新球员姓名" class="px-2 border rounded" @keyup.enter="addNewPlayer" />
        <button @click="addNewPlayer" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          添加新球员
        </button>
      </div>
    </div>

    <!-- 球员列表 -->
    <div v-for="player in store.players" :key="player.id"
      class="mb-4 p-4 border rounded hover:shadow-lg transition-shadow">
      <router-link :to="`/players/${player.id}`" class="block hover:text-blue-500 transition-colors">
        <h3 class="text-xl font-bold">{{ player.name }}</h3>
        <span class="text-sm text-gray-500">ID: {{ player.id }}</span>
      </router-link>

      <!-- 关键数据速览 -->
      <div v-if="player.stats.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        <div class="p-2 bg-gray-100 rounded">
          <div class="text-sm text-gray-500">比赛场次</div>
          <div class="font-bold">{{ player.stats.length }}</div>
        </div>

        <div class="p-2 bg-gray-100 rounded">
          <div class="text-sm text-gray-500">场均得分</div>
          <div class="font-bold">
            {{ (calculatePTS(player.stats) / player.stats.length).toFixed(1) }}
          </div>
        </div>

        <div class="p-2 bg-gray-100 rounded">
          <div class="text-sm text-gray-500">命中率</div>
          <div class="font-bold">{{ calculateFGPercentage(player.stats) }}%</div>
        </div>

        <div class="p-2 bg-gray-100 rounded">
          <div class="text-sm text-gray-500">效率值</div>
          <div class="font-bold">{{ calculateEfficiency(player.stats).toFixed(1) }}</div>
        </div>
      </div>

      <div v-else class="mt-2 text-gray-500">
        暂无比赛数据
      </div>
    </div>
  </div>
</template>
