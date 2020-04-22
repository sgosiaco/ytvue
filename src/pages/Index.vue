<template>
  <q-page class="flex flex-center">
    <div class='q-pa-md'>
      {{infoLabel}}
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
          style="height: 55px; width: 150px"
          class="col"
          :loading="loading"
          color="primary"
          @click="download()"
        >
          Download
          <template v-slot:loading>
            Downloading...
          </template>
        </q-btn>
      </div>
      <div class ="q-gutter-y-md column">
        <div class="q-gutter-sm">
          <q-toggle
            class="float-right col"
            v-model="audioOnly"
            left-label
            label="Audio only"
            :disable="loading"
          />
          <q-toggle
            class="float-right col"
            v-model="keepMP3"
            left-label
            label="Keep MP3"
            :disable="loading"
            v-if="!audioOnly"
          />
          <q-toggle
            class="float-right col"
            v-model="loading"
            left-label
            label="Load"
          />
        </div>
        <div class="q-gutter-md row">
          <div class="flex flex-center col">
            <q-linear-progress class="row" size="25px" :value="percentage/100" color="positive" v-if="percentage > 0 && percentage < 100">
              <div class="absolute-full flex flex-center">
                <q-badge color="transparent" text-color="white" :label="label"/>
              </div>
            </q-linear-progress>
            <q-linear-progress class="row" size="25px" color="primary" indeterminate v-if="loading">
              <div class="absolute-full flex flex-center">
                <q-badge color="transparent" text-color="white" :label="ffLabel"/>
              </div>
            </q-linear-progress>
          </div>
          <div class="flex flex-center float-right">
            <q-btn
              style="max-width: 70px; max-height: 35px"
              class="col"
              color="negative"
              @click="cancel()"
              v-if="loading"
            >
              Cancel
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'PageIndex',
  computed: {
    infoLabel: {
      get () {
        if (this.info !== null) {
          return `Video Info: ${this.info.title} uploaded by ${this.info.author.name}`
        } else {
          return ''
        }
      }
    },
    ffLabel: {
      get () {
        return `Processing ${this.label.split(':')[0].toLowerCase()}...`
      }
    }
  },
  beforeCreate: function () {
    this.$q.electron.ipcRenderer.on('progress', (event, percent, label) => {
      this.percentage = percent
      this.label = label
      if (!this.loading) {
        this.loading = percent > 0
      } else {
        if (percent >= 100) {
          this.percentage = 0
          this.label = ''
        }
      }
    })

    this.$q.electron.ipcRenderer.on('ffProgress', (event, done) => {
      if (this.loading && done) {
        this.loading = false
        this.info = null
        this.percentage = 0
        this.label = ''
      }
    })

    this.$q.electron.ipcRenderer.on('info', (event, info) => {
      this.info = info
    })
  },
  methods: {
    cancel () {
      this.$q.electron.ipcRenderer.send('cancel')
    },
    download () {
      if (this.exp.test(this.url)) {
        this.$q.electron.ipcRenderer.send('download', this.url, this.audioOnly, this.keepMP3)
      }
    }
  },
  data () {
    return {
      audioOnly: true,
      keepMP3: false,
      loading: false,
      label: '',
      percentage: 0,
      url: '',
      info: null,
      // eslint-disable-next-line no-useless-escape
      exp: RegExp('^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+')
    }
  }
}
</script>
