import os from 'node:os'
import { execFile, exec, execSync } from 'node:child_process'
import fs from 'node:fs/promises'

export function isRunningInWsl() {
	// Check for common WSL environment variables
	// The 'WSL_DISTRO_NAME' variable is generally reliable in newer WSL versions
	if (process.env.WSL_DISTRO_NAME) {
		return true
	}

	// Another check is for the 'WSLENV' variable
	if (process.env.WSLENV) {
		return true
	}

	// A more generic approach is checking the OS type and release file
	// This might require synchronous file reading in a non-blocking context

	if (os.type() === 'Linux') {
		try {
			const versionInfo = fs.readFileSync('/proc/version', 'utf8')
			if (
				versionInfo.toLowerCase().includes('microsoft') ||
				versionInfo.toLowerCase().includes('wsl')
			) {
				return true
			}
		} catch (err) {
			// Handle error if file can't be read
		}
	}

	return false
}

export class AbletonInfoWin64 {
	LIVE_PATHS = {
		Live_Preferences: false, // ????
		Install_Root: 'C:\\ProgramData\\Ableton',
		Executables: {
			'Live 12 Suite':
				'C:\\ProgramData\\Ableton\\Live 12 Suite\\Program\\Ableton Live 12 Suite.exe',
			'Live 12 Standard':
				'C:\\ProgramData\\Ableton\\Live 12 Standard\\Program\\Ableton Live 12 Standard.exe',
			'Live 11 Suite':
				'C:\\ProgramData\\Ableton\\Live 11 Suite\\Program\\Ableton Live 11 Suite.exe',
			'Live 11 Standard':
				'C:\\ProgramData\\Ableton\\Live 11 Standard\\Program\\Ableton Live 11 Standard.exe',
			'Live 10 Suite':
				'C:\\ProgramData\\Ableton\\Live 10 Suite\\Program\\Ableton Live 10 Suite.exe',
			'Live 10 Standard':
				'C:\\ProgramData\\Ableton\\Live 10 Standard\\Program\\Ableton Live 10 Standard.exe',
		},
	}

	constructor(config = {}) {
		// console.log('os', os.platform())
		this.platform = os.platform()
		this.isWsl = isRunningInWsl()
		this.username = os.userInfo().username

		this.LIVE_PATHS.Live_Preferences = `C:\\Users\\${this.username}\\AppData\\Roaming\\Ableton`

		// console.log('wsl?', this.isWsl, 'platform', this.platform)

		if (this.platform !== 'win32' && this.isWsl === false) {
			throw new Error(
				'AbletonInfoWin64 can only be used on Windows operating systems',
			)
		}
	}

	// async get installedVersions() {
	// 	return await this._getAbletonInstallations()
	// }

	async _getAbletonInstallations() {
		let dirs = []
		try {
			await fs.access(this.LIVE_PATHS.Install_Root)
		} catch (Err) {
			return `Install root path not found: ${this.LIVE_PATHS.Install_Root}, is Ableton Live installed?`
		}

		let arr = await fs.readdir(this.LIVE_PATHS.Install_Root)

		let versionMap = arr.map(async (version) => {
			if (this.LIVE_PATHS.Executables[version]) {
				return await this._getAbletonVersionFromExe(
					this.LIVE_PATHS.Executables[version],
				)
			}
		})

		return await versionMap

		// letasync  versionInfo = await this.#_getAbletonVersionFromExe(
		// 	this.LIVE_PATHS.Executables[arr[0]],
		// )

		// console.log('versionInfo', versionInfo)

		// return versionInfo

		// console.log(
		// 	'arr',
		// 	`${this.LIVE_PATHS.Install_Root}\\${arr[0]}`,
		// 	this.LIVE_PATHS.Executables[arr[0]],
		// )
	}

	async _getAbletonVersionFromExe(exePath) {
		console.log('exePath', exePath)
		try {
			const command = `"(Get-Item '${exePath}').VersionInfo.ProductVersion"`
			return await runPowerShellCommand(command)
		} catch (Err) {
			console.error(`Error getting version from ${exePath}:`, Err)
			return null
		}
	}

	getWindowsVersion() {
		// return runPowerShellCommand('(Get-WindowsEdition -Online)')
		let strRelease = os.release()
		let majorVersion = parseInt(strRelease.split('.')[0], 10)
		let buildNumber = parseInt(strRelease.split('.')[2], 10)

		if (buildNumber < 10240) {
			throw new Error(
				`Unsupported Windows version: ${strRelease}. This library only supports Windows 10 and 11.`,
			)
		}

		// Windows 10 has build numbers starting from 10240, while Windows 11 starts from 26000
		let productName = buildNumber >= 26000 ? 'Windows 11' : 'Windows 10'

		return {
			majorVersion,
			buildNumber,
			productName,
		}
	}

	async getLiveVersionFromExe(exePath) {
		return await this._getAbletonVersionFromExe(exePath)
	}
}

export function runPowerShellCommand(command) {
	try {
		let result = execSync(
			`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ${command}`,
			{ windowsHide: true },
		)

		return result.toString().trim()
	} catch (Err) {
		throw Err
	}
}
