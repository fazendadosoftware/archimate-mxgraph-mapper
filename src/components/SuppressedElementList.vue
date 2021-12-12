<template>
  <div class="flex flex-col p-2">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded">
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
                v-for="element in suppressedElements"
                :key="element.id"
                class="bg-white even:bg-gray-100 hover:bg-gray-200 transition-colors cursor-default">
                <td
                  v-for="column in columns"
                  :key="`${column.key}_${element.id}`"
                  class="px-3 py-2 text-xs text-gray-500"
                  :class="column.classes">
                  {{ typeof column.mapFn === 'function' ? column.mapFn(element) : element[column.key] }}
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
import { Diagram, Element } from '../types'

const props = defineProps<{ diagram: Diagram }>()
const { diagram } = toRefs(props)
const suppressedElements = computed(() => unref(diagram).elements.filter(({ isOmmited }) => isOmmited))

const columns: { key: keyof Element, label: string, classes?: string, mapFn?: (element: Element) => string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'notes', label: 'Notes', mapFn: (element: Element) => element.notes.join(', ') }
]
</script>
