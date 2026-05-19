<script setup lang="ts">
import { computed } from "vue";
import { Book } from "../../model/Book";

const props = defineProps<{ book: Book | null }>()

const hasExternalLink = computed(() => props.book?.amazonId != null
  || props.book?.goodreadsId != null
  || props.book?.googleId != null
  || props.book?.librarythingId != null
  || props.book?.openlibraryId != null
  || props.book?.isfdbId != null
  || props.book?.noosfereId != null
  || props.book?.inventaireId != null)

const getIsbn = (): string | null => {
  if (props.book?.isbn13 && props.book.isbn13.length > 0) {
    return props.book.isbn13.replaceAll("-", "")
  }
  if (props.book?.isbn10 && props.book.isbn10.length > 0) {
    return props.book.isbn10.replaceAll("-", "")
  }
  return null
}
</script>

<template>
  <p>
    <span class="font-semibold capitalize">Extern:</span>
    <span v-if="hasExternalLink">
      <span v-if="book?.goodreadsId" class="badge badge-warning ml-1">
        <a :href="'https://www.goodreads.com/book/show/' + book.goodreadsId" target="_blank" rel="noopener noreferrer">goodreads</a>
      </span>
      <span v-if="book?.googleId" class="badge badge-warning ml-1">
        <a :href="'https://books.google.com/books?id=' + book.googleId" target="_blank" rel="noopener noreferrer">google</a>
      </span>
      <span v-if="book?.amazonId" class="badge badge-warning ml-1">
        <a :href="'https://www.amazon.com/dp/' + book.amazonId" target="_blank" rel="noopener noreferrer">amazon</a>
      </span>
      <span v-if="book?.librarythingId" class="badge badge-warning ml-1">
        <a :href="'https://www.librarything.com/work/' + book.librarythingId" target="_blank" rel="noopener noreferrer">librarything</a>
      </span>
      <span v-if="book?.isfdbId" class="badge badge-warning ml-1">
        <a :href="'https://www.isfdb.org/cgi-bin/title.cgi?' + book.isfdbId" target="_blank" rel="noopener noreferrer">ISFDB</a>
      </span>
      <span v-if="book?.openlibraryId" class="badge badge-warning ml-1">
        <a :href="`https://openlibrary.org/works/${book.openlibraryId}?mode=all`" target="_blank" rel="noopener noreferrer">Openlibrary</a>
      </span>
      <span v-if="book?.noosfereId" class="badge badge-warning ml-1">
        <a :href="'https://www.noosfere.org/livres/EditionsLivre.asp?numitem=' + book.noosfereId" target="_blank" rel="noopener noreferrer">Noosfere</a>
      </span>
      <span v-if="getIsbn() != null" class="badge badge-warning ml-1">
        <a :href="'https://inventaire.io/entity/isbn:' + getIsbn()" target="_blank" rel="noopener noreferrer">inventaire</a>
      </span>
      <span v-if="book?.inventaireId && getIsbn() == null" class="badge badge-warning ml-1">
        <a :href="'https://inventaire.io/entity/inv:' + book.inventaireId" target="_blank" rel="noopener noreferrer">inventaire</a>
      </span>
    </span>
    <span v-else class="opacity-60">-</span>
  </p>
</template>
