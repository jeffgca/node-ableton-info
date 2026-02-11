import os from 'os'
import { execFile, exec, execSync } from 'node:child_process'
import fs from 'node:fs/promises'

export class AbletonInfoWin64 {
	LIVE_PATHS = {
		Live_Preferences: 'C:\\Users\\<username>\\AppData\\Roaming\\Ableton', // ????
		Install_Root: 'C:\\ProgramData\\Ableton\\',
	}

	constructor() {
		// console.log('os', os.platform())
		this.platform = os.platform()
		if (this.platform !== 'win32') {
			throw new Error(
				'AbletonInfoWin64 can only be used on Windows operating systems',
			)
		}
	}

	get installedVersions() {
		return this.#_getAbletonInstallations()
	}

	#_getAbletonInstallations() {
		let dirs = []
		if (fs.existsSync(LIVE_PATHS.Install_Root)) {
			return fs
				.readdirSync(LIVE_PATHS.Install_Root)
				.filter((dir) => dir.toLowerCase().startsWith('live'))
		} else {
			return `Install root path not found: ${LIVE_PATHS.Install_Root}, is Ableton Live installed?`
		}
	}

	#_getAbletonVersionFromExe(exePath) {
		try {
			const command = `"(Get-Item '${exePath}').VersionInfo.ProductVersion"`
			return runPowerShellCommand(command)
		} catch (Err) {
			console.error(`Error getting version from ${exePath}:`, Err)
			return null
		}
	}

	getWindowsVersion() {
		return runPowerShellCommand('(Get-WindowsEdition -Online)')
	}

	getLiveVersionFromExe(exePath) {
		return this.#_getAbletonVersionFromExe(exePath)
	}
}

function runPowerShellCommand(command) {
	try {
		execFile(
			'powershell.exe',
			[
				'-NoProfile',
				'-NonInteractive',
				'-ExecutionPolicy',
				'Bypass',
				'-Command',
				// 'Get-Date; $PSVersionTable.PSVersion',
				command,
			],
			{ windowsHide: true },
			(err, stdout, stderr) => {
				if (err) {
					throw `Error executing PowerShell command: ${err}\nstderr: ${stderr}`
				}
				return stdout.trim()
			},
		)
	} catch (Err) {}
}
