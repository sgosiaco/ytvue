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
      <div class ="q-gutter-md column">
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
        </div>
        <div class="q-gutter-md row">
          <div class="col">
            <q-linear-progress class="row" size="25px" :value="audioPercentage/100" color="positive" v-if="audioPercentage > 0 && audioPercentage < 100">
              <div class="absolute-full flex flex-center">
                <q-badge color="transparent" text-color="white" :label="audioLabel"/>
              </div>
            </q-linear-progress>
            <q-linear-progress class="row" size="25px" :value="videoPercentage/100" color="positive" v-if="!audioOnly && videoPercentage > 0 && videoPercentage < 100">
              <div class="absolute-full flex flex-center">
                <q-badge color="transparent" text-color="white" :label="videoLabel"/>
              </div>
            </q-linear-progress>
            <q-linear-progress class="row" size="25px" color="primary" indeterminate v-if="loading">
              <div class="absolute-full flex flex-center">
                <q-badge color="transparent" text-color="white" label="FFMPEG"/>
              </div>
            </q-linear-progress>
          </div>
          <q-btn
            style="max-width: 70px"
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
  </q-page>
</template>

<script>
export default {
  name: 'PageIndex',
  computed: {
    percentage: {
      get () {
        if (this.audioOnly) {
          return parseFloat(this.audioPercentage)
        } else {
          return parseFloat(this.videoPercentage)
        }
      }
    },
    infoLabel: {
      get () {
        if (this.info !== null) {
          return `Video Info: ${this.info.title} uploaded by ${this.info.author.name}`
        } else {
          return ''
        }
      }
    },
    audioLabel: {
      get () {
        return `Audio: ${this.audioSize}`
      }
    },
    videoLabel: {
      get () {
        return `Video: ${this.videoSize}`
      }
    }
  },
  beforeCreate: function () {
    this.$q.electron.ipcRenderer.on('audioProgress', (event, percent, size) => {
      this.audioPercentage = percent
      this.audioSize = size
      if (!this.loading) {
        if (percent > 0) {
          this.loading = true
        }
      } else {
        if (percent >= 100) { // && this.audioOnly
          // this.loading = false
          // this.info = null
          this.audioPercentage = 0
          this.audioSize = ''
        }
      }
    })

    this.$q.electron.ipcRenderer.on('videoProgress', (event, percent, size) => {
      this.videoPercentage = percent
      this.videoSize = size
      if (percent >= 100) {
        // this.loading = false
        // this.info = null
        // this.audioPercentage = 0
        // this.audioSize = ''
        this.videoPercentage = 0
        this.videoSize = ''
      }
    })

    this.$q.electron.ipcRenderer.on('ffProgress', (event, done) => {
      if (this.loading && done) {
        this.loading = false
        this.info = null
        this.audioPercentage = 0
        this.audioSize = ''
        this.videoPercentage = 0
        this.videoSize = ''
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
        // this.loading = true
        this.$q.electron.ipcRenderer.send('download', this.url, this.audioOnly, this.keepMP3)
      }
    }
  },
  data () {
    return {
      audioOnly: true,
      keepMP3: false,
      loading: false,
      audioSize: '',
      audioPercentage: 0,
      videoSize: '',
      videoPercentage: 0,
      url: '',
      info: null,
      // eslint-disable-next-line no-useless-escape
      exp: RegExp('^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+')
    }
  }
}
</script>
