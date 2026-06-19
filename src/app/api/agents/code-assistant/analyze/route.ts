import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chatComplete } from '@/lib/nvidia';

const ANALYSIS_PROMPT = `You are an expert code analyst. Analyze the provided source files for:
1. **Bugs**: Syntax errors, logic errors, runtime errors
2. **Security Issues**: SQL injection, XSS, hardcoded secrets, insecure patterns
3. **Performance Issues**: Inefficient loops, unnecessary allocations, N+1 queries
4. **Code Quality**: Dead code, duplication, complexity, naming issues
5. **Missing Error Handling**: Uncaught exceptions, missing null checks
6. **Type Issues**: Type mismatches, missing types, unsafe casts

For each file, provide a structured analysis. Group findings by severity:
- **Critical**: Bugs that will cause crashes or incorrect behavior
- **Warning**: Security issues and potential bugs
- **Info**: Code quality and style improvements

Return your analysis in this exact JSON format:
\`\`\`json
{
  "summary": "Overall assessment of the codebase",
  "totalIssues": 0,
  "criticalCount": 0,
  "warningCount": 0,
  "infoCount": 0,
  "files": [
    {
      "path": "path/to/file.ts",
      "issues": [
        {
          "severity": "critical|warning|info",
          "line": 42,
          "description": "What is wrong",
          "suggestion": "How to fix it"
        }
      ]
    }
  ]
}
\`\`\`
Only include files that have issues. If no issues found, return an empty files array.`;

const BATCH_SIZE = 5;

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, sourceId } = await req.json();

    if (!workspaceId || !sourceId) {
      return NextResponse.json({ error: 'workspaceId and sourceId required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

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

    const apiKey = workspace.aiApiKey;
    if (!apiKey) {
      return NextResponse.json({
        summary: 'NVIDIA API key not configured. Add one in Settings to enable AI analysis.',
        totalIssues: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        files: [],
      });
    }

    const allIssues: {
      path: string;
      issues: { severity: string; line: number; description: string; suggestion: string }[];
    }[] = [];

    let summary = '';
    const batches: typeof source.files[] = [];

    for (let i = 0; i < source.files.length; i += BATCH_SIZE) {
      batches.push(source.files.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const fileChunks = batch.map(
        (f) => `File: ${f.path}\n\n\`\`\`\n${f.content}\n\`\`\``
      );
      const batchContext = fileChunks.join('\n\n---\n\n');

      const userPrompt = `Analyze these source files for bugs, security issues, performance problems, and code quality issues:

${batchContext}

Return your analysis as JSON in the exact format specified.`;

      try {
        const result = await chatComplete(
          [
            { role: 'system', content: ANALYSIS_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          apiKey,
          {
            model: workspace.aiModel || 'meta/llama-3.1-8b-instruct',
            temperature: 0.1,
            maxTokens: 4096,
          }
        );

        const jsonMatch = result.match(/```json\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : result;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.summary) summary = parsed.summary;
          if (parsed.files) allIssues.push(...parsed.files);
        } catch {
          allIssues.push({
            path: batch.map((f) => f.path).join(', '),
            issues: [
              {
                severity: 'info',
                line: 0,
                description: 'Analysis completed but response was not structured JSON',
                suggestion: result.slice(0, 500),
              },
            ],
          });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Unknown error';
        allIssues.push({
          path: batch.map((f) => f.path).join(', '),
          issues: [
            {
              severity: 'info',
              line: 0,
              description: `AI analysis failed: ${errMsg}`,
              suggestion: 'Check your API key or try again later.',
            },
          ],
        });
      }
    }

    const criticalCount = allIssues.reduce(
      (sum, f) => sum + f.issues.filter((i) => i.severity === 'critical').length,
      0
    );
    const warningCount = allIssues.reduce(
      (sum, f) => sum + f.issues.filter((i) => i.severity === 'warning').length,
      0
    );
    const infoCount = allIssues.reduce(
      (sum, f) => sum + f.issues.filter((i) => i.severity === 'info').length,
      0
    );

    return NextResponse.json({
      summary: summary || `Analyzed ${source.files.length} file(s) in "${source.label}".`,
      totalIssues: allIssues.reduce((sum, f) => sum + f.issues.length, 0),
      criticalCount,
      warningCount,
      infoCount,
      files: allIssues,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
