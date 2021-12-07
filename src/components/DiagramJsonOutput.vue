<template>
  <div class="bg-white p-4 overflow-hidden h-full flex flex-column">
    <div ref="container" class="flex-1 bg-red-300" />
  </div>
</template>

<script lang="ts" setup>
import { toRefs, ref, onMounted, unref, onBeforeUnmount, watch } from 'vue'
import { Diagram } from '../types'
import JSONEditor, { JSONEditorOptions } from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
// import VueJsonPretty from 'vue-json-pretty'
// import 'vue-json-pretty/lib/styles.css'

const props = defineProps<{ diagram: Diagram }>()
const { diagram } = toRefs(props)
const container = ref<HTMLElement | null>(null)
const editor = ref<JSONEditor | null>(null)
const editorOptions: JSONEditorOptions = {
  name: 'diagram',
  mode: 'tree'
}
onMounted(() => {
  console.log()
  const _container = unref(container)
  if (_container !== null) editor.value = new JSONEditor(_container, editorOptions, unref(diagram))
})
onBeforeUnmount(() => unref(editor)?.destroy())

watch(diagram, diagram => unref(editor)?.set(diagram))
</script>
