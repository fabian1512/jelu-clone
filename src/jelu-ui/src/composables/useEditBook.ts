import { useOruga } from "@oruga-ui/oruga-next";
import { useRouter } from 'vue-router';
import { computed, Ref, ref, watch } from "vue";
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { Author } from "../model/Author";
import { Wrapper } from "../model/autocomplete-wrapper";
import { UserBook } from "../model/Book";
import { Metadata } from "../model/Metadata";
import { ReadingEventType } from "../model/ReadingEvent";
import { SeriesOrder } from "../model/Series";
import { Tag } from "../model/Tag";
import { authorService } from "../services/authorService";
import { bookService } from "../services/bookService";
import { userBookService } from "../services/userBookService";
import { tagService } from "../services/tagService";
import { publisherService } from "../services/publisherService";
import { ObjectUtils } from "../utils/ObjectUtils";
import { StringUtils } from "../utils/StringUtils";
import { useImageUpload } from "./useImageUpload";
import { Role } from "../model/Role";
import { key } from '../store';
import { emitBusEvent, BOOK_SAVED } from "./eventBus";

export function useEditBook(
  props: { book: UserBook | Metadata | null },
  emit: (e: 'close', reason?: 'save' | 'cancel') => void
) {
  const { t } = useI18n({
    inheritLocale: true,
    useScope: 'global'
  })
  const oruga = useOruga()
  const router = useRouter()
  const store = useStore(key)

  const isAdmin = computed(() => {
    return store !== undefined && store.getters.isAdmin
  })

  const deleteBook = async () => {
    let deleteForUserOnly = true
    let abort = false
    if (isAdmin.value === true) {
      await ObjectUtils.swalMixin.fire({
        html: `<p>${t('labels.delete_for_all_or_only_you')}</p>`,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: t('labels.only_me'),
        denyButtonText: t('labels.all_users'),
        cancelButtonText: t('labels.dont_delete'),
      }).then((result) => {
        if (result.isDenied) {
          deleteForUserOnly = false
        } else if (result.isDismissed) {
          abort = true
          return;
        }
      })
    }
    else {
      await ObjectUtils.swalYesNoMixin.fire({
        html: `<p>${t('labels.delete_this_book')}</p>`,
        showCancelButton: true,
        showConfirmButton: true,
        showDenyButton: false,
        confirmButtonText: t('labels.delete'),
        cancelButtonText: t('labels.dont_delete'),
      }).then((result) => {
        if (result.isDismissed) {
          abort = true
          return;
        }
      })
    }
    if (abort) {
      return
    }
    let promise
    if (deleteForUserOnly) {
      if (userbook.value.id) {
        promise = userBookService.deleteUserBook(userbook.value.id)
      }
    }
    else {
      if (userbook.value.book.id) {
        promise = bookService.deleteBook(userbook.value.book.id)
      }
    }
    promise?.then(res => {
      ObjectUtils.toast(oruga, "success", t('labels.book_was_deleted'), 4000);
      emit('close', 'cancel')
      router.push('/')
    })
      .catch(err => {
        ObjectUtils.toast(oruga, "danger", t('labels.error_deleting', {msg : err.message}), 4000);
      })
  }

  const filteredAuthors: Ref<Array<Wrapper>> = ref([]);
  const filteredTags: Ref<Array<Wrapper>> = ref([]);
  const filteredTranslators: Ref<Array<Wrapper>> = ref([]);
  const filteredNarrators: Ref<Array<Wrapper>> = ref([]);
  const filteredPublishers: Ref<Array<string>> = ref([])

  function copyInput(book: UserBook | Metadata | null): any {
    if (book == null) {
      return {}
    }
    if (!('id' in book)) {
      const meta = book as Metadata
      return {
        book: {
          title: meta.title || '',
          originalTitle: undefined,
          isbn10: meta.isbn10,
          isbn13: meta.isbn13,
          summary: meta.summary || '',
          publisher: meta.publisher || undefined,
          image: meta.image || null,
          pageCount: meta.pageCount || null,
          publishedDate: meta.publishedDate || null,
          authors: meta.authors?.map((a: string) => ({ name: a })) || [],
          translators: meta.translators?.map((t: string) => ({ name: t })) || [],
          narrators: [],
          tags: meta.tags?.map((t: string) => ({ name: t })) || [],
          series: meta.series ? [{ name: meta.series, numberInSeries: meta.numberInSeries }] : [],
          language: meta.language || '',
          googleId: meta.googleId,
          amazonId: meta.amazonId,
          goodreadsId: meta.goodreadsId,
          librarythingId: meta.librarythingId,
          isfdbId: meta.isfdbId,
          openlibraryId: meta.openlibraryId,
          noosfereId: meta.noosfereId,
          inventaireId: meta.inventaireId,
        },
        lastReadingEvent: ReadingEventType.FINISHED,
        lastReadingEventDate: null,
        creationDate: null,
        modificationDate: null,
        owned: false,
        toRead: false,
        borrowed: false,
        price: 0,
        currentPageNumber: 0,
        percentRead: 0,
        personalNotes: null,
        userBookId: undefined,
        userbook: undefined,
      }
    }
    const b = ObjectUtils.deepCopy(book)
    return b
  }

  const userbook: Ref<UserBook> = ref(copyInput(props.book))
  const hasImage: Ref<boolean> = ref(userbook.value.book.image != null)
  const deleteImage: Ref<boolean> = ref(false)

  const {
    imageUrl,
    imagePath,
    file,
    uploadType,
    uploadPercentage,
    progress,
    errorMessage,
    handleFileUpload,
    clearImageField,
    canApplyUpload,
    getUploadPayload,
  } = useImageUpload()

  const publishedDateString = computed({
    get: () => userbook.value.book.publishedDate || '',
    set: (val: string) => {
      userbook.value.book.publishedDate = val || null
    }
  })

  const smallCoverUrl = computed(() => {
    if (!userbook.value?.book?.image) return null
    if (userbook.value.book.image.startsWith('http') || userbook.value.book.image.startsWith('/api/')) {
      return userbook.value.book.image
    }
    return StringUtils.thumbnailUrl(userbook.value.book.image, "thumb") ?? "/files/" + userbook.value.book.image
  })

  const seriesCopy: Array<SeriesOrder> = userbook.value.book.series ?? []

  const importBook = () => {
    userbook.value.book.series = seriesCopy.filter(s => s.name != null && s.name.trim().length > 0)
    if (userbook.value.lastReadingEvent === ReadingEventType.NONE) {
      userbook.value.lastReadingEvent = null
    }
    if (StringUtils.isNotBlank(imageUrl.value)) {
      userbook.value.book.image = imageUrl.value
    } else if (imagePath.value != null && StringUtils.isNotBlank(imagePath.value)) {
      userbook.value.book.image = imagePath.value
    } else if (deleteImage.value) {
      userbook.value.book.image = null
    }
    if (userbook.value.price != null) {
      if (userbook.value.price <= 0) {
        userbook.value.price = null
      }
    }

    let promise: Promise<UserBook>
    progress.value = true
    if (StringUtils.isBlank(userbook.value.id)) {
      promise = userBookService.saveUserBookImage(
        userbook.value,
        file.value,
        (event: { loaded: number; total: number }) => {
          const percent = Math.round((100 * event.loaded) / event.total);
          uploadPercentage.value = percent;
        }
      )
    }
    else {
      promise = userBookService.updateUserBookImage(
        userbook.value,
        file.value,
        (event: { loaded: number; total: number }) => {
          const percent = Math.round((100 * event.loaded) / event.total);
          uploadPercentage.value = percent;
        }
      )
    }
    promise
      .then(res => {
        progress.value = false
        ObjectUtils.toast(oruga, "success", t('labels.book_title_updated', { title : res.book.title}), 4000);
        emitBusEvent(BOOK_SAVED)
        emit('close', 'save')
      })
      .catch(err => {
        progress.value = false
        ObjectUtils.toast(oruga, "danger", t('labels.error_message', {msg : err.message}), 4000);
      })
  }

  function getFilteredData(text: string, target: Array<Wrapper>) {
    authorService.findAuthorByCriteria(Role.ANY, text).then((data) => {
      target.splice(0, target.length)
      data.content.forEach(a => target.push(ObjectUtils.wrapForOptions(a)))
    })
  }

  function getFilteredTags(text: string) {
    tagService.findTagsByCriteria(text).then((data) => {
      filteredTags.value.splice(0, filteredTags.value.length)
      data.content.forEach(t => filteredTags.value.push(ObjectUtils.wrapForOptions(t)))
    })
  }

  const publisherInput = ref(userbook.value.book.publisher ?? '')
  let publisherMounted = false

  function getFilteredPublishers(text: string) {
    if (!publisherMounted) {
      publisherMounted = true
      return
    }
    publisherInput.value = text
    userbook.value.book.publisher = text
    publisherService.findPublisherByCriteria(text).then(data => {
      filteredPublishers.value = data.content
      if (text !== '' && !filteredPublishers.value.includes(text)) {
        filteredPublishers.value.push(text)
      }
    })
  }

  function beforeAdd(item: Author | string, target: Array<Author>) {
    let shouldAdd = true
    if (item instanceof Object) {
      target.forEach(author => {
        if (author.name === item.name) {
          shouldAdd = false;
        }
      });
    }
    else {
      target.forEach(author => {
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
      userbook.value.book?.tags?.forEach(tag => {
        if (tag.name === item.name) {
          shouldAdd = false;
        }
      });
    }
    else {
      userbook.value.book?.tags?.forEach(tag => {
        if (tag.name === item) {
          shouldAdd = false;
        }
      });
    }
    return shouldAdd
  }

  function selectPublisher(publisher: string) {
    if (publisher != null) {
      publisherInput.value = publisher
      userbook.value.book.publisher = publisher
    }
  }

  function toggleRemoveImage() {
    deleteImage.value = !deleteImage.value
  }

  const applyCoverUpload = () => {
    const payload = getUploadPayload()
    if (!payload) return

    if (payload.type === 'web') {
      userbook.value.book.image = payload.url
      hasImage.value = true
      deleteImage.value = false
    } else if (payload.type === 'computer') {
      progress.value = true
      userBookService.saveUserBookImage(
        userbook.value,
        payload.file,
        (event: { loaded: number; total: number }) => {
          const percent = Math.round((100 * event.loaded) / event.total);
          uploadPercentage.value = percent;
        }
      ).then((result) => {
        userbook.value = result
        hasImage.value = true
        deleteImage.value = false
        file.value = null
        uploadPercentage.value = 0
        progress.value = false
      }).catch((error) => {
        progress.value = false
        uploadPercentage.value = 0
        errorMessage.value = error.message || 'Upload failed'
      })
      return
    } else if (payload.type === 'server') {
      userbook.value.book.image = payload.path
      hasImage.value = true
      deleteImage.value = false
    }
  }

  watch(() => [userbook.value.currentPageNumber, userbook.value.percentRead, userbook.value.book.pageCount],(newVal, oldVal) => {
    if (userbook.value.book.pageCount != null) {
      ObjectUtils.computePages(newVal, oldVal, userbook.value, userbook.value.book.pageCount)
    }
  })

  if (userbook.value.book.publisher != null && userbook.value.book.publisher !== '') {
    filteredPublishers.value.push(userbook.value.book.publisher as string)
  }

  const sliderPercent = ref(userbook.value.percentRead || 0)

  watch(() => userbook.value.percentRead, (newVal) => {
    sliderPercent.value = newVal || 0
  })

  watch(() => sliderPercent.value, (newVal) => {
    userbook.value.percentRead = newVal
  })

  return {
    t,
    userbook,
    isAdmin,
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
    clearImageField,
    canApplyUpload,
    applyCoverUpload,
    errorMessage,
    file,
  }
}
