<template>
  <label
    v-if="isAuthenticated === false"
    class="cursor-pointer select-none">
    <span
      v-wave
      class="w-full relative border-box inline-flex justify-center items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 focus:outline-none focus:ring-0"
      :class="{
        'opacity-50 animate-pulse': isAuthenticating,
        'hover:bg-indigo-700': !isAuthenticating
      }">
      {{ isAuthenticating ? 'Authenticating...' : 'Load LeanIX Credentials File' }}
      <input
        :disabled="isAuthenticating"
        class="hidden"
        type="file"
        accept="application/json"
        @change="loadFile">
    </span>
  </label>
  <button
    v-else
    type="button"
    class="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-0"
    @click="logout">
    Logout
  </button>
</template>

<script lang="ts" setup>
import useWorkspace from '../composables/useWorkspace'
import useSwal from '../composables/useSwal'

const { authenticate, isAuthenticating, isAuthenticated, logout } = useWorkspace()
const { toast } = useSwal()

const loadFile = (event: any) => {
  const { target: { files } } = event
  if (!files.length) return
  const reader = new FileReader()

  reader.onload = async (evt: ProgressEvent<FileReader>) => {
    let host = null
    let apitoken = null
    let apiToken = null
    try {
      ({ host = null, apitoken = null, apiToken = null } = JSON.parse(evt.target?.result as string))
      apitoken = apiToken || apitoken
      if (!host || !apitoken) {
        alert('Invalid credentials file, must be JSON with apitoken and host entries.')
        return
      }
    } catch (err) {
      console.error(err)
      toast.fire({
        icon: 'error',
        title: 'Invalid lxr.json file',
        text: 'Check console for more details'
      })
    }
    await authenticate(host, apitoken)
  }
  reader.readAsText(files[0])
}
</script>
