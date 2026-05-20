<script setup lang="ts">

import { useOruga } from "@oruga-ui/oruga-next";
import { Ref, ref } from "vue";

import { Author } from "../../model/Author";
import { UserBook } from "../../model/Book";
import { Metadata } from "../../model/Metadata";
import { Path } from "../../model/DirectoryListing";
import { ObjectUtils } from "../../utils/ObjectUtils";

import ImagePickerModal from '../Misc/ImagePickerModal.vue';
import SeriesCompleteInput from '../Series/SeriesCompleteInput.vue';
import TagInputField from '../Global/TagInputField.vue'
import FormField from '../Global/FormField.vue';
import AutoImportFormModal from '../Admin/AutoImportFormModal.vue';
import MergeBookModal from './MergeBookModal.vue';

import { useEditBook } from "../../composables/useEditBook";

const props = defineProps<{ book: UserBook | Metadata | null }>()
const emit = defineEmits<{
  (e: 'close', reason?: 'save' | 'cancel'): void
}>();

const {
  t,
  userbook,
  progress,
  deleteBook,
  importBook,
  filteredAuthors,
  filteredTags,
  filteredTranslators,
  filteredNarrators,
  filteredPublishers,
  publisherInput,
  getFilteredData,
  getFilteredTags,
  getFilteredPublishers,
  selectPublisher,
  beforeAdd,
  beforeAddTag,
  publishedDateString,
  sliderPercent,
  hasImage,
  deleteImage,
  toggleRemoveImage,
  smallCoverUrl,
  uploadType,
  imageUrl,
  imagePath,
  uploadPercentage,
  handleFileUpload,
  canApplyUpload,
  applyCoverUpload,
  errorMessage,
} = useEditBook(props, emit)

const oruga = useOruga()

const showImagePickerModal: Ref<boolean> = ref(false)

const toggleImagePickerModal = () => {
  showImagePickerModal.value = !showImagePickerModal.value
  oruga.modal.open({
    parent: this,
    component: ImagePickerModal,
    trapFocus: true,
    active: true,
    cancelable: ['outside'],
    scroll: 'keep',
    events: {
      choose: (path: Path) => {
        imagePath.value = path.path
      }
    },
    onClose: modalClosed
  });
}

function modalClosed() {
}

const openMetadataModal = () => {
  oruga.modal.open({
    parent: this,
    component: AutoImportFormModal,
    trapFocus: true,
    active: true,
    cancelable: ['outside'],
    scroll: 'clip',
    props: {
      book: userbook.value,
      hideBarcodeAndManual: true
    },
    events: {
      metadataReceived: (event: { metadata: Metadata, hasExistingBook: boolean }) => {
        if (event.hasExistingBook) {
          oruga.modal.open({
            parent: this,
            component: MergeBookModal,
            trapFocus: true,
            active: true,
            cancelable: ['outside'],
            scroll: 'clip',
            props: {
              book: userbook.value.book,
              metadata: event.metadata
            },
            onClose: (mergedData: any) => {
              if (mergedData) {
                if (mergedData.title) userbook.value.book.title = mergedData.title
                if (mergedData.authors?.length) userbook.value.book.authors = mergedData.authors.map((a: string) => ({ name: a }))
                if (mergedData.isbn13) userbook.value.book.isbn13 = mergedData.isbn13
                if (mergedData.isbn10) userbook.value.book.isbn10 = mergedData.isbn10
                if (mergedData.publisher) userbook.value.book.publisher = mergedData.publisher
                if (mergedData.publishedDate) userbook.value.book.publishedDate = mergedData.publishedDate
                if (mergedData.pageCount) userbook.value.book.pageCount = mergedData.pageCount
                if (mergedData.language) userbook.value.book.language = mergedData.language
                if (mergedData.summary) userbook.value.book.summary = mergedData.summary
                if (mergedData.image) userbook.value.book.image = mergedData.image
                if (mergedData.tags?.length) userbook.value.book.tags = mergedData.tags.map((t: string) => ({ name: t }))
                if (mergedData.series) userbook.value.book.series = [{ name: mergedData.series, numberInSeries: mergedData.numberInSeries || 1 }]
                if (mergedData.goodreadsId) userbook.value.book.goodreadsId = mergedData.goodreadsId
                if (mergedData.googleId) userbook.value.book.googleId = mergedData.googleId
                if (mergedData.amazonId) userbook.value.book.amazonId = mergedData.amazonId
                if (mergedData.openlibraryId) userbook.value.book.openlibraryId = mergedData.openlibraryId
                if (mergedData.librarythingId) userbook.value.book.librarythingId = mergedData.librarythingId
                if (mergedData.isfdbId) userbook.value.book.isfdbId = mergedData.isfdbId
                if (mergedData.inventaireId) userbook.value.book.inventaireId = mergedData.inventaireId
                if (mergedData.noosfereId) userbook.value.book.noosfereId = mergedData.noosfereId
              }
            }
          })
        } else {
          oruga.modal.open({
            component: EditBookModal,
            trapFocus: true,
            active: true,
            cancelable: ['outside'],
            scroll: 'clip',
            props: {
              book: event.metadata
            },
            onClose: (args: any) => {
              if (args && args[0] === 'save') {
              }
            }
          })
        }
      }
    },
    onClose: () => {}
  });
}
</script>

