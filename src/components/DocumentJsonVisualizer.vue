<template>
  <div ref="container" class="h-full" />
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, unref, ref, watch } from 'vue'
import JSONEditor, { JSONEditorOptions } from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
import useDiagrams from '../composables/useDiagrams'
const { document } = useDiagrams()

const container = ref<HTMLElement | null>(null)
const editor = ref<JSONEditor | null>(null)
const editorOptions: JSONEditorOptions = {
  name: 'exportedDocument',
  mode: 'view'
}

onMounted(() => {
  console.log()
  const _container = unref(container)
  if (_container !== null) editor.value = new JSONEditor(_container, editorOptions, unref(document))
})
onBeforeUnmount(() => unref(editor)?.destroy())

watch(document, document => unref(editor)?.set(document))

</script>
