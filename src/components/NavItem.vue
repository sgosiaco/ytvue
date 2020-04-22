<template>
  <q-item clickable v-ripple :to=route exact>
    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  name: 'NavItem',
  props: {
    title: {
      type: String,
      required: true
    },

    route: {
      type: String,
      required: true
    }
  }
}
</script>
