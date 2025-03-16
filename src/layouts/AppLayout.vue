<script setup></script>

<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto p-4">
      <header class="mb-16">
        <div class="navbar bg-primary text-white p-2">
          <button class="btn btn-ghost text-xl">
            <RouterLink to="/">Team</RouterLink>
          </button>
          <button class="btn btn-ghost text-xl">
            <RouterLink to="/players">Players</RouterLink>
          </button>
        </div>
      </header>
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>
