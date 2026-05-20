<script setup lang="ts">
import { Ref, ref } from "vue";
import { useI18n } from 'vue-i18n';
import { Author } from "../../model/Author";
import { Wrapper } from "../../model/autocomplete-wrapper";
import { Book } from "../../model/Book";
import { Metadata } from "../../model/Metadata";
import { SeriesOrder } from "../../model/Series";
import { Tag } from "../../model/Tag";
import { authorService } from "../../services/authorService";
import { bookService } from "../../services/bookService";
import { tagService } from "../../services/tagService";
import { ObjectUtils } from "../../utils/ObjectUtils";
import MergeField from './MergeField.vue';
import SeriesCompleteInput from '../Series/SeriesCompleteInput.vue';
import TagInputField from '../Global/TagInputField.vue';
import { Role } from "../../model/Role";
import useTypography from "../../composables/typography";

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})

const props = defineProps<{
  book: Book,
  metadata: Metadata
}>()

const book: Ref<Book> = ref(props.book)
const initialImage = props.book.image
const initialIsbn10: Ref<string|undefined> = ref(book.value.isbn10)
const initialIsbn13: Ref<string|undefined> = ref(book.value.isbn13)
const seriesCopy: Array<SeriesOrder> = book.value.series ?? []

const emit = defineEmits<{
  (e: 'close', data?: any): void
}>()

let authors: Ref<Array<string|Author>> = ref([]);
let tags: Ref<Array<string|Tag>> = ref([])
let translators: Ref<Array<string|Author>> = ref([]);
let narrators: Ref<Array<string|Author>> = ref([]);

let filteredAuthors: Ref<Array<Wrapper>> = ref([]);
let filteredTags: Ref<Array<Wrapper>> = ref([]);
let filteredTranslators: Ref<Array<Wrapper>> = ref([]);
let filteredNarrators: Ref<Array<Wrapper>> = ref([]);

const progress: Ref<boolean> = ref(false)
const replaceImage: Ref<boolean> = ref(false)

const discard = () => {
  emit('close')
}

const isbnHasChanged = () => {
  return (book.value.isbn10 != undefined && book.value.isbn10 !== initialIsbn10.value) ||
  (book.value.isbn13 != undefined && book.value.isbn13 !== initialIsbn13.value)
}

const importData = async () => {
  if (book.value.id != null) {
    progress.value = true
    let saveBook = true
    // only check if isbn has changed, otherwise we could
    // only be editing an already existing book
    // with an isbn already set. And we don't want to warn in that case
    if (isbnHasChanged()) {
      let alreadyExisting = await bookService.checkIsbnExists(book.value.isbn10, book.value.isbn13)
      if (alreadyExisting != null) {
        saveBook = false
        await ObjectUtils.swalYesNoMixin.fire({
          html: `<p>${t('labels.book_with_same_isbn_already_exists')}:<br>${alreadyExisting.title}<br>${t('labels.save_new_anyway')}</p>`,
          showDenyButton: false,
          confirmButtonText: t('labels.save'),
        }).then((result) => {
          if (result.isConfirmed) {
            saveBook = true
          } else if (result.isDenied) {
            ObjectUtils.baseSwalMixin.fire('', t('labels.changes_not_saved'), 'info')
          }
        })
      }
    }
    if (!saveBook) {
      progress.value = false
      return
    }
    if (seriesCopy.length > 0) {
      if (book.value.series == null) {
        book.value.series = []
      }
      seriesCopy.forEach(s => {
        if (s.name.trim().length > 0){
          book.value.series?.push(s)
        }
      })
    }
    bookService.updateBook(book.value.id, {...book.value})
    .then(res => {
          progress.value = false
          emit('close', { ...book.value, ...props.metadata })
        })
        .catch(err => {
          progress.value = false
        })
  }
}

function beforeAdd(item: Author | string) {
  let shouldAdd = true
  if (item instanceof Object) {
    book.value.authors?.forEach(author => {
      if (author.name === item.name) {
        shouldAdd = false;
      }
    });
  }
  else {
    book.value.authors?.forEach(author => {
      if (author.name === item) {
        shouldAdd = false;
      }
    });
  }
  return shouldAdd
}

