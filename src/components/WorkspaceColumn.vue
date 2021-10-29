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
          class="transition-colors px-2 py-1 text-xs rounded-md cursor-pointer shadow-md border border-gray-400"
          :class="{
            'bg-yellow-300 bg-opacity-50 hover:bg-opacity-100': isSelected(bookmark),
            'bg-white hover:bg-yellow-100': !isSelected(bookmark),
            'pointer-events-none opacity-25': !bookmarkHasXml(bookmark)
          }"
          @click="toggleBookmarkSelection(bookmark)">
          <div>{{ bookmark.name }}</div>
          <div>
            <span>{{ getDate(bookmark.updatedAt) }}</span>
            <span v-if="!bookmarkHasXml(bookmark)" class="text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </span>
          </div>
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

const bookmarkHasXml = (bookmark: any) => !!bookmark?.state?.graphXml
</script>
