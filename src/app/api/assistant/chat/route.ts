import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chatComplete } from '@/lib/nvidia';

function searchRelevant(contents: { title: string; text: string; type: string }[], query: string, maxResults = 5) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return contents.slice(0, maxResults);
  const scored = contents.map((item) => {
    const lower = item.text.toLowerCase() + ' ' + item.title.toLowerCase();
    const score = terms.reduce((sum, term) => {
      const count = (lower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      return sum + count;
    }, 0);
    return { ...item, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, maxResults);
}

export async function POST(req: NextRequest) {
  try {
    const { message, workspaceId } = await req.json();
    if (!message || !workspaceId) {
      return NextResponse.json({ error: 'message and workspaceId required' }, { status: 400 });
    }

    const [workspace, docs, sources] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
      prisma.generatedDocument.findMany({ where: { workspaceId } }),
      prisma.sourceConnection.findMany({ where: { workspaceId }, include: { files: { take: 50, orderBy: { syncAt: 'desc' } } } }),
    ]);

    const contents: { title: string; text: string; type: string }[] = [];

    for (const doc of docs) {
      contents.push({ title: doc.title, text: doc.content, type: 'doc' });
    }

    for (const source of sources) {
      for (const file of source.files) {
        contents.push({ title: file.path, text: file.content, type: 'file' });
      }
    }

    const relevant = searchRelevant(contents, message);

    const citations = relevant.map((r) => ({
      sourceTitle: r.title,
      sourceType: r.type === 'doc' ? 'doc' : 'file',
      excerpt: r.text.slice(0, 200),
    }));

    if (!relevant.length) {
      const emptyResponses = [
        "I don't see any documentation or source files in your workspace yet. Try connecting a GitHub repo or uploading docs in the Sources page, then come back!",
        "Your workspace is empty — I have nothing to search through. Head to Sources to connect your codebase, then I can help!",
        "I couldn't find anything relevant. Make sure you've added sources and synced your files first.",
      ];
      return NextResponse.json({
        response: emptyResponses[Math.floor(Math.random() * emptyResponses.length)],
        citations: [],
      });
    }

    const context = relevant.map((r) => `[${r.type.toUpperCase()}] ${r.title}:\n${r.text.slice(0, 2000)}`).join('\n\n---\n\n');

    const systemPrompt = `You are DocFlow's AI documentation assistant. You help users understand their codebase, documentation, and project structure. 

Rules:
- Always answer in a natural, conversational tone — like a helpful colleague.
- Cite your sources by name when referencing documents or files.
- If the context doesn't contain enough information to fully answer, say what you DO know and suggest what the user could do next.
- Use markdown formatting: headers, bold, lists, and code blocks where helpful.
- Keep answers concise but complete. Don't pad with filler.
- Never output raw JSON, code dumps, or technical metadata unless the user specifically asks for it.`;

    const userPrompt = `The user asked: "${message}"

Here is relevant context from their workspace:

${context}

Based on the context above, provide a helpful, conversational answer. Cite the source documents/files by name.`;

    const apiKey = workspace?.aiApiKey;
    let response: string;

    if (apiKey) {
      try {
        response = await chatComplete(
          [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          apiKey,
          { model: workspace?.aiModel || 'meta/llama-3.1-8b-instruct', temperature: 0.3, maxTokens: 1024 }
        );
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Unknown error';
        if (errMsg.includes('401') || errMsg.includes('403')) {
          response = `It looks like your NVIDIA API key is invalid or expired. Go to **Settings → NVIDIA API Key** to update it. In the meantime, here's what I found:\n\n${relevant.map((r) => `**${r.title}**\n${r.text.slice(0, 400)}...`).join('\n\n')}`;
        } else {
          response = `I hit an error reaching the AI model (${errMsg}). Here's what I found in your docs:\n\n${relevant.map((r) => `**${r.title}**\n${r.text.slice(0, 400)}...`).join('\n\n')}`;
        }
      }
    } else {
      const topResults = relevant.slice(0, 3);
      const parts = topResults.map((r) => {
        const snippet = r.text.slice(0, 500).trim();
        return `### ${r.title}\n\n${snippet}${r.text.length > 500 ? '...' : ''}`;
      });
      response = `I found ${relevant.length} relevant source${relevant.length !== 1 ? 's' : ''} for your question. Here's what I can tell you:\n\n${parts.join('\n\n---\n\n')}\n\n> *Connect your NVIDIA API key in Settings to get AI-powered conversational answers.*`;
    }

    return NextResponse.json({ response, citations });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
