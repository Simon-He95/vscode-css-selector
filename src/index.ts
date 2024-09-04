import { createCompletionItem, createExtension, getSelection, registerCompletionItemProvider } from '@vscode-use/utils'

export = createExtension(() => [
  registerCompletionItemProvider(['vue', 'css', 'react', 'javasscriptreact', 'typescriptreact', 'typescript', 'html', 'svelte', 'solid', 'plaintext'], (document) => {
    const { lineText, character } = getSelection()!
    const preInput = lineText[character - 1]
    const text = document.getText()
    const results = []

    if (preInput === '#') {
      for (const match of text.matchAll(/\s+id="([^"]+)"/g)) {
        if (!match)
          continue
        const content = match[1]
        results.push(createCompletionItem({
          content,
          type: 4,
        }))
      }
    }
    else {
      for (const match of text.matchAll(/\s+(?:custom-)?class(?:Name)?="([^"]+)"/g)) {
        if (!match)
          continue
        const classNames = match[1]
          .replace(/\s+/g, ' ')
          .split(' ')
          .filter(name => !name.includes('['))
        // 过滤掉一些unocss或tailwind的class
        results.push(...classNames.map(content => createCompletionItem({
          content,
          type: 4,
        })))
      }
    }
    return results
  }, ['#', '.']),
])
