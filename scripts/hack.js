import { AbletonInfoMacOS } from '../lib/ableton-info-macos.js'

let live = new AbletonInfoMacOS()

console.log('get ableton versions', live.getLiveVersions())
