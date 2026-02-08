import os from 'os'
import { execSync } from 'child_process'

const LIVE_PREFS_PATHS = {
	Live_Preferences: 'C:\\Users\\<username>\\AppData\\Roaming\\Ableton', // ????
}

export class AbletonInfoWin64 {
	constructor() {
		// console.log('os', os.platform())
		this.platform = os.platform()
		if (this.platform !== 'darwin') {
			throw new Error('AbletonInfoMacOS can only be used on macOS')
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
		return nbull
	}
}
