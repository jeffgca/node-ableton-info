// import { cleanPreferencesFile } from './scripts/cfg_tools.js'

// let str = cleanPreferencesFile()

// console.log('Cleaned Preferences.cfg content:')
// console.log(str)

import fs from 'node:fs/promises'
import AbletonPrefs from './lib/ableton-prefs.js'
import { readFileBytes, findAllOccurrences } from './lib/hacklib.js'
import _ from 'lodash-es'

let dir = './tests/testdata/live-11'

let files = [
	// 'Preferences-vst3-custom-disabled.cfg',
	// 'Preferences-vst3-custom-enabled.cfg',
	// 'Preferences-vst3-custom-init.cfg',
	// 'Preferences-vst3-disabled.cfg',
	// 'Preferences-vst3-enabled.cfg',
	// 'Preferences-vst3-init.cfg',
	// 'Preferences-vst3.cfg',
	'Preferences-all-prefs-set.cfg',
]

_.each(files, async (file) => {
	console.log('file', `${dir}/${file}`)

	// const bytes = await readFileBytes(`${dir}/${file}`)

	// let indexes = findAllOccurrences('Vst3Preferences', bytes)
	// let bytesSegment = bytes.slice(indexes[1], indexes[1] + 200)

	// console.log('vst3 config', getVst3Configuration(bytesSegment))

	let prefs = await new AbletonPrefs(`${dir}/${file}`)

	console.log('prefs', prefs)
})
