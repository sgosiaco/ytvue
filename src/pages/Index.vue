<template>
  <q-page class="flex flex-center">
    <div class='q-pa-md'>
      <div v-if="info !== null" class="row">
          {{info.title}} by {{info.author.name}}
      </div>
      <div class="q-gutter-md row">
        <q-input
          style="min-width: 500px"
          class="col"
          outlined
          v-model="url"
          type="url"
          label="Youtube link"
          :rules="[val => this.exp.test(val) || 'Please enter valid youtube link']"
        />
        <q-btn
          style="max-height: 60px"
          class="col"
          :loading="loading"
          :percentage="percentage"
          color="primary"
          @click="download()"
        >
          Download Song
          <template v-slot:loading>
            Downloading...
          </template>
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'PageIndex',
  beforeCreate: function () {
    this.$q.electron.ipcRenderer.on('progress', (event, percent) => {
      this.percentage = percent
      if (percent >= 100) {
        this.loading = false
        this.info = null
      }
    })

    this.$q.electron.ipcRenderer.on('info', (event, info) => {
      this.info = info
    })
  },
  methods: {
    download () {
      if (this.exp.test(this.url)) {
        this.loading = true
        this.$q.electron.ipcRenderer.send('download', this.url)
      }
    }
  },
  data () {
    return {
      loading: false,
      percentage: 0,
      url: '',
      info: null,
      // eslint-disable-next-line no-useless-escape
      exp: RegExp('^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+')
    }
  }
}
</script>
