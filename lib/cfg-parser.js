import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Search for a string in a cfg file and return the count of occurrences
 * @param {string} filePath - Path to the cfg file
 * @param {string} searchString - String to search for
 * @returns {number} Count of occurrences
 */
export function searchInFile(filePath, searchString) {
	try {
		const fileContent = fs.readFileSync(filePath, 'utf8')
		const matches = fileContent.match(new RegExp(searchString, 'g'))
		return matches ? matches.length : 0
	} catch (error) {
		console.error(`Error reading file: ${error.message}`)
		return 0
	}
}

/**
 * Search for 'Vst3' in the Preferences-init.cfg file
 * @returns {number} Count of 'Vst3' occurrences
 */
export function countVst3InPreferences() {
	const filePath = path.join(
		__dirname,
		'../tests/testdata/live-11/Preferences-init.cfg',
	)
	return searchInFile(filePath, 'Vst3')
}

// Map of control character codes to their standard names
const CONTROL_CHAR_NAMES = {
	0x00: 'NULL',
	0x01: 'SOH (Start of Heading)',
	0x02: 'STX (Start of Text)',
	0x03: 'ETX (End of Text)',
	0x04: 'EOT (End of Transmission)',
	0x05: 'ENQ (Enquiry)',
	0x06: 'ACK (Acknowledge)',
	0x07: 'BEL (Bell)',
	0x08: 'BS (Backspace)',
	0x09: 'HT (Horizontal Tab)',
	0x0a: 'LF (Line Feed)',
	0x0b: 'VT (Vertical Tab)',
	0x0c: 'FF (Form Feed)',
	0x0d: 'CR (Carriage Return)',
	0x0e: 'SO (Shift Out)',
	0x0f: 'SI (Shift In)',
	0x10: 'DLE (Data Link Escape)',
	0x11: 'DC1 (Device Control 1)',
	0x12: 'DC2 (Device Control 2)',
	0x13: 'DC3 (Device Control 3)',
	0x14: 'DC4 (Device Control 4)',
	0x15: 'NAK (Negative Acknowledge)',
	0x16: 'SYN (Synchronous Idle)',
	0x17: 'ETB (End of Transmission Block)',
	0x18: 'CAN (Cancel)',
	0x19: 'EM (End of Medium)',
	0x1a: 'SUB (Substitute)',
	0x1b: 'ESC (Escape)',
	0x1c: 'FS (File Separator)',
	0x1d: 'GS (Group Separator)',
	0x1e: 'RS (Record Separator)',
	0x1f: 'US (Unit Separator)',
	0xfffd: 'REPLACEMENT CHARACTER',
}

/**
 * Get unique non-printable characters from file contents
 * Non-printable characters are those outside the ASCII range 32-126
 * @param {string} fileContents - The contents of the file
 * @returns {Array} Array of unique non-printable characters with metadata, sorted by code point
 */
export function getNonPrintableCharacters(fileContents) {
	const nonPrintableChars = new Set()

	for (const char of fileContents) {
		const charCode = char.charCodeAt(0)
		// Printable ASCII range is 32-126, so non-printable is outside this range
		if (charCode < 32 || charCode > 126) {
			nonPrintableChars.add(char)
		}
	}

	// Convert to array of objects with metadata, sorted by character code
	return Array.from(nonPrintableChars)
		.sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0))
		.map((char) => {
			const charCode = char.charCodeAt(0)
			return {
				char,
				code: charCode,
				hex: `0x${charCode.toString(16).padStart(2, '0')}`,
				name: CONTROL_CHAR_NAMES[charCode] || 'UNKNOWN',
			}
		})
}

/**
 * Convert a string to a display format where non-printable characters are shown as hex
 * @param {string} str - The string to convert
 * @returns {string} String with non-printable chars as hex codes
 */
function convertToHexDisplay(str) {
	let printable = ''
	let chars = str.split('').map((char) => {
		const charCode = char.charCodeAt(0)
		// Printable ASCII range is 32-126
		if (charCode < 32 || charCode > 126) {
			return `\\x${charCode.toString(16).padStart(2, '0')}`
		}
		printable += char
		return char
	})

	return {
		printable,
		chars,
	}
}

/**
 * Search for a string in file contents and return results with context
 * @param {string} fileContents - The contents of the file
 * @param {string} searchString - String to search for
 * @param {number} contextLength - Number of characters before and after to include
 * @returns {Array} Array of result objects with context
 */
export function searchWithContext(
	fileContents,
	searchString,
	contextLength = 40,
) {
	const results = []
	let startIndex = 0

	while (true) {
		const index = fileContents.indexOf(searchString, startIndex)
		if (index === -1) break

		const before = fileContents.substring(
			Math.max(0, index - contextLength),
			index,
		)
		const after = fileContents.substring(
			index + searchString.length,
			Math.min(
				fileContents.length,
				index + searchString.length + contextLength,
			),
		)

		results.push({
			index,
			beforeContext: convertToHexDisplay(before),
			match: searchString,
			afterContext: convertToHexDisplay(after),
			fullContext: convertToHexDisplay(before + searchString + after),
		})

		startIndex = index + 1
	}

	return results
}

// If this script is run directly, execute the search
if (import.meta.url === `file://${process.argv[1]}`) {
	const count = countVst3InPreferences()
	console.log(`Found 'Vst3' ${count} times in Preferences-init.cfg`)
}
