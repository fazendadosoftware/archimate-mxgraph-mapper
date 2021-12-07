<template>
  <div class="bg-white p-4 overflow-hidden">
    <vue-json-pretty
      :data="{ diagram }"
      :show-length="true"
      :show-line="true"
      :collapsed-on-click-brackets="true"
      :deep-collapse-children="true"
    />
  </div>
</template>

<script lang="ts" setup>
import { toRefs } from 'vue'
import { Diagram } from '../types'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

const props = defineProps<{ diagram: Diagram }>()

const { diagram } = toRefs(props)
</script>
