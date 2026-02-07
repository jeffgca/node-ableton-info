import fs from 'node:fs/promises'
import _ from 'lodash-es'

export default class AbletonPrefs {
	#_bytes = null
	#_text = null
	#_vst3Config = null
	#_auConfig = null
	#_vst2Config = null
	#_bytesSegment = null
	#_strSegment = null

	constructor(path) {
		return (async () => {
			try {
				await fs.access(path)
			} catch (Err) {
				throw new Error(`File not found: ${path}`)
			}

			// grab the bytes as Uint8Array from the filesystem
			this.#_bytes = await fs.readFile(path)
			// convert a text representation of the bytes, easier for simpler processing
			this.#_text = new TextDecoder('utf-8').decode(this.#_bytes)

			this.#_strSegment = this.#_getPluginManagerSegment(this.#_text)

			return this
		})()
	}

	get PluginConfig() {
		this.getVst3Configuration()
		this.getVst2Configuration()
		this.getAuConfiguration()

		return {
			vst3: this.#_vst3Config,
			vst2: this.#_vst2Config,
			au: this.#_auConfig,
		}
	}

	getAuConfiguration() {
		this.#_auConfig = {
			isEnabled: this.#_strSegment.includes('AuFolder'),
		}

		return this.#_auConfig
	}

	/**
	 * warning: this will fail on windows
	 * need to account for:
	 * 	* vst2 sys disabled but custom dir enabled?
	 *  * vst2 sys enabled but custom dir disabled?
	 */
	getVst2Configuration() {
		// does the segment include PlugScanInfo data?
		const isEnabled = this.#_strSegment.includes('PlugScanInfo')
		let vstIndexes = this.findAllOccurrences('VstManager', this.#_bytes)
		let segment = this.#_bytes.slice(vstIndexes[1], vstIndexes[1] + 300)
		let _str = this.bytesToStringArr(segment)

		let customPath = null,
			isCustomPathEnabled = null

		if (segment[14] === 0) {
			isCustomPathEnabled = false
		} else if (segment[14] === 28) {
			isCustomPathEnabled = true
			customPath = this.extractVst2CustomPath(segment)
		}

		this.#_vst2Config = {
			isEnabled,
			customPath,
			isCustomPathEnabled,
		}

		return this.#_vst2Config
	}

	/**
	 * warning: this will fail on windows
	 */
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

	/**
	 * warning: this will fail on windows
	 */
	extractVst2CustomPath(bytes) {
		let textSegment = this.bytesToStringArr(bytes)

		let filtered = textSegment
			.filter((char) => {
				if (char !== '\\x00') return true
			})
			.join('')

		let match = filtered.match(/(\/[\w\/\-]+?)\\x01/)

		return match[1] || null
	}

	/**
	 * getVst3Configuration()
	 *
	 */
	getVst3Configuration() {
		// segment for vst3 detection
		let indexes = this.findAllOccurrences('Vst3Preferences', this.#_bytes)
		let bytes = this.#_bytes.slice(indexes[1], indexes[1] + 200)

		if (!bytes[15] === 2) {
			throw new Error('Unexpected byte value at index 15, expected 2')
		}

		const SYSTEM_ENABLED_BYTE = 19
		const CUSTOM_ENABLED_BYTE = 20

		const isEnabled = bytes[SYSTEM_ENABLED_BYTE] === 1
		const isCustomPathEnabled = bytes[CUSTOM_ENABLED_BYTE] === 1

		let customPath = this.extractVst3CustomPath(bytes)

		this.#_vst3Config = {
			isEnabled,
			isCustomPathEnabled,
			customPath,
		}

		return this.#_vst3Config
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
