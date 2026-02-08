import { AbletonInfoMacOS } from '../lib/ableton-info-macos.js'
import { AbletonPrefs } from '../lib/ableton-prefs.js'

let live = new AbletonInfoMacOS()

console.log('get ableton versions', live.getInstalledLiveVersions())

let winfiles = [
	'./tests/testdata/win64/Preferences-all-x64.cfg',
	'./tests/testdata/win64/Preferences-init-x64.cfg',
]

winfiles.forEach(async (file) => {
	let prefs = await new AbletonPrefs(file)

	console.log('plugin config', prefs.PluginConfig)
})
