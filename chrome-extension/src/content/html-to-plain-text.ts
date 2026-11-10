const BREAK = '\u0000'

export function htmlToPlainText(html: string): string {
  let container = document.createElement('div')
  container.innerHTML = html

  if (container.children.length === 0 && /&lt;|&gt;/.test(html)) {
    const decoded = container.textContent ?? ''
    container = document.createElement('div')
    container.innerHTML = decoded
  }

  container.querySelectorAll('br').forEach((br) => br.replaceWith(BREAK))
  container.querySelectorAll('li').forEach((li) => {
    li.prepend('• ')
    li.append(BREAK)
  })
  container.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6').forEach((el) => {
    el.append(BREAK)
  })

  const raw = container.textContent ?? ''

  return raw
    .split(BREAK)
    .map((segment) => segment.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
