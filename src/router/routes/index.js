import { usePlayersStore } from '@/stores/players'

export const Routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: 'Homepage',
    },

  },
  {
    path: '/players',
    name: 'PlayerStats',
    component: () => import('@/views/PlayerStats.vue'),
    meta: {
      title: 'Player Stats',
      layout: 'AppLayout'
    },

  },
  {
    path: '/players/:id',
    name: 'PlayerDetail',
    component: () => import('@/views/PlayerDetail.vue'),
    props: true,
    beforeEnter: async (to, from, next) => {
      const store = usePlayersStore()
      // 确保数据已加载
      if (store.players.length === 0) {
        await store.fetchPlayers()
      }
      const playerExists = store.players.some(p => p.id === Number(to.params.id))
      playerExists ? next() : next('/players?error=player_not_found')
    },
    meta: {
      title: 'Player Detail',
      layout: 'AppLayout'
    },

  },
  {
    path: '/team',
    name: 'TeamStats',
    component: () => import('@/views/TeamStats.vue'),
    meta: {
      title: 'Team Stats',
      layout: 'AppLayout'
    },

  },
]