<template>
  <section id="edit-modal-content" class="edit-modal p-0 relative flex flex-col max-h-[85vh] overflow-visible">
    <!-- Sticky Header -->
    <div class="sticky top-0 z-10 bg-base-100 pb-4 px-4 pt-4 border-b border-base-200 shrink-0">
      <div class="flex justify-between items-center">
        <div class="flex gap-2">
          <button @click="importBook" class="btn btn-sm btn-primary" :class="{'btn-disabled' : progress}">
            <span v-if="progress" class="loading loading-spinner loading-xs"></span>
            <span v-else class="flex items-center">
              <i class="mdi mdi-content-save mdi-18px"></i>
              <span class="hidden sm:inline ml-1">{{ t('labels.save_changes') }}</span>
            </span>
          </button>
          <button @click="openMetadataModal" class="btn btn-sm btn-secondary flex items-center">
            <i class="mdi mdi-information mdi-18px"></i>
            <span class="hidden sm:inline ml-1">{{ t('labels.metadata') }}</span>
          </button>
          <button v-if="userbook.id || (props.book && 'id' in props.book)" @click="deleteBook" class="btn btn-sm btn-error btn-outline flex items-center">
            <i class="mdi mdi-delete mdi-18px"></i>
            <span class="hidden sm:inline ml-1">{{ t('labels.delete') }}</span>
          </button>
        </div>
        <button @click="emit('close', 'cancel')" class="btn btn-sm btn-circle btn-outline ml-auto">
          <i class="mdi mdi-close mdi-18px"></i>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 pb-8">
      <div v-if="!userbook?.book?.isbn13 && !userbook?.book?.isbn10" class="alert alert-warning text-xs mb-3 py-2">
        ⚠ {{ t('labels.incomplete_metadata') }}
      </div>
    <div class="flex gap-4 mb-6 mt-4">
      <div class="shrink-0 relative">
        <figure v-if="userbook.book.image && !deleteImage" class="w-24 h-36 rounded-lg overflow-hidden shadow-md">
          <img :src="smallCoverUrl" class="w-full h-full object-cover" loading="lazy">
        </figure>
        <div v-else class="w-24 h-36 bg-base-200 rounded-lg flex items-center justify-center text-3xl">📖</div>
        <button v-if="userbook.book.image && !deleteImage" @click="toggleRemoveImage" class="absolute -bottom-2 -right-2 btn btn-xs btn-circle btn-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button v-else-if="deleteImage" @click="toggleRemoveImage" class="absolute -bottom-2 -right-2 btn btn-xs btn-circle btn-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <div class="flex-1 min-w-0">
        <input v-model="userbook.book.title" :placeholder="t('book.title')" class="text-xl font-bold bg-transparent w-full outline-none mb-2 block border-b border-base-300 focus:border-primary pb-1">
        <div class="flex flex-wrap gap-1 mb-2">
          <span v-for="author in userbook.book.authors" :key="author.name" class="text-sm">{{ author.name }}</span>
        </div>
        <div class="flex flex-wrap gap-1">
          <span v-for="tag in userbook.book.tags" :key="tag.name" class="badge badge-sm badge-secondary">{{ tag.name }}</span>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <div class="text-xs font-semibold uppercase opacity-60 tracking-wider mb-1 px-1">{{ t('book.summary') }}</div>
      <div class="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
        <div class="px-4 py-3">
          <textarea
            v-model="userbook.book.summary"
            rows="5"
            class="w-full bg-transparent resize-none outline-none text-sm overflow-y-auto"
            :placeholder="t('book.summary')"></textarea>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <details open class="rounded-xl border border-base-300 group">
        <summary class="text-xs font-semibold uppercase opacity-60 tracking-wider px-4 py-2 cursor-pointer flex justify-between items-center select-none bg-base-200 list-none">
          <span>{{ t('book.details') }}</span>
          <span class="text-base-content/60 transition-transform group-open:rotate-90">›</span>
        </summary>
        <div class="bg-base-100">
