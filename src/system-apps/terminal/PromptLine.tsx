import type { RefObject } from 'react'
import { cn } from '@/lib/cn'
import { Prompt } from './Prompt'
import type { Identity } from './types'
import type { useLineEditor } from './useLineEditor'

type Editor = ReturnType<typeof useLineEditor>

/**
 * The live prompt. What you see is drawn with spans (so the block cursor can
 * sit on a character); a transparent input on top does the actual typing,
 * which also brings up the keyboard on phones.
 */
export function PromptLine({
  identity,
  cwd,
  editor,
  inputRef,
  hidden,
  focused,
  onFocusChange,
}: {
  identity: Identity
  cwd: string
  editor: Editor
  inputRef: RefObject<HTMLInputElement | null>
  /** While a command runs the prompt disappears, but the input keeps focus for Ctrl+C. */
  hidden: boolean
  focused: boolean
  onFocusChange: (focused: boolean) => void
}) {
  const { value, caret } = editor
  const at = value[caret] ?? ' '

  return (
    <div className={cn('flex min-h-[1.5em]', hidden && 'pointer-events-none h-0 min-h-0 overflow-hidden opacity-0')}>
      <span className="shrink-0 whitespace-pre">
        <Prompt user={identity.user} host={identity.host} cwd={cwd} home={identity.home} />
      </span>
      <div className="relative min-w-0 flex-1">
        <div className="break-all whitespace-pre-wrap" aria-hidden>
          {value.slice(0, caret)}
          <span
            key={`${value}:${caret}`}
            className={cn(
              'rounded-[2px]',
              focused ? 'term-cursor bg-[#e8e6f0] text-[#14121c]' : 'shadow-[inset_0_0_0_1px_rgb(232_230_240/0.6)]',
            )}
          >
            {at}
          </span>
          {value.slice(caret + 1)}
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={editor.onChange}
          onKeyDown={editor.onKeyDown}
          onSelect={editor.onSelect}
          onPaste={(e) => void editor.onPaste(e)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          aria-label="Terminal input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="send"
          className="absolute inset-0 h-full w-full bg-transparent p-0 font-mono text-transparent caret-transparent outline-none selection:bg-transparent max-sm:text-base sm:text-[length:inherit]"
        />
      </div>
    </div>
  )
}
