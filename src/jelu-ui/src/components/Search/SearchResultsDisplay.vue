<script setup lang="ts">
import { useTitle } from '@vueuse/core';
import { useRouteQuery } from '@vueuse/router';
import axios from 'axios';
import { computed, onUnmounted, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import usePagination from '../../composables/pagination';
import useSort from '../../composables/sort';
import useBulkEdition from '../../composables/bulkEdition';
import { Book } from '../../model/Book';
import { LibraryFilter } from '../../model/LibraryFilter';
import { bookService } from "../../services/bookService";
import { ObjectUtils } from '../../utils/ObjectUtils';
import BookCard from '../Global/BookCard.vue';
import SortFilterBarVue from '../Global/SortFilterBar.vue';
import { ReadingEventType } from '../../model/ReadingEvent';
import useTypography from '../../composables/typography';

const { t } = useI18n({
      inheritLocale: true,
      useScope: 'global'
    })

useTitle('Jelu | Search')

const searchQuery: Ref<string|undefined> = useRouteQuery('q', undefined)

const books: Ref<Array<Book>> = ref([]);

const { total, page, pageAsNumber, perPage, updatePage, getPageIsLoading, updatePageLoading, pageCount } = usePagination()

const { sortQuery, sortOrder, sortBy, sortOrderUpdated } = useSort('title,asc')

const { showSelect, selectAll, checkedCards, cardChecked, toggleEdit } = useBulkEdition(modalClosed)

const libraryFilter: Ref<LibraryFilter> = useRouteQuery('libraryFilter', 'ONLY_USER_BOOKS' as LibraryFilter)

const open = ref(false)

const progress: Ref<boolean> = ref(false)
const searchRequestCounter: Ref<number> = ref(0)
let searchAbortController: AbortController | null = null

const eventTypes: Ref<Array<ReadingEventType>> = useRouteQuery('lastEventTypes', [])
const toRead: Ref<string|null> = useRouteQuery('toRead', "null")
const owned: Ref<string|null> = useRouteQuery('owned', "null")
const borrowed: Ref<string|null> = useRouteQuery('borrowed', "null")

const toReadAsBool = computed(() => {
  if (toRead.value?.toLowerCase() === "null") {
    return null
  } else if (toRead.value?.toLowerCase() === "true") {
    return true
  } else {
    return false
  }
  }
)

const ownedAsBool = computed(() => {
  if (owned.value?.toLowerCase() === "null") {
    return null
  } else if (owned.value?.toLowerCase() === "true") {
    return true
  } else {
    return false
  }
  }
)

const borrowedAsBool = computed(() => {
  if (borrowed.value?.toLowerCase() === "null") {
    return null
  } else if (borrowed.value?.toLowerCase() === "true") {
    return true
  } else {
    return false
  }
  }
)

const search = () => {
    searchAbortController?.abort()
    searchAbortController = new AbortController()
    const requestId = ++searchRequestCounter.value
    progress.value = true
    updatePageLoading(true)
      bookService.findBooks(
        searchQuery.value, 
      pageAsNumber.value - 1, perPage.value, 
      sortQuery.value, libraryFilter.value,
      eventTypes.value, toReadAsBool.value, 
      ownedAsBool.value, borrowedAsBool.value,
      searchAbortController.signal
      )
    .then(res => {
      if (requestId !== searchRequestCounter.value) {
        return
      }
      progress.value = false
      updatePageLoading(false)
          total.value = res.totalElements
          books.value = res.content
        if (! res.empty) {
          page.value =  (res.number + 1).toString(10)
        }
        else {
          page.value = "1"
        }
    }
    )
    .catch(e => {
      if (axios.isAxiosError(e) && e.code === 'ERR_CANCELED') {
        return
      }
      if (requestId !== searchRequestCounter.value) {
        return
      }
      progress.value = false
      updatePageLoading(false)
    })
}

onUnmounted(() => {
  searchAbortController?.abort()
})

watch([searchQuery, page, sortQuery, libraryFilter, eventTypes, toRead, owned, borrowed], (newVal, oldVal) => {
  if (newVal !== oldVal) {
    search()
  }
})

const convertedBooks = computed(() => books.value?.map(b => ObjectUtils.toUserBook(b)))

function modalClosed() {
  search()
}

const append = (text: string) => {
  if (searchQuery.value == null) {
    searchQuery.value = ''
  }
  searchQuery.value += text
  //@ts-ignore
  document.getElementById("search_helper").close()
}

const terms = ["tag", "author", "translator", "narrator", "series", "language", 
"published_date", "publisher", "summary", "googleId", "goodreadsId", "amazonId", 
"librarythingId", "noosfereId", "isfdbId", "inventaireId", "openlibraryId"]

const operators = ["AND", "OR", "NOT"]

if (searchQuery.value != null) {
    search()
  }

const { typographyClasses } = useTypography()

</script>

<template>
  <sort-filter-bar-vue
    :open="open"
    :order="sortOrder"
    @update:open="open = $event"
    @update:sort-order="sortOrderUpdated"
  >
    <template #sort-fields>
      <div class="field flex flex-col items-start gap-1">
        <p class="px-4 py-2 text-xs font-bold opacity-60 uppercase tracking-wide border-t border-base-300 mt-2">{{ t('sorting.sort_by') }}</p>
        <div class="">
          <input
            v-model="sortBy"
            type="radio"
            name="radio-22"
          class="radio radio-primary"
          value="title"
        >
        <span class="label-text">{{ t('sorting.title') }}</span>
      </div>
      <div class="field">
        <input
          v-model="sortBy"
          type="radio"
          name="radio-22"
          class="radio radio-primary"
          value="publisher"
        >
        <span class="label-text">{{ t('sorting.publisher') }}</span>
      </div>
      <div class="field">
        <input
          v-model="sortBy"
          type="radio"
          name="radio-22"
          class="radio radio-primary"
          value="series"
        >
        <span class="label-text">{{ t('sorting.series') }}</span>
      </div>
      <div class="field">
        <input
          v-model="sortBy"
          type="radio"
          name="radio-22"
          class="radio radio-primary"
          value="publishedDate"
        >
        <span class="label-text">{{ t('sorting.publication_date') }}</span>
      </div>
      <div class="field">
        <input
          v-model="sortBy"
          type="radio"
          name="radio-22"
          class="radio radio-primary"
          value="pageCount"
        >
        <span class="label-text">{{ t('sorting.page_count') }}</span>
      </div>
      </div>
    </template>
    <template #filters>
      <div class="field flex flex-col items-start gap-1">
        <p class="px-4 py-2 text-xs font-bold opacity-60 uppercase tracking-wide border-t border-base-300 mt-2">{{ t('filtering.books_type') }}</p>
        <div class="">
          <input
            v-model="libraryFilter"
            type="radio"
            name="radio-51"
            class="radio radio-primary"
            value="ANY"
          >
          <span class="label-text">{{ t('filtering.any') }}</span>
        </div>
        <div class="">
          <input
            v-model="libraryFilter"
            type="radio"
            name="radio-51"
            class="radio radio-primary"
            value="ONLY_USER_BOOKS"
          >
          <span class="label-text">{{ t('filtering.only_in_my_list') }}</span>
        </div>
        <div class="">
          <input
            v-model="libraryFilter"
            type="radio"
            name="radio-51"
            class="radio radio-primary"
            value="ONLY_NON_USER_BOOKS"
          >
          <span class="label-text">{{ t('filtering.only_not_in_my_list') }}</span>
        </div>
      </div>
      <div class="field flex flex-col items-start">
        <p class="px-4 py-2 text-xs font-bold opacity-60 uppercase tracking-wide border-t border-base-300 mt-2">{{ t('reading_events.last_event_type') }}</p>
        <div class="field">
          <input
            v-model="eventTypes"
            type="checkbox"
            class="checkbox checkbox-primary"
            value="FINISHED"
          >
          <span class="label-text">{{ t('reading_events.finished') }}</span>
        </div>
        <div class="field">
          <input
            v-model="eventTypes"
            type="checkbox"
            class="checkbox checkbox-primary"
            value="CURRENTLY_READING"
          >
          <span class="label-text">{{ t('reading_events.currently_reading') }}</span>
        </div>
        <div class="field">
          <input
            v-model="eventTypes"
            type="checkbox"
            class="checkbox checkbox-primary"
            value="DROPPED"
          >
          <span class="label-text">{{ t('reading_events.dropped') }}</span>
        </div>
        <div class="field">
          <input
            v-model="eventTypes"
            type="checkbox"
            class="checkbox checkbox-primary"
            value="NONE"
          >
          <span class="label-text">{{ t('reading_events.none') }}</span>
        </div>
      </div>
      <div class="field flex flex-col items-start">
        <p class="px-4 py-2 text-xs font-bold opacity-60 uppercase tracking-wide border-t border-base-300 mt-2">{{ t('filtering.book_in_list') }}</p>
        <div class="field">
          <input
            v-model="toRead"
            type="radio"
            name="radio-28"
            class="radio radio-primary"
            value="null"
          >
          <span class="label-text">{{ t('filtering.unset') }}</span>
        </div>
        <div class="field">
          <input
            v-model="toRead"
            type="radio"
            name="radio-28"
            class="radio radio-primary"
            value="false"
          >
          <span class="label-text">{{ t('labels.false') }}</span>
        </div>
        <div class="field">
          <input
            v-model="toRead"
            type="radio"
            name="radio-28"
            class="radio radio-primary"
            value="true"
          >
          <span class="label-text">{{ t('labels.true') }}</span>
        </div>
      </div>
      <div class="field flex flex-col items-start">
        <p class="px-4 py-2 text-xs font-bold opacity-60 uppercase tracking-wide border-t border-base-300 mt-2">{{ t('filtering.owned') }}</p>
        <div class="field">
          <input
            v-model="owned"
            type="radio"
            name="radio-31"
            class="radio radio-primary"
            value="null"
          >
          <span class="label-text">{{ t('filtering.unset') }}</span>
        </div>
        <div class="field">
          <input
            v-model="owned"
            type="radio"
            name="radio-31"
            class="radio radio-primary"
            value="false"
          >
          <span class="label-text">{{ t('labels.false') }}</span>
        </div>
        <div class="field">
          <input
            v-model="owned"
            type="radio"
            name="radio-31"
            class="radio radio-primary"
            value="true"
          >
          <span class="label-text">{{ t('labels.true') }}</span>
        </div>
      </div>
      <div class="field flex flex-col items-start">
        <p class="px-4 py-2 text-xs font-bold opacity-60 uppercase tracking-wide border-t border-base-300 mt-2">{{ t('filtering.borrowed') }}</p>
        <div class="field">
          <input
            v-model="borrowed"
            type="radio"
            name="radio-34"
            class="radio radio-primary"
            value="null"
          >
          <span class="label-text">{{ t('filtering.unset') }}</span>
        </div>
        <div class="field">
          <input
            v-model="borrowed"
            type="radio"
            name="radio-34"
            class="radio radio-primary"
            value="false"
          >
          <span class="label-text">{{ t('labels.false') }}</span>
        </div>
        <div class="field">
          <input
            v-model="borrowed"
            type="radio"
            name="radio-34"
            class="radio radio-primary"
            value="true"
          >
          <span class="label-text">{{ t('labels.true') }}</span>
        </div>
      </div>
    </template>
  </sort-filter-bar-vue>
  <div class="flex flex-row justify-between mb-2">
    <h2
      class="text-xl sm:text-2xl md:text-3xl capitalize truncate min-w-0 flex-1"
      :class="typographyClasses"
    >
      <span class="icon">
        <i class="mdi mdi-magnify" />
      </span>
      &nbsp; {{ t('labels.search') }} :
    </h2>
    <div class="flex flex-row gap-1">
      <button
        class="btn btn-outline btn-success"
        @click="open = !open"
      >
        <span class="icon text-lg">
          <i class="mdi mdi-filter-variant" />
        </span>
      </button>
      <button
        v-tooltip="t('bulk.toggle')"
        class="btn btn-outline btn-primary"
        @click="showSelect = !showSelect"
      >
        <span class="icon text-lg">
          <i class="mdi mdi-pencil" />
        </span>
      </button>
      <button
        v-if="showSelect"
        v-tooltip="t('bulk.select_all')"
        class="btn btn-outline btn-accent"
        @click="selectAll = !selectAll"
      >
        <span class="icon text-lg">
          <i class="mdi mdi-checkbox-multiple-marked" />
        </span>
      </button>
      <button
        v-if="showSelect && checkedCards.length > 0"
        v-tooltip="t('bulk.edit')"
        class="btn btn-outline btn-info"
        @click="toggleEdit(checkedCards)"
      >
        <span class="icon text-lg">
          <i class="mdi mdi-book-edit" />
        </span>
      </button>
    </div>
  </div>
  
  <dialog
    id="search_helper"
    ref="search_helper"
    class="modal"
  >
    <div class="modal-box space-x-3 space-y-3">
      <span
        v-for="term in terms"
        :key="term"
        class="badge badge-outline"
        @click="append(` ${term}:`)"
      >{{ term }}</span>
      <br>
      <span
        v-for="op in operators"
        :key="op"
        class="badge badge-outline badge-accent"
        @click="append(` ${op} `)"
      >{{ op }}</span>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
    >
      <button>close</button>
    </form>
  </dialog>
  <o-pagination
    v-if="pageCount > 1"
    v-model:current="pageAsNumber"
    :total="total"
    order="centered"
    :per-page="perPage"
    @change="updatePage"
  />
  <div class="grid gap-[12px] grid-cols-1 sm:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] my-3 mt-2">
    <div
      v-for="book in convertedBooks"
      :key="book.book.id"
        class="h-full"
      >
      <book-card
        :book="book"
        :force-select="selectAll"
        :public="false"
        :show-select="showSelect"
        :propose-add="true"
        class="h-full"
        @update:modal-closed="modalClosed"
        @update:checked="cardChecked"
      />
    </div>
  </div>
  <div
    v-if="convertedBooks.length === 0 && !getPageIsLoading"
    class="flex flex-col items-center justify-center py-16 text-base-content/60"
  >
    <i class="mdi mdi-book-open-variant text-6xl mb-4" />
    <p class="text-lg">{{ t('labels.library_empty') }}</p>
  </div>
  <o-pagination
    v-if="pageCount > 1"
    v-model:current="pageAsNumber"
    :total="total"
    order="centered"
    :per-page="perPage"
    @change="updatePage"
  />
  <o-loading
    v-model:active="getPageIsLoading"
    :full-page="true"
    :cancelable="true"
  />  
</template>

<style scoped>
</style>
