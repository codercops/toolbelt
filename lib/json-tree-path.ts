export type JsonPathSegment =
  | { type: "property"; key: string }
  | { type: "index"; index: number };

const SIMPLE_PROPERTY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Build a JSONPath location, keeping object keys distinct from array indexes. */
export function buildJsonTreePath(segments: JsonPathSegment[]): string {
  return segments.reduce((path, segment) => {
    if (segment.type === "index") {
      return `${path}[${segment.index}]`;
    }

    if (SIMPLE_PROPERTY.test(segment.key)) {
      return `${path}.${segment.key}`;
    }

    return `${path}[${JSON.stringify(segment.key)}]`;
  }, "$");
}
