<template>
  <div class="flex flex-col pt-2 px-2 space-y-2 bg-gradient-to-br from-gray-100 to-gray-50">
    <authenticate-button />
    <template
      v-if="isAuthenticated">
      <search-input
        v-model="queryString"
        @refresh="() => fetchVisualizerBookmarks()"
        :refreshing="loadingBookmarks"
        :placeholder="'Search workspace diagrams'" />
      <div class="flex-1 flex flex-col rounded-md overflow-hidden">
        <div class="flex flex-col space-y-2 overflow-auto rounded-md">
          <div
            v-for="bookmark in filteredBookmarks"
            :key="bookmark.id"
            class="transition-colors p-2 text-xs rounded-md cursor-pointer border"
            :class="{
              'bg-yellow-300': selectedBookmark?.id === bookmark.id,
              'bg-white hover:bg-yellow-200': selectedBookmark?.id !== bookmark.id
            }"
            @click="selectedBookmark?.id !== bookmark.id ? setSelectedBookmark(bookmark) : undefined">
            <div>{{bookmark.name}}</div>
            <div>{{getDate(bookmark.updatedAt)}}</div>
          </div>
        </div>
      </div>
      <current-workspace class="-mx-2 px-2 py-2 bg-gray-200"/>
    </template>
  </div>
</template>

<script>
import { format } from 'date-fns'
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
  data () {
    return {
      queryString: ''
    }
  },
  computed: {
    ...mapState(['loadingBookmarks', 'filteredBookmarks', 'selectedBookmark']),
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
    ...mapActions(['fetchVisualizerBookmarks', 'searchFTSBookmarkIndex']),
    ...mapMutations(['setSelectedBookmark']),
    getDate (dateString = '') {
      return format(Date.parse(dateString), 'MM/dd/yyyy HH:mm:ss')
    }
  },
  watch: {
    bookmarks () {
      this.queryString = ''
    },
    async queryString (query) {
      await this.searchFTSBookmarkIndex(query)
    }
  }
}
</script>