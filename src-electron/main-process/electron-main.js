/* eslint-disable camelcase */
import { app, BrowserWindow, nativeTheme, ipcMain, dialog } from 'electron'

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    width: 800,
    height: 400,
    useContentSize: true,
    webPreferences: {
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: QUASAR_NODE_INTEGRATION,

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

const ytdl = require('ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
// const fs = require('fs')
const path = require('path')
const sanitize = require('sanitize-filename')
// import store from '../../store'

// var songDir = path.join(app.getAppPath(), '..', '..', 'songs')

// if (!fs.existsSync(songDir)) {
//  fs.mkdirSync(songDir)
// }

// ipcMain.on('updateDir', (event, dir) => {
//  songDir = dir
// })

const onProgress = (chunkLength, downloaded, total) => {
  const percent = downloaded / total
  // readline.cursorTo(process.stdout, 0)
  // process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `)
  // process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`)
  // console.log(`${(percent * 100).toFixed(2)}% downloaded `)
  // console.log(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`)
  mainWindow.send('log', `${(percent * 100).toFixed(2)}% downloaded `)
  mainWindow.send('log', `(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`)
  mainWindow.send('progress', percent * 100)
}

ipcMain.on('download', (event, url) => {
  console.log('downloading track')
  let title
  let length_seconds
  let name
  let format
  let bitrate
  const printDebug = false

  ytdl.getInfo(url, (err, info) => {
    if (err) {
      console.log(err)
    } else {
      mainWindow.send('info', info);
      // extract info
      ({ title, length_seconds } = info)
      name = info.author.name
      format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
      bitrate = format.audioBitrate

      // logging
      if (printDebug) {
        console.log(info)
        console.log(`${title} by ${name}`)
        console.log(`${length_seconds}`)
        console.log(format)
      }

      const songDir = dialog.showSaveDialogSync({
        defaultPath: path.join(app.getPath('music'), `${sanitize(title)}.mp3`)
      })

      if (songDir !== undefined) {
        // download from info
        const stream = ytdl.downloadFromInfo(info, {
          quality: 'highestaudio'
        }).on('progress', onProgress)

        ffmpeg(stream)
          .audioBitrate(bitrate)
          .save(songDir)
          .on('end', () => {
            console.log('\ndone')
          })
      } else {
        mainWindow.send('progress', 100)
      }
    }
  })
})
