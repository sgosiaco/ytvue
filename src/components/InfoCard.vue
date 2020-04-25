<template>
  <q-card style="width: fit-content"> <!--class="q-pa-xs"-->
    <q-card-section horizontal>
      <q-card-section style="max-width: 400px">
        <div class="text">{{localInfo.title}}</div>
        <div class="text-caption">{{localInfo.author.name}}</div>
        <div class="text-caption">{{uploaded}}</div>
      </q-card-section>
      <q-card-section>
        <q-img
          :src="thumbnail"
          spinner-color="white"
          style="height:90px; width:160px"
          class="rounded-borders"
        >
          <div class="fixed-bottom-right transparent">
            <q-badge color="black" text-color="white" :label="duration"/>
          </div>
        </q-img>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<script>
export default {
  name: 'InfoCard',
  props: {
    info: {
      type: Object,
      required: true
    }
  },
  computed: {
    localInfo: {
      get () {
        return this.info ? this.info : {
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
    thumbnail: {
      get () {
        return `https://img.youtube.com/vi/${this.localInfo.video_id}/hqdefault.jpg`
      }
    },
    uploaded: {
      get () {
        const now = new Date(Date.now())
        const upload = new Date(this.localInfo.published) // .toUTCString() // .toDateString()
        var days = Math.floor((now.getTime() - upload.getTime()) / (1000 * 3600 * 24))
        if (days >= 365) {
          var years = Math.floor(days / 365)
          if (years === 1) {
            return '1 year ago'
          }
          return `${years} years ago`
        } else if (days >= 30) {
          var months = Math.floor(days / 30)
          if (months === 1) {
            return '1 month ago'
          }
          return `${months} months ago`
        } else if (days >= 7) {
          var weeks = Math.floor(days / 7)
          days -= weeks * 7
          if (weeks === 1) {
            return '1 week ago'
          }
          return `${weeks} weeks ago`
        }
        if (days === 1) {
          return '1 day ago'
        }
        return `${days} days ago`
      }
    },
    duration: {
      get () {
        var seconds = this.localInfo.length_seconds
        var minutes = 0
        var hours = 0
        var output = ''

        if (seconds >= 3600) {
          hours = Math.floor(seconds / 3600)
          seconds -= hours * 3600
          output += `${hours.toString().padStart(2, '0')}:`
        }
        if (seconds >= 60) {
          minutes = Math.floor(seconds / 60)
          seconds -= minutes * 60
          if (hours > 0) {
            output += `${minutes.toString().padStart(2, '0')}:`
          } else {
            output += `${minutes}:`
          }
        } else {
          output += '0:'
        }
        output += `${seconds.toString().padStart(2, '0')}`
        return output
      }
    }
  },
  data () {
    return {}
  }
}
</script>