<div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.author', 2) }}</label>
          <TagInputField
            v-model="userbook.book.authors"
            :options="filteredAuthors"
            :validate-item="(item: any) => beforeAdd(item, userbook.book.authors as Array<Author>)"
            :create-item="ObjectUtils.createNamedItem"
            :placeholder="t('labels.add_author')"
            :root-class="'flex-1 borderless-autocomplete'"
            badge-class="badge-primary badge-sm"
            @input="(v: string) => getFilteredData(v, filteredAuthors)"
          />
        </div>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.tag', 2) }}</label>
          <TagInputField
            v-model="userbook.book.tags"
            :options="filteredTags"
            :validate-item="beforeAddTag"
            :create-item="ObjectUtils.createNamedItem"
            :placeholder="t('labels.add_tag')"
            :root-class="'flex-1 borderless-autocomplete'"
            badge-class="badge-primary badge-sm"
            @input="getFilteredTags"
          />
        </div>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.publisher') }}</label>
          <o-autocomplete :model-value="publisherInput" :options="filteredPublishers" :clear-on-select="false" :debounce="100" @input="getFilteredPublishers" @select="selectPublisher" root-class="flex-1 borderless-autocomplete" expanded :placeholder="t('book.publisher')">
            <template #default="{ value }">
              <div class="jl-taginput-item">{{ value }}</div>
            </template>
          </o-autocomplete>
        </div>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.published_date') }}</label>
          <input v-model="publishedDateString" type="date" class="ml-auto w-auto bg-transparent outline-none text-sm text-right" />
        </div>
