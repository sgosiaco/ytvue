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
        <InfoCard v-for="bar in bars" v-bind="bar" :key="bar.url"></InfoCard>
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
            :disable="downloadDisable"
          />
          <q-toggle
            class="float-right col"
            v-model="keepMP3"
            left-label
            label="Keep MP3"
            v-if="!audioOnly"
            :disable="downloadDisable"
          />
        </div>
        <LoadingBars v-for="bar in bars" v-bind="bar" :key="bar.url"></LoadingBars>
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
import LoadingBars from 'components/LoadingBars'

export default {
  name: 'PageIndex',
  components: {
    InfoCard,
    LoadingBars
  },
  beforeCreate: function () {
    this.$q.electron.ipcRenderer.on('progress', (event, percent, label, url) => {
      var bar = this.bars.filter(it => it.url === url)[0]
      var index = this.bars.indexOf(bar)
      bar.percentage = percent
      bar.label = label
      if (!bar.loading) {
        bar.loading = percent > 0
      } else {
        if (percent >= 100) {
          bar.percentage = '0'
          bar.label = ''
        }
      }
      this.$set(this.bars, index, bar)
    })

    this.$q.electron.ipcRenderer.on('ffProgress', (event, done, savePath, url) => {
      var bar = this.bars.filter(it => it.url === url)[0]
      if (bar.loading && done) {
        bar.loading = false
        this.downloadDisable = false
        bar.percentage = '0'
        bar.label = ''
        if (savePath !== null) {
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
        this.bars = this.bars.filter(it => it.url !== url)
      }
    })

    this.$q.electron.ipcRenderer.on('info', (event, info, url) => {
      var bar = this.bars.filter(it => it.url === url)[0]
      var index = this.bars.indexOf(bar)
      bar.info = info
      this.$set(this.bars, index, bar)
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
    download () {
      if (this.exp.test(this.url)) {
        this.$q.electron.ipcRenderer.send('download', this.url, this.audioOnly, this.keepMP3)
        this.downloadDisable = true
        this.bars.push({
          url: this.url,
          label: '',
          percentage: '0',
          loading: false
        })
      }
    },
    dismiss () {
      this.banner = false
    },
    openFolder () {
      this.$q.electron.ipcRenderer.send('openFolder', this.savePath, this.url)
      this.banner = false
    },
    deleteFiles () {
      this.$q.electron.ipcRenderer.send('deleteTemp', this.url)
      this.banner = false
    }
  },
  data () {
    return {
      debug: false,
      audioOnly: true,
      keepMP3: false,
      loading: false,
      downloadDisable: false,
      bars: [],
      url: '',
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
