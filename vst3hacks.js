import fs from 'node:fs/promises'
import _ from 'lodash-es'
import * as pkg from './lib/hacklib.js'
Object.assign(globalThis, pkg)

let dir = './tests/testdata/live-11'

let files = [
	'Preferences-vst3-custom-disabled.cfg',
	'Preferences-vst3-custom-enabled.cfg',
	'Preferences-vst3-custom-init.cfg',
	'Preferences-vst3-disabled.cfg',
	'Preferences-vst3-enabled.cfg',
	'Preferences-vst3-init.cfg',
	'Preferences-vst3.cfg',
]

function extractVst3CustomPath(bytes) {
	let textSegment = bytesToStringArr(bytes)
	let filtered = textSegment
		.filter((char) => {
			if (char !== '\\x00') return true
		})
		.join('')

	if (/\#([\/\w\-]+)\\x15/.test(filtered)) {
		let path = filtered.match(/\#([\/\w\-]+)\\x15/)[1]

		return path
	} else {
		// no directory path, return null or empty string
		return false
	}
}

function getVst3Configuration(bytes) {
	if (!bytes[15] === 2) {
		throw new Error('Unexpected byte value at index 15, expected 2')
	}

	const SYSTEM_ENABLED_BYTE = 19
	const CUSTOM_ENABLED_BYTE = 20

	const isSystemEnabled = bytes[SYSTEM_ENABLED_BYTE] === 1
	const isCustomEnabled = bytes[CUSTOM_ENABLED_BYTE] === 1

	let customPath = extractVst3CustomPath(bytes)

	return {
		isSystemEnabled,
		isCustomEnabled,
		customPath,
	}
}

export default function main() {
	files.forEach(async (file) => {
		const bytes = await readFileBytes(`${dir}/${file}`)
		const strContents = await fs.readFile(`${dir}/${file}`, 'utf8')
		let indexes = findAllOccurrences('Vst3Preferences', bytes)
		let bytesSegment = bytes.slice(indexes[1], indexes[1] + 200)

		console.log('vst3 config', getVst3Configuration(bytesSegment))
	})
}

main()
