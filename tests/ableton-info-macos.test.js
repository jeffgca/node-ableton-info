import { expect, test, vi } from 'vitest'
import { execSync } from 'child_process'

vi.mock('child_process', async () => {
	const actual = await vi.importActual('child_process')
	return {
		...actual,
		execSync: vi.fn(actual.execSync),
	}
})

import AbletonInfoMacOS from '../lib/ableton-info-macos.js'

test('AbletonInfoMacOS constructor sets platform to darwin', () => {
	const instance = new AbletonInfoMacOS()
	expect(instance.platform).toBe('darwin')
})

test('defaultInstallRoot returns /Applications/', () => {
	const instance = new AbletonInfoMacOS()
	expect(instance.defaultInstallRoot).toBe('/Applications/')
})

test('getMacOSVersion returns a version string', () => {
	const instance = new AbletonInfoMacOS()
	const version = instance.getMacOSVersion()

	// Should return a string
	expect(typeof version).toBe('string')

	// Should match version format (e.g., "14.2.1" or "13.0")
	expect(version).toMatch(/^\d+\.\d+(\.\d+)?$/)

	// Should not be empty
	expect(version.length).toBeGreaterThan(0)
})

test('getMacOSVersion handles execution correctly', async () => {
	// get current OS version
	const currentVersion = execSync('sw_vers -productVersion', {
		encoding: 'utf8',
	}).trim()

	const instance = new AbletonInfoMacOS()

	const version = instance.getMacOSVersion()

	expect(version).toBe(currentVersion)
})

test('getExactVersionFromAppBundle returns version from Info.plist', async () => {
	const instance = new AbletonInfoMacOS()

	vi.mocked(execSync).mockReturnValueOnce('12.1.5\n')

	const version = instance.getLiveVersionFromAppBundle(
		'/Applications/Ableton Live 12 Suite.app',
	)

	expect(execSync).toHaveBeenCalledWith(
		'plutil -extract CFBundleShortVersionString raw "/Applications/Ableton Live 12 Suite.app/Contents/Info.plist"',
		{ encoding: 'utf8' },
	)
	expect(version).toBe('12.1.5')

	vi.clearAllMocks()
})

test('getExactVersionFromAppBundle throws error on failure', async () => {
	const instance = new AbletonInfoMacOS()

	vi.mocked(execSync).mockImplementationOnce(() => {
		throw new Error('Command failed')
	})

	expect(() => {
		instance.getLiveVersionFromAppBundle('/Applications/NonExistent.app')
	}).toThrow('Failed to get version from app bundle')

	vi.clearAllMocks()
})
