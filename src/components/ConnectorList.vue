<template>
  <div class="flex flex-col">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class=" overflow-hidden border-b border-gray-200">
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
                v-for="connector in diagram.connectors"
                :key="connector.id"
                class="bg-white even:bg-gray-100 hover:bg-gray-200 transition-colors cursor-default">
                <td
                  v-for="column in columns"
                  :key="`${column.key}_${connector.id}`"
                  class="px-3 py-2 text-xs text-gray-500"
                  :class="column.classes">
                  <template v-if="!column.component">
                    {{ connector[column.key] }}
                  </template>
                  <component :is="typeof column.component === 'function' ? column.component(connector) : column.component" v-else :row="connector" />
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
import { toRefs, ComputedRef, computed, unref } from 'vue'
import { Connector, Diagram } from '../types'
import ExternalConnectorMarker from './ExternalConnectorMarker.vue'

const props = defineProps<{ diagram: Diagram }>()

const { diagram } = toRefs(props)

const columns: ComputedRef<{ key: keyof Connector, label: string, classes?: string, mapFn?: (element: Element) => string, component?: any }[]> = computed(() => [
  { key: 'type', label: 'Type', classes: 'font-medium text-gray-900' },
  { key: 'start', label: 'SourceID' },
  { key: 'end', label: 'Target ID' },
  { key: 'direction', label: 'Direction' },
  { key: 'isExternal', label: 'Is External?', component: (connector: Connector) => connector.isExternal ? ExternalConnectorMarker : null }
])

</script>
