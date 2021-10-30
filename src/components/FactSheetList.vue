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
                v-for="row in rows"
                :key="row.id"
                class="bg-white even:bg-gray-100 hover:bg-gray-200 transition-colors cursor-default">
                <td
                  v-for="column in columns"
                  :key="`${column.key}_${row.id}`"
                  class="px-3 py-2 text-xs text-gray-500"
                  :class="column.classes">
                  <template v-if="!column.component">
                    {{ row[column.key] }}
                  </template>
                  <component :is="column.component" v-else :row="row" />
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
import useWorkspace from '../composables/useWorkspace'
import FactSheetCell from './FactSheetCell.vue'

const props = defineProps({ diagram: { type: Object, required: true } })
const { diagram } = toRefs(props)
const { factSheetIndex } = useWorkspace()

const columns = [
  { key: 'type', label: 'Element Type', classes: 'font-medium text-gray-900' },
  { key: 'name', label: 'Element Name' },
  { key: 'id', label: 'External ID' },
  { key: 'factSheet', label: 'FactSheet', component: FactSheetCell }
]

const rows = computed(() => {
  const { elements = [] } = unref(diagram)
  const rows = elements
    .map((element: any) => {
      const { id } = element
      const factSheet = unref(factSheetIndex) === null ? null : unref(factSheetIndex)[id]
      return { ...element, factSheet }
    })
  return rows
})
</script>
