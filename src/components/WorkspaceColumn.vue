<template>
  <div class="flex flex-col p-2 space-y-2">
    <authenticate-button/>
    <template
      v-if="isAuthenticated">
      <search-input
        @refresh="() => fetchDiagrams()"
        :refreshing="loadingBookmarks" />
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