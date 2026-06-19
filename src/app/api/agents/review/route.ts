import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWithNvidia } from '@/lib/nvidia';

const DEFAULT_PATTERNS = ['.ts', '.js', '.py', '.tsx', '.jsx', '.go', '.rs', '.java'];
const BATCH_SIZE = 5;

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the following code file and provide:
1. **Summary**: Brief overview of what the code does
2. **Issues Found**: List any bugs, errors, or potential problems (with line references if possible)
3. **Code Quality**: Rate the code quality (Good/Fair/Poor) with explanation
4. **Security Concerns**: Any security vulnerabilities
5. **Suggestions**: Improvement recommendations
6. **Score**: Overall score out of 10

Return your response as valid JSON with this exact structure:
{
  "summary": "string",
  "issues": ["string"],
  "quality": { "rating": "Good|Fair|Poor", "explanation": "string" },
  "security": ["string"],
  "suggestions": ["string"],
  "score": number
}`;

function parseReviewResponse(raw: string): Record<string, unknown> {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // fall through
    }
  }
  return {
    summary: raw.slice(0, 500),
    issues: [],
    quality: { rating: 'Fair', explanation: 'Could not parse structured review' },
    security: [],
    suggestions: [],
    score: 5,
  };
}

async function reviewBatch(
  files: { path: string; content: string }[],
  apiKey: string,
  model?: string
) {
  const reviews = await Promise.all(
    files.map(async (file) => {
      const userPrompt = `File: ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\``;
      const raw = await generateWithNvidia(SYSTEM_PROMPT, userPrompt, apiKey, model);
      const parsed = parseReviewResponse(raw);
      return { filePath: file.path, ...parsed };
    })
  );
  return reviews;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceId, workspaceId, filePatterns } = body as {
      sourceId: string;
      workspaceId: string;
      filePatterns?: string[];
    };

    if (!sourceId || !workspaceId) {
      return NextResponse.json({ error: 'sourceId and workspaceId are required' }, { status: 400 });
    }

    const source = await prisma.sourceConnection.findUnique({
      where: { id: sourceId },
      include: { files: true },
    });
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }
    if (source.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Source does not belong to workspace' }, { status: 403 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const apiKey = workspace.aiApiKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'No AI API key configured for this workspace' }, { status: 400 });
    }

    const patterns = filePatterns?.length ? filePatterns : DEFAULT_PATTERNS;

    const matchingFiles = source.files
      .filter((f) => f.content.trim().length > 0)
      .filter((f) => patterns.some((ext) => f.path.endsWith(ext)))
      .map((f) => ({ path: f.path, content: f.content }));

    if (matchingFiles.length === 0) {
      return NextResponse.json({
        reviews: [],
        overallScore: 0,
        totalIssues: 0,
        message: 'No matching files found for the given patterns',
      });
    }

    const allReviews: Record<string, unknown>[] = [];
    for (let i = 0; i < matchingFiles.length; i += BATCH_SIZE) {
      const batch = matchingFiles.slice(i, i + BATCH_SIZE);
      const batchReviews = await reviewBatch(batch, apiKey, workspace.aiModel);
      allReviews.push(...batchReviews);
    }

    const scores = allReviews
      .map((r) => (typeof r.score === 'number' ? r.score : 0))
      .filter((s) => s > 0);
    const overallScore = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

    let totalIssues = 0;
    for (const r of allReviews) {
      if (Array.isArray(r.issues)) totalIssues += r.issues.length;
    }

    return NextResponse.json({
      reviews: allReviews.map((r) => ({
        filePath: r.filePath,
        summary: r.summary,
        issues: r.issues,
        quality: r.quality,
        security: r.security,
        suggestions: r.suggestions,
        score: r.score,
      })),
      overallScore,
      totalIssues,
      filesReviewed: allReviews.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
