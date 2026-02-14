import {
	AbletonInfoWin64,
	isRunningInWsl,
	runPowerShellCommand,
	PluginInfoWin64,
} from '../lib/ableton-info-win64.js'
import path from 'node:path'

import { AbletonPrefs } from '../lib/ableton-prefs.js'

import fs from 'node:fs/promises'

import * as fsSync from 'node:fs'

// console.log('env', process.env.WSL_DISTRO_NAME)

// console.log(
// 	'XXX debug',
// 	`type: ${os.type()}`,
// 	`release: ${os.release()}`,
// 	`WSL_DISTRO_NAME: ${process.env.WSL_DISTRO_NAME}`,
// 	`WSLENV: ${process.env.WSLENV}`,
// )

console.log('Wsl?', isRunningInWsl())

// let info = new AbletonInfoWin64()

import os from 'node:os'

const username = os.userInfo().username
console.log(username)

// console.log(
// 	'info',
// 	info.LIVE_PATHS.Install_Root,
// 	fsSync.existsSync(info.LIVE_PATHS.Install_Root),
// )

// console.log('info', info.LIVE_PATHS)
// // console.log('exists?', await fs.access(info.LIVE_PATHS.Install_Root))
// console.log('windows version', info.getWindowsVersion())

// console.log(
// 	'Installed Ableton Live versions:',
// 	await info._getAbletonInstallations(),
// )

// const exePath = `C:\\ProgramData\\Ableton\\Live\ 11\ Suite\\Program\\Ableton\ Live\ 11\ Suite.exe`

// console.log('Live exe exists?', fsSync.existsSync(exePath))

// const command = `"(Get-Item '${exePath}').VersionInfo.ProductVersion"`

// // console.log('command', command)

// console.log('Live version', runPowerShellCommand(command))

let prefsfiles = [
	'./tests/testdata/win64/Preferences-init-x64.cfg',
	'./tests/testdata/live-11/Preferences-all-prefs-set.cfg',
	'./tests/testdata/live-11/Preferences-vst3-init.cfg',
	'./tests/testdata/win64/Preferences-all-x64.cfg',
]

Promise.all(
	prefsfiles.map(async (file) => {
		// console.log('file', file)
		let _prefs = await new AbletonPrefs(file)
		let config = _prefs.PluginConfig
		console.log('Plugin config', path.basename(file), _prefs.PluginConfig)
	}),
)

// console.log('Plugin config', prefs.PluginConfig)

// console.log(
// 	'Installed Ableton Live versions:',
// 	await info._getAbletonInstallations(),
// )
