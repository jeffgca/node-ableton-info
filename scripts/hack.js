import { AbletonInfoMacOS, PluginInfoMacOS } from '../lib/ableton-info-macos.js'
import { AbletonPrefs } from '../lib/ableton-prefs.js'

let live = new AbletonInfoMacOS()

// console.log('get ableton versions', live.getInstalledLiveVersions())

let winfiles = [
	// './tests/testdata/win64/Preferences-all-x64.cfg',
	// './tests/testdata/win64/Preferences-init-x64.cfg',
	'./tests/testdata/live-11/Preferences-all-prefs-set.cfg',
]

winfiles.forEach(async (file) => {
	let prefs = await new AbletonPrefs(file)

	console.log(`\n\nPrefs from file: ${file}`)

	console.log(prefs.PluginConfig)

	let plugins = new PluginInfoMacOS(prefs.PluginConfig)

	console.log('VST3 Plugins found:', await plugins.getVst3Plugins())
	console.log('VST2 Plugins found:', await plugins.getVst2Plugins())
	console.log('AU Plugins found:', await plugins.getAudioUnitPlugins())
})