function beforeAddTag(item: Tag | string) {
  let shouldAdd = true
  if (item instanceof Object) {
    book.value.tags?.forEach(tag => {
      if (tag.name === item.name) {
        shouldAdd = false;
      }
    });
  }
  else {
    book.value.tags?.forEach(tag => {
      if (tag.name === item) {
        shouldAdd = false;
      }
    });
  }
  return shouldAdd
}

function createAuthor(item: Author | string) {
    return item
}

function createTag(item: Tag | string) {
    return item
}

function getFilteredAuthors(text: string) {
  authorService.findAuthorByCriteria(Role.ANY, text).then((data) => {
    filteredAuthors.value.splice(filteredAuthors.value.length)
    data.content.forEach(a => filteredAuthors.value.push(ObjectUtils.wrapForOptions(a)))
  })
}

function getFilteredTags(text: string) {
  tagService.findTagsByCriteria(text).then((data) => data.content.forEach(t => filteredTags.value.push(ObjectUtils.wrapForOptions(t))))
}

function authorAdded(item: string|Author) {
  itemAdded(item, book.value.authors as Array<Author>)
}

function tagAdded(item: string|Tag) {
  itemAdded(item, book.value.tags as Array<Tag>)
}

function itemAdded(item: string|Author|Tag, target: Array<Author|Tag>) {
    if (typeof item === 'string') {
      target.push({"name": item})
    } else {
      target.push(item)
    }
}

function authorRemoved(item: string|Author) {
  if (typeof item === 'string') {
    const toKeep = book.value.authors?.filter(a => a.name !== item)
    book.value.authors = toKeep
  } else {
    const toKeep = book.value.authors?.filter(a => a.id !== item.id)
    book.value.authors = toKeep
  }
}

function tagRemoved(item: string|Tag) {
  if (typeof item === 'string') {
    const toKeep = book.value.tags?.filter(a => a.name !== item)
    book.value.tags = toKeep
  } else {
    const toKeep = book.value.tags?.filter(a => a.id !== item.id)
    book.value.tags = toKeep
  }
}

function beforeAddTranslator(item: Author | string) {
  let shouldAdd = true
  if (item instanceof Object) {
    book.value.translators?.forEach(t => {
      if (t.name === item.name) shouldAdd = false;
    });
  } else {
    book.value.translators?.forEach(t => {
      if (t.name === item) shouldAdd = false;
    });
  }
  return shouldAdd
}

function beforeAddNarrator(item: Author | string) {
  let shouldAdd = true
  if (item instanceof Object) {
    book.value.narrators?.forEach(n => {
      if (n.name === item.name) shouldAdd = false;
    });
  } else {
    book.value.narrators?.forEach(n => {
      if (n.name === item) shouldAdd = false;
    });
  }
  return shouldAdd
}

function translatorAdded(item: string|Author) {
  if (!book.value.translators) book.value.translators = []
  itemAdded(item, book.value.translators as Array<Author>)
}

function narratorAdded(item: string|Author) {
  if (!book.value.narrators) book.value.narrators = []
  itemAdded(item, book.value.narrators as Array<Author>)
}

function translatorRemoved(item: string|Author) {
  if (typeof item === 'string') {
    book.value.translators = book.value.translators?.filter(t => t.name !== item)
  } else {
    book.value.translators = book.value.translators?.filter(t => t.id !== item.id)
  }
}

function narratorRemoved(item: string|Author) {
  if (typeof item === 'string') {
    book.value.narrators = book.value.narrators?.filter(n => n.name !== item)
  } else {
    book.value.narrators = book.value.narrators?.filter(n => n.id !== item.id)
  }
}

function copyTranslatorsFromMetadata() {
  if (!props.metadata.translators?.length) return
  book.value.translators = props.metadata.translators.map(name => ({ name }))
  translators.value = []
  props.metadata.translators.forEach(t => translators.value.push(t))
}

