import { expect, test, vi, describe } from 'vitest'
import { execSync } from 'child_process'
import { platform } from 'os'

vi.mock('child_process', async () => {
	const actual = await vi.importActual('child_process')
	return {
		...actual,
		execSync: vi.fn(actual.execSync),
	}
})

import { AbletonInfoWin64 } from '../lib/ableton-info-win64.js'

describe.skipIf(platform() !== 'win32')('AbletonInfoMacOS', () => {
	test('AbletonInfoMacOS constructor sets platform to darwin', () => {
		const instance = new AbletonInfoWin64()
		expect(instance.platform).toBe('win32')
	})
})
