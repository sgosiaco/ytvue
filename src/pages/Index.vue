<template>
  <q-page class="flex flex-center">
    <q-banner inline-actions="" class="absolute-top" v-if="banner">
        {{bannerText}}
        <template v-slot:action>
          <q-btn flat label="Dismiss" @click="dismiss"/>
          <q-btn flat label="Open folder" v-if="folderButton" @click="openFolder"/>
          <q-btn flat label="Delete temp files" v-if="deleteButton" @click="deleteFiles"/>
        </template>
    </q-banner>
    <div class="q-gutter-md column"> <!-- class="q-gutter-md" -->
      <div class="row fit justify-center">
        <InfoCard :info="info" v-if="loading"></InfoCard>
      </div>
      <div class="q-gutter-md row">
        <q-input
          style="min-width: 500px"
          class="float col"
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
      <div class ="column">
        <div class="q-gutter-x-md" v-if="!loading">
          <q-toggle
            class="float-right col"
            v-model="audioOnly"
            left-label
            label="Audio only"
          />
          <q-toggle
            class="float-right col"
            v-model="keepMP3"
            left-label
            label="Keep MP3"
            v-if="!audioOnly"
          />
        </div>
        <div class="q-gutter-x-md row">
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
      <q-toggle
            class="float-right col"
            v-model="loading"
            left-label
            label="Load"
            v-if="debug"
          />
    </div>
  </q-page>
</template>

<script>
import InfoCard from 'components/InfoCard'

export default {
  name: 'PageIndex',
  components: {
    InfoCard
  },
  computed: {
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

    this.$q.electron.ipcRenderer.on('ffProgress', (event, done, savePath) => {
      if (this.loading && done) {
        this.loading = false
        // this.info = null
        this.percentage = 0
        this.label = ''
        if (savePath !== undefined) {
          this.savePath = savePath
          this.bannerText = `Finished downloading ${this.info.title}`
          this.folderButton = true
          this.deleteButton = false
        } else {
          this.bannerText = 'Canceled download'
          this.folderButton = false
          this.deleteButton = true
        }
        this.banner = true
      }
    })

    this.$q.electron.ipcRenderer.on('info', (event, info) => {
      this.info = info
    })
  },
  created: function () {
    if (this.debug) {
      this.info = {
        title: 'BURNOUT SYNDROMES 『PHOENIX』Music Video（TVアニメ「ハイキュー!! TO THE TOP」オープニングテーマ',
        author: {
          name: ' BURNOUT SYNDROMES Official YouTube Channel'
        },
        video_id: 'b5lsuPxMFmw',
        length_seconds: 213,
        published: 1586217600000
      }
    }
  },
  methods: {
    cancel () {
      this.$q.electron.ipcRenderer.send('cancel')
    },
    download () {
      if (this.exp.test(this.url)) {
        this.$q.electron.ipcRenderer.send('download', this.url, this.audioOnly, this.keepMP3)
      }
    },
    dismiss () {
      this.banner = false
    },
    openFolder () {
      this.$q.electron.ipcRenderer.send('openFolder', this.savePath)
      this.banner = false
    },
    deleteFiles () {
      this.$q.electron.ipcRenderer.send('deleteTemp')
      this.banner = false
    }
  },
  data () {
    return {
      debug: false,
      audioOnly: true,
      keepMP3: false,
      loading: false,
      label: '',
      percentage: 0,
      url: '',
      info: null,
      savePath: undefined,
      banner: false,
      bannerText: '',
      folderButton: true,
      deleteButton: false,
      // eslint-disable-next-line no-useless-escape
      exp: RegExp('^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+')
    }
  }
}
</script>
