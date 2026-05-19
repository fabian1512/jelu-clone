<script setup lang="ts">
import dayjs from "dayjs";
import { computed } from "vue";
import { useI18n } from 'vue-i18n';
import { ReadingEvent, CreateReadingEvent } from "../../model/ReadingEvent";
import { ReadingEventType } from "../../model/ReadingEvent";
import useTypography from "../../composables/typography";

const { t, d } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})

const props = defineProps<{
  events: ReadingEvent[]
}>()

const emit = defineEmits<{
  (e: 'edit-event', event: ReadingEvent): void
  (e: 'create-event', event: CreateReadingEvent): void
}>()

const { typographyClasses } = useTypography()

const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => {
    const dateA = a.startDate ? dayjs(a.startDate) : dayjs(0)
    const dateB = b.startDate ? dayjs(b.startDate) : dayjs(0)
    return dateA.isAfter(dateB) ? -1 : 1
  })
})

interface TimelineEntry {
  event: ReadingEvent
  date: Date
  label: string
  originalEvent: ReadingEvent
}

const timelineEntries = computed((): TimelineEntry[] => {
  const entries: TimelineEntry[] = []
  sortedEvents.value.forEach(event => {
    const hasStart = event.startDate != null
    const hasEnd = event.endDate != null
    if (hasStart && hasEnd) {
      entries.push({
        event: { ...event, eventType: ReadingEventType.CURRENTLY_READING } as ReadingEvent,
        date: event.startDate as Date,
        label: 'started',
        originalEvent: event
      })
      entries.push({
        event: event,
        date: event.endDate as Date,
        label: 'finished',
        originalEvent: event
      })
    } else if (hasStart) {
      entries.push({
        event: event,
        date: event.startDate as Date,
        label: event.eventType,
        originalEvent: event
      })
    } else if (hasEnd) {
      entries.push({
        event: event,
        date: event.endDate as Date,
        label: event.eventType,
        originalEvent: event
      })
    }
  })
  return entries.sort((a, b) => {
    const dateA = dayjs(a.date)
    const dateB = dayjs(b.date)
    return dateA.isAfter(dateB) ? -1 : 1
  })
})

function defaultCreateEvent(): CreateReadingEvent {
  return {
    eventType: ReadingEventType.CURRENTLY_READING,
    eventDate: new Date(),
    startDate: new Date(),
    bookId: props.events[0]?.bookId
  }
}

const eventClass = (event: ReadingEvent) => {
  if (event.eventType === ReadingEventType.FINISHED) {
    return "bg-info";
  } else if (event.eventType === ReadingEventType.DROPPED) {
    return "bg-error";
  } else if (event.eventType === ReadingEventType.CURRENTLY_READING) {
    return "bg-success";
  } else if (event.eventType === ReadingEventType.MARKED_OWNED) {
    return "bg-accent";
  } else if (event.eventType === ReadingEventType.MARKED_TO_READ) {
    return "bg-warning";
  } else if (event.eventType === ReadingEventType.MARKED_BORROWED) {
    return "bg-secondary";
  }
  else return "";
}

const iconClass = (event: ReadingEvent) => {
  if (event.eventType === ReadingEventType.FINISHED) {
    return "mdi-checkbox-marked-circle";
  } else if (event.eventType === ReadingEventType.DROPPED) {
    return "mdi-close-octagon";
  } else if (event.eventType === ReadingEventType.CURRENTLY_READING) {
    return "mdi-book-open-page-variant";
  } else if (event.eventType === ReadingEventType.MARKED_OWNED) {
    return "mdi-bookshelf";
  } else if (event.eventType === ReadingEventType.MARKED_BORROWED) {
    return "mdi-handshake";
  }
  else return ""
}

const eventLabel = (type: ReadingEventType) => {
  if (type === ReadingEventType.FINISHED) {
    return t('reading_events.finished');
  } else if (type === ReadingEventType.DROPPED) {
    return t('reading_events.dropped');
  } else if (type === ReadingEventType.CURRENTLY_READING) {
    return t('reading_events.reading');
  } else if (type === ReadingEventType.MARKED_OWNED) {
    return t('book.owned');
  } else if (type === ReadingEventType.MARKED_TO_READ) {
    return t('book.in_read_list');
  } else if (type === ReadingEventType.MARKED_BORROWED) {
    return t('book.borrowed');
  } else return ""
}
</script>

