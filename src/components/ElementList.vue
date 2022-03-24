<template>
  <div class="flex flex-col">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="overflow-hidden border-b border-gray-200">
          <table class="min-w-full divide-y divide-gray-200 table-auto">
            <thead class="bg-gray-400 text-white">
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  scope="col"
                  class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
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
import { toRefs, computed, unref, ComputedRef } from 'vue'
import { Element, Diagram } from '../types'
import FactSheetCell from './FactSheetCell.vue'
import LoginToMatchTag from './LoginToMatchTag.vue'
import useWorkspace from '../composables/useWorkspace'

const props = defineProps<{ diagram: Diagram }>()
const { diagram } = toRefs(props)
const { factSheetIndex, isAuthenticated } = useWorkspace()

const columns: ComputedRef<{ key: keyof Element | 'factSheet' | 'parentName' | 'childrenNames', label: string, classes?: string, component?: any }[]> = computed(() => [
  { key: 'type', label: 'Type', classes: 'font-medium text-gray-900' },
  { key: 'name', label: 'Name' },
  { key: 'childrenNames', label: 'Children', classes: 'whitespace-pre' },
  { key: 'parentName', label: 'Parent' },
  { key: 'factSheet', label: 'FactSheet', component: unref(isAuthenticated) ? FactSheetCell : LoginToMatchTag }
])

const rows = computed(() => {
  const { elements = [] } = unref(diagram)
  const elementIndex = elements
    .reduce((accumulator: Record<string, any>, element) => ({ ...accumulator, [element.id]: element }), {})
  const rows = elements
    .filter(({ isOmmited }) => !isOmmited)
    .map((element: any) => {
      const { id, parent: parentId, children: childrenIds = [] } = element
      const { [parentId]: parent = null } = elementIndex
      const childrenNames = ((childrenIds as string[])?.map(id => elementIndex[id]?.name) ?? []).join('\n')
      const factSheet = unref(factSheetIndex) === null ? null : unref(factSheetIndex)[id]
      return { ...element, factSheet, parentName: parent?.name ?? '-', childrenNames: childrenNames }
    })
  return rows
})
</script>
