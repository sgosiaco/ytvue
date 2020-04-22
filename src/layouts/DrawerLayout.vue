<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated>
      <Toolbar :title=title></Toolbar>
      <q-toolbar class="bg-black text-white">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      content-class="bg-grey-1"
      behavior="desktop"
    >
      <q-list>
        <NavItem
          v-for="item in navItems"
          :key="item.title"
          v-bind="item"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import NavItem from 'components/NavItem'
import Toolbar from 'components/Toolbar'

export default {
  name: 'MainLayout',

  components: {
    NavItem,
    Toolbar
  },

  beforeCreate: function () {
    this.$q.electron.ipcRenderer.on('log', (event, string) => {
      console.log(string)
    })
  },

  data () {
    return {
      title: 'YT Vue',
      leftDrawerOpen: false,
      navItems: [
        {
          title: 'Home',
          route: '/'
        },
        {
          title: 'Settings',
          route: '/settings'
        }
      ]
    }
  }
}
</script>
