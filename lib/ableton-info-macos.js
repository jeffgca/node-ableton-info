import os from 'node:os'
import fs from 'node:fs'
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

export class PluginInfoMacOS {
	/** macOS can have 64-bit vst plugins, including cusotm paths for them */
	#_vst = []
	#_vst3 = []
	#_au = []

	#_config = {
		default: '/Library/Audio/Plug-Ins/',
		vst2: {
			enabled: false,
			customEnabled: false,
			customPath: null,
		},
		vst3: {
			enabled: false,
			customEnabled: false,
			customPath: null,
		},
		customVst2: null,
		customVst3: null,
		au: {
			enabled: false,
		},
	}

	constructor(config) {
		this.platform = os.platform()
		if (this.platform !== 'darwin') {
			throw new Error('PluginInfoMacOS can only be used on macOS')
		}

		this.#_config = { ...this.#_config, ...config }
		;(async () => {
			this.#_vst = await this.getVst2Plugins()
			this.#_vst3 = await this.getVst3Plugins()
			this.#_au = await this.getAudioUnitPlugins()
		})()
	}

	get map() {
		return {
			vst2: this.#_vst,
			vst3: this.#_vst3,
			au: this.#_au,
		}
	}

	async refresh() {
		this.#_vst = await this.getVst2Plugins(false)
		this.#_vst3 = await this.getVst3Plugins(false)
		this.#_au = await this.getAudioUnitPlugins(false)
	}

	async getVst2Plugins(cache = true) {
		if (cache && this.#_vst.length > 0) {
			return this.#_vst
		}
		return await this.#_getPluginPaths('Vst')
	}

	async getVst3Plugins(cache = true) {
		if (cache && this.#_vst3.length > 0) {
			return this.#_vst3
		}
		return await this.#_getPluginPaths('Vst3')
	}

	async getAudioUnitPlugins(cache = true) {
		if (cache && this.#_au.length > 0) {
			return this.#_au
		}
		return await this.#_getPluginPaths('AudioUnit')
	}

	async #_getPluginPaths(pluginType) {
		let searchPaths = []
		if (pluginType === 'Vst') {
			if (this.#_config.vst2.isEnabled) {
				searchPaths = [this.#_config.default + 'VST/']
			}
			if (
				this.#_config.vst2.isCustomPathEnabled &&
				this.#_config.vst2.customPath
			) {
				searchPaths.push(this.#_config.vst2.customPath)
			}
		} else if (pluginType === 'Vst3') {
			if (this.#_config.vst3.isEnabled) {
				searchPaths = [this.#_config.default + 'VST3/']
			}

			if (
				this.#_config.vst3.isCustomPathEnabled &&
				this.#_config.vst3.customPath
			) {
				searchPaths.push(this.#_config.vst3.customPath)
			}
		} else if (pluginType === 'AudioUnit') {
			searchPaths = [this.#_config.default + 'Components/']
		}

		let pluginFiles = []

		for (const path of searchPaths) {
			try {
				const files = await fs.promises.readdir(path)
				const pluginFilesInPath = files
					.filter((file) =>
						file.endsWith(this.#_getPluginExtension(pluginType)),
					)
					.map((file) => path + file)
				pluginFiles.push(...pluginFilesInPath)
			} catch (err) {
				// Handle error if directory can't be read
				if (err) throw err
			}
		}

		return pluginFiles
	}

	#_getPluginExtension(pluginType) {
		if (pluginType === 'Vst') {
			return '.vst'
		} else if (pluginType === 'Vst3') {
			return '.vst3'
		} else if (pluginType === 'AudioUnit') {
			return '.component'
		}
	}
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