function copyNarratorsFromMetadata() {
  if (!props.metadata.narrators?.length) return
  book.value.narrators = props.metadata.narrators.map(name => ({ name }))
  narrators.value = []
  props.metadata.narrators.forEach(n => narrators.value.push(n))
}

function copyAuthorsFromMetadata() {
  if (!props.metadata.authors?.length) return
  book.value.authors = props.metadata.authors.map(name => ({ name }))
  authors.value = []
  props.metadata.authors.forEach(a => authors.value.push(a))
}

function copyTagsFromMetadata() {
  if (!props.metadata.tags?.length) return
  book.value.tags = props.metadata.tags.map(name => ({ name }))
  tags.value = []
  props.metadata.tags.forEach(t => tags.value.push(t))
}

function getFilteredTranslators(text: string) {
  authorService.findAuthorByCriteria(Role.TRANSLATOR, text).then((data) => {
    filteredTranslators.value.splice(filteredTranslators.value.length)
    data.content.forEach(a => filteredTranslators.value.push(ObjectUtils.wrapForOptions(a)))
  })
}

function getFilteredNarrators(text: string) {
  authorService.findAuthorByCriteria(Role.NARRATOR, text).then((data) => {
    filteredNarrators.value.splice(filteredNarrators.value.length)
    data.content.forEach(a => filteredNarrators.value.push(ObjectUtils.wrapForOptions(a)))
  })
}

book.value.authors?.forEach(a => authors.value.push(a.name))
book.value.tags?.forEach(t => tags.value.push(t.name))
book.value.translators?.forEach(t => translators.value.push(t.name))
book.value.narrators?.forEach(n => narrators.value.push(n.name))

const { typographyClasses } = useTypography()
</script>

