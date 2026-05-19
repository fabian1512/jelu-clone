<script setup lang="ts">
const props = defineProps<{
  label: string
  modelValue: string | number | null | undefined
  metadataValue: string | number | null | undefined
  fieldType?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

function copy() {
  emit('update:modelValue', props.metadataValue)
}
</script>

<template>
  <div class="form-control w-full">
    <label class="label">
      <span class="label-text">{{ label }}</span>
    </label>
    <input
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :type="fieldType ?? 'text'"
      class="input input-primary w-full"
    >
  </div>
  <div class="form-control w-full">
    <div class="join w-full">
      <button
        class="btn btn-square btn-ghost btn-outline btn-secondary join-item z-0"
        @click="copy"
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
        :value="metadataValue"
        type="text"
        disabled
        class="jelu-cursor-text input input-secondary w-full join-item"
      >
    </div>
  </div>
</template>
