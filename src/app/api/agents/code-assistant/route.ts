import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chatComplete } from '@/lib/nvidia';

const SYSTEM_PROMPT = `You are an expert code assistant. Help the user with their code by:
1. **Analysis**: Understand what the code does
2. **Bug Detection**: Find bugs, errors, and potential issues
3. **Fix Suggestions**: Provide specific code fixes with explanations
4. **Code Quality**: Suggest improvements
5. **Testing**: Suggest test cases
6. **Documentation**: Help document the code

When providing fixes, use this format:
\`\`\`language
// Fixed code here
\`\`\`
Always explain what was wrong and why the fix works.`;

export async function POST(req: NextRequest) {
  try {
    const { message, workspaceId, sourceId, fileId, context } = await req.json();

    if (!message || !workspaceId) {
      return NextResponse.json({ error: 'message and workspaceId required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    let codeContext = context || '';
    const filesUsed: { path: string; issues: string; fix: string }[] = [];

    if (fileId) {
      const file = await prisma.repoFile.findUnique({ where: { id: fileId } });
      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      codeContext = `File: ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\``;
    } else if (sourceId) {
      const source = await prisma.sourceConnection.findUnique({
        where: { id: sourceId },
        include: { files: { orderBy: { path: 'asc' } } },
      });
      if (!source) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }
      if (source.files.length === 0) {
        return NextResponse.json({ error: 'No files found in this source' }, { status: 404 });
      }
      const fileChunks = source.files.map(
        (f) => `File: ${f.path}\n\n\`\`\`\n${f.content}\n\`\`\``
      );
      codeContext = fileChunks.join('\n\n---\n\n');
    } else {
      const sources = await prisma.sourceConnection.findMany({
        where: { workspaceId },
        include: { files: { orderBy: { path: 'asc' } } },
      });
      const allChunks: string[] = [];
      for (const source of sources) {
        for (const file of source.files) {
          allChunks.push(`File: ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\``);
        }
      }
      if (allChunks.length > 0) {
        codeContext = allChunks.join('\n\n---\n\n');
      }
    }

    if (!codeContext) {
      return NextResponse.json({
        response: "I don't see any code files in your workspace yet. Connect a GitHub repo or upload files in the Sources page, then come back!",
        files: [],
      });
    }

    const userPrompt = `The user asked: "${message}"

Here is the relevant code from their workspace:

${codeContext}

Analyze the code and respond to the user's question. If you find bugs or issues, list them with fixes using the format specified.`;

    const apiKey = workspace.aiApiKey;
    let response: string;

    if (apiKey) {
      try {
        response = await chatComplete(
          [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          apiKey,
          {
            model: workspace.aiModel || 'meta/llama-3.1-8b-instruct',
            temperature: 0.3,
            maxTokens: 4096,
          }
        );
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Unknown error';
        if (errMsg.includes('401') || errMsg.includes('403')) {
          response = `Your NVIDIA API key appears invalid or expired. Go to **Settings → NVIDIA API Key** to update it.`;
        } else {
          response = `I hit an error reaching the AI model: ${errMsg}. Please check your API key and try again.`;
        }
      }
    } else {
      response = "You don't have an NVIDIA API key configured. Go to **Settings → NVIDIA API Key** to add one so I can analyze your code.";
    }

    return NextResponse.json({ response, files: filesUsed });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
