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
      nodeIntegration: QUASAR_NODE_INTEGRATION

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  if (process.platform === 'win32') {
    if (!fs.existsSync(path.join(app.getAppPath(), '..', '..', 'ffmpeg.exe'))) {
      console.log('copy')
      fs.copyFileSync(path.join(__statics, 'ffmpeg.exe'), path.join(app.getAppPath(), '..', '..', 'ffmpeg.exe'))
    }
    global.ffmpegPath = path.join(app.getAppPath(), '..', '..', 'ffmpeg.exe')
  }
  /*
  else if (process.platform === 'darwin') {
    if (!fs.existsSync(path.join(app.getAppPath(), '..', '..', 'ffmpeg'))) {
      console.log('copy')
      fs.copyFileSync(path.join(__statics, 'ffmpeg'), path.join(app.getAppPath(), '..', '..', 'ffmpeg'))
      global.ffmpegPath = path.join(app.getAppPath(), '..', '..', 'ffmpeg')
    }
  }
  */

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

const onAudioProgress = (chunkLength, downloaded, total, url) => {
  const percent = downloaded / total
  mainWindow.send('progress', (percent * 100).toFixed(2), `Audio: ${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB`, url)
}

const onVideoProgress = (chunkLength, downloaded, total, url) => {
  const percent = downloaded / total
  mainWindow.send('progress', (percent * 100).toFixed(2), `Video: ${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB`, url)
}

const cancelAll = (url) => {
  var proc = processes.get(url)
  console.log('cancel')

  if (proc.audioStream !== undefined) {
    console.log('audio destroy')
    proc.audioStream.destroy()
    proc.audioStream = undefined
  }

  if (proc.videoStream !== undefined) {
    console.log('video destroy')
    proc.videoStream.destroy()
    proc.videoStream = undefined
  }

  if (proc.audioFF !== undefined) {
    console.log('audioFF kill')
    proc.audioFF.kill()
    proc.audioFF = undefined
  }

  if (proc.videoFF !== undefined) {
    console.log('videoFF kill')
    proc.videoFF.kill()
    proc.videoFF = undefined
  }
  // processes.delete(url)  can't delete cause need for delete temp but need to delete incase of actual error!!
  mainWindow.send('ffProgress', true, null, url)
}

const finish = (url) => {
  var proc = processes.get(url)
  console.log('\ndone')
  if (fs.existsSync(proc.savePath + '.tmp')) {
    fs.unlinkSync(proc.savePath + '.tmp')
  }
  mainWindow.send('ffProgress', true, proc.savePath, url)
  proc.audioStream = undefined
  proc.videoStream = undefined
  proc.audioFF = undefined
  proc.videoFF = undefined
  processes.delete(url)
}

var processes = new Map()

ipcMain.on('download', (event, url, audioOnly, keepMP3) => {
  console.log('downloading track')

  ytdl.getInfo(url, (err, info) => {
    if (err) {
      cancelAll(err)
    } else {
      mainWindow.send('info', info, url)
      const title = sanitize(info.title)
      const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
      const audioBitrate = audioFormat.audioBitrate
      const audioPath = path.join(app.getPath('music'), `${title}`)
      // const videoFormat = ytdl.chooseFormat(ytdl.filterFormats(info.formats, format => format.container === 'mp4'), { quality: 'highestvideo' }) // && !format.audioEncoding
      const videoPath = path.join(app.getPath('videos'), `${title}`) // .${videoFormat.container}
      let saveDialog

      if (audioOnly) {
        saveDialog = dialog.showSaveDialog({
          defaultPath: audioPath,
          filters: [
            { name: '.mp3', extensions: ['mp3'] }
          ]
        })
      } else {
        saveDialog = dialog.showSaveDialog({
          defaultPath: videoPath,
          filters: [
            { name: '.mp4', extensions: ['mp4'] }
          ]
        })
      }
      saveDialog.then((object) => {
        const { canceled, filePath } = object
        if (canceled) {
          // canceled
          mainWindow.send('ffProgress', true, null, url)
        } else {
          var proc = {}
          proc.savePath = filePath
          proc.audioStream = ytdl.downloadFromInfo(info, {
            quality: 'highestaudio'
          })
            .on('progress', (chunkLength, downloaded, total) => {
              onAudioProgress(chunkLength, downloaded, total, url)
            })
            .on('error', (error) => {
              console.log(error)
              cancelAll(url)
            })

          if (audioOnly) {
            // save audio
            proc.audioFF = ffmpeg(proc.audioStream)
              .setFfmpegPath(global.ffmpegPath)
              .audioBitrate(audioBitrate)
              .save(proc.savePath)
              .on('error', (error) => {
                console.log(error)
                cancelAll(url)
              })
              .on('end', () => {
                finish(url)
              })
          } else {
            // download video too
            proc.audioStream.pipe(fs.createWriteStream(proc.savePath + '.tmp'))
              .on('finish', () => {
                proc.videoStream = ytdl.downloadFromInfo(info, {
                  quality: 'highestvideo'
                })
                  .on('progress', (chunkLength, downloaded, total) => {
                    onVideoProgress(chunkLength, downloaded, total, url)
                  })
                  .on('error', (error) => {
                    console.log(error)
                    cancelAll(url)
                  })

                proc.videoFF = ffmpeg()
                  .setFfmpegPath(global.ffmpegPath)
                  .input(proc.videoStream)
                  .videoCodec('copy')
                  .input(proc.savePath + '.tmp')
                  .save(proc.savePath)
                  .on('error', (error) => {
                    console.log(error)
                    cancelAll(url)
                  })
                  .on('end', () => {
                    if (keepMP3) {
                      proc.audioFF = ffmpeg()
                        .input(proc.savePath + '.tmp')
                        .audioBitrate(audioBitrate)
                        .save(proc.savePath.split('.mp4')[0] + '.mp3')
                        .on('error', (error) => {
                          console.log(error)
                          cancelAll(url)
                        })
                        .on('end', () => {
                          finish(url)
                        })
                    } else {
                      finish(url)
                    }
                  })
              })
          }
          processes.set(url, proc)
        }
      })
    }
  })
})

ipcMain.on('cancel', (event, url) => {
  console.log(url)
  cancelAll(url)
})

ipcMain.on('openFolder', (event, savePath, url) => {
  if (savePath !== undefined) {
    require('child_process').exec(`start "" "${path.dirname(savePath)}"`)
  }
  // global.savePath = null
})

ipcMain.on('deleteTemp', (event, url) => {
  var proc = processes.get(url)
  console.log(proc.savePath)
  if (fs.existsSync(proc.savePath)) {
    fs.unlinkSync(proc.savePath)
  }

  if (fs.existsSync(proc.savePath + '.tmp')) {
    fs.unlinkSync(proc.savePath + '.tmp')
  }

  if (fs.existsSync(proc.savePath.split('.mp4'[0] + '.mp3'))) {
    fs.unlinkSync(proc.savePath.split('.mp4'[0] + '.mp3'))
  }
})
