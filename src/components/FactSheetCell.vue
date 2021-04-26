<template>
  <div class="w-full flex justify-center">
    <template v-if="factSheetIndex === null">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 animate-spin transform -rotate-180 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
      </svg>
    </template>
    <template v-else>
      <span
        v-if="row.factSheet"
        @click="openFactSheet"
        class="cursor-pointer text-green-600 hover:text-green-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
        </svg>
      </span>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </template>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
export default {
  props: {
    row: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState(['factSheetIndex']),
    ...mapGetters(['decodedJwt'])
  },
  methods: {
    openFactSheet () {
      const { factSheet = null } = this.row
      const { instanceUrl = null } = this.decodedJwt
      if (instanceUrl === null || factSheet === null) return
      const { id, type } = factSheet
      console.log('DECODED', instanceUrl, id, type)
    }
  }
}
</script>