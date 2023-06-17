import type * as vscode from 'vscode'
import { createCompletionItem, getSelection, registerCompletionItemProvider } from '@vscode-use/utils'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(registerCompletionItemProvider(['vue', 'css', 'react', 'javasscriptreact', 'typescriptreact', 'html', 'svelte', 'solid'], (document) => {
    const { lineText, character } = getSelection()!
    const preInput = lineText[character - 1]
    const text = document.getText()
    const results = []
    if (preInput === '#') {
      for (const match of text.matchAll(/\sid="([^"]+)"/g)) {
        if (!match)
          continue
        const id = match[1]
        results.push(createCompletionItem(id, 4))
      }
    }
    else {
      for (const match of text.matchAll(/\sclass(?:Name)?="([^"]+)"/g)) {
        if (!match)
          continue
        const classNames = match[1]
          .replace(/\s+/g, ' ')
          .split(' ')
          .filter(name => !name.includes('['))
        // 过滤掉一些unocss或tailwind的class
        results.push(...classNames.map(className => createCompletionItem(className, 4)))
      }
    }
    return results
  }, ['#', '.']))
}

export function deactivate() {

}
