<template>
  <div class="flex flex-col p-2">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded">
          <table class="min-w-full divide-y divide-gray-200 table-auto">
            <thead class="bg-gray-50">
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  scope="col"
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, i) in items"
                :key="i"
                class="bg-white even:bg-gray-100 hover:bg-gray-200 transition-colors cursor-default">
                <td
                  v-for="column in columns"
                  :key="`${column.key}_${i}`"
                  class="px-3 py-2 text-xs text-gray-500"
                  :class="column.classes">
                  {{ item[column.key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toRefs, computed, unref } from 'vue'
import { styleIndex } from '../composables/useMXGraph'

const props = defineProps({
  diagram: { type: Object, required: true }
})

const { diagram } = toRefs(props)
const columns = [
  { key: 'type', label: 'Type', classes: 'font-medium text-gray-900' },
  { key: 'sourceId', label: 'SourceID' },
  { key: 'targetId', label: 'Target ID' }
]

const items = computed(() => {
  const { elements = [], connectors = [] } = unref(diagram)
  const items: any = Object.values([
    ...elements.map(({ type }: { type: string }) => ({ type, diagramType: 'Element' })),
    ...connectors.map(({ type }: { type: string }) => ({ type, diagramType: 'Connector' }))
  ].reduce((accumulator: any, item) => {
    const { type, diagramType } = item
    const { [type]: style = null } = styleIndex
    if (type) accumulator[type] = { type, diagramType, style }
    return accumulator
  }, {}))
    .sort(({ type: A }: any, { type: B }: any) => A > B ? 1 : A < B ? -1 : 0)
  return items
})
</script>
