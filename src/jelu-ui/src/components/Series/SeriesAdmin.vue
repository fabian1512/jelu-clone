<script setup lang="ts">
import AdminEntityList from '../Admin/AdminEntityList.vue'
import { seriesService } from "../../services/seriesService"
import { LibraryFilter } from "../../model/LibraryFilter"
</script>

<template>
  <AdminEntityList
    title="Series page"
    orphan-label-key="labels.orphan-series"
    find-label-key="labels.find-series"
    entity-type-key="book.series"
    delete-confirm-key="labels.delete_this_series"
    route-name="series"
    route-param="seriesId"
    icon-class="mdi mdi-book-open-variant mdi-24px"
    :find-fn="(q: string) => seriesService.findSeriesByCriteria(q)"
    :get-orphan-fn="(p: number, s: number, sort: string) => seriesService.getOrphanSeries(p, s, sort)"
    :get-by-id-fn="(id: string) => seriesService.getSeriesById(id)"
    :get-books-by-id-fn="(id: string) => seriesService.getSeriesBooksById(id, 0, 2, 'title:desc', LibraryFilter.ANY)"
    :delete-fn="(id: string) => seriesService.deleteSeries(id)"
    :backend-filtering="true"
  />
</template>
