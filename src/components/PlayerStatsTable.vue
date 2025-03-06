<script setup>
defineProps({
  stats: {
    type: Array,
    required: true,
    default: () => []
  }
})

const headers = [
  'GAME', 'GR', 'GT', 'GP', 'MIN', 'PTS', 'FGM', 'FGA', 'FG%',
  '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%',
  'OREB', 'DREB', 'REB', 'AST', 'TOV', 'STL', 'BLK', 'PF'
]

const calculatePTS = (record) => {
  return (record.FGM * 2) + (record.threePM * 3) + record.FTM
}
const calculateFG = (record) => {
  return ((record.FGM) / (record.FGA) * 100).toFixed(2) + '%'
}
const calculateThree = (record) => {
  return ((record.threePM) / (record.threePA) * 100).toFixed(2) + '%'
}
const calculateFT = (record) => {
  return ((record.FTM) / (record.FTA) * 100).toFixed(2) + '%'
}
const calculateREB = (record) => {
  return (record.OREB || 0) + (record.DREB || 0)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full table-auto border-collapse">
      <thead>
        <tr class="text-center bg-gray-100">
          <th v-for="header in headers" :key="header" class="border p-2">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr class="text-center hover:bg-gray-50" v-for="(record, index) in stats" :key="index">
          <td class="border p-2">{{ record.GAME || index + 1 }}</td>
          <td class="border p-2">{{ record.GR || '-' }}</td>
          <td class="border p-2">{{ record.GT || '-' }}</td>
          <td class="border p-2">{{ index + 1 }}</td>
          <td class="border p-2">{{ record.MIN || 0 }}</td>
          <td class="border p-2">{{ calculatePTS(record) }}</td>
          <td class="border p-2">{{ record.FGM || 0 }}</td>
          <td class="border p-2">{{ record.FGA || 0 }}</td>
          <td class="border p-2">{{ calculateFG(record) }}</td>
          <td class="border p-2">{{ record.threePM || 0 }}</td>
          <td class="border p-2">{{ record.threePA || 0 }}</td>
          <td class="border p-2">{{ calculateThree(record) }}</td>
          <td class="border p-2">{{ record.FTM || 0 }}</td>
          <td class="border p-2">{{ record.FTA || 0 }}</td>
          <td class="border p-2">{{ calculateFT(record) }}</td>
          <td class="border p-2">{{ record.OREB || 0 }}</td>
          <td class="border p-2">{{ record.DREB || 0 }}</td>
          <td class="border p-2">{{ calculateREB(record) }}</td>
          <td class="border p-2">{{ record.AST || 0 }}</td>
          <td class="border p-2">{{ record.TOV || 0 }}</td>
          <td class="border p-2">{{ record.STL || 0 }}</td>
          <td class="border p-2">{{ record.BLK || 0 }}</td>
          <td class="border p-2">{{ record.PF || 0 }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
