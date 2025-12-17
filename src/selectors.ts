export interface ExtractedSelectors {
  ids: string[]
  classes: string[]
}

const ID_ATTR_RE = /\bid\s*=\s*(?:"([^"]+)"|'([^']+)')/g
const CLASS_ATTR_RE = /\b(?:custom-)?class(?:Name)?\s*=\s*(?:"([^"]+)"|'([^']+)')/g

export function extractSelectorsFromText(text: string): ExtractedSelectors {
  const ids = new Set<string>()
  const classes = new Set<string>()

  for (const match of text.matchAll(ID_ATTR_RE)) {
    const value = match[1] ?? match[2]
    if (value)
      ids.add(value)
  }

  for (const match of text.matchAll(CLASS_ATTR_RE)) {
    const raw = match[1] ?? match[2]
    if (!raw)
      continue

    const tokens = raw
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(t => t.trim())
      .filter(t => t && !t.includes('['))

    for (const token of tokens)
      classes.add(token)
  }

  return {
    ids: [...ids].sort(),
    classes: [...classes].sort(),
  }
}

export function isInStyleBlock(text: string, offset: number): boolean {
  const before = text.slice(0, offset).toLowerCase()
  const lastStyleOpen = before.lastIndexOf('<style')
  if (lastStyleOpen === -1)
    return false

  const lastStyleClose = before.lastIndexOf('</style>')
  if (lastStyleClose > lastStyleOpen)
    return false

  const openTagEnd = before.indexOf('>', lastStyleOpen)
  if (openTagEnd === -1)
    return false

  return true
}

export function isInJavaScriptStringLike(text: string, offset: number): boolean {
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  let inLineComment = false
  let inBlockComment = false
  let escaped = false
  let templateExprDepth = 0

  for (let i = 0; i < offset; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inLineComment) {
      if (ch === '\n')
        inLineComment = false
      continue
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }

    if (inSingle) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === '\'')
        inSingle = false
      continue
    }

    if (inDouble) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === '"')
        inDouble = false
      continue
    }

    if (inTemplate) {
      if (templateExprDepth === 0) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '`') {
          inTemplate = false
          continue
        }
        if (ch === '$' && next === '{') {
          templateExprDepth = 1
          i++
          continue
        }
        continue
      }
      else {
        if (ch === '/' && next === '/') {
          inLineComment = true
          i++
          continue
        }
        if (ch === '/' && next === '*') {
          inBlockComment = true
          i++
          continue
        }
        if (ch === '\'') {
          inSingle = true
          continue
        }
        if (ch === '"') {
          inDouble = true
          continue
        }
        if (ch === '{') {
          templateExprDepth++
          continue
        }
        if (ch === '}') {
          templateExprDepth--
          continue
        }
        continue
      }
    }

    if (ch === '/' && next === '/') {
      inLineComment = true
      i++
      continue
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true
      i++
      continue
    }

    if (ch === '\'') {
      inSingle = true
      continue
    }

    if (ch === '"') {
      inDouble = true
      continue
    }

    if (ch === '`') {
      inTemplate = true
      escaped = false
      templateExprDepth = 0
      continue
    }
  }

  return inSingle || inDouble || (inTemplate && templateExprDepth === 0)
}
