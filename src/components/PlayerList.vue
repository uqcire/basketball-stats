<script setup>
defineProps({
  players: {
    type: Array,
    default: () => [
      { id: 1, name: 'LeBron James', number: 23, position: 'SF', pts: 28.5, reb: 8.2 },
      { id: 2, name: 'Stephen Curry', number: 30, position: 'PG', pts: 31.2, reb: 5.4 }
    ]
  }
})
</script>

<template>
  <div class="bg-base-100 rounded-box shadow p-4">
    <h2 class="text-xl font-bold mb-4 text-primary">球员列表</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="player in players" :key="player.id"
        class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
        <div class="card-body p-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="card-title text-base">#{{ player.number }} {{ player.name }}</h3>
              <div class="text-sm text-gray-500">位置: {{ player.position }}</div>
            </div>
            <button @click="$emit('select', player)" class="btn btn-sm btn-ghost text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15l-4.243-4.243 1.415-1.414L12 12.172l2.828-2.829 1.415 1.414L12 15z" />
              </svg>
            </button>
          </div>

          <div class="stats stats-vertical md:stats-horizontal shadow bg-base-200 mt-2">
            <div class="stat p-2">
              <div class="stat-title">得分</div>
              <div class="stat-value text-secondary text-lg">{{ player.pts }}</div>
            </div>
            <div class="stat p-2">
              <div class="stat-title">篮板</div>
              <div class="stat-value text-accent text-lg">{{ player.reb }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
