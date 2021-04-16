<template>
  <div
    v-if="isAuthenticated"
    class="flex flex-col items-center text-xs font-medium">
    <div>{{currentUser}}</div>
    <a :href="currentWorkspace" target="_blank">{{currentWorkspace}}</a>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters(['isAuthenticated', 'decodedJwt']),
    currentUser () {
      const { sub } = this.decodedJwt
      return sub
    },
    currentWorkspace () {
      const { instanceUrl, principal: { permission: { workspaceName } = {} } = {} } = this.decodedJwt
      return `${instanceUrl}/${workspaceName}`
    }
  }
}
</script>
