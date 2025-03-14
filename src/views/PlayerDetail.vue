<script setup>
import PlayerStatsTable from '@/components/PlayerStatsTable.vue';
import { usePlayerStore } from '@/stores/player';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const playerId = computed(() => Number(route.params.id))
const player = computed(() => playerStore.players.find(p => p.id === playerId.value))
const playerStats = computed(() => playerStore.getPlayerStats(playerId.value))
const playerAverageStats = computed(() => playerStore.getPlayerAverageStats(playerId.value))

// 编辑状态管理
const isEditing = ref(false)
const editingName = ref('')
const editingNumber = ref('')

// 开始编辑
const startEdit = () => {
  editingName.value = player.value.name
  editingNumber.value = player.value.number
  isEditing.value = true
}

// 保存编辑
const saveEdit = async () => {
  if (!editingName.value.trim()) {
    alert('请输入球员姓名')
    return
  }

  try {
    await playerStore.updatePlayer(player.value.id, {
      ...player.value,
      name: editingName.value.trim(),
      number: String(editingNumber.value)
    })
    isEditing.value = false
  } catch (error) {
    console.error('Error updating player:', error)
    alert('保存失败，请重试')
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editingName.value = ''
  editingNumber.value = ''
}

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
      <div v-if="!isEditing" class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-xl text-gray-600">#{{ player.number || '-' }}</span>
          <h1 class="text-2xl font-bold">{{ player.name }}</h1>
        </div>
        <button @click="startEdit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          编辑信息
        </button>
      </div>
      <div v-else class="flex items-center gap-2">
        <div class="flex gap-2">
          <input v-model.number="editingNumber" type="number" min="0" placeholder="球员号码"
            class="px-2 py-1 border rounded w-24" />
          <input v-model="editingName" type="text" placeholder="球员姓名" class="px-2 py-1 border rounded" />
        </div>
        <div class="flex gap-2">
          <button @click="saveEdit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            保存
          </button>
          <button @click="cancelEdit" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            取消
          </button>
        </div>
      </div>
      <button @click="deletePlayer" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
        删除球员
      </button>
    </div>

    <!-- 数据展示 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 生涯数据总览 -->
      <div class="p-4 border rounded bg-white shadow">
        <h3 class="text-lg font-semibold mb-4">生涯数据总览</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card">
            <div class="text-gray-600">比赛场次</div>
            <div class="text-2xl font-bold">{{ playerStats.length }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均得分</div>
            <div class="text-2xl font-bold">{{ playerAverageStats?.PTS?.toFixed(1) || '0.0' }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">投篮命中率</div>
            <div class="text-2xl font-bold">
              {{ calculatePercentage(playerAverageStats?.FGM, playerAverageStats?.FGA) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">三分命中率</div>
            <div class="text-2xl font-bold">
              {{ calculatePercentage(playerAverageStats?.threePM, playerAverageStats?.threePA) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">罚球命中率</div>
            <div class="text-2xl font-bold">
              {{ calculatePercentage(playerAverageStats?.FTM, playerAverageStats?.FTA) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均篮板</div>
            <div class="text-2xl font-bold">
              {{ ((playerAverageStats?.OREB || 0) + (playerAverageStats?.DREB || 0)).toFixed(1) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均助攻</div>
            <div class="text-2xl font-bold">{{ playerAverageStats?.AST?.toFixed(1) || '0.0' }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均抢断</div>
            <div class="text-2xl font-bold">{{ playerAverageStats?.STL?.toFixed(1) || '0.0' }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均盖帽</div>
            <div class="text-2xl font-bold">{{ playerAverageStats?.BLK?.toFixed(1) || '0.0' }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均失误</div>
            <div class="text-2xl font-bold">{{ playerAverageStats?.TOV?.toFixed(1) || '0.0' }}</div>
          </div>
          <div class="stat-card">
            <div class="text-gray-600">场均犯规</div>
            <div class="text-2xl font-bold">{{ playerAverageStats?.PF?.toFixed(1) || '0.0' }}</div>
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
