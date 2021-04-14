<template>
  <div class="p-2 flex justify-end gap-2 border border-gray-300 bg-gray-200 shadow">
    <button
      v-wave
      @click="$emit('authorize')"
      type="button"
      class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-0">
      Authorize
    </button>
  </div>
</template>