<div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
           <label class="text-sm opacity-60 w-24 shrink-0">ISBN13</label>
           <input v-model="userbook.book.isbn13" class="flex-1 bg-transparent outline-none text-sm text-right uniform-input" placeholder="ISBN13">
         </div>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.page_count') }}</label>
          <input v-model.number="userbook.book.pageCount" type="number" class="flex-1 bg-transparent outline-none text-sm text-right" :placeholder="t('book.page_count')">
        </div>
        </div>
      </details>
    </div>

    <details class="rounded-xl border border-base-300 mb-4 group">
      <summary class="text-xs font-semibold uppercase opacity-60 tracking-wider px-4 py-2 cursor-pointer flex justify-between items-center select-none bg-base-200 list-none">
        <span>{{ t('labels.more_options') }}</span>
        <span class="text-base-content/60 transition-transform group-open:rotate-90">›</span>
      </summary>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.price') }}</label>
          <input v-model.number="userbook.price" type="number" step="0.01" class="flex-1 bg-transparent outline-none text-sm text-right" :placeholder="t('book.price')">
        </div>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">ISBN10</label>
          <input v-model="userbook.book.isbn10" class="flex-1 bg-transparent outline-none text-sm text-right uniform-input" placeholder="ISBN10">
        </div>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.original_title') }}</label>
          <input v-model="userbook.book.originalTitle" class="flex-1 bg-transparent outline-none text-sm text-right uniform-input" :placeholder="t('book.original_title')">
        </div>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.translator', 2) }}</label>
          <TagInputField
            v-model="userbook.book.translators"
            :options="filteredTranslators"
            :validate-item="(item: any) => beforeAdd(item, userbook.book.translators as Array<Author>)"
            :create-item="ObjectUtils.createNamedItem"
            :placeholder="t('labels.add_translator')"
            :root-class="'flex-1 borderless-autocomplete'"
            badge-class="badge-primary badge-sm"
            @input="(v: string) => getFilteredData(v, filteredTranslators)"
          />
        </div>
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
          <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.narrator', 2) }}</label>
          <TagInputField
            v-model="userbook.book.narrators"
            :options="filteredNarrators"
            :validate-item="(item: any) => beforeAdd(item, userbook.book.narrators as Array<Author>)"
            :create-item="ObjectUtils.createNamedItem"
            :placeholder="t('labels.add_narrator')"
            :root-class="'flex-1 borderless-autocomplete'"
            badge-class="badge-primary badge-sm"
            @input="(v: string) => getFilteredData(v, filteredNarrators)"
          />
        </div>
      </details>

    <!-- Status -->
    <details class="rounded-xl border border-base-300 mb-4 group">
      <summary class="text-xs font-semibold uppercase opacity-60 tracking-wider px-4 py-2 cursor-pointer flex justify-between items-center select-none bg-base-200 list-none">
        <span>{{ t('reading_events.event_type') }}</span>
        <span class="text-base-content/60 transition-transform group-open:rotate-90">›</span>
      </summary>
      <div class="bg-base-100 px-4 py-3 border-b border-base-200">
        <div class="flex gap-3 flex-wrap">
          <label class="label cursor-pointer gap-1 mb-0">
            <input v-model="userbook.lastReadingEvent" type="radio" value="FINISHED" class="radio radio-sm radio-primary">
            <span class="label-text text-sm">{{ t('reading_events.finished') }}</span>
          </label>
          <label class="label cursor-pointer gap-1 mb-0">
            <input v-model="userbook.lastReadingEvent" type="radio" value="CURRENTLY_READING" class="radio radio-sm radio-primary">
            <span class="label-text text-sm">{{ t('reading_events.currently_reading') }}</span>
          </label>
          <label class="label cursor-pointer gap-1 mb-0">
            <input v-model="userbook.lastReadingEvent" type="radio" value="DROPPED" class="radio radio-sm radio-primary">
            <span class="label-text text-sm">{{ t('reading_events.dropped') }}</span>
          </label>
          <label class="label cursor-pointer gap-1 mb-0">
            <input v-model="userbook.lastReadingEvent" type="radio" value="NONE" class="radio radio-sm radio-primary">
            <span class="label-text text-sm">{{ t('reading_events.none') }}</span>
          </label>
        </div>
      </div>
      <div class="flex items-center gap-3 px-4 py-3 border-b border-base-200">
        <label class="text-sm opacity-60 w-24 shrink-0">{{ t('book.current_page_number') }}</label>
        <input v-model.number="userbook.currentPageNumber" type="number" class="flex-1 bg-transparent outline-none text-sm text-right" :placeholder="t('book.current_page_number')">
      </div>
      <div class="px-4 py-3">
        <label class="text-sm opacity-60 block mb-1">{{ t('book.percent_read') }}</label>
        <input v-model.number="sliderPercent" type="range" min="0" max="100" class="w-full range range-primary range-xs">
        <div class="text-right text-xs opacity-60 mt-1">{{ sliderPercent }}%</div>
      </div>
    </details>

    <!-- Persönlich -->
    <details class="rounded-xl border border-base-300 mb-4 group">
      <summary class="text-xs font-semibold uppercase opacity-60 tracking-wider px-4 py-2 cursor-pointer flex justify-between items-center select-none bg-base-200 list-none">
        <span>{{ t('book.status') }}</span>
        <span class="text-base-content/60 transition-transform group-open:rotate-90">›</span>
      </summary>
      <div class="bg-base-100 px-4 py-3 border-b border-base-200">
        <label class="text-sm opacity-60 block mb-2">{{ t('book.properties') }}</label>
        <div class="flex gap-4 flex-wrap">
          <label class="label cursor-pointer gap-2 mb-0">
            <input v-model="userbook.owned" type="checkbox" class="checkbox checkbox-sm checkbox-primary">
            <span class="label-text text-sm">{{ t('book.owned') }}</span>
          </label>
          <label class="label cursor-pointer gap-2 mb-0">
            <input v-model="userbook.toRead" type="checkbox" class="checkbox checkbox-sm checkbox-primary">
            <span class="label-text text-sm">{{ t('book.to_read') }}</span>
          </label>
          <label class="label cursor-pointer gap-2 mb-0">
            <input v-model="userbook.borrowed" type="checkbox" class="checkbox checkbox-sm checkbox-primary">
            <span class="label-text text-sm">{{ t('book.borrowed') }}</span>
          </label>
        </div>
      </div>
      <div class="px-4 py-3">
        <label class="text-sm opacity-60 block mb-1">{{ t('book.personal_notes') }}</label>
        <input v-model="userbook.personalNotes" :placeholder="t('book.personal_notes')" class="w-full bg-transparent outline-none text-sm">
      </div>
    </details>

    <details v-if="!hasImage || deleteImage" class="rounded-xl border border-base-300 mb-4 group">
      <summary class="text-xs font-semibold uppercase opacity-60 tracking-wider px-4 py-2 cursor-pointer flex justify-between items-center select-none bg-base-200 list-none">
        <span>{{ t('labels.upload_cover') }}</span>
        <span class="text-base-content/60 transition-transform group-open:rotate-90">›</span>
      </summary>
      <div class="bg-base-100 p-4">
        <div class="flex gap-3 mb-3 justify-center">
          <label class="label cursor-pointer gap-1 mb-0">
            <input v-model="uploadType" type="radio" value="web" class="radio radio-sm">
            <span class="label-text text-sm">{{ t('labels.upload_from_web') }}</span>
          </label>
          <label class="label cursor-pointer gap-1 mb-0">
            <input v-model="uploadType" type="radio" value="computer" class="radio radio-sm">
            <span class="label-text text-sm">{{ t('labels.upload_from_computer') }}</span>
          </label>
          <label class="label cursor-pointer gap-1 mb-0">
            <input v-model="uploadType" type="radio" value="server" class="radio radio-sm">
            <span class="label-text text-sm">{{ t('labels.upload_from_server') }}</span>
          </label>
        </div>
        <div v-if="uploadType === 'web'" class="mt-2">
          <input v-model="imageUrl" :placeholder="t('labels.url_must_start')" class="input input-sm w-full">
        </div>
        <div v-else-if="uploadType === 'computer'" class="mt-2">
          <input type="file" accept="image/*" @change="handleFileUpload" class="file-input file-input-sm w-full">
          <progress v-if="uploadPercentage > 0" :value="uploadPercentage" max="100" class="progress progress-primary w-full mt-2"></progress>
        </div>
        <div v-else class="mt-2 text-center">
          <button @click="toggleImagePickerModal" class="btn btn-sm btn-primary">{{ t('labels.choose_file') }}</button>
          <span v-if="imagePath" class="block text-xs mt-1 opacity-60">{{ imagePath }}</span>
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <button @click="applyCoverUpload" class="btn btn-sm btn-success" :disabled="!canApplyUpload">
            <i class="mdi mdi-check mdi-18px"></i>
            <span class="ml-1">{{ t('labels.apply_cover') }}</span>
          </button>
        </div>
      </div>
    </details>

    <p v-if="errorMessage" class="text-error text-center text-sm mb-3">{{ errorMessage }}</p>
    <progress v-if="progress" class="animate-pulse progress progress-success w-full" max="100" />
  </div>
  </section>
