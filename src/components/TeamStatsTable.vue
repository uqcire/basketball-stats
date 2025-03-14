<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  stats: {
    type: Array,
    required: true
  },
  editingGameId: {
    type: [Number, String],
    default: null
  },
  editingGameName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['start-edit', 'save-edit', 'cancel-edit', 'update:editingGameName'])

const headers = [
  'GAME', 'GR', 'GT', 'PTS', 'FGM', 'FGA', 'FG%',
  '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%',
  'OREB', 'DREB', 'REB', 'AST', 'TOV', 'STL', 'BLK', 'PF'
]

const calculatePTS = (record) => {
  return (record.FGM * 2) + (record.threePM * 3) + record.FTM
}

const calculatePercentage = (made, attempted) => {
  if (!attempted) return 'N/A'
  return ((made / attempted) * 100).toFixed(1) + '%'
}

const calculateREB = (record) => {
  return (record.OREB || 0) + (record.DREB || 0)
}

const handleInput = (event) => {
  emit('update:editingGameName', event.target.value)
}

const goToGameDetail = (gameId) => {
  if (props.editingGameId === gameId) return
  router.push(`/game/${gameId}`)
}
</script>

<template>
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="">
      <tr>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Game
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Date
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          GR
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          GT
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          PTS
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          FG
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          3FG
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          FT
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          REB
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
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr v-for="stat in stats" :key="stat.id" class="hover:bg-gray-50 cursor-pointer" @click="goToGameDetail(stat.id)">
        <td class="px-6 py-4 whitespace-nowrap">
          <div v-if="editingGameId === stat.id" class="flex items-center space-x-2" @click.stop>
            <input type="text" :value="editingGameName" @input="handleInput" class="border rounded px-2 py-1 text-sm"
              @keyup.enter="emit('save-edit')" @keyup.esc="emit('cancel-edit')">
            <button @click="emit('save-edit')" class="text-green-600 hover:text-green-800">
              <span class="text-sm">✓</span>
            </button>
            <button @click="emit('cancel-edit')" class="text-red-600 hover:text-red-800">
              <span class="text-sm">✕</span>
            </button>
          </div>
          <div v-else class="flex items-center space-x-2">
            <span>{{ stat.name }}</span>
            <button @click.stop="emit('start-edit', stat)" class="text-gray-400 hover:text-gray-600">
              <span class="text-sm">✎</span>
            </button>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          {{ stat.date }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          {{ stat.GR }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          {{ stat.GT }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap font-semibold">
          {{ stat.PTS }}
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
        <td class="px-6 py-4 whitespace-nowrap">
          {{ stat.TOV }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          {{ stat.PF }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
