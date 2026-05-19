<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})

const googleId = defineModel<string | undefined>('googleId')
const goodreadsId = defineModel<string | undefined>('goodreadsId')
const amazonId = defineModel<string | undefined>('amazonId')
const librarythingId = defineModel<string | undefined>('librarythingId')
const isfdbId = defineModel<string | undefined>('isfdbId')
const openlibraryId = defineModel<string | undefined>('openlibraryId')
const noosfereId = defineModel<string | undefined>('noosfereId')
const inventaireId = defineModel<string | undefined>('inventaireId')
</script>

<template>
  <fieldset class="fieldset sm:grid sm:grid-cols-3">
    <legend class="fieldset-legend capitalize">
      {{ t('book.identifiers') }}
    </legend>
    <input
      v-model="googleId"
      :placeholder="t('book.google_id')"
      class="input focus:input-accent w-full"
    >
    <input
      v-model="goodreadsId"
      :placeholder="t('book.goodreads_id')"
      class="input focus:input-accent w-full"
    >
    <input
      v-model="amazonId"
      :placeholder="t('book.amazon_id')"
      class="input focus:input-accent w-full"
    >
    <input
      v-model="librarythingId"
      :placeholder="t('book.librarything_id')"
      class="input focus:input-accent w-full"
    >
    <input
      v-model="isfdbId"
      :placeholder="t('book.isfdb_id')"
      class="input focus:input-accent w-full"
    >
    <input
      v-model="openlibraryId"
      :placeholder="t('book.openlibrary_id')"
      class="input focus:input-accent w-full"
    >
    <input
      v-model="noosfereId"
      :placeholder="t('book.noosfere_id')"
      class="input focus:input-accent w-full"
    >
    <input
      v-model="inventaireId"
      :placeholder="t('book.inventaire_id')"
      class="input focus:input-accent w-full"
    >
  </fieldset>
</template>
