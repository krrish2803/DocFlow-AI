import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface DetectedEndpoint {
  path: string;
  method: string;
  file: string;
  line?: number;
}

function parseOpenApiEndpoints(content: string, filePath: string): DetectedEndpoint[] {
  const endpoints: DetectedEndpoint[] = [];

  try {
    const spec = JSON.parse(content);
    if (spec.paths && typeof spec.paths === 'object') {
      for (const [path, methods] of Object.entries<Record<string, unknown>>(spec.paths)) {
        if (typeof methods !== 'object' || methods === null) continue;
        for (const method of Object.keys(methods)) {
          if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())) {
            endpoints.push({ path, method: method.toUpperCase(), file: filePath });
          }
        }
      }
    }
  } catch {
    // Try YAML-like inline parsing as fallback for malformed JSON
    const pathMatch = content.matchAll(/["']\/[a-zA-Z0-9/_\-{}]*["']\s*:/g);
    for (const match of pathMatch) {
      endpoints.push({ path: match[0].replace(/["':]/g, '').trim(), method: 'GET', file: filePath });
    }
  }

  return endpoints;
}

const TS_JS_ROUTE_PATTERNS = [
  /\bapp\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /\brouter\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /\bserver\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /@(Get|Post|Put|Patch|Delete|Head|Options)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  /@(RequestMapping)\s*\(\s*\{\s*path\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*method\s*:\s*(RequestMethod\.\w+)/g,
];

function parseTsJsEndpoints(content: string, filePath: string): DetectedEndpoint[] {
  const endpoints: DetectedEndpoint[] = [];

  for (const pattern of TS_JS_ROUTE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const method = (match[1] || match[3] || 'GET').toUpperCase().replace('REQUESTMETHOD.', '');
      const routePath = match[2];
      const line = content.slice(0, match.index).split('\n').length;
      endpoints.push({ path: routePath, method, file: filePath, line });
    }
  }

  return endpoints;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const source = await prisma.sourceConnection.findUnique({
      where: { id },
      include: { files: true },
    });
    if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 });

    const allEndpoints: DetectedEndpoint[] = [];

    for (const file of source.files) {
      if (source.sourceType === 'OPENAPI_SPEC') {
        if (file.path.endsWith('.json') || file.path.endsWith('.yaml') || file.path.endsWith('.yml')) {
          allEndpoints.push(...parseOpenApiEndpoints(file.content, file.path));
        }
      } else if (source.sourceType === 'GITHUB_REPO') {
        if (/\.(ts|js|py|jsx|tsx)$/.test(file.path)) {
          allEndpoints.push(...parseTsJsEndpoints(file.content, file.path));
        }
      }
    }

    const workspaceId = source.workspaceId;
    const docs = await prisma.generatedDocument.findMany({
      where: { workspaceId },
      select: { content: true },
    });
    const allDocContent = docs.map((d) => d.content).join('\n').toLowerCase();

    const undocumentedEndpoints = allEndpoints.filter(
      (ep) => !allDocContent.includes(ep.path.toLowerCase())
    );

    return NextResponse.json({
      source: { id: source.id, label: source.label, sourceType: source.sourceType },
      endpoints: allEndpoints,
      totalEndpoints: allEndpoints.length,
      undocumentedEndpoints,
      lastCheckedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
