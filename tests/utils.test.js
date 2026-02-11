import { Utils } from '../lib/utils.js'
import { AbletonInfoWin64, isRunningInWsl } from '../lib/ableton-info-win64.js'
import os from 'node:os'

test('the utils library', async () => {
	let instance = await new Utils({
		foo: 'bar',
		bar: 'baz',
		baz: 'qux',
	})
	expect(instance.options.foo).toBe('bar')
})

test('the runner platform', async () => {
	expect(os.platform()).toBe('win32')
	expect(os.platform()).toBe('linux')
})
