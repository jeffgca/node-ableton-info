import fs from 'node:fs/promises'
import _ from 'lodash-es'

export function bytesToAsciiOrNumber(bytes) {
	return Array.from(bytes, (b) => {
		// printable ASCII range 0x21–0x7E (exclude whitespace/control)
		if (b >= 0x21 && b <= 0x7e) return String.fromCharCode(b)
		return b
	})
}

export function findAllOccurrences(needle, bytes) {
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

/**
 * a nodejs function that takes an array of bytes and extracts sequences where 
 * a single asii character is followed by a 0 byte value, and returns the raw 
 * data as well as the string you get from removing the null bytes, eg:

    {
      raw: [56, 0, 57],
      string: '89'
    }
 */

export function extractNullTerminatedString(bytes, startIndex = 0) {
	const raw = []
	const chars = []

	for (let i = startIndex; i < bytes.length; i++) {
		const byte = bytes[i]
		const nextByte = bytes[i + 1]

		console.log('byte, nextByte', byte, nextByte)

		// Check if this is an ASCII char followed by null
		if (byte >= 0x20 && byte <= 0x7e && nextByte === 0) {
			raw.push(byte, 0)
			chars.push(String.fromCharCode(byte))
			i++ // skip the null byte
		} else if (byte === 0) {
			// skip standalone nulls
			continue
		} else {
			// end of pattern
			// break
		}
	}

	return {
		raw,
		string: chars.join(''),
	}
}

export function bytesToStringArr(bytes, options = {}) {
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

export async function processFile(path) {
	// console.log('file length: ', contents.length)

	const contents = await fs.readFile(path, 'utf8')
	const bytes = await readFileBytes(path)

	const pluginManagerSegment = _getPluginManagerSegment(contents)

	// console.log(
	// 	'AuManager',
	// 	pluginManagerSegment.indexOf('AuManager'),
	// 	'\nAuFolder',
	// 	pluginManagerSegment.includes('AuFolder'),
	// 	'\nVstManager',
	// 	pluginManagerSegment.includes('VstManager'),
	// )

	// console.log('is Au Enabled: ', isAuEnabled(pluginManagerSegment))
	// console.log('is vst2 enabled: ', isVst2Enabled(pluginManagerSegment))
	// console.log('is vst3 enabled: ', await isVst3Enabled(pluginManagerSegment))
	// console.log(
	// 	'is vst3 directory enabled: ',
	// 	isVst3DirectoryEnabled(pluginManagerSegment),
	// )

	return {
		au: {
			enabled: isAuEnabled(pluginManagerSegment),
		},
		vst2: {
			enabled: isVst2Enabled(pluginManagerSegment),
		},
	}
}

export function _getPluginManagerSegment(fileContent) {
	const segmentStart = fileContent.indexOf('PluginManager')
	if (segmentStart === -1) {
		throw new Error('PluginManager segment not found')
	}

	const segmentEnd = fileContent.indexOf('SongPrefData', segmentStart)

	return fileContent.slice(segmentStart, segmentEnd)
}

export function isAuEnabled(segment) {
	return segment.includes('AuFolder')
}

export function isVst2Enabled(segment) {
	return segment.includes('PlugScanInfo')
}

export async function isVst3Enabled(file) {
	const bytes = await readFileBytes(file)

	let result = findAllOccurrences('Vst3Preferences', bytes)

	// console.log('Vst3Preferences found at byte index: ', result)

	let vst3Result = result.pop() // there are always 2, we need the second one

	let arr = bytes.slice(vst3Result, vst3Result + 200)

	// console.log('arr', arr[19]) // the 19th byte is either 1 or 0???

	return arr[19] === 1 || false
}

export function extractPath(strRaw) {}

/**
 * VST3 - test for existence of path, plus after Vst3Preferences is the 6th null byte 1 or zero?
 */
export async function isCustomVst3PathEnabled(segment, file) {
	// tbd

	let vst3Enabled = await isVst3Enabled(file)

	const bytes = await readFileBytes(file)

	let result = findAllOccurrences('Vst3Preferences', bytes).pop()

	// if (vst3Enabled) {
	// test for existence of directory path after Vst3Preferences

	const pluginManagerSegment = _getPluginManagerSegment(segment)

	console.log('segment', pluginManagerSegment)

	console.log(result)

	let arr = bytes.slice(result, result + 200)

	// console.log('arr', bytesToStringArr(arr)) // the 19th byte is either 1 or 0???

	let filtered = _.filter(
		bytesToStringArr(arr),
		(char) => char !== '\\x00',
	).join('')

	console.log('filtered', filtered)
	// }

	return vst3Enabled
}

/**
 * VST2 - init has ~ 14 bytes of blank space after VstManager followed by the system folder, enabled has a custom path after 8 null bytes + VstPlugScanInfo entries
 * Between VstManager and Vst3Preferences there is paths, and if the folder is enabled, there is also the VstPlugScanInfo symbol
 */
export function isCustomVst2PathEnabled(segment) {
	// tbd
}

export function getCustomVst2Path(segment) {
	// tbd
}

export function getCustomVst3Path(segment) {
	// tbd
}

export async function readFileBytes(filePath) {
	const buf = await fs.readFile(filePath) // Buffer is binary-safe
	return new Uint8Array(buf)
}

export function indexOfStringInBytes(needle, bytes) {
	const pattern = new TextEncoder().encode(needle)
	outer: for (let i = 0; i <= bytes.length - pattern.length; i++) {
		for (let j = 0; j < pattern.length; j++) {
			if (bytes[i + j] !== pattern[j]) continue outer
		}
		return i
	}
	return -1
}