<template>
  <section class="jl-modal" style="--modal-width: min(900px, calc(100vw - 24px)); --modal-min-height: 10rem;">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold" :class="typographyClasses">
        {{ t('book_merge.merge_books') }}
      </h2>
      <button @click="emit('close')" class="btn btn-sm btn-circle btn-outline ml-auto">
        <i class="mdi mdi-close mdi-18px"></i>
      </button>
    </div>
    <div class="w-full">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text first-letter:capitalize">{{ t('book.title') }}</span>
          </label>
          <input
            v-model="book.title"
            type="text"
            class="input input-primary w-full"
          >
        </div>
        <div class="form-control w-full">
          <div class="join w-full">
            <button
              class="btn btn-square btn-ghost btn-outline btn-secondary join-item z-0"
              @click="book.title = props.metadata.title != null ? props.metadata.title : ''"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <input
              type="text"
              :value="props.metadata.title"
              disabled
              class="jelu-cursor-text input input-secondary w-full join-item"
            >
          </div>
        </div>
        <div class="w-full jelu-authorinput">
          <label class="label">
            <span class="label-text first-letter:capitalize">{{ t('book.author', 2) }}</span>
          </label>
          <TagInputField
            v-model="authors"
            :options="filteredAuthors"
            :validate-item="beforeAdd"
            :create-item="createAuthor"
            icon-pack="mdi"
            icon="account-plus"
            :placeholder="t('labels.add_author')"
            @input="getFilteredAuthors"
            @add="authorAdded"
            @remove="authorRemoved"
          />
        </div>
        <div class="form-control w-full">
          <div class="join w-full">
            <button
              class="btn btn-square btn-ghost btn-outline btn-secondary join-item z-0"
              @click="copyAuthorsFromMetadata()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <input
              type="text"
              :value="props.metadata.authors.join(', ')"
              disabled
              class="jelu-cursor-text input input-secondary w-full join-item"
            >
          </div>
        </div>
        <div class="w-full jelu-taginput">
          <label class="label">
            <span class="label-text first-letter:capitalize">{{ t('book.tag', 2) }}</span>
          </label>
          <TagInputField
            v-model="tags"
            :options="filteredTags"
            :validate-item="beforeAddTag"
            :create-item="createTag"
            icon-pack="mdi"
            icon="tag-plus"
            :placeholder="t('labels.add_tag')"
            @input="getFilteredTags"
            @add="tagAdded"
            @remove="tagRemoved"
          />
        </div>
        <div class="form-control w-full">
          <div class="join w-full">
            <button
              class="btn btn-square btn-ghost btn-outline btn-secondary join-item z-0"
              @click="copyTagsFromMetadata()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <input
              type="text"
              :value="props.metadata.tags.join(', ')"
              disabled
              class="jelu-cursor-text input input-secondary w-full join-item"
            >
          </div>
        </div>
        <!-- translators -->
        <div class="w-full jelu-authorinput">
          <label class="label">
            <span class="label-text first-letter:capitalize">{{ t('book.translator', 2) }}</span>
          </label>
          <TagInputField
            v-model="translators"
            :options="filteredTranslators"
            :validate-item="beforeAddTranslator"
            :create-item="createAuthor"
            icon-pack="mdi"
            icon="account-plus"
            :placeholder="t('labels.add_translator')"
            @input="getFilteredTranslators"
            @add="translatorAdded"
            @remove="translatorRemoved"
          />
        </div>
        <div class="form-control w-full">
          <div class="join w-full">
            <button
              class="btn btn-square btn-ghost btn-outline btn-secondary join-item z-0"
              @click="copyTranslatorsFromMetadata()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <input
              type="text"
              :value="props.metadata.translators?.join(', ')"
              disabled
              class="jelu-cursor-text input input-secondary w-full join-item"
            >
          </div>
        </div>
        <!-- narrators -->
        <div class="w-full jelu-authorinput">
          <label class="label">
            <span class="label-text first-letter:capitalize">{{ t('book.narrator', 2) }}</span>
          </label>
          <TagInputField
            v-model="narrators"
            :options="filteredNarrators"
            :validate-item="beforeAddNarrator"
            :create-item="createAuthor"
            icon-pack="mdi"
            icon="account-plus"
            :placeholder="t('labels.add_narrator')"
            @input="getFilteredNarrators"
            @add="narratorAdded"
            @remove="narratorRemoved"
          />
        </div>
        <div class="form-control w-full">
          <div class="join w-full">
            <button
              class="btn btn-square btn-ghost btn-outline btn-secondary join-item z-0"
              @click="copyNarratorsFromMetadata()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <input
              type="text"
              :value="props.metadata.narrators?.join(', ')"
              disabled
              class="jelu-cursor-text input input-secondary w-full join-item"
            >
          </div>
        </div>
        <MergeField
          :label="t('book.isbn10')"
          :model-value="book.isbn10"
          :metadata-value="props.metadata.isbn10"
          @update:model-value="book.isbn10 = $event"
        />
        <MergeField
          :label="t('book.isbn13')"
          :model-value="book.isbn13"
          :metadata-value="props.metadata.isbn13"
          @update:model-value="book.isbn13 = $event"
        />
        <MergeField
          :label="t('book.publisher')"
          :model-value="book.publisher"
          :metadata-value="props.metadata.publisher"
          @update:model-value="book.publisher = $event"
        />
        <MergeField
          :label="t('book.page_count')"
          :model-value="book.pageCount"
          :metadata-value="props.metadata.pageCount"
          field-type="number"
          @update:model-value="book.pageCount = $event"
        />
        <MergeField
          :label="t('book.published_date')"
          :model-value="book.publishedDate"
          :metadata-value="props.metadata.publishedDate"
          @update:model-value="book.publishedDate = $event"
        />
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text first-letter:capitalize">{{ t('book.series') }}</span>
          </label>
          <div>
            <SeriesCompleteInput v-model="seriesCopy" />
          </div>
        </div>
        <div class="form-control w-full">
          <div class="flex">
            <div class="m-2">
              {{ props.metadata.series }} <span v-if="props.metadata.numberInSeries">#{{ props.metadata.numberInSeries }}</span>
            </div>
          </div>
        </div>
        <MergeField
          :label="t('book.language')"
          :model-value="book.language"
          :metadata-value="props.metadata.language"
          @update:model-value="book.language = $event"
        />
        <MergeField
          :label="t('book.google_id')"
          :model-value="book.googleId"
          :metadata-value="props.metadata.googleId"
          @update:model-value="book.googleId = $event"
        />
        <MergeField
          :label="t('book.goodreads_id')"
          :model-value="book.goodreadsId"
          :metadata-value="props.metadata.goodreadsId"
          @update:model-value="book.goodreadsId = $event"
        />
        <MergeField
          :label="t('book.amazon_id')"
          :model-value="book.amazonId"
          :metadata-value="props.metadata.amazonId"
          @update:model-value="book.amazonId = $event"
        />

        <MergeField
          :label="t('book.librarything_id')"
          :model-value="book.librarythingId"
          :metadata-value="props.metadata.librarythingId"
          @update:model-value="book.librarythingId = $event"
        />

        <MergeField
          :label="t('book.isfdb_id')"
          :model-value="book.isfdbId"
          :metadata-value="props.metadata.isfdbId"
          @update:model-value="book.isfdbId = $event"
        />

        <MergeField
          :label="t('book.openlibrary_id')"
          :model-value="book.openlibraryId"
          :metadata-value="props.metadata.openlibraryId"
          @update:model-value="book.openlibraryId = $event"
        />

        <MergeField
          :label="t('book.noosfere_id')"
          :model-value="book.noosfereId"
          :metadata-value="props.metadata.noosfereId"
          @update:model-value="book.noosfereId = $event"
        />

        <MergeField
          :label="t('book.inventaire_id')"
          :model-value="book.inventaireId"
          :metadata-value="props.metadata.inventaireId"
          @update:model-value="book.inventaireId = $event"
        />
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text first-letter:capitalize">{{ t('book.summary') }}</span>
          </label>
          <textarea
            v-model="book.summary"
            class="textarea textarea-primary w-full"
          />
        </div>
        <div class="form-control w-full">
          <div class="join w-full">
            <button
              class="btn btn-square btn-ghost btn-outline btn-secondary join-item z-0"
              @click="book.summary = props.metadata.summary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <textarea
              :value="props.metadata.summary"
              disabled
              class="jelu-cursor-text textarea textarea-secondary w-full join-item"
            />
          </div>
        </div>
        <div class="form-control w-full" v-if="props.metadata.image">
          <div class="indicator">
                        <span
                        v-if="replaceImage"
              class="badge indicator-item indicator-bottom indicator-start tooltip tooltip-bottom"
              :data-tip="t('labels.discard')"
              @click="book.image = initialImage; replaceImage = false;"
            >
              <i class="mdi mdi-autorenew" />
            </span>

            <figure>
              <img
                v-if="book.image"
                :src="book.image?.startsWith('http') ? book.image : '/files/' + book.image"
                alt="Book Image"
                class="max-h-96"
                loading="lazy"
                decoding="async"
              />
              <img
                v-else
                src="../../assets/placeholder_asset.jpg"
                class="max-h-96"
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </div>
          <div class="form-control w-full">
            <button
              class="btn btn-square btn-ghost btn-outline btn-secondary join-item z-0"
              @click="book.image = props.metadata.image; replaceImage = true;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>

           <div class="">
             <figure>
               <img
                  :src="props.metadata.image?.startsWith('http') ? props.metadata.image : '/files/' + props.metadata.image"
                 alt="Book Image"
                 class="max-h-96"
                 loading="lazy"
                 decoding="async"
               />
             </figure>
           </div>
        </div>
      </div>
      <div
        class="flex space-x-5 mt-4 justify-center"
      >
        <button
          class="btn btn-sm btn-primary"
          :disabled="progress"
          @click="importData"
        >
          <span
            v-if="progress"
            class="loading loading-spinner"
          />
          <span class="icon">
            <i class="mdi mdi-check mdi-18px" />
          </span><span>{{ t('labels.import') }}</span>
        </button>
        <button
          class="btn btn-sm btn-warning"
          :disabled="progress"
          @click="discard"
        >
          <span
            v-if="progress"
            class="loading loading-spinner"
          />
          <span class="icon">
            <i class="mdi mdi-cancel mdi-18px" />
          </span><span>{{ t('labels.discard') }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style>

</style>
