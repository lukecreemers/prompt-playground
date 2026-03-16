export function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
}

export function segmentText(text: string): Array<{ text: string; isVariable: boolean }> {
  const parts = text.split(/(\{\{\w+\}\})/);
  return parts
    .filter((p) => p !== '')
    .map((p) => ({
      text: p,
      isVariable: /^\{\{\w+\}\}$/.test(p),
    }));
}

export function detectVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const vars = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}
