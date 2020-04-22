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
    backgroundColor: '#fff',
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
const fs = require('fs')
const path = require('path')
const sanitize = require('sanitize-filename')

const onAudioProgress = (chunkLength, downloaded, total) => {
  const percent = downloaded / total
  // mainWindow.send('log', `${(percent * 100).toFixed(2)}% downloaded `)
  // mainWindow.send('log', `(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`)
  mainWindow.send('audioProgress', (percent * 100).toFixed(2), `${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB`)
}

const onVideoProgress = (chunkLength, downloaded, total) => {
  const percent = downloaded / total
  // mainWindow.send('log', `${(percent * 100).toFixed(2)}% downloaded `)
  // mainWindow.send('log', `(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`)
  mainWindow.send('videoProgress', (percent * 100).toFixed(2), `${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB`)
}

// global.audioStream = null
// global.videoStream = null
// global.audioFF = null
// global.videoFF = null

ipcMain.on('download', (event, url, audioOnly) => {
  console.log('downloading track')

  ytdl.getInfo(url, (err, info) => {
    if (err) {
      console.log(err)
    } else {
      mainWindow.send('info', info)
      const title = sanitize(info.title)
      const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
      const audioBitrate = audioFormat.audioBitrate
      const audioPath = path.join(app.getPath('music'), `${title}.mp3`)
      const videoFormat = ytdl.chooseFormat(ytdl.filterFormats(info.formats, format => format.container === 'mp4'), { quality: 'highestvideo' }) // && !format.audioEncoding
      const videoPath = path.join(app.getPath('videos'), `${title}.${videoFormat.container}`)

      let savePath

      if (audioOnly) {
        savePath = dialog.showSaveDialogSync({
          defaultPath: audioPath
        })
      } else {
        savePath = dialog.showSaveDialogSync({
          defaultPath: videoPath
        })
      }

      if (savePath !== undefined) {
        // download from info
        const audioStream = ytdl.downloadFromInfo(info, {
          quality: 'highestaudio'
        }).on('progress', onAudioProgress)

        if (audioOnly) {
          ffmpeg(audioStream)
            .audioBitrate(audioBitrate)
            .save(savePath)
            .on('end', () => {
              console.log('\ndone')
            })
        } else {
          audioStream.pipe(fs.createWriteStream(savePath + '.tmp'))
            .on('finish', () => {
              const videoStream = ytdl.downloadFromInfo(info, {
                quality: 'highestvideo'
              }).on('progress', onVideoProgress)

              ffmpeg()
                .input(videoStream)
                .videoCodec('copy')
                .input(savePath + '.tmp')
                .save(savePath)
                .on('error', console.error)
                .on('end', () => {
                  fs.unlink(savePath + '.tmp', err => {
                    if (err) console.error(err)
                    else console.log('\ndone')
                  })
                })
            })
        }
      } else {
        if (audioOnly) {
          mainWindow.send('audioProgress', 100)
        } else {
          mainWindow.send('videoProgress', 100)
        }
      }
    }
  })
})

ipcMain.on('cancel', (event) => {
  console.log('cancel')
  console.log(global.audioStream)
  console.log(global.audioFF)
  if (global.audioStream !== null) {
    console.log('audio destroy')
    global.audioStream.destroy()
  }

  if (global.videoStream !== null) {
    global.videoStream.destroy()
  }

  if (global.audioFF !== null) {
    console.log('audioFF kill')
    global.audioFF.kill()
  }

  if (global.videoFF !== null) {
    global.videoFF.kill()
  }
})
