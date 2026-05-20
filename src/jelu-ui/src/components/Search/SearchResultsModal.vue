<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from 'vue-i18n';
import { Metadata } from "../../model/Metadata";
import { StringUtils } from "../../utils/StringUtils";

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})

const props = defineProps<{
  results?: Metadata[],
  loading?: boolean,
  scrollOnOpenIndex?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', metadata: Metadata): void
}>()

const PAGE_SIZE = 15
const displayCount = ref(PAGE_SIZE)
const visibleResults = computed(() => props.results?.slice(0, displayCount.value) ?? [])
const hasMore = computed(() => (props.results?.length ?? 0) > displayCount.value)

watch(() => props.results, () => {
  displayCount.value = PAGE_SIZE
})

const loadMore = () => {
  displayCount.value += PAGE_SIZE
}

const listRef = ref<HTMLElement | null>(null)

watch(() => props.scrollOnOpenIndex, (idx) => {
  if (idx === undefined || idx < 0) return
  nextTick(() => {
    if (!listRef.value) return
    const items = listRef.value.querySelectorAll('.search-result-item')
    if (items[idx]) {
      items[idx].scrollIntoView({ block: 'center', behavior: 'auto' })
    }
  })
}, { immediate: true })

const selectResult = (metadata: Metadata) => {
  emit('select', metadata)
}

const close = () => {
  emit('close')
}
</script>

<template>
  <section class="jl-modal flex flex-col" style="--modal-width: min(676px, calc(100vw - 24px)); --modal-min-height: 12rem;">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-bold">{{ t('labels.search_results') }}</h3>
      <button @click="close" class="btn btn-sm btn-circle btn-outline"><i class="mdi mdi-close mdi-18px"></i></button>
    </div>

    <!-- Search Results -->
    <div v-if="results && results.length > 0" class="relative flex flex-col flex-1 min-h-0">
      <div class="flex-1 overflow-y-auto min-h-0" ref="listRef">
        <h4 class="text-sm font-semibold mb-2 opacity-60">{{ t('labels.search_results') }} ({{ results.length }})</h4>
        <div class="space-y-2">
          <div
            v-for="(metadata, index) in visibleResults"
            :key="index"
            class="search-result-item flex items-center gap-3 p-2 border rounded hover:bg-base-200 cursor-pointer"
            :class="{ 'opacity-50': loading }"
            @click="selectResult(metadata)"
          >
            <img
              v-if="metadata.image"
              :src="StringUtils.resolveImageUrl(metadata.image)"
              class="w-12 h-16 object-cover rounded flex-shrink-0"
              loading="lazy"
            >
            <img
              v-else
              src="../../assets/placeholder_asset.jpg"
              class="w-12 h-16 object-cover rounded flex-shrink-0"
            >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate">{{ metadata.title }}</p>
              <p class="text-xs opacity-60 truncate">
                {{ metadata.authors?.join(', ') }}
              </p>
            </div>
            <button class="btn btn-sm btn-primary" :disabled="loading">
              <i class="mdi mdi-check"></i>
              {{ t('labels.select') }}
            </button>
          </div>
        </div>

        <!-- Load more button -->
        <div v-if="hasMore" class="flex justify-center mt-3">
          <button @click="loadMore" class="btn btn-sm btn-outline" :disabled="loading">
            {{ t('labels.load_more_results') }}
          </button>
        </div>
      </div>
      
      <!-- Loading overlay on top of results -->
      <div v-if="loading" class="absolute inset-0 bg-base-100/80 flex flex-col items-center justify-center z-10 rounded-box">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="mt-2 text-sm">{{ t('labels.searching_external') }}</p>
      </div>
    </div>

    <!-- No results -->
    <div v-else-if="results && results.length === 0" class="flex-1 flex items-center justify-center">
      <p class="opacity-60">{{ t('labels.no_results_found') }}</p>
    </div>
  </section>
</template>