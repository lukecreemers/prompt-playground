import { diffLines, type Change } from 'diff';

export interface DiffLine {
  text: string;
  type: 'unchanged' | 'added' | 'removed';
  lineNumber: number;
}

export function computeDiff(oldCode: string, newCode: string): DiffLine[] {
  const changes: Change[] = diffLines(oldCode, newCode);
  const lines: DiffLine[] = [];
  let lineNumber = 1;

  for (const change of changes) {
    const changeLines = change.value.replace(/\n$/, '').split('\n');
    for (const line of changeLines) {
      if (change.added) {
        lines.push({ text: line, type: 'added', lineNumber: lineNumber++ });
      } else if (change.removed) {
        lines.push({ text: line, type: 'removed', lineNumber: lineNumber++ });
      } else {
        lines.push({ text: line, type: 'unchanged', lineNumber: lineNumber++ });
      }
    }
  }

  return lines;
}

export function buildMergedView(diffLines: DiffLine[]): string {
  return diffLines.map((l) => l.text).join('\n');
}

export function getDecorations(diffLines: DiffLine[]) {
  const added: number[] = [];
  const removed: number[] = [];

  for (let i = 0; i < diffLines.length; i++) {
    const lineNum = i + 1;
    if (diffLines[i].type === 'added') {
      added.push(lineNum);
    } else if (diffLines[i].type === 'removed') {
      removed.push(lineNum);
    }
  }

  return { added, removed };
}
