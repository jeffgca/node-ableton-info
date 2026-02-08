import os from 'os'
import { execSync } from 'child_process'

const LIVE_APP_BUNDLES = {
	Live_12_Suite: 'Ableton Live 12 Suite.app',
	Live_12_Standard: 'Ableton Live 12 Standard.app',
	Live_12_Lite: 'Ableton Live 12 Lite.app',
	Live_11_Suite: 'Ableton Live 11 Suite.app',
	Live_11_Standard: 'Ableton Live 11 Standard.app',
	Live_11_Lite: 'Ableton Live 11 Lite.app',
	Live_10_Suite: 'Ableton Live 10 Suite.app',
	Live_10_Standard: 'Ableton Live 10 Standard.app',
	Live_10_Lite: 'Ableton Live 10 Lite.app',
}

const LIVE_PREFS_PATHS = {
	Live_Preferences: '~/Library/Preferences/Ableton',
}

export class AbletonInfoMacOS {
	constructor() {
		// console.log('os', os.platform())
		this.platform = os.platform()
		if (this.platform !== 'darwin') {
			throw new Error('AbletonInfoMacOS can only be used on macOS')
		}
	}

	get defaultInstallRoot() {
		return '/Applications/'
	}

	get installedVersions() {
		return this.getInstalledLiveVersions()
	}

	getMacOSVersion() {
		return execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim()
	}

	getInstalledLiveVersions(rootDirectory = null) {
		if (!rootDirectory) {
			rootDirectory = this.defaultInstallRoot
		}

		let bundles = Object.values(LIVE_APP_BUNDLES).filter((appBundleName) => {
			const appPath = `${rootDirectory}${appBundleName}`
			try {
				execSync(`test -d "${appPath}"`)
				return true
			} catch {
				return false
			}
		})

		return bundles.map((appBundleName) => {
			const appPath = `${rootDirectory}${appBundleName}`
			return this.getLiveVersionFromAppBundle(appPath)
		})
	}

	getLiveVersionFromAppBundle(appBundlePath) {
		try {
			const plistPath = `${appBundlePath}/Contents/Info.plist`
			const rawVersion = execSync(
				`plutil -extract CFBundleShortVersionString raw "${plistPath}"`,
				{ encoding: 'utf8' },
			).trim()

			let pieces = rawVersion.split(' (')

			return {
				version: pieces[0].trim(),
				build: pieces[1] ? pieces[1].replace(')', '').trim() : null,
			}
		} catch (error) {
			throw new Error(`Failed to get version from app bundle: ${error.message}`)
		}
	}
}

export default AbletonInfoMacOS
