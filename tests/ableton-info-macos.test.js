import { expect, test, vi, describe } from 'vitest'
import { execSync } from 'child_process'
import os, { platform } from 'os'

vi.mock('child_process', async () => {
	const actual = await vi.importActual('child_process')
	return {
		...actual,
		execSync: vi.fn(actual.execSync),
	}
})

import AbletonInfoMacOS from '../lib/ableton-info-macos.js'

test('AbletonInfoMacOS constructor throws on non-macOS platform', () => {
	const platformSpy = vi.spyOn(os, 'platform').mockReturnValue('win32')

	expect(() => new AbletonInfoMacOS()).toThrow(
		'AbletonInfoMacOS can only be used on macOS',
	)

	platformSpy.mockRestore()
})

describe.skipIf(platform() !== 'darwin')('AbletonInfoMacOS', () => {
	test('AbletonInfoMacOS constructor sets platform to darwin', () => {
		const instance = new AbletonInfoMacOS()
		expect(instance.platform).toBe('darwin')
	})

	test('defaultInstallRoot returns /Applications/', () => {
		const instance = new AbletonInfoMacOS()
		expect(instance.defaultInstallRoot).toBe('/Applications/')
	})

	test('installedVersions getter returns getInstalledLiveVersions result', () => {
		const instance = new AbletonInfoMacOS()
		const expectedVersions = [{ version: '12.1.0', build: '1234' }]
		const getInstalledLiveVersionsSpy = vi
			.spyOn(instance, 'getInstalledLiveVersions')
			.mockReturnValue(expectedVersions)

		expect(instance.installedVersions).toEqual(expectedVersions)
		expect(getInstalledLiveVersionsSpy).toHaveBeenCalledTimes(1)

		getInstalledLiveVersionsSpy.mockRestore()
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

	test('getInstalledLiveVersions returns versions for installed bundles only', () => {
		const instance = new AbletonInfoMacOS()
		const rootDirectory = '/Applications/'
		const existingBundles = new Set([
			`${rootDirectory}Ableton Live 12 Suite.app`,
			`${rootDirectory}Ableton Live 11 Standard.app`,
		])

		vi.mocked(execSync).mockImplementation((command) => {
			const appPath = command.match(/test -d "(.*)"/)?.[1]
			if (appPath && existingBundles.has(appPath)) {
				return ''
			}
			throw new Error('not found')
		})

		const getLiveVersionFromAppBundleSpy = vi
			.spyOn(instance, 'getLiveVersionFromAppBundle')
			.mockImplementation((appBundlePath) => ({
				version: appBundlePath.includes('12 Suite') ? '12.1.0' : '11.3.35',
				build: null,
			}))

		const result = instance.getInstalledLiveVersions(rootDirectory)

		expect(result).toEqual([
			{ version: '12.1.0', build: null },
			{ version: '11.3.35', build: null },
		])
		expect(getLiveVersionFromAppBundleSpy).toHaveBeenCalledTimes(2)
		expect(getLiveVersionFromAppBundleSpy).toHaveBeenNthCalledWith(
			1,
			'/Applications/Ableton Live 12 Suite.app',
		)
		expect(getLiveVersionFromAppBundleSpy).toHaveBeenNthCalledWith(
			2,
			'/Applications/Ableton Live 11 Standard.app',
		)

		vi.clearAllMocks()
	})

	test('getInstalledLiveVersions uses defaultInstallRoot when rootDirectory is not provided', () => {
		const instance = new AbletonInfoMacOS()
		const defaultRoot = '/CustomApplications/'
		const existingBundlePath = `${defaultRoot}Ableton Live 12 Suite.app`

		const defaultInstallRootSpy = vi
			.spyOn(instance, 'defaultInstallRoot', 'get')
			.mockReturnValue(defaultRoot)

		vi.mocked(execSync).mockImplementation((command) => {
			const appPath = command.match(/test -d "(.*)"/)?.[1]
			if (appPath === existingBundlePath) {
				return ''
			}
			throw new Error('not found')
		})

		const getLiveVersionFromAppBundleSpy = vi
			.spyOn(instance, 'getLiveVersionFromAppBundle')
			.mockReturnValue({ version: '12.1.0', build: null })

		const result = instance.getInstalledLiveVersions()

		expect(result).toEqual([{ version: '12.1.0', build: null }])
		expect(defaultInstallRootSpy).toHaveBeenCalledTimes(1)
		expect(getLiveVersionFromAppBundleSpy).toHaveBeenCalledTimes(1)
		expect(getLiveVersionFromAppBundleSpy).toHaveBeenCalledWith(
			'/CustomApplications/Ableton Live 12 Suite.app',
		)

		vi.clearAllMocks()
	})

	test('getExactVersionFromAppBundle returns version from Info.plist', async () => {
		const instance = new AbletonInfoMacOS()

		vi.mocked(execSync).mockReturnValueOnce(
			{ version: '12.1.5', build: '2025-12-15_bba1e05a87' }.version,
		)

		const result = instance.getLiveVersionFromAppBundle(
			'/Applications/Ableton Live 12 Suite.app',
		)

		expect(execSync).toHaveBeenCalledWith(
			'plutil -extract CFBundleShortVersionString raw "/Applications/Ableton Live 12 Suite.app/Contents/Info.plist"',
			{ encoding: 'utf8' },
		)
		expect(result.version).toBe('12.1.5')

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
})
