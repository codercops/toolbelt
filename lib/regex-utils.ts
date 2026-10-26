export type CompileResult = { ok: true; regex: RegExp } | { ok: false; error: string };

export interface RegexMatch {
  text: string;
  index: number;
  end: number;
  groups: (string | undefined)[];
  named: Record<string, string | undefined>;
}

export interface FindResult {
  matches: RegexMatch[];
  truncated: boolean;
}

export function compileRegex(pattern: string, flags: string): CompileResult {
  if (!/^[dgimsuvy]*$/.test(flags) || new Set(flags).size !== flags.length) {
    return { ok: false, error: `Invalid flags "${flags}": use each of d, g, i, m, s, u, v, y at most once.` };
  }
  try {
    return { ok: true, regex: new RegExp(pattern, flags) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // V8 prefixes the reason with "Invalid regular expression: /<pattern>/<flags>: ".
    const reason = message.slice(message.lastIndexOf(": ") + 1).trim();
    return { ok: false, error: `Invalid pattern: ${reason}` };
  }
}

export function findMatches(regex: RegExp, text: string, { limit = 1000 } = {}): FindResult {
  const re = new RegExp(regex.source, regex.global ? regex.flags : regex.flags + "g");
  const matches: RegexMatch[] = [];
  let truncated = false;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (matches.length === limit) {
      truncated = true;
      break;
    }
    matches.push({
      text: match[0],
      index: match.index,
      end: match.index + match[0].length,
      groups: match.slice(1),
      named: { ...match.groups },
    });
    if (!regex.global) break;
    // A zero-length match leaves lastIndex where it was, so step past it or the loop never ends.
    if (match[0] === "") re.lastIndex += re.unicode && text.codePointAt(re.lastIndex)! > 0xffff ? 2 : 1;
  }
  return { matches, truncated };
}

export function replacePreview(regex: RegExp, text: string, replacement: string): string {
  return text.replace(new RegExp(regex.source, regex.flags), replacement);
}
