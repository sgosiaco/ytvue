<template>
  <q-bar class="q-electron-drag bg-black text-white">
    <div>{{title}}</div>
    <q-space/>
    <q-btn dense flat icon="minimize" @click="minimize"/>
    <q-btn dense flat :icon="isMaximized ? 'filter_none' : 'crop_square'" @click="maximize"/>
    <q-btn dense flat icon="close" @click="closeWindow"/>
  </q-bar>
</template>

<script>
export default {
  name: 'Toolbar',
  props: {
    title: {
      type: String,
      required: true
    }
  },
  methods: {
    minimize () {
      if (process.env.MODE === 'electron') {
        this.$q.electron.remote.BrowserWindow.getAllWindows()[0].minimize()
      }
    },
    maximize () {
      const window = this.$q.electron.remote.BrowserWindow.getAllWindows()[0]
      this.isMaximized = !window.isMaximized()
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    },
    closeWindow () {
      this.$q.electron.remote.BrowserWindow.getAllWindows()[0].close()
    }
  },
  data () {
    return {
      isMaximized: false
    }
  }
}
</script>
