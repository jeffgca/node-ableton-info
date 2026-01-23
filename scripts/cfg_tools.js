import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Removes non-ASCII characters from Preferences.cfg and saves as Preferences.txt
 */
function cleanPreferencesFile() {
	const inputPath = path.join(__dirname, '../tests/testdata/Preferences.cfg')
	const outputPath = path.join(__dirname, '../tests/testdata/Preferences.txt')

	// Read the input file
	const content = fs.readFileSync(inputPath, 'utf8')

	// Keep only printable ASCII characters (space to ~) plus newlines and tabs
	// This removes control characters, null bytes, and non-ASCII characters
	const cleanedContent = content.replace(/[^ -~\n\r\t]/g, '')

	// Write to output file
	fs.writeFileSync(outputPath, cleanedContent, 'utf8')

	console.log(`Cleaned preferences saved to: ${outputPath}`)
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	cleanPreferencesFile()
}

export { cleanPreferencesFile }
