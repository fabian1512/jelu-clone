<script setup lang="ts">
import AdminEntityList from '../Admin/AdminEntityList.vue'
import { tagService } from "../../services/tagService"
import { LibraryFilter } from "../../model/LibraryFilter"
</script>

<template>
  <AdminEntityList
    title="Tags page"
    orphan-label-key="labels.orphan-tags"
    find-label-key="labels.find-tag"
    entity-type-key="book.tag"
    delete-confirm-key="labels.delete_this_tag"
    route-name="tag-detail"
    route-param="tagId"
    icon-class="mdi mdi-tag mdi-24px"
    :find-fn="(q: string) => tagService.findTagsByCriteria(q)"
    :get-orphan-fn="(p: number, s: number, sort: string) => tagService.getOrphanTags(p, s, sort)"
    :get-by-id-fn="(id: string) => tagService.getTagById(id)"
    :get-books-by-id-fn="(id: string) => tagService.getTagBooksById(id, 0, 2, 'title:desc', LibraryFilter.ANY)"
    :delete-fn="(id: string) => tagService.deleteTag(id)"
    :backend-filtering="true"
  />
</template>
