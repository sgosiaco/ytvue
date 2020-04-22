<template>
  <q-page padding>
    {{directory}}
    <q-btn
      color="primary"
      @click="selectPath()"
    >
      Set path
    </q-btn>
  </q-page>
</template>

<script>
export default {
  name: 'Settings',
  methods: {
    selectPath () {
      const dir = this.$q.electron.remote.dialog.showOpenDialogSync({ properties: ['openDirectory'] })
      if (dir !== undefined) {
        this.directory = dir[0]
      }
    }
  },
  data () {
    return {
      directory: 'None'
    }
  }
}
</script>
