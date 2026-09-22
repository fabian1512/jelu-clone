<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import Avatar from 'vue-avatar-sdh'
import { key } from '../../store'

const emit = defineEmits<{
  close: []
}>()

const store = useStore(key)
const { t } = useI18n({ inheritLocale: true, useScope: 'global' })

const username = computed(() => store.getters.getUsername)
const isLogged = computed(() => store.getters.getLogged)
const isAdmin = computed(() => store.getters.isAdmin)

const mainLinks = computed(() => [
  { to: '/', icon: 'mdi mdi-bookshelf', label: t('nav.my_books') },
  { to: '/to-read', icon: 'mdi mdi-home', label: t('nav.dashboard') },
  { to: '/reading-list', icon: 'mdi mdi-book-open-page-variant', label: t('nav.to_read') },
  { to: '/random', icon: 'mdi mdi-shuffle', label: t('nav.random') },
  { to: '/history', icon: 'mdi mdi-history', label: t('nav.history') },
  { to: '/reviews', icon: 'mdi mdi-star', label: t('nav.activity') },
  { to: '/authors', icon: 'mdi mdi-account-group', label: t('book.author', 2) },
  { to: '/profile/imports', icon: 'mdi mdi-file-import', label: t('settings.imports') },
  { to: '/profile/stats', icon: 'mdi mdi-chart-bar', label: t('stats.yearly_stats') },
])

const adminLinks = computed(() => [
  { to: '/profile/admin/users', icon: 'mdi mdi-account-multiple', label: t('settings.users') },
  { to: '/profile/tags', icon: 'mdi mdi-tag', label: t('nav.tags-admin') },
  { to: '/profile/data', icon: 'mdi mdi-database', label: t('nav.data-admin') },
  { to: '/profile/metadata-providers', icon: 'mdi mdi-tune', label: t('settings.metadata_providers') },
])
</script>

<template>
  <aside class="bg-base-200 w-64 min-h-screen flex flex-col">
    <!-- User-Profil -->
    <router-link
      v-if="isLogged"
      to="/profile/me"
      class="p-4 border-b border-base-300 flex items-center gap-3 hover:bg-base-300"
      @click="emit('close')"
    >
      <Avatar :size="40" :username="username" />
      <div class="min-w-0 flex-1">
        <p class="font-bold truncate">{{ username }}</p>
      </div>
      <i class="mdi mdi-chevron-right text-xl opacity-60" />
    </router-link>

    <!-- Hauptnavigation -->
    <nav class="flex-1 p-2 overflow-y-auto">
      <ul class="menu gap-0.5">
        <li v-for="item in mainLinks" :key="item.to">
          <router-link
            :to="item.to"
            class="flex items-center gap-3"
            @click="emit('close')"
          >
            <i :class="item.icon" class="text-xl" />
            {{ item.label }}
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Admin-Bereich (nur für Admins) -->
    <nav v-if="isAdmin" class="p-2 border-t border-base-300">
      <p class="px-4 py-2 text-xs font-bold opacity-60 uppercase tracking-wide">
        {{ t('nav.dashboard') }}
      </p>
      <ul class="menu gap-0.5">
        <li v-for="item in adminLinks" :key="item.to">
          <router-link
            :to="item.to"
            class="flex items-center gap-3"
            @click="emit('close')"
          >
            <i :class="item.icon" class="text-xl" />
            {{ item.label }}
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-base-300 text-sm">
      <a
        href="https://github.com/bayang/jelu"
        target="_blank" rel="noopener noreferrer"
        class="link link-hover opacity-60"
      >
        <i class="mdi mdi-github" /> Jelu
      </a>
    </div>
  </aside>
</template>
