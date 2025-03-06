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

// 获取该场比赛的所有球员数据
const playerStats = computed(() => {
  if (!game.value) return []

  return game.value.playerStats.map(stat => {
    const player = playerStore.players.find(p => p.id === stat.playerId)
    return {
      ...stat,
      name: player?.name || 'Unknown Player',
      number: player?.number || '-'
    }
  }).filter(stat => stat.MIN > 0) // 只显示上场的球员
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
  router.push('/team')
}

// 跳转到球员详情页
const goToPlayerDetail = (playerId) => {
  router.push(`/players/${playerId}`)
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
    </div>

    <!-- 比赛基本信息 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-gray-600">比赛结果</div>
          <div class="text-2xl font-bold">{{ game.GR }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-600">比赛类型</div>
          <div class="text-2xl font-bold">{{ game.GT }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-600">比赛日期</div>
          <div class="text-2xl font-bold">{{ game.date }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-600">上场人数</div>
          <div class="text-2xl font-bold">{{ game.teamStats.playerCount }}</div>
        </div>
      </div>
    </div>

    <!-- 球队数据卡片 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">球队数据</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card">
          <div class="text-gray-600">得分</div>
          <div class="text-2xl font-bold">
            {{ (game.teamStats.FGM * 2) + (game.teamStats.threePM * 3) + game.teamStats.FTM }}
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">投篮</div>
          <div class="text-2xl font-bold">
            {{ calculatePercentage(game.teamStats.FGM, game.teamStats.FGA) }}
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">三分</div>
          <div class="text-2xl font-bold">
            {{ calculatePercentage(game.teamStats.threePM, game.teamStats.threePA) }}
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">罚球</div>
          <div class="text-2xl font-bold">
            {{ calculatePercentage(game.teamStats.FTM, game.teamStats.FTA) }}
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">篮板</div>
          <div class="text-2xl font-bold">
            {{ game.teamStats.OREB + game.teamStats.DREB }}
          </div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">助攻</div>
          <div class="text-2xl font-bold">{{ game.teamStats.AST }}</div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">抢断</div>
          <div class="text-2xl font-bold">{{ game.teamStats.STL }}</div>
        </div>
        <div class="stat-card">
          <div class="text-gray-600">盖帽</div>
          <div class="text-2xl font-bold">{{ game.teamStats.BLK }}</div>
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
            <tr v-for="stat in playerStats" :key="stat.playerId" class="hover:bg-gray-50 cursor-pointer"
              @click="goToPlayerDetail(stat.playerId)">
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
                {{ stat.MIN }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.FGM }}/{{ stat.FGA }}
                <span class="text-gray-500 text-sm">
                  ({{ calculatePercentage(stat.FGM, stat.FGA) }})
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.threePM }}/{{ stat.threePA }}
                <span class="text-gray-500 text-sm">
                  ({{ calculatePercentage(stat.threePM, stat.threePA) }})
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.FTM }}/{{ stat.FTA }}
                <span class="text-gray-500 text-sm">
                  ({{ calculatePercentage(stat.FTM, stat.FTA) }})
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.OREB + stat.DREB }}
                <span class="text-gray-500 text-sm">
                  ({{ stat.OREB }}/{{ stat.DREB }})
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.AST }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.STL }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ stat.BLK }}
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
