<template>
  <div>Hi there! {{t}}</div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      t: new Date().toISOString()
    }
  },
  created () {
    setInterval(() => {
      this.t = new Date().toISOString()
    }, 100)
  }
}
</script>