</template>

<style lang="scss">
details > summary {
  list-style: none;
}
details > summary::-webkit-details-marker {
  display: none;
}

@media (min-width: 640px) {
  .jl-modal {
    max-width: 42.5rem;
    margin: 0 auto;
  }
}

.o-modal__content {
  max-height: 90vh !important;
  padding-bottom: 1.5rem !important;
}

#edit-modal-content {
  padding-bottom: 0 !important;
  min-height: 50vh;
}

.borderless-autocomplete {
  --oruga-input-border-width: 0px;
  --oruga-input-box-shadow: none;
  --oruga-input-background-color: transparent;
  --oruga-input-border-color: transparent;
  --oruga-input-border-style: none;
}

.borderless-autocomplete .o-taginput__container {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 0.25rem !important;
  max-width: 100% !important;
  overflow: visible !important;
}

.borderless-autocomplete .o-taginput__container > .badge {
  flex-shrink: 0;
}

.borderless-autocomplete .o-taginput__input {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  font-size: 0.875rem !important;
  text-align: left !important;
  min-width: 6rem !important;
  width: 8rem !important;
  flex: none !important;
}

.borderless-autocomplete .o-taginput__autocomplete,
.borderless-autocomplete .o-dropdown__trigger,
.borderless-autocomplete .o-input {
  display: inline-flex !important;
  width: 8rem !important;
  flex: none !important;
}

.borderless-autocomplete.flex-1 {
  display: flex !important;
  justify-content: flex-end !important;
  position: relative !important;
}

.borderless-autocomplete .o-input__input {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  text-align: right !important;
  font-size: 0.875rem !important;
}

.borderless-autocomplete .o-taginput__input::placeholder {
  text-align: left !important;
}

.borderless-autocomplete .o-dropdown__menu {
  left: auto !important;
  right: 0 !important;
  transform: none !important;
  width: auto !important;
  min-width: 12rem !important;
}

.uniform-input,
.o-input__input,
.o-taginput__input {
  min-height: 1.5rem !important;
  height: 1.5rem !important;
  line-height: 1.5rem !important;
}

.borderless-autocomplete .o-taginput__container,
.borderless-autocomplete .o-dropdown__trigger {
  min-height: 1.5rem !important;
  height: 1.5rem !important;
  align-items: center !important;
}
</style>
