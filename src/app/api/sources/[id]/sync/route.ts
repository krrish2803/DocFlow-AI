import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchRepoFiles, isDocRelevantFile } from '@/lib/github';
import { createHash } from 'crypto';

async function fetchOpenApiSpec(url: string): Promise<{ path: string; content: string; sha: string }[]> {
  const res = await fetch(url, { headers: { 'User-Agent': 'docflow-ai' } });
  if (!res.ok) throw new Error(`Failed to fetch OpenAPI spec (${res.status})`);
  const content = await res.text();
  const sha = createHash('sha256').update(content).digest('hex');
  const path = url.split('/').pop() || 'openapi.json';
  return [{ path, content, sha }];
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const source = await prisma.sourceConnection.findUnique({ where: { id }, include: { files: true } });
    if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 });

    if (!source.repositoryUrl) {
      return NextResponse.json({ error: 'No repository URL configured' }, { status: 400 });
    }

    let rawFiles: { path: string; content: string; sha?: string }[];

    if (source.sourceType === 'OPENAPI_SPEC') {
      rawFiles = await fetchOpenApiSpec(source.repositoryUrl);
    } else {
      rawFiles = await fetchRepoFiles(source.repositoryUrl, source.token);
    }

    const relevantFiles = source.sourceType === 'OPENAPI_SPEC'
      ? rawFiles
      : rawFiles.filter((f) => isDocRelevantFile(f.path));

    for (const file of relevantFiles) {
      await prisma.repoFile.upsert({
        where: { sourceId_path: { sourceId: source.id, path: file.path } },
        update: { content: file.content, sha: file.sha || '', syncAt: new Date() },
        create: { sourceId: source.id, path: file.path, content: file.content, sha: file.sha || '' },
      });
    }

    await prisma.sourceConnection.update({
      where: { id },
      data: { contentVolume: relevantFiles.length, lastSyncAt: new Date(), status: 'connected' },
    });

    return NextResponse.json({ synced: relevantFiles.length, total: rawFiles.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
