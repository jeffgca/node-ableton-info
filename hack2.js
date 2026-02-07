import fs from 'node:fs/promises'
import _ from 'lodash-es'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// hacky
import * as pkg from './lib/hacklib.js'
Object.assign(globalThis, pkg)

const argv = yargs(hideBin(process.argv)).option('file', {
	alias: 'f',
	describe: 'Path to the file to read',
	type: 'string',
	demandOption: true,
}).argv

async function main() {
	try {
		const fileContent = await fs.readFile(argv.file, 'utf8')

		console.log('Vst3?', await isVst3Enabled(argv.file))

		console.log(
			'Custom vst3?',
			await isCustomVst3PathEnabled(fileContent, argv.file),
		)

		// console.log(bytesToAsciiOrNumber(bytes.slice(result, bytes.length)))

		// _.each(result, (index) => {
		// 	console.log('Context at index ', index)
		// 	let _slice = bytes.slice(index, index + 200)
		// 	console.log(bytesToAsciiOrNumber(_slice))

		// 	console.log('---\n')
		// 	// console.log(extractNullTerminatedString(_slice))
		// })

		// console.log()

		// console.log(fileContent)
		// processFile(fileContent)
	} catch (error) {
		console.error(`Error reading file: ${error.message}`)
		process.exit(1)
	}
}

main()
