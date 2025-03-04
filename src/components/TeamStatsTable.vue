<script setup>
defineProps({
  stats: {
    type: Array,
    required: true,
    default: () => []
  }
})

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
</script>

<template>
  <table class="min-w-full table-auto border-collapse">
    <thead>
      <tr class="bg-gray-100">
        <th v-for="header in headers" :key="header" class="border p-2 text-center font-semibold">
          {{ header }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(record, index) in stats" :key="index" class="hover:bg-gray-50">
        <td class="border p-2 text-center">{{ record.GAME }}</td>
        <td class="border p-2 text-center">{{ record.GR }}</td>
        <td class="border p-2 text-center">{{ record.GT }}</td>
        <td class="border p-2 text-center font-semibold">{{ calculatePTS(record) }}</td>
        <td class="border p-2 text-center">{{ record.FGM }}</td>
        <td class="border p-2 text-center">{{ record.FGA }}</td>
        <td class="border p-2 text-center">{{ calculatePercentage(record.FGM, record.FGA) }}</td>
        <td class="border p-2 text-center">{{ record.threePM }}</td>
        <td class="border p-2 text-center">{{ record.threePA }}</td>
        <td class="border p-2 text-center">{{ calculatePercentage(record.threePM, record.threePA) }}</td>
        <td class="border p-2 text-center">{{ record.FTM }}</td>
        <td class="border p-2 text-center">{{ record.FTA }}</td>
        <td class="border p-2 text-center">{{ calculatePercentage(record.FTM, record.FTA) }}</td>
        <td class="border p-2 text-center">{{ record.OREB }}</td>
        <td class="border p-2 text-center">{{ record.DREB }}</td>
        <td class="border p-2 text-center font-semibold">{{ calculateREB(record) }}</td>
        <td class="border p-2 text-center">{{ record.AST }}</td>
        <td class="border p-2 text-center">{{ record.TOV }}</td>
        <td class="border p-2 text-center">{{ record.STL }}</td>
        <td class="border p-2 text-center">{{ record.BLK }}</td>
        <td class="border p-2 text-center">{{ record.PF }}</td>
      </tr>
    </tbody>
  </table>
</template>
