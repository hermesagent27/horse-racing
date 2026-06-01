<script setup lang="ts">
const { data: auth, refresh } = await useFetch('/api/auth/status')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refresh()
  await navigateTo('/login')
}

const menuItems = [
  { label: 'Races', path: '/races', icon: 'lucide:calendar' },
  { label: 'Bets', path: '/bets', icon: 'lucide:ticket' },
  { label: 'Bankroll', path: '/bankroll', icon: 'lucide:wallet' },
  { label: 'History', path: '/history', icon: 'lucide:history' },
]
</script>

<template>
  <div class="navbar bg-base-100 shadow-sm sticky top-0 z-50">
    <!-- Logo -->
    <div class="navbar-start">
      <NuxtLink to="/races" class="btn btn-ghost text-xl gap-2">
        <span>🏇</span>
        <span class="hidden sm:inline">Horse Racing Tracker</span>
      </NuxtLink>
    </div>

    <!-- Desktop Navigation -->
    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1">
        <li v-for="item in menuItems" :key="item.path">
          <NuxtLink :to="item.path" class="gap-2">
            <Icon :name="item.icon" class="w-4 h-4" />
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Right Side Actions -->
    <div class="navbar-end gap-2">
      <!-- Mobile Menu Dropdown -->
      <div class="dropdown dropdown-end lg:hidden">
        <label tabindex="0" class="btn btn-ghost btn-circle">
          <Icon name="lucide:menu" class="w-5 h-5" />
        </label>
        <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
          <li v-for="item in menuItems" :key="item.path">
            <NuxtLink :to="item.path">
              <Icon :name="item.icon" class="w-4 h-4" />
              {{ item.label }}
            </NuxtLink>
          </li>
          <li class="menu-divider"></li>
          <li>
            <button @click="logout">
              <Icon name="lucide:log-out" class="w-4 h-4" />
              Logout
            </button>
          </li>
        </ul>
      </div>

      <!-- Desktop Logout -->
      <button class="btn btn-ghost btn-sm hidden lg:flex" @click="logout">
        <Icon name="lucide:log-out" class="w-4 h-4" />
        Logout
      </button>
    </div>
  </div>
</template>
