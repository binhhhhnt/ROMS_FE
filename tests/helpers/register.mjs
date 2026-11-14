import { registerHooks } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const sourceRoot = new URL('../../src/', import.meta.url)
const httpMock = new URL('./httpMock.mjs', import.meta.url).href
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/shared/lib/axios') return { url: httpMock, shortCircuit: true }
    if (specifier.startsWith('@/')) {
      const url = new URL(specifier.slice(2), sourceRoot)
      if (!url.pathname.endsWith('.ts')) url.pathname += '.ts'
      return { url: url.href, shortCircuit: true }
    }
    if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts')) {
      const url = new URL(specifier, context.parentURL)
      if (existsSync(fileURLToPath(url) + '.ts')) return { url: pathToFileURL(fileURLToPath(url) + '.ts').href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot.href) && url.endsWith('.ts')) {
      const source = readFileSync(new URL(url), 'utf8').replaceAll('import.meta.env.DEV', 'false')
      return { format: 'module', source: ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText, shortCircuit: true }
    }
    return nextLoad(url, context)
  },
})
const memory = new Map()
globalThis.sessionStorage ??= { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key), clear: () => memory.clear() }
