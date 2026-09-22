<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ProfileDetail from "./ProfileDetail.vue"
import UserShelves from "../User/UserShelves.vue"
import CustomLists from '../List/CustomLists.vue'
import UserMessages from '../User/UserMessages.vue'
import UserSettings from '../User/UserSettings.vue'
import ApiTokens from './ApiTokens.vue'

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})

useTitle('Jelu | User page')

const route = useRoute()

const tabs = computed(() => [
  { id: 'PROFILE', label: t('settings.profile', 2) },
  { id: 'SHELVES', label: t('settings.shelves', 2) },
  { id: 'LISTS', label: t('settings.custom_lists', 2) },
  { id: 'MESSAGES', label: t('settings.messages') },
  { id: 'SETTINGS', label: t('settings.title') },
  { id: 'API_TOKENS', label: t('settings.api_tokens') },
])

const requestedTab = typeof route.query.tab === 'string' ? route.query.tab.toUpperCase() : 'PROFILE'
const currentView = ref<string>(tabs.value.some(t => t.id === requestedTab) ? requestedTab : 'PROFILE')

const changeView = (viewName: string) => {
  currentView.value = viewName
}

</script>

<template>
  <div class="w-fit sm:w-full flex flex-wrap justify-center gap-3 sm:gap-0 mb-3">
    <div
      role="tablist"
      class="tabs tabs-box tabs-lg flex-wrap"
    >
      <a
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        class="tab"
        :class="{'tab-active': currentView == tab.id}"
        @click="changeView(tab.id)"
      >{{ tab.label }}</a>
    </div>
  </div>
  <ProfileDetail v-if="currentView == 'PROFILE'" />
  <UserShelves v-if="currentView == 'SHELVES'" />
  <CustomLists v-if="currentView == 'LISTS'" />
  <UserMessages v-if="currentView == 'MESSAGES'" />
  <UserSettings v-if="currentView == 'SETTINGS'" />
  <ApiTokens v-if="currentView == 'API_TOKENS'" />
</template>

<style lang="scss" scoped>
</style>
