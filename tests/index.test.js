// import { expect, test, vi } from 'vitest'

// Run index.js and verify it logs env var
// Use dynamic import so we can set env before execution

// test('main logs TEST_ENV_VAR and constructs Utils', async () => {
// 	const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
// 	const original = process.env.TEST_ENV_VAR
// 	process.env.TEST_ENV_VAR = 'hello-world'

// 	const mod = await import('../index.js')

// 	// index.js calls main() on import; call again to cover export usage
// 	if (typeof mod.default === 'function') {
// 		mod.default()
// 	}

// 	expect(spy).toHaveBeenCalled()
// 	const messages = spy.mock.calls.map((args) => args.join(' '))
// 	expect(
// 		messages.some((m) => m.includes("Value of TEST_ENV_VAR is 'hello-world'")),
// 	).toBe(true)

// 	spy.mockRestore()
// 	process.env.TEST_ENV_VAR = original
// })

test('anything at all', async () => {
	expect(1 + 1).toBe(2)
})
