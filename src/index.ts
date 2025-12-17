import { createCompletionItem, createExtension, getSelection, registerCompletionItemProvider } from '@vscode-use/utils'

import { extractSelectorsFromText, isInJavaScriptStringLike, isInStyleBlock } from './selectors'

const COMPLETION_KIND = 4
const SUPPORTED_LANGUAGE_IDS = [
  'vue',
  'svelte',
  'html',
  'css',
  'scss',
  'less',
  'postcss',
  'javascriptreact',
  'typescriptreact',
]

interface CachedSelectors {
  version: number
  ids: string[]
  classes: string[]
}

const selectorCache = new Map<string, CachedSelectors>()

export = createExtension(() => [
  registerCompletionItemProvider(SUPPORTED_LANGUAGE_IDS, (document) => {
    const selectionInfo = getSelection()
    if (!selectionInfo)
      return []

    const { lineText, character, selection } = selectionInfo
    const triggerCharacter = lineText[character - 1]
    if (triggerCharacter !== '#' && triggerCharacter !== '.')
      return []

    const languageId = document.languageId
    const needsStyleGuard = languageId === 'vue' || languageId === 'svelte' || languageId === 'html'
    const needsStringGuard = languageId === 'javascriptreact' || languageId === 'typescriptreact'
    const text = needsStyleGuard || needsStringGuard ? document.getText() : undefined
    if (needsStyleGuard) {
      const offset = document.offsetAt(selection.active)
      if (!isInStyleBlock(text!, offset))
        return []
    }
    if (needsStringGuard) {
      const offset = document.offsetAt(selection.active)
      if (!isInJavaScriptStringLike(text!, offset))
        return []
    }

    const cacheKey = document.uri.toString()
    const cached = selectorCache.get(cacheKey)
    if (!cached || cached.version !== document.version) {
      const computed = extractSelectorsFromText(text ?? document.getText())
      if (selectorCache.size > 50)
        selectorCache.clear()
      selectorCache.set(cacheKey, { version: document.version, ...computed })
    }

    const { ids, classes } = selectorCache.get(cacheKey)!
    const list = triggerCharacter === '#' ? ids : classes
    return list.map(content => createCompletionItem({ content, type: COMPLETION_KIND }))
  }, ['#', '.']),
])
