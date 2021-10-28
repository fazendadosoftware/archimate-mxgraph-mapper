<template>
  <div class="flex flex-col pt-2 px-2 space-y-2 bg-gradient-to-br from-gray-100 to-gray-50">
    <authenticate-button />
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
  </div>
</template>

<script lang="ts" setup>
import useWorkspace from '../composables/useWorkspace'
import AuthenticateButton from './AuthenticateButton.vue'
const { filteredBookmarks, selectedBookmark, getDate, toggleBookmarkSelection, isSelected } = useWorkspace()

</script>
