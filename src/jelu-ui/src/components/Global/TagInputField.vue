<script setup lang="ts">
import ClosableBadge from './ClosableBadge.vue'

const props = defineProps<{
  modelValue: any[]
  options: any[]
  placeholder?: string
  icon?: string
  iconPack?: string
  badgeClass?: string
  validateItem?: (item: any) => boolean
  beforeAdding?: (item: any) => boolean | Promise<boolean>
  createItem?: (item: any) => any
  allowNew?: boolean
  rootClass?: string
  displayField?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: any[]): void
  (e: 'input', val: string): void
  (e: 'add', item: any): void
  (e: 'remove', item: any): void
}>()

function itemContent(item: any): string {
  if (props.displayField) {
    return item[props.displayField] ?? item
  }
  if (typeof item === 'string') {
    return item
  }
  return item?.name ?? item
}

function itemKey(item: any, index: number): string {
  return item?.id ?? item?.name ?? index
}
</script>

<template>
  <o-taginput
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :options="options"
    :allow-autocomplete="true"
    autocomplete="off"
    :allow-new="allowNew ?? true"
    :allow-duplicates="false"
    :open-on-focus="true"
    :validate-item="validateItem"
    :before-adding="beforeAdding"
    :create-item="createItem"
    :placeholder="placeholder"
    :icon-pack="iconPack"
    :icon="icon"
    :root-class="rootClass"
    :field="displayField"
    @input="emit('input', $event)"
    @add="emit('add', $event)"
    @remove="emit('remove', $event)"
  >
    <template #default="{ value }">
      <div class="jl-taginput-item">{{ displayField ? value[displayField] : value?.name ?? value }}</div>
    </template>
    <template #selected="{ removeItem, items }">
      <ClosableBadge
        v-for="(item, index) in items"
        :key="itemKey(item, index)"
        :content="itemContent(item)"
        :class="badgeClass ?? 'badge-primary'"
        @closed="removeItem(index, $event)"
      />
    </template>
  </o-taginput>
</template>
