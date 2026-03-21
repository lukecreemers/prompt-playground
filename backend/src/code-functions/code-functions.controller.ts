import { Controller, Get, Post, Patch, Delete, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { CodeFunctionsService } from './code-functions.service';
import { CodeExecutionService } from './code-execution.service';
import { AiService } from '../ai/ai.service';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';
import { CreateCodeFunctionDto } from './dto/create-code-function.dto';
import { UpdateCodeFunctionDto } from './dto/update-code-function.dto';

@Controller('code-functions')
export class CodeFunctionsController {
  constructor(
    private readonly service: CodeFunctionsService,
    private readonly executor: CodeExecutionService,
    private readonly ai: AiService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCodeFunctionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCodeFunctionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/test')
  async test(@Param('id') id: string, @Body() body: { inputs: Record<string, string> }) {
    const fn = await this.service.findOne(id);
    const expectedOutputs: string[] = JSON.parse(fn.outputs || '[]');
    try {
      const outputs = await this.executor.execute(fn.code, body.inputs || {}, expectedOutputs);
      return { outputs };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  @Post(':id/ai-assist')
  async aiAssist(
    @Param('id') id: string,
    @Body() body: {
      instruction: string;
      currentCode: string;
      inputs: string[];
      outputs: string[];
      history: Array<{ role: 'user' | 'assistant'; content: string }>;
      model: string;
      temperature?: number;
      maxTokens?: number;
    },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const systemPrompt = `You are a code assistant that modifies JavaScript functions. You receive the current code, its defined inputs and outputs, and a natural language instruction.

You MUST respond with valid JSON only, no markdown, no explanation outside the JSON. The JSON schema:
{
  "code": "the complete updated JavaScript function code",
  "inputs": ["array", "of", "input", "names"],
  "outputs": ["array", "of", "output", "names"],
  "explanation": "brief explanation of what you changed"
}

Rules:
- The code must be a valid JavaScript async function body
- The function receives an object with the input names as properties
- The function must return an object with the output names as properties
- Preserve existing inputs/outputs unless the instruction asks to change them
- If the instruction asks to add/remove inputs or outputs, update the arrays accordingly
- Always return the complete code, not just the changed parts`;

    const userMessage = `Current code:
\`\`\`javascript
${body.currentCode}
\`\`\`

Current inputs: ${JSON.stringify(body.inputs)}
Current outputs: ${JSON.stringify(body.outputs)}

Instruction: ${body.instruction}`;

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...body.history,
      { role: 'user', content: userMessage },
    ];

    const request: LlmRequest = {
      model: body.model,
      prompt: '',
      temperature: body.temperature ?? 0.3,
      maxTokens: body.maxTokens ?? 4096,
      system: systemPrompt,
      messages,
    };

    return new Promise<void>((resolve) => {
      const stream$ = this.ai.stream(request);
      let fullText = '';

      const subscription = stream$.subscribe({
        next: (chunk) => {
          switch (chunk.type) {
            case 'text_delta':
              fullText += chunk.content;
              res.write(`event: text\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
              break;
            case 'done':
              res.write(`event: done\ndata: ${JSON.stringify({ fullText, usage: chunk.metadata?.usage })}\n\n`);
              break;
            case 'error':
              res.write(`event: error\ndata: ${JSON.stringify({ message: chunk.content })}\n\n`);
              break;
          }
        },
        complete: () => {
          res.end();
          resolve();
        },
        error: (err) => {
          res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
          res.end();
          resolve();
        },
      });

      res.on('close', () => {
        subscription.unsubscribe();
        resolve();
      });
    });
  }
}
