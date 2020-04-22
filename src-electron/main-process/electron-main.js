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
  mainWindow.send('audioProgress', (percent * 100).toFixed(2), `${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB`)
}

const onVideoProgress = (chunkLength, downloaded, total) => {
  const percent = downloaded / total
  mainWindow.send('videoProgress', (percent * 100).toFixed(2), `${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB`)
}

const cancelAll = (err) => {
  console.error(err)
  console.log('cancel')
  // console.log(global.audioStream)
  // console.log(global.audioFF)
  if (global.audioStream !== null) {
    console.log('audio destroy')
    global.audioStream.destroy()
  }

  if (global.videoStream !== null) {
    console.log('video destroy')
    global.videoStream.destroy()
    global.videoStream = null
  }

  if (global.audioFF !== null) {
    console.log('audioFF kill')
    global.audioFF.kill()
    global.audioFF = null
  }

  if (global.videoFF !== null) {
    console.log('videoFF kill')
    global.videoFF.kill()
    global.videoFF = null
  }

  /*
  leaving out auto clean up for now.
  let user manually delete

  if (fs.existsSync(global.savePath)) {
    fs.unlinkSync(global.savePath)
  }

  if (fs.existsSync(global.savePath + '.tmp')) {
    fs.unlinkSync(global.savePath + '.tmp')
  }

  if (fs.existsSync(global.savePath.split('.mp4')[0] + '.mp3')) {
    fs.unlinkSync(global.savePath.split('.mp4')[0] + '.mp3')
  }
  */
  mainWindow.send('ffProgress', true)
}

const finish = () => {
  console.log('\ndone')
  if (fs.existsSync(global.savePath + '.tmp')) {
    fs.unlinkSync(global.savePath + '.tmp')
  }
  global.audioStream = null
  global.videoStream = null
  global.audioFF = null
  global.videoFF = null
  global.savePath = null
  mainWindow.send('ffProgress', true)
}

global.audioStream = null
global.videoStream = null
global.audioFF = null
global.videoFF = null
global.savePath = null

ipcMain.on('download', (event, url, audioOnly, keepMP3) => {
  console.log('downloading track')

  ytdl.getInfo(url, (err, info) => {
    if (err) {
      cancelAll(err)
    } else {
      mainWindow.send('info', info)
      const title = sanitize(info.title)
      const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
      const audioBitrate = audioFormat.audioBitrate
      const audioPath = path.join(app.getPath('music'), `${title}`)
      // const videoFormat = ytdl.chooseFormat(ytdl.filterFormats(info.formats, format => format.container === 'mp4'), { quality: 'highestvideo' }) // && !format.audioEncoding
      const videoPath = path.join(app.getPath('videos'), `${title}`) // .${videoFormat.container}

      // let savePath

      if (audioOnly) {
        global.savePath = dialog.showSaveDialogSync({
          defaultPath: audioPath,
          filters: [
            { name: '.mp3', extensions: ['mp3'] }
          ]
        })
      } else {
        global.savePath = dialog.showSaveDialogSync({
          defaultPath: videoPath,
          filters: [
            { name: '.mp4', extensions: ['mp4'] }
          ]
        })
      }

      if (global.savePath !== undefined) {
        // download from info
        global.audioStream = ytdl.downloadFromInfo(info, {
          quality: 'highestaudio'
        })
          .on('progress', onAudioProgress)
          .on('error', cancelAll)

        if (audioOnly) {
          // save audio
          global.audioFF = ffmpeg(global.audioStream)
            .audioBitrate(audioBitrate)
            .save(global.savePath)
            .on('error', cancelAll)
            .on('end', finish)
        } else {
          // download video too
          global.audioStream.pipe(fs.createWriteStream(global.savePath + '.tmp'))
            .on('finish', () => {
              const videoStream = ytdl.downloadFromInfo(info, {
                quality: 'highestvideo'
              })
                .on('progress', onVideoProgress)
                .on('error', cancelAll)

              global.videoFF = ffmpeg()
                .input(videoStream)
                .videoCodec('copy')
                .input(global.savePath + '.tmp')
                .save(global.savePath)
                .on('error', cancelAll)
                .on('end', () => {
                  if (keepMP3) {
                    global.audioFF = ffmpeg()
                      .input(global.savePath + '.tmp')
                      .audioBitrate(audioBitrate)
                      .save(global.savePath.split('.mp4')[0] + '.mp3')
                      .on('error', cancelAll)
                      .on('end', finish)
                  } else {
                    finish()
                  }
                })
            })
        }
      } else {
        // no path selected
        mainWindow.send('ffProgress', true)
      }
    }
  })
})

ipcMain.on('cancel', cancelAll)
