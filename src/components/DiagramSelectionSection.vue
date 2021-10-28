<template>
<div>{{selectedDiagrams}}</div>
</template>

<script lang="ts" setup>
import useDiagrams from '../composables/useDiagrams'
const { selectedDiagrams } = useDiagrams()
</script>
