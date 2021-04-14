<template>
  <div>
    <action-bar @authorize="authorize"/>
  </div>
</template>

<script>
import ActionBar from '@/components/ActionBar'
export default {
  name: 'App',
  components: {
    ActionBar
  },
  methods: {
    authorize () {
      this.$Swal.fire('hi there!')
    }
  }
}
</script>
