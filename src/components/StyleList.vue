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
                {{column.label}}
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
                {{item[column.key]}}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  props: {
    diagram: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      columns: [
        { key: 'type', label: 'Name', classes: 'font-medium text-gray-900' },
        { key: 'diagramType', label: 'Type' },
        { key: 'style', label: 'Type' }
      ]
    }
  },
  computed: {
    ...mapState(['styles']),
    items () {
      const { elements = [], connectors = [] } = this.diagram
      const items = Object.values([
        ...elements.map(({ type }) => ({ type, diagramType: 'Element' })),
        ...connectors.map(({ type }) => ({ type, diagramType: 'Connector' })),
      ].reduce((accumulator, item) => {
        const { type, diagramType } = item
        const { [type]: style = null } = this.styles
        if (type) accumulator[type] = { type, diagramType, style }
        return accumulator
      }, {}))
        .sort(({ type: A }, { type: B }) => A > B ? 1 : A < B ? -1 : 0)
      return items
    }
  }
}
</script>
