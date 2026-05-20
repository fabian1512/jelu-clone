<script setup lang="ts">
import { useOruga } from "@oruga-ui/oruga-next"
import { useTitle } from '@vueuse/core'
import { computed, ref, Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import usePagination from "../../composables/pagination"
import useSort from "../../composables/sort"
import { Book } from "../../model/Book"
import { LibraryFilter } from "../../model/LibraryFilter"
import { Page } from "../../model/Page"
import { ObjectUtils } from "../../utils/ObjectUtils"
import useTypography from "../../composables/typography"

const props = defineProps<{
  title: string
  orphanLabelKey: string
  findLabelKey: string
  entityTypeKey: string
  deleteConfirmKey: string
  routeName: string
  routeParam: string
  iconClass: string
  findFn: (query: string) => Promise<Page<any>>
  getOrphanFn: (page: number, size: number, sort: string) => Promise<Page<any>>
  getByIdFn: (id: string) => Promise<any>
  getBooksByIdFn: (id: string) => Promise<Page<Book>>
  deleteFn: (id: string) => Promise<void>
  entityTypeArgs?: any
  backendFiltering?: boolean
}>()

const oruga = useOruga()

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})

useTitle('Jelu | ' + props.title)

const { total, page, pageAsNumber, perPage, updatePage, updatePageLoading } = usePagination(12)
const { sortQuery } = useSort('name,desc')

const { typographyClasses } = useTypography()

const orphans: Ref<Array<any>> = ref([])
const isOrphanFetching = ref(false)
const filteredItems: Ref<Array<any>> = ref([])
const isFetching = ref(false)
const selected: Ref<any> = ref({ name: "" })
const selectedBooks: Ref<Page<Book> | null> = ref(null)
const getBooksIsLoading: Ref<boolean> = ref(false)

const options = computed(() => filteredItems.value.map(t => ObjectUtils.wrapForOptions(t)))

function getFilteredItems(text: string) {
  isFetching.value = true
  props.findFn(text).then((data) => filteredItems.value = data.content)
  isFetching.value = false
}

function getOrphans() {
  isOrphanFetching.value = true
  props.getOrphanFn(pageAsNumber.value - 1, perPage.value, sortQuery.value)
    .then((res) => {
      total.value = res.totalElements
      orphans.value = res.content
      if (!res.empty) {
        page.value = (res.number + 1).toString(10)
      } else {
        page.value = "1"
      }
      isOrphanFetching.value = false
      updatePageLoading(false)
    })
    .catch(() => {
      isOrphanFetching.value = false
      updatePageLoading(false)
    })
}

function deleteItem(target: any) {
  if (target.id) {
    props.deleteFn(target.id)
      .then(() => {
        selected.value = { name: "" }
        ObjectUtils.toast(oruga, "success", t('labels.operation-success'), 4000)
        getOrphans()
      })
      .catch((err: any) => {
        ObjectUtils.toast(oruga, "danger", t('labels.error_deleting', { msg: err.message }), 4000)
      })
  }
}

async function promptDelete(item: any) {
  let abort = false
  await ObjectUtils.swalYesNoMixin.fire({
    html: `<p>${t(props.deleteConfirmKey, { nb: selectedBooks.value?.totalElements })}</p>`,
    showCancelButton: true,
    showConfirmButton: true,
    showDenyButton: false,
    confirmButtonText: t('labels.delete'),
    cancelButtonText: t('labels.dont_delete'),
  }).then((result) => {
    if (result.isDismissed) {
      abort = true
    }
  })
  if (abort) return
  deleteItem(item)
}

async function getSelected(id: string) {
  try {
    selected.value = await props.getByIdFn(id)
  } catch (_error) { /* ignore */ }
}

function getBooks(entity: any) {
  getBooksIsLoading.value = true
  props.getBooksByIdFn(entity.id as string)
    .then(res => {
      selectedBooks.value = res
      getBooksIsLoading.value = false
    })
    .catch(() => {
      getBooksIsLoading.value = false
    })
}

function selectItem(selectedItem: any) {
  getSelected(selectedItem.id)
  getBooks(selectedItem)
}

watch([page, sortQuery], () => {
  getOrphans()
})

getOrphans()
</script>

<template>
  <div class="w-fit sm:w-full flex flex-wrap justify-items-center justify-self-center gap-3 sm:gap-0">
    <div class="w-full sm:w-1/2 sm:p-3">
      <h1 class="text-2xl mb-3 capitalize" :class="typographyClasses">
        {{ t(orphanLabelKey) }} :
      </h1>
      <div>
        <ul>
          <li v-for="orphan in orphans" :key="orphan.id" class="my-2">
            <div class="alert shadow-lg w-full">
              <i :class="iconClass" />
              <h3 class="font-bold">{{ orphan.name }}</h3>
              <button class="btn btn-sm" @click="deleteItem(orphan)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </li>
        </ul>
      </div>
      <o-pagination
        v-if="orphans.length > 0"
        :current="pageAsNumber"
        :total="total"
        order="centered"
        :per-page="perPage"
        @change="updatePage"
      />
    </div>
    <div class="w-full sm:w-1/2 sm:p-3">
      <h1 class="text-2xl mb-3 capitalize" :class="typographyClasses">
        {{ t(findLabelKey) }} :
      </h1>
      <div class="field">
        <o-autocomplete
          :options="options"
          clear-on-select
          :loading="isFetching"
          :debounce="100"
          class="w-full"
          :input-classes="{ rootClass: 'border-2 border-accent w-full' }"
          :backend-filtering="backendFiltering ?? false"
          @input="getFilteredItems"
          @select="selectItem"
        >
          <template #default="{ value }">
            <div class="jl-taginput-item">{{ value.name }}</div>
          </template>
        </o-autocomplete>
      </div>
      <div v-if="selected.id != null" class="alert shadow-lg w-full mt-3">
        <div class="w-full">
          <span class="capitalize">{{ t(entityTypeKey, entityTypeArgs) }}</span> :
          <router-link
            class="hover:underline hover:decoration-4 hover:decoration-secondary"
            :to="{ name: routeName, params: { [routeParam]: selected.id } }"
          >
            {{ selected.name }}&nbsp;
          </router-link>
          {{ selectedBooks?.totalElements }} {{ t('labels.associated-books') }}
        </div>
        <button class="btn btn-sm" @click="promptDelete(selected)">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.o-dropdown.o-dropdown--position-auto.o-autocomplete,
.o-dropdown.o-dropdown--position-bottom.o-autocomplete {
  @apply w-full;
}
</style>
