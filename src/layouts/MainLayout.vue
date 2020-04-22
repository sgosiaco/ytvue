<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated>
      <Toolbar :title=title></Toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import Toolbar from 'components/Toolbar'

export default {
  name: 'MainLayout',

  components: {
    Toolbar
  },

  beforeCreate: function () {
    this.$q.electron.ipcRenderer.on('log', (event, string) => {
      console.log(string)
    })
  },

  data () {
    return {
      title: 'YT Vue'
    }
  }
}
</script>
