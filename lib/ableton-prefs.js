import fs from 'node:fs/promises'
import _ from 'lodash-es'

export default class AbletonPrefs {
	#_bytes = null
	#_text = null
	#_vst3Config = null
	#_bytesSegment = null
	#_strSegment = null

	constructor(path) {
		// this.#_bytes = this.

		// return this.loadFromFile(path)

		return (async () => {
			// this.vst3Config = this.getVst3Configuration(bytes)

			try {
				await fs.access(path)
			} catch (Err) {
				throw new Error(`File not found: ${path}`)
			}

			this.#_bytes = await fs.readFile(path)
			this.#_text = new TextDecoder('utf-8').decode(this.#_bytes)

			// segment for vst3 detection
			let indexes = this.findAllOccurrences('Vst3Preferences', this.#_bytes)
			console.log('indexes', indexes)
			this.#_bytesSegment = this.#_bytes.slice(indexes[1], indexes[1] + 200)

			// text content for vst2 detection
			this.#_strSegment = this.#_getPluginManagerSegment(this.#_text)

			// console.log('PluginManager segment', this.#_strSegment) // --- IGNORE ---

			// console.log('strSegment', this.#_strSegment)

			// console.log(
			// 	'testy',
			// 	this.isAuEnabled(),
			// 	this.isVst2Enabled(),
			// 	this.getVst3Configuration(this.#_bytesSegment),
			// )

			let vstIndexes = this.findAllOccurrences('VstManager', this.#_bytes)

			console.log('vst2 indexes', vstIndexes)

			// TODO: extract custom path for vst2 if enabled, similar to vst3 (may be in the same segment as the "VstManager" string)

			// console.log('vst2', this.extractVst2CustomPath(bytes))

			return this
		})()
	}

	isAuEnabled() {
		return this.#_strSegment.includes('AuFolder')
	}

	isVst2Enabled() {
		return this.#_strSegment.includes('PlugScanInfo')
	}

	extractVst3CustomPath(bytes) {
		let textSegment = this.bytesToStringArr(bytes)
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

	extractVst2CustomPath() {
		// tbd

		let indexes = this.findAllOccurrences('VstManager', this.#_bytes)

		let segment = this.#_bytes.slice(indexes[0], indexes[0] + 200)

		// let textSegment = this.bytesToStringArr(bytes)

		return textSegment
	}

	getVst3Configuration(bytes) {
		if (!bytes[15] === 2) {
			throw new Error('Unexpected byte value at index 15, expected 2')
		}

		const SYSTEM_ENABLED_BYTE = 19
		const CUSTOM_ENABLED_BYTE = 20

		const isSystemEnabled = bytes[SYSTEM_ENABLED_BYTE] === 1
		const isCustomEnabled = bytes[CUSTOM_ENABLED_BYTE] === 1

		let customPath = this.extractVst3CustomPath(bytes)

		return {
			isSystemEnabled,
			isCustomEnabled,
			customPath,
		}
	}

	bytesToStringArr(bytes, options = {}) {
		const {
			hexPrefix = '\\x', // alternatives: '0x', '%'
			lowercase = true,
		} = options

		let out = []

		bytes.forEach((byte) => {
			// Printable ASCII characters: 32-126
			// console.log('byte', byte)
			if (byte >= 32 && byte <= 126) {
				// console.log('str', String.fromCharCode(byte))
				out.push(String.fromCharCode(byte))
				// return String.fromCharCode(byte)
			} else {
				// Non-printable: convert to hex
				const hex = byte.toString(16).padStart(2, '0')
				out.push(`${hexPrefix}${lowercase ? hex : hex.toUpperCase()}`)
			}
		})

		return out
	}

	findAllOccurrences(needle, bytes) {
		const pattern = new TextEncoder().encode(needle)
		const matches = []

		outer: for (let i = 0; i <= bytes.length - pattern.length; i++) {
			for (let j = 0; j < pattern.length; j++) {
				if (bytes[i + j] !== pattern[j]) continue outer
			}
			matches.push(i)
			i += pattern.length - 1 // skip ahead (optional: remove to find overlapping matches)
		}

		return matches
	}

	#_getPluginManagerSegment() {
		const segmentStart = this.#_text.indexOf('PluginManager')
		if (segmentStart === -1) {
			throw new Error('PluginManager segment not found')
		}

		const segmentEnd = this.#_text.indexOf('SongPrefData', segmentStart)

		return this.#_text.slice(segmentStart, segmentEnd)
	}
}
