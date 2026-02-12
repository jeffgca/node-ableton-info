import { AbletonInfoMacOS, PluginInfoMacOS } from '../lib/ableton-info-macos.js'
import { AbletonPrefs } from '../lib/ableton-prefs.js'

let live = new AbletonInfoMacOS()

// console.log('get ableton versions', live.getInstalledLiveVersions())

let winfiles = [
	'./tests/testdata/win64/Preferences-all-x64.cfg',
	'./tests/testdata/win64/Preferences-init-x64.cfg',
	'./tests/testdata/live-11/Preferences-all-prefs-set.cfg',
]

winfiles.forEach(async (file) => {
	let prefs = await new AbletonPrefs(file)

	// console.log('plugin config', prefs.PluginConfig)

	console.log('file', file)
	// let bytes = prefs.bytes

	let indexes = prefs.findAllOccurrences('Vst3Preferences', prefs.bytes)

	console.log('indexes', indexes)

	let _bytes = prefs.bytes.slice(indexes[1], indexes[1] + 300)
	let _charArr = prefs.bytesToStringArr(_bytes)

	// console.log('strBytes', _charArr)

	console.log('path', prefs.extractVst3CustomPathUnified(_bytes))
})
