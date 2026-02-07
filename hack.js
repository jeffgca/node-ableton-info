import fs from 'fs'
import { searchWithContext } from './lib/cfg-parser.js'
import _ from 'lodash-es'

const compareObj = {}

const filePath = './tests/testdata/Preferences-11-0-12-init.cfg'

console.log('filePath', filePath)
// const filePath = './tests/testdata/live-11/Preferences-custom-vst2-sys-vst3.cfg'
const fileContents = fs.readFileSync(filePath, 'latin1')
const results = searchWithContext(fileContents, 'RemoteableBool', 90)

_.each(results, (result, i) => {
	// console.log('match: ', result.match + '\n')
	// console.log('after: ', result.afterContext.printable + '\n')
	if (result.beforeContext.printable.includes('VstManager')) {
		console.log('before: ', result.beforeContext.printable + '\n')
		compareObj.default = _.flatten([
			result.beforeContext.chars,
			result.afterContext.chars,
		])
		// console.log('before: ', result.beforeContext.printable + '\n')
		// console.log('match: ', result.match + '\n')
		// console.log('before chars', result.beforeContext.chars + '\n')
		console.log('default after chars ', result.afterContext.chars + '\n')
	}
})

// const filePath = './tests/testdata/live-11/Preferences-init.cfg'
const filePath2 = './tests/testdata/Preferences-11-0-12-custom.cfg'
const fileContents2 = fs.readFileSync(filePath2, 'latin1')

// console.log('filecontests2', fileContents2)

const results2 = searchWithContext(fileContents2, 'RemoteableBool', 90)

console.log('filePath2', filePath2)

_.each(results2, (result, i) => {
	// console.log('before: ', result.beforeContext.printable + '\n')
	// console.log('match: ', result.match + '\n')
	// console.log('after: ', result.afterContext.printable + '\n')
	if (result.beforeContext.printable.includes('VstManager')) {
		console.log('before: ', result.beforeContext.printable + '\n')
		compareObj.edited = _.flatten([
			result.beforeContext.chars,
			result.afterContext.chars,
		])
		// console.log('before: ', result.beforeContext.printable + '\n')
		// console.log('match: ', result.match + '\n')
		// console.log('before chars', result.beforeContext.chars + '\n')
		console.log('modified after chars ', result.afterContext.chars + '\n')
	}
})

function extractNullSeparatedStrings(str) {
	// Match sequences of letters separated by \x00
	// Pattern: letter, then (null byte + letter) repeated 1+ times
	const regex = /[a-zA-Z\/\ \-](?:\x00[a-zA-Z\/\ \-])+/g

	const matches = str.match(regex) || []

	// Remove the null bytes from each match
	return matches.map((match) => match.replace(/\x00/g, ''))
}

// Example usage:
// const testStr = 'N\x00o\x00L\x00a\x00b\x00e\x00l\x00s some text H\x00e\x00l\x00l\x00o';
// const results = extractNullSeparatedStrings(testStr);
// console.log(results); // ['NoLabels', 'Hello']

// console.log('compareObj', compareObj)

// console.log('bytes diff', _.difference(compareObj.default, compareObj.edited))

// console.log('before diff', _.difference(compareObj.default, compareObj.edited))

let one = extractNullSeparatedStrings(fileContents)

let two = extractNullSeparatedStrings(fileContents2)

fs.writeFileSync(
	'./output/hack-output-1.json',
	JSON.stringify({ one, two }, null, '  '),
)
