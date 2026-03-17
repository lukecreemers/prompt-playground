import { Injectable } from '@nestjs/common';

@Injectable()
export class CodeExecutionService {
  async execute(
    code: string,
    inputs: Record<string, string>,
    expectedOutputs: string[],
  ): Promise<Record<string, string>> {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction('inputs', code);

    const result = await Promise.race([
      fn(inputs),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: execution exceeded 30s')), 30000),
      ),
    ]);

    if (result === null || result === undefined || typeof result !== 'object') {
      throw new Error('Code must return an object with the defined output keys');
    }

    const output: Record<string, string> = {};
    for (const key of expectedOutputs) {
      if (!(key in result)) {
        throw new Error(`Missing output key: "${key}"`);
      }
      const val = result[key];
      if (val === null || val === undefined) {
        output[key] = '';
      } else if (typeof val === 'string') {
        output[key] = val;
      } else if (typeof val === 'object') {
        output[key] = JSON.stringify(val);
      } else {
        output[key] = String(val);
      }
    }

    return output;
  }
}
