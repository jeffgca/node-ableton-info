import os from 'os'
import { execSync } from 'child_process'

const LIVE_PREFS_PATHS = {
	Live_Preferences: 'C:\\Users\\<username>\\AppData\\Roaming\\Ableton', // ????
}

export class AbletonInfoWin64 {
	constructor() {
		// console.log('os', os.platform())
		this.platform = os.platform()
		if (this.platform !== 'win32') {
			throw new Error(
				'AbletonInfoWin64 can only be used on Windows operating systems',
			)
		}
	}

	get defaultInstallRoot() {
		// return '/Applications/'
		return 'c:\\Program\ Files\\Ableton\\'
	}

	get installedVersions() {
		return []
	}

	getOSVersion() {
		// return execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim()
		return null
	}
}
