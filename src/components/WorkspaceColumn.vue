<template>
  <div class="flex flex-col space-y-2 bg-white">
    <div class="flex">
      <search-bar
        v-model="searchQuery"
        class="m-2"
        placeholder="Search workspace diagrams" />
    </div>
    <div class="flex-1 flex flex-col rounded-md overflow-hidden">
      <div class="flex flex-col space-y-2 overflow-auto rounded-md">
        <div
          v-for="bookmark in filteredBookmarks"
          :key="bookmark.id"
          class="select-none transition-colors p-2 text-xs rounded-md cursor-pointer border"
          :class="{
            'bg-yellow-300': isSelected(bookmark),
            'bg-white hover:bg-yellow-200': !isSelected(bookmark)
          }"
          @click="toggleBookmarkSelection(bookmark)">
          <div>{{ bookmark.name }}</div>
          <div>{{ getDate(bookmark.updatedAt) }}</div>
        </div>
      </div>
    </div>
    <div class="flex justify-center p-2 bg-gray-200 border-t border-gray-300">
      <authenticate-button />
    </div>
  </div>
</template>

<script lang="ts" setup>
import useWorkspace from '../composables/useWorkspace'
import SearchBar from './SearchBar.vue'
import AuthenticateButton from './AuthenticateButton.vue'

const { filteredBookmarks, getDate, toggleBookmarkSelection, isSelected, searchQuery } = useWorkspace()
</script>
