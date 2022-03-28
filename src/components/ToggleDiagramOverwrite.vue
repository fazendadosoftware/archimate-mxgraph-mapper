<template>
  <div
    class="flex justify-between items-start text-xs">
    <div class="font-medium">
      Overwrite existing diagrams
    </div>
    <Switch
      v-model="setting"
      class="flex-shrink-0 group relative rounded-full inline-flex items-center justify-center h-5 w-10 cursor-pointer focus:outline-none focus:ring-0">
      <span class="sr-only">Use setting</span>
      <span aria-hidden="true" class="pointer-events-none absolute w-full h-full rounded-md" />
      <span aria-hidden="true" :class="[setting ? 'bg-indigo-600' : 'bg-gray-400', 'pointer-events-none absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200']" />
      <span aria-hidden="true" :class="[setting ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none absolute left-0 inline-block h-5 w-5 border border-gray-200 rounded-full bg-white shadow transform ring-0 transition-transform ease-in-out duration-200']" />
    </Switch>
  </div>
</template>

<script lang="ts" setup>
import { ref, unref, computed } from 'vue'
import { Switch } from '@headlessui/vue'
import { getOverwriteSetting, setOverwriteSetting } from '../store'

const _setting = ref(getOverwriteSetting())

const setting = computed({
  get: () => unref(_setting),
  set: value => { setOverwriteSetting(value); _setting.value = getOverwriteSetting() }
})
</script>
