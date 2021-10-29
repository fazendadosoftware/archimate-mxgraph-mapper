<template>
  <div
    v-if="isAuthenticated && jwtClaims !== null"
    class="flex flex-col text-xs font-medium">
    <div>{{ currentUser }}</div>
    <a :href="currentWorkspace" target="_blank" class="hover:underline">{{ currentWorkspace }}</a>
  </div>
</template>

<script lang="ts" setup>
import { computed, unref } from 'vue'
import useWorkspace from '../composables/useWorkspace'
const { isAuthenticated, jwtClaims } = useWorkspace()
const currentUser = computed(() => unref(jwtClaims)?.sub)
const currentWorkspace = computed(() => {
  if (unref(jwtClaims) === null) return ''
  const { instanceUrl, principal: { permission: { workspaceName } } } = unref(jwtClaims)
  return `${instanceUrl}/${workspaceName}`
})
</script>
