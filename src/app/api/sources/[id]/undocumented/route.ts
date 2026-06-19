import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface UndocumentedRoute {
  path: string;
  method: string;
  file: string;
  line?: number;
}

const TS_JS_ROUTE_PATTERNS = [
  /\bapp\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /\brouter\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /\bserver\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /@(Get|Post|Put|Patch|Delete|Head|Options)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  /@(RequestMapping)\s*\(\s*\{\s*path\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*method\s*:\s*(RequestMethod\.\w+)/g,
];

function parseTsJsEndpoints(content: string, filePath: string): UndocumentedRoute[] {
  const endpoints: UndocumentedRoute[] = [];

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

function parseOpenApiEndpoints(content: string, filePath: string): UndocumentedRoute[] {
  const endpoints: UndocumentedRoute[] = [];

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
    const pathMatch = content.matchAll(/["']\/[a-zA-Z0-9/_\-{}]*["']\s*:/g);
    for (const match of pathMatch) {
      endpoints.push({ path: match[0].replace(/["':]/g, '').trim(), method: 'GET', file: filePath });
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

    const allRoutes: UndocumentedRoute[] = [];

    for (const file of source.files) {
      if (source.sourceType === 'OPENAPI_SPEC') {
        if (file.path.endsWith('.json') || file.path.endsWith('.yaml') || file.path.endsWith('.yml')) {
          allRoutes.push(...parseOpenApiEndpoints(file.content, file.path));
        }
      } else if (source.sourceType === 'GITHUB_REPO') {
        if (/\.(ts|js|py|jsx|tsx)$/.test(file.path)) {
          allRoutes.push(...parseTsJsEndpoints(file.content, file.path));
        }
      }
    }

    const workspaceId = source.workspaceId;
    const docs = await prisma.generatedDocument.findMany({
      where: { workspaceId },
      select: { content: true },
    });
    const allDocContent = docs.map((d) => d.content).join('\n').toLowerCase();

    const documented: UndocumentedRoute[] = [];
    const undocumented: UndocumentedRoute[] = [];

    for (const route of allRoutes) {
      if (allDocContent.includes(route.path.toLowerCase())) {
        documented.push(route);
      } else {
        undocumented.push(route);
      }
    }

    return NextResponse.json({
      total: allRoutes.length,
      documented: documented.length,
      undocumented,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
