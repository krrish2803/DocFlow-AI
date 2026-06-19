import type { RepoFile } from '@prisma/client';
import { createHash } from 'crypto';
import { prisma } from './prisma';
import { generateWithNvidia } from './nvidia';

interface GenerateInput {
  files: RepoFile[];
  docType: string;
  sourceLabel: string;
  repositoryUrl?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
  jobId?: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  readme: 'README',
  'api-ref': 'API Reference',
  changelog: 'Changelog / Release Notes',
  'feature-doc': 'Feature Documentation',
  'help-center': 'Help Center Article',
  troubleshooting: 'Troubleshooting Guide',
  'setup-guide': 'Setup / Installation Guide',
  internal: 'Internal Documentation',
};

const DOC_TYPE_PROMPTS: Record<string, string> = {
  readme: `Write a comprehensive README.md in markdown for this project. Include:
- Project name and description
- Quick start / installation
- Usage examples
- Key features
- Tech stack
- Configuration (if any)
- Project structure overview
Keep it clear and developer-friendly.`,

  'api-ref': `Write a complete API reference document in markdown. Include:
- API overview and base URL
- Authentication
- All endpoints with their methods, paths, request/response formats
- Error codes
- Rate limits
- Code examples for each endpoint
Be thorough and precise.`,

  changelog: `Write a changelog / release notes document in markdown. Structure it chronologically. Include:
- Version numbers and dates
- New features
- Bug fixes
- Breaking changes
- Deprecations
Group by version if possible.`,

  'setup-guide': `Write a setup / installation guide in markdown. Include:
- Prerequisites
- Step-by-step installation
- Configuration
- Environment variables
- Running locally
- Deployment
- Troubleshooting common issues
Make it beginner-friendly.`,

  'feature-doc': `Write a feature documentation guide in markdown. Include:
- Feature overview and purpose
- How it works
- Usage instructions with examples
- Configuration options
- Best practices
- Common pitfalls`,

  'help-center': `Write a help center article in markdown. Include:
- Overview of what this covers
- Step-by-step instructions
- Screenshot descriptions (text only)
- FAQ section
- Related articles
Use a friendly, helpful tone.`,

  troubleshooting: `Write a troubleshooting guide in markdown. Include:
- Common issues and their symptoms
- Step-by-step solutions
- Error messages and meanings
- Debugging tips
- When to contact support
Be practical and solution-oriented.`,

  internal: `Write internal documentation in markdown. Include:
- Architecture overview
- Code organization
- Key components and their responsibilities
- Data flow
- Development workflow
- Deployment process
Be technical and thorough.`,
};

function extractTitle(files: RepoFile[], docType: string, sourceLabel: string): string {
  const name = sourceLabel || files[0]?.path.split('/')[0] || 'Project';
  return `${name} ${DOC_TYPE_LABELS[docType] || 'Documentation'}`;
}

function buildContext(files: RepoFile[], docType: string): string {
  const relevant = files.filter((f) => {
    const p = f.path.toLowerCase();
    switch (docType) {
      case 'readme': return /readme|package\.json/i.test(p);
      case 'api-ref': return /openapi|swagger|api|route|controller|handler/i.test(p);
      case 'changelog': return /changelog|changes|release-notes|version/i.test(p);
      case 'setup-guide': return /docker|\.env|package\.json|tsconfig|readme|install|setup|config/i.test(p);
      default: return /\.(md|ts|js|tsx|jsx|py|go|rs|rb|java|yaml|yml|json|toml|cfg|ini)$/.test(p);
    }
  });

  const selected = relevant.length > 0 ? relevant : files;
  const limited = selected.slice(0, 30);

  return limited.map((f) => {
    const lines = f.content.split('\n');
    const snippet = lines.slice(0, 60).join('\n');
    return `--- ${f.path} ---\n${snippet}\n`;
  }).join('\n');
}

async function generateWithAI(
  docType: string,
  context: string,
  sourceLabel: string,
  apiKey: string,
  model?: string
): Promise<string> {
  const typeLabel = DOC_TYPE_LABELS[docType] || 'documentation';
  const systemPrompt = `You are an expert technical writer. Generate high-quality documentation in markdown format. Be thorough, accurate, and well-structured. Use proper markdown headings, code blocks, tables, and lists.`;

  const userPrompt = `Generate a ${typeLabel} for the project "${sourceLabel}".

${DOC_TYPE_PROMPTS[docType] || `Write a ${typeLabel} document in markdown.`}

Here are the source files from the repository to base the documentation on:

${context}

Write the complete document in markdown.`;

  return generateWithNvidia(systemPrompt, userPrompt, apiKey, model || undefined);
}

