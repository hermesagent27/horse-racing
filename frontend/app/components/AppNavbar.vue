<script setup lang="ts">
const mobileMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const menuButtonRef = ref<HTMLElement | null>(null)

// Close on click outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  
  // Don't close if clicking inside menu or menu button
  if (
    menuRef.value?.contains(target) ||
    menuButtonRef.value?.contains(target)
  ) {
    return
  }
  
  mobileMenuOpen.value = false
}

// Close on escape key
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    mobileMenuOpen.value = false
  }
}

// Add/remove event listeners when menu state changes
watch(mobileMenuOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden' // Prevent scrolling when menu open
  } else {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})

const { data: auth, refresh } = await useFetch('/api/auth/status')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  mobileMenuOpen.value = false
  await refresh()
  await navigateTo('/login')
}

const menuItems = [
  { label: 'Races', path: '/races', icon: 'lucide:calendar' },
  { label: 'Upload', path: '/upload', icon: 'lucide:upload' },
  { label: 'Bets', path: '/bets', icon: 'lucide:ticket' },
  { label: 'Bankroll', path: '/bankroll', icon: 'lucide:wallet' },
  { label: 'History', path: '/history', icon: 'lucide:history' },
]

const currentRoute = useRoute()

// Close menu when route changes (on mobile after navigation)
watch(() => currentRoute.path, () => {
  mobileMenuOpen.value = false
})
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
      <!-- Mobile Menu Toggle -->
      <button
        ref="menuButtonRef"
        class="btn btn-ghost btn-circle lg:hidden"
        :class="{ 'btn-active': mobileMenuOpen }"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <Icon :name="mobileMenuOpen ? 'lucide:x' : 'lucide:menu'" class="w-5 h-5" />
      </button>

      <!-- Desktop Logout -->
      <button class="btn btn-ghost btn-sm hidden lg:inline-flex" @click="logout">
        <Icon name="lucide:log-out" class="w-4 h-4" />
        Logout
      </button>
    </div>
  </div>

  <!-- Mobile Backdrop (dims screen when menu open) -->
  <transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="mobileMenuOpen = false"
    />
  </transition>

  <!-- Mobile Menu Dropdown -->
  <transition
    enter-active-class="transition-all duration-200 origin-top-right"
    leave-active-class="transition-all duration-200 origin-top-right"
    enter-from-class="opacity-0 scale-95 -translate-y-2"
    leave-to-class="opacity-0 scale-95 -translate-y-2"
  >
    <div
      ref="menuRef"
      v-if="mobileMenuOpen"
      class="fixed right-4 top-16 z-50 w-52 bg-base-100 shadow-xl rounded-box p-2 lg:hidden"
    >
      <ul class="menu menu-sm">
        <li v-for="item in menuItems" :key="item.path">
          <NuxtLink
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3"
            :class="{ 'active': currentRoute.path === item.path }"
            @click="mobileMenuOpen = false"
          >
            <Icon :name="item.icon" class="w-4 h-4" />
            {{ item.label }}
          </NuxtLink>
        </li>
        
        <li class="divider my-1"></li>
        
        <li>
          <button
            class="flex items-center gap-3 px-4 py-3 w-full text-left"
            @click="logout"
          >
            <Icon name="lucide:log-out" class="w-4 h-4" />
            Logout
          </button>
        </li>
      </ul>
    </div>
  </transition>
</template>
