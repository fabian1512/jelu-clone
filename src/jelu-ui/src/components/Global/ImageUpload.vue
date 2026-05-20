<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})

const props = defineProps<{
  uploadType: string
  imageUrl: string | null
  imagePath: string | null
  uploadPercentage: number
  progress: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  (e: 'update:uploadType', value: string): void
  (e: 'update:imageUrl', value: string | null): void
  (e: 'file-change', event: Event): void
  (e: 'clear-image-url'): void
  (e: 'pick-server'): void
}>()
</script>

<template>
  <div>
    <fieldset class="fieldset">
      <legend class="fieldset-legend capitalize">
        {{ t('labels.upload_cover') }}
      </legend>
      <div>
        <label class="label cursor-pointer justify-start sm:justify-center gap-3 sm:gap-2 flex flex-wrap">
          <div>
            <input
              :checked="uploadType === 'web'"
              type="radio"
              name="upload-type"
              class="radio radio-primary mx-3"
              value="web"
              @change="emit('update:uploadType', 'web')"
            >
            <span class="label-text">{{ t('labels.upload_from_web') }}</span>
          </div>
          <div>
            <input
              :checked="uploadType === 'computer'"
              type="radio"
              name="upload-type"
              class="radio radio-primary mx-3"
              value="computer"
              @change="emit('update:uploadType', 'computer')"
            >
            <span class="label-text">{{ t('labels.upload_from_computer') }}</span>
          </div>
          <div>
            <input
              :checked="uploadType === 'server'"
              type="radio"
              name="upload-type"
              class="radio radio-primary mx-3"
              value="server"
              @change="emit('update:uploadType', 'server')"
            >
            <span class="label-text">{{ t('labels.upload_from_server') }}</span>
          </div>
        </label>
      </div>
    </fieldset>
    <fieldset v-if="uploadType === 'web'" class="fieldset">
      <legend class="fieldset-legend capitalize">
        {{ t('labels.enter_image_address') }}
      </legend>
      <label class="input validator w-full">
        <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </g>
        </svg>
        <input
          :value="imageUrl"
          type="url"
          required
          class="w-full"
          :placeholder="t('labels.url_must_start')"
          pattern="https?://.*"
          @input="emit('update:imageUrl', ($event.target as HTMLInputElement).value)"
        >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-8 hover:cursor-pointer"
          @click="emit('clear-image-url')"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </label>
      <p class="validator-hint">{{ t('labels.url_must_start') }}</p>
    </fieldset>
    <fieldset v-else-if="uploadType === 'computer'" class="fieldset">
      <legend class="file fieldset-legend">{{ t('labels.choose_file') }}</legend>
      <input type="file" accept="image/*" class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-primary hover:file:bg-gray-300" @change="emit('file-change', $event)">
      <br>
      <progress v-if="uploadPercentage > 0" :value="uploadPercentage" max="100" class="progress progress-primary" />
    </fieldset>
    <fieldset v-else class="fieldset">
      <legend class="file fieldset-legend">{{ t('labels.choose_file') }}</legend>
      <button class="btn btn-primary button" @click="emit('pick-server')">
        <span class="icon"><i class="mdi mdi-file-question mdi-18px" /></span>
        <span>{{ t('labels.choose_file') }}</span>
      </button>
      <span>{{ imagePath }}</span>
    </fieldset>
    <div class="field">
      <progress v-if="progress" class="progress progress-success mt-5" max="100" />
      <p v-if="errorMessage" class="text-error">{{ errorMessage }}</p>
    </div>
  </div>
</template>
