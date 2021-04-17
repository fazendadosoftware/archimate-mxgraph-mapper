<template>
  <div class="flex flex-col pt-2 px-2 space-y-2 bg-gradient-to-br from-gray-100 to-gray-50">
    <authenticate-button />
    <template
      v-if="isAuthenticated">
      <search-input
        @refresh="() => fetchDiagrams()"
        :refreshing="loadingBookmarks"
        :placeholder="'Search workspace diagrams'" />
      <div class="flex-1 flex flex-col rounded-md overflow-hidden">
        <div class="flex flex-col space-y-2 overflow-auto rounded-md">
          <div
            v-for="bookmark in bookmarks"
            :key="bookmark.id"
            class="transition-colors p-2 text-xs rounded-md cursor-pointer border"
            :class="{
              'bg-yellow-300': selectedBookmark?.id === bookmark.id,
              'bg-white hover:bg-yellow-200': selectedBookmark?.id !== bookmark.id
            }"
            @click="selectedBookmark?.id !== bookmark.id ? setSelectedBookmark(bookmark) : undefined">
            {{bookmark.name}}
          </div>
        </div>
      </div>
      <current-workspace class="border-t border-gray-400 -mx-2 px-2 py-1 bg-gradient-to-r from-gray-700 to-gray-500 text-white"/>
    </template>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions, mapMutations } from 'vuex'
import SearchInput from '@/components/SearchInput'
import AuthenticateButton from '@/components/AuthenticateButton'
import CurrentWorkspace from '@/components/CurrentWorkspace'

export default {
  components: {
    SearchInput,
    AuthenticateButton,
    CurrentWorkspace
  },
  computed: {
    ...mapState(['loadingBookmarks', 'bookmarks', 'selectedBookmark']),
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