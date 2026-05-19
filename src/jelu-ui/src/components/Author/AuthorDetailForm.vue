<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import FormField from '../Global/FormField.vue';

defineProps<{
  author: {
    name: string
    dateOfBirth?: Date | string | null
    dateOfDeath?: Date | string | null
    biography?: string | null
    officialPage?: string | null
    wikipediaPage?: string | null
    goodreadsPage?: string | null
    twitterPage?: string | null
    facebookPage?: string | null
    instagramPage?: string | null
    notes?: string | null
  }
  nameLabel?: string
}>()

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})
</script>

<template>
  <FormField
    v-model="author.name"
    :legend="nameLabel ?? t('author.name')"
    placeholder=""
  />
  <fieldset class="fieldset">
    <legend class="fieldset-legend capitalize">
      {{ t('author.date_of_birth') }}
    </legend>
    <o-datepicker
      v-model="author.dateOfBirth"
      :show-week-number="false"
      :locale="undefined"
      :placeholder="t('labels.click_to_select')"
      :expanded="true"
      icon="calendar"
      icon-right="close"
      icon-right-clickable="true"
      :mobile-native="false"
      mobile-modal="false"
      trap-focus
      @icon-right-click="author.dateOfBirth = undefined"
    />
  </fieldset>
  <fieldset class="fieldset">
    <legend class="fieldset-legend capitalize">
      {{ t('author.date_of_death') }}
    </legend>
    <o-datepicker
      v-model="author.dateOfDeath"
      :show-week-number="false"
      :locale="undefined"
      :placeholder="t('labels.click_to_select')"
      :expanded="true"
      icon="calendar"
      icon-right="close"
      icon-right-clickable="true"
      mobile-native="false"
      mobile-modal="false"
      trap-focus
      @icon-right-click="author.dateOfDeath = undefined"
    />
  </fieldset>
  <fieldset class="fieldset">
    <legend class="fieldset-legend capitalize">
      {{ t('author.biography') }}
    </legend>
    <textarea
      v-model="author.biography"
      class="textarea focus:textarea-accent w-full"
      maxlength="5000"
    />
  </fieldset>
  <FormField
    v-model="author.officialPage"
    :legend="t('author.official_page')"
  />
  <FormField
    v-model="author.wikipediaPage"
    :legend="t('author.wikipedia_page')"
  />
  <FormField
    v-model="author.goodreadsPage"
    :legend="t('author.goodreads_page')"
    placeholder=""
  />
  <FormField
    v-model="author.twitterPage"
    :legend="t('author.x_page')"
    placeholder=""
  />
  <FormField
    v-model="author.facebookPage"
    :legend="t('author.facebook_page')"
    placeholder=""
  />
  <FormField
    v-model="author.instagramPage"
    :legend="t('author.instagram_page')"
    placeholder=""
  />
  <fieldset class="fieldset">
    <legend class="fieldset-legend capitalize">
      {{ t('author.personal_notes') }}
    </legend>
    <textarea
      v-model="author.notes"
      class="textarea w-full focus:textarea-accent"
      maxlength="5000"
    />
  </fieldset>
</template>
