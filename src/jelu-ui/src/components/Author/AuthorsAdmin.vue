<script setup lang="ts">
import AdminEntityList from '../Admin/AdminEntityList.vue'
import { authorService } from "../../services/authorService"
import { Role } from "../../model/Role"
import { LibraryFilter } from "../../model/LibraryFilter"
</script>

<template>
  <AdminEntityList
    title="Authors page"
    orphan-label-key="labels.orphan_authors"
    find-label-key="labels.find-authors"
    entity-type-key="book.author"
    :entity-type-args="1"
    delete-confirm-key="labels.delete_this_author"
    route-name="author-detail"
    route-param="authorId"
    icon-class="mdi mdi-account mdi-24px"
    :find-fn="(q: string) => authorService.findAuthorByCriteria(Role.ANY, q)"
    :get-orphan-fn="(p: number, s: number, sort: string) => authorService.getOrphanAuthors(p, s, sort)"
    :get-by-id-fn="(id: string) => authorService.getAuthorById(id)"
    :get-books-by-id-fn="(id: string) => authorService.getAuthorBooksById(id, 0, 2, 'title:desc', LibraryFilter.ANY)"
    :delete-fn="(id: string) => authorService.deleteAuthor(id)"
  />
</template>
