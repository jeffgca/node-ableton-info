import os from 'node:os'
import { execFile, exec, execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import { readFileSync } from 'node:fs'

export function isRunningInWsl() {
	const hasWslEnv =
		process.env.WSL_DISTRO_NAME || process.env.WSLENV ? true : false

	const isWsl = os.type() === 'Linux' && hasWslEnv
	return isWsl
}

export class PluginInfoWin64 {
	/** Windows can have 32-bit and 64-bit VST plugins, including custom paths for them */
	#_vst2 = []
	#_vst3 = []

	#_config = {
		vst2: {
			enabled: false,
			systemPaths: [
				'C:\\Program Files\\VSTPlugins',
				'C:\\Program Files\\Steinberg\\VSTPlugins',
			],
			customEnabled: false,
			customPath: null,
		},
		vst3: {
			enabled: false,
			systemPaths: ['C:\\Program Files\\Common Files\\VST3'],
			customEnabled: false,
			customPath: null,
		},
	}

	constructor(config = {}) {
		this.platform = os.platform()
		this.isWsl = isRunningInWsl()

		if (this.platform !== 'win32' && this.isWsl === false) {
			throw new Error('PluginInfoWin64 can only be used on Windows')
		}

		// Deep merge config
		if (config.vst2) {
			this.#_config.vst2 = { ...this.#_config.vst2, ...config.vst2 }
		}
		if (config.vst3) {
			this.#_config.vst3 = { ...this.#_config.vst3, ...config.vst3 }
		}

		;(async () => {
			this.#_vst2 = await this.getVst2Plugins()
			this.#_vst3 = await this.getVst3Plugins()
		})()
	}

	get map() {
		return {
			vst2: this.#_vst2,
			vst3: this.#_vst3,
		}
	}

	async refresh() {
		this.#_vst2 = await this.getVst2Plugins(false)
		this.#_vst3 = await this.getVst3Plugins(false)
	}

	async getVst2Plugins(cache = true) {
		if (cache && this.#_vst2.length > 0) {
			return this.#_vst2
		}
		return await this.#_getPluginPaths('Vst2')
	}

	async getVst3Plugins(cache = true) {
		if (cache && this.#_vst3.length > 0) {
			return this.#_vst3
		}
		return await this.#_getPluginPaths('Vst3')
	}

	async #_getPluginPaths(pluginType) {
		let searchPaths = []

		if (pluginType === 'Vst2') {
			if (this.#_config.vst2.enabled) {
				searchPaths.push(...this.#_config.vst2.systemPaths)
			}
			if (this.#_config.vst2.customEnabled && this.#_config.vst2.customPath) {
				searchPaths.push(this.#_config.vst2.customPath)
			}
		} else if (pluginType === 'Vst3') {
			if (this.#_config.vst3.enabled) {
				searchPaths.push(...this.#_config.vst3.systemPaths)
			}
			if (this.#_config.vst3.customEnabled && this.#_config.vst3.customPath) {
				searchPaths.push(this.#_config.vst3.customPath)
			}
		}

		let pluginFiles = []

		for (const path of searchPaths) {
			try {
				const files = await fs.readdir(path)
				const pluginFilesInPath = files
					.filter((file) =>
						file.endsWith(this.#_getPluginExtension(pluginType)),
					)
					.map((file) => {
						const separator = path.endsWith('\\') ? '' : '\\'
						return path + separator + file
					})
				pluginFiles.push(...pluginFilesInPath)
			} catch (err) {
				// Handle error if directory can't be read (e.g., doesn't exist)
				// Silently continue to the next path
			}
		}

		return pluginFiles
	}

	#_getPluginExtension(pluginType) {
		if (pluginType === 'Vst2') {
			return '.dll'
		} else if (pluginType === 'Vst3') {
			return '.vst3'
		}
	}
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

	getWindowsVersion() {
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
		try {
			const command = `"(Get-Item '${exePath}').VersionInfo.ProductVersion"`
			return await runPowerShellCommand(command)
		} catch (Err) {
			console.error(`Error getting version from ${exePath}:`, Err)
			return null
		}
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
