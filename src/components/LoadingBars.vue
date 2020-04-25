<template>
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
</template>

<script>
export default {
  name: 'LoadingBars',
  props: {
    url: {
      type: String,
      required: true
    },
    percentage: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    ffLabel: {
      get () {
        return `Processing ${this.label.split(':')[0].toLowerCase()}...`
      }
    }
  },
  methods: {
    cancel () {
      this.$q.electron.ipcRenderer.send('cancel', this.url) // does key work?
    }
  },
  data () {
    return {}
  }
}
</script>
