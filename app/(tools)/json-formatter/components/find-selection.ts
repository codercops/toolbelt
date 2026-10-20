type FindEditor = Pick<HTMLTextAreaElement, "value" | "setSelectionRange" | "scrollTop" | "matches">;

export interface FindMatch {
  start: number;
  end: number;
}

export function selectFindMatch(editor: FindEditor, start: number, end: number) {
  // Updating matches while editing must not move the caret or replace user text.
  if (editor.matches(":focus")) return;
  editor.setSelectionRange(start, end);
  // Keep a few lines of context above the selected match.
  const before = editor.value.slice(0, start).split("\n").length;
  const lineHeight = 21.45;
  editor.scrollTop = Math.max(0, (before - 4) * lineHeight);
}
