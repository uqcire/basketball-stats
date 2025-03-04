<script setup>

import { ref } from 'vue';

const showAddForm = ref(false)

</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">Player Statistics</h1>
      <button @click="showAddForm = true" class="btn btn-primary">
        <span class="i-heroicons-plus-circle-20-solid"></span>
        Add Record A
      </button>
    </div>

  </div>
</template>