<template>
  <div
    v-if="timelineEntries.length > 0"
    class="mt-4"
  >
    <p
      v-if="timelineEntries.length > 0"
      class="text-lg mt-6 mb-3 capitalize text-center"
      :class="typographyClasses"
    >
      {{ t('reading_events.reading_events') }}:
    </p>
    <div class="relative max-w-2xl mx-auto px-4">
      <div class="relative mb-6 flex items-center z-10">
        <div class="flex-shrink-0 md:hidden">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer bg-info"
            @click="emit('create-event', defaultCreateEvent())"
          >
            <i class="mdi mdi-pencil text-white" />
          </div>
        </div>
        <div class="hidden md:flex md:flex-1 md:justify-center">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer bg-info"
            @click="emit('create-event', defaultCreateEvent())"
          >
            <i class="mdi mdi-pencil text-white" />
          </div>
        </div>
      </div>
      <div class="absolute left-4 md:left-1/2 top-10 bottom-0 w-0.5 bg-base-300 -translate-x-1/2"></div>

      <div
        v-for="(entry, index) in timelineEntries"
        :key="`${entry.originalEvent.id}-${entry.label}`"
        class="relative mb-6 flex items-center"
      >
        <template v-if="index % 2 === 0">
          <div class="flex-shrink-0 md:hidden">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              :class="entry.label === 'started' ? 'bg-info' : eventClass(entry.event)"
              @dblclick="emit('edit-event', entry.originalEvent)"
            >
              <i class="mdi text-white" :class="entry.label === 'started' ? 'mdi-play-circle' : iconClass(entry.event)" />
            </div>
          </div>

          <div class="flex-1 pl-2 md:hidden">
            <div class="card bg-base-100 shadow-md w-full">
              <div class="card-body p-2 flex flex-row justify-between items-center gap-2">
                <div class="flex flex-col gap-1">
                  <span class="badge badge-sm badge-ghost w-fit">
                    {{ d(entry.date, 'short') }}
                  </span>
                  <span class="font-semibold capitalize truncate">{{ entry.label === 'started' ? t('reading_events.currently_reading') : eventLabel(entry.event.eventType) }}</span>
                </div>
                <button
                  class="btn btn-xs btn-circle btn-ghost flex-shrink-0"
                  @click="emit('edit-event', entry.originalEvent)"
                >
                  <i class="mdi mdi-pencil mdi-18px" />
                </button>
              </div>
            </div>
          </div>

          <div class="hidden md:flex md:flex-1 md:justify-end md:pr-2">
            <span class="badge badge-sm badge-ghost">
              {{ d(entry.date, 'short') }}
            </span>
          </div>

          <div class="hidden md:flex md:flex-shrink-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              :class="entry.label === 'started' ? 'bg-info' : eventClass(entry.event)"
              @dblclick="emit('edit-event', entry.originalEvent)"
            >
              <i class="mdi text-white" :class="entry.label === 'started' ? 'mdi-play-circle' : iconClass(entry.event)" />
            </div>
          </div>

          <div class="hidden md:flex md:flex-1 md:justify-start md:pl-2">
            <div class="card bg-base-100 shadow-md w-full">
              <div class="card-body p-2 flex flex-col md:flex-row justify-center items-center gap-2">
                <span class="font-semibold capitalize truncate">{{ entry.label === 'started' ? t('reading_events.currently_reading') : eventLabel(entry.event.eventType) }}</span>
                <button
                  class="btn btn-xs btn-circle btn-ghost flex-shrink-0 ml-auto"
                  @click="emit('edit-event', entry.originalEvent)"
                >
                  <i class="mdi mdi-pencil mdi-18px" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="flex-shrink-0 md:hidden">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              :class="entry.label === 'started' ? 'bg-info' : eventClass(entry.event)"
              @dblclick="emit('edit-event', entry.originalEvent)"
            >
              <i class="mdi text-white" :class="entry.label === 'started' ? 'mdi-play-circle' : iconClass(entry.event)" />
            </div>
          </div>

          <div class="flex-1 pl-2 md:hidden">
            <div class="card bg-base-100 shadow-md w-full">
              <div class="card-body p-2 flex flex-row justify-between items-center gap-2">
                <div class="flex flex-col gap-1">
                  <span class="badge badge-sm badge-ghost w-fit">
                    {{ d(entry.date, 'short') }}
                  </span>
                  <span class="font-semibold capitalize truncate">{{ entry.label === 'started' ? t('reading_events.currently_reading') : eventLabel(entry.event.eventType) }}</span>
                </div>
                <button
                  class="btn btn-xs btn-circle btn-ghost flex-shrink-0"
                  @click="emit('edit-event', entry.originalEvent)"
                >
                  <i class="mdi mdi-pencil mdi-18px" />
                </button>
              </div>
            </div>
          </div>

          <div class="hidden md:flex md:flex-1 md:justify-end md:pr-2">
            <div class="card bg-base-100 shadow-md w-full">
              <div class="card-body p-2 flex flex-col md:flex-row justify-center items-center gap-2">
                <span class="font-semibold capitalize truncate">{{ entry.label === 'started' ? t('reading_events.currently_reading') : eventLabel(entry.event.eventType) }}</span>
                <button
                  class="btn btn-xs btn-circle btn-ghost flex-shrink-0 ml-auto"
                  @click="emit('edit-event', entry.originalEvent)"
                >
                  <i class="mdi mdi-pencil mdi-18px" />
                </button>
              </div>
            </div>
          </div>

          <div class="hidden md:flex md:flex-shrink-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              :class="entry.label === 'started' ? 'bg-info' : eventClass(entry.event)"
              @dblclick="emit('edit-event', entry.originalEvent)"
            >
              <i class="mdi text-white" :class="entry.label === 'started' ? 'mdi-play-circle' : iconClass(entry.event)" />
            </div>
          </div>

          <div class="hidden md:flex md:flex-1 md:justify-start md:pl-2">
            <span class="badge badge-sm badge-ghost">
              {{ d(entry.date, 'short') }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
