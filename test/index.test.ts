import { describe, expect, it } from 'vitest'

import { extractSelectorsFromText, isInJavaScriptStringLike, isInStyleBlock } from '../src/selectors'

describe('selectors', () => {
  it('extracts ids (single/double quotes)', () => {
    const text = `
      <div id="app"></div>
      <span id='header'></span>
    `
    expect(extractSelectorsFromText(text).ids).toEqual(['app', 'header'])
  })

  it('extracts classes and dedupes', () => {
    const text = `
      <div class="a b  a  [c]"></div>
      <div className='b c'></div>
      <div custom-class="d e"></div>
    `
    expect(extractSelectorsFromText(text).classes).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('detects style block by cursor offset', () => {
    const text = `
      <template><div class="a"></div></template>
      <style scoped>
      .a {}
      </style>
    `

    const inTemplateOffset = text.indexOf('class="a"') + 2
    expect(isInStyleBlock(text, inTemplateOffset)).toBe(false)

    const inStyleOffset = text.indexOf('.a {}') + 2
    expect(isInStyleBlock(text, inStyleOffset)).toBe(true)
  })

  it('detects JS string/template literal context', () => {
    const text = `
      const x = foo.bar
      const y = ".a"
      const z = \`
        .b {
          color: red;
        }
      \`
    `

    expect(isInJavaScriptStringLike(text, text.indexOf('foo.bar') + 'foo.'.length)).toBe(false)
    expect(isInJavaScriptStringLike(text, text.indexOf('".a"') + 2)).toBe(true)
    expect(isInJavaScriptStringLike(text, text.indexOf('.b {') + 2)).toBe(true)
  })
})
