<template>
  <div class="flex flex-col p-2 space-y-2">
    <!-- search-bar -->
    <div class="flex rounded-md shadow-sm">
      <div class="relative flex items-stretch flex-grow focus-within:z-10">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <!-- Heroicon name: solid/search -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          class="focus:ring-0 focus:border-gray-300 block w-full rounded-none rounded-l-md pl-10 sm:text-xs border-gray-300 shadow" placeholder="Search diagrams">
      </div>
      <button
        v-wave
        @click="fetchDiagrams"
        class="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 shadow text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-0">
        <!-- Heroicon name: solid/refresh -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          :class="{
            'animate-spin transform -rotate-180': loadingBookmarks
          }"
          viewBox="0 0 20 20"
          fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <!-- /search-bar -->
    <div class="flex-1 flex flex-col space-y-2 bg-red-300">
      <div
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        class="bg-gray-100 hover:bg-gray-200 shadow border border-gray-200 transition-colors p-2 bg-white text-xs rounded-md cursor-pointer"
        @click="setSelectedBookmark(bookmark)">
        {{bookmark.name}}
      </div>
    </div>
    <current-workspace />
    <load-xml-button/>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions, mapMutations } from 'vuex'
import LoadXmlButton from '@/components/LoadXmlButton'
import CurrentWorkspace from '@/components/CurrentWorkspace'

export default {
  components: {
    LoadXmlButton,
    CurrentWorkspace
  },
  computed: {
    ...mapState(['loadingBookmarks', 'bookmarks']),
    ...mapGetters(['isAuthenticated', 'decodedJwt']),
    currentUser () {
      const { sub } = this.decodedJwt
      return sub
    },
    currentWorkspace () {
      const { instanceUrl, principal: { permission: { workspaceName } = {} } = {} } = this.decodedJwt
      return `${instanceUrl}/${workspaceName}`
    }
  },
  methods: {
    ...mapActions(['fetchVisualizerBookmarks']),
    ...mapMutations(['setSelectedBookmark']),
    fetchDiagrams () {
      this.fetchVisualizerBookmarks()
    }
  }
}
</script>