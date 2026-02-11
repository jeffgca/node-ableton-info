import { AbletonInfoWin64, isRunningInWsl } from '../lib/ableton-info-win64.js'

console.log('Wsl?', isRunningInWsl())

let info = new AbletonInfoWin64()
// console.log('Installed Ableton Live versions:', info.installedVersions)