function templateFallback(files: RepoFile[], docType: string, sourceLabel: string, repoUrl?: string | null): string {
  const pkg = files.find((f) => f.path === 'package.json');
  let pkgInfo = '';
  if (pkg) {
    try {
      const json = JSON.parse(pkg.content);
      pkgInfo = `**Version:** ${json.version || 'N/A'}\n**Description:** ${json.description || 'No description'}\n`;
    } catch {}
  }

  const langs = [...new Set(files.map((f) => f.path.split('.').pop()).filter(Boolean))];
  const fileTree = files.slice(0, 20).map((f) => `- \`${f.path}\``).join('\n');
  const typeLabel = DOC_TYPE_LABELS[docType] || 'Documentation';

  let body = '';

  switch (docType) {
    case 'readme':
      body = `${pkgInfo}\n## Tech Stack\n${langs.map((l) => `- ${l}`).join('\n')}\n\n## File Structure\n${fileTree}\n`;
      break;
    case 'api-ref': {
      const spec = files.find((f) => /openapi|swagger/i.test(f.path));
      if (spec) {
        try {
          const json = JSON.parse(spec.content);
          const paths = json.paths ? Object.keys(json.paths) : [];
          body = `**API:** ${json.info?.title || 'API'} v${json.info?.version || '1.0'}\n\n## Endpoints\n\n${paths.map((p: string) => {
            const methods = Object.keys(json.paths[p]);
            return `### \`${p}\`\n${methods.map((m) => `- **${m.toUpperCase()}**`).join('\n')}`;
          }).join('\n\n')}`;
        } catch { body = 'No parseable API spec found.'; }
      } else {
        body = 'No API specification file detected.';
      }
      break;
    }
    case 'changelog': {
      const cl = files.find((f) => /changelog|changes|release-notes/i.test(f.path));
      body = cl ? cl.content : 'No changelog file found.';
      break;
    }
    default:
      body = `## Source Files\n${fileTree}\n\n${pkgInfo}`;
  }

  return `# ${sourceLabel} ${typeLabel}\n\n${body}\n${repoUrl ? `\n---\n**Repository:** ${repoUrl}` : ''}`;
}

export async function generateDocument(input: GenerateInput): Promise<{ title: string; content: string; documentId?: string }> {
  const { files, docType, sourceLabel, repositoryUrl, aiApiKey, aiModel, jobId } = input;

  if (files.length === 0) {
    return {
      title: sourceLabel,
      content: `# ${sourceLabel}\n\n_No source files available yet. Sync the source to fetch files._\n`,
    };
  }

  const hashContent = (content: string) => createHash('sha256').update(content).digest('hex');

  async function createDocSourceLinks(documentId: string) {
    for (const file of files) {
      await prisma.docSourceLink.upsert({
        where: { documentId_sourceFileId: { documentId, sourceFileId: file.id } },
        update: { fileContentHash: hashContent(file.content), lastCheckedAt: new Date(), stale: false },
        create: {
          documentId,
          sourceFileId: file.id,
          sourceId: file.sourceId,
          fileContentHash: hashContent(file.content),
        },
      });
    }
  }

  const title = extractTitle(files, docType, sourceLabel);

  let result: { title: string; content: string };

  if (aiApiKey) {
    const context = buildContext(files, docType);
    try {
      const content = await generateWithAI(docType, context, sourceLabel, aiApiKey, aiModel || undefined);
      result = { title, content };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      const fallback = templateFallback(files, docType, sourceLabel, repositoryUrl);
      result = {
        title,
        content: `${fallback}\n\n<!-- AI generation failed: ${errorMsg}. Using template fallback. -->`,
      };
    }
  } else {
    const content = templateFallback(files, docType, sourceLabel, repositoryUrl);
    result = { title, content };
  }

  if (jobId) {
    const doc = await prisma.generatedDocument.create({
      data: {
        title: result.title,
        slug: result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `doc-${Date.now()}`,
        docType,
        content: result.content,
        workspaceId: (await prisma.generationJob.findUnique({ where: { id: jobId } }))?.workspaceId || '',
        status: 'DRAFT',
      },
    });

    await createDocSourceLinks(doc.id);

    await prisma.generationJob.update({
      where: { id: jobId },
      data: { resultDocumentId: doc.id },
    });

    return { ...result, documentId: doc.id };
  }

  return result;
}
