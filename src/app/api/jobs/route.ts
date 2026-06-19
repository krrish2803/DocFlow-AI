import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { generateDocument } from '@/lib/generator';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const id = req.nextUrl.searchParams.get('id');

    if (id) {
      const job = await prisma.generationJob.findUnique({ where: { id } });
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      return NextResponse.json(job);
    }

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId or id required' }, { status: 400 });

    const jobs = await prisma.generationJob.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(jobs);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, message, workspaceId } = body;
    if (!type || !workspaceId) {
      return NextResponse.json({ error: 'type and workspaceId required' }, { status: 400 });
    }

    const job = await prisma.generationJob.create({
      data: { type, message: message || '', status: 'PROCESSING', progress: 0, workspaceId },
    });

    (async () => {
      try {
        const sources = await prisma.sourceConnection.findMany({
          where: { workspaceId },
          include: { files: { orderBy: { syncAt: 'desc' } } },
        });

        if (sources.length === 0) {
          const doc = await prisma.generatedDocument.create({
            data: {
              title: 'Untitled', slug: `untitled-${Date.now()}`, docType: type,
              content: `# No sources connected\n\nConnect a source repository first, then sync it before generating documents.`,
              workspaceId, status: 'DRAFT',
            },
          });
          await prisma.generationJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', progress: 100, resultDocumentId: doc.id } });
          return;
        }

        let allFiles: { source: typeof sources[0]; files: typeof sources[0]['files'] }[] = [];
        let totalProgress = 0;
        const progressPerSource = Math.floor(80 / sources.length);

        for (const source of sources) {
          if (source.files.length === 0) continue;
          allFiles.push({ source, files: source.files });

          for (const file of source.files) {
            await prisma.jobSourceLink.create({
              data: {
                jobId: job.id,
                sourceId: source.id,
                filePath: file.path,
                fileContent: file.content,
              },
            });
          }

          totalProgress += progressPerSource;
          await prisma.generationJob.update({ where: { id: job.id }, data: { progress: Math.min(totalProgress, 80), message: `Analyzing ${source.label}...` } });
        }

        if (allFiles.length === 0) {
          const doc = await prisma.generatedDocument.create({
            data: {
              title: 'No files synced', slug: `no-files-${Date.now()}`, docType: type,
              content: `# No files available\n\nSync your connected sources first to fetch repository files.`,
              workspaceId, status: 'DRAFT',
            },
          });
          await prisma.generationJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', progress: 100, resultDocumentId: doc.id } });
          return;
        }

        const workspace_ = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        const source = allFiles[0].source;
        const { title, content } = await generateDocument({
          files: allFiles[0].files,
          docType: type,
          sourceLabel: source.label,
          repositoryUrl: source.repositoryUrl,
          aiApiKey: workspace_?.aiApiKey || null,
          aiModel: workspace_?.aiModel || null,
          jobId: job.id,
        });

        await prisma.generationJob.update({ where: { id: job.id }, data: { progress: 90, message: 'Creating document...' } });

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `doc-${Date.now()}`;

        const existingJob = await prisma.generationJob.findUnique({ where: { id: job.id } });
        if (!existingJob?.resultDocumentId) {
          const doc = await prisma.generatedDocument.create({
            data: { title, slug, docType: type, content, workspaceId, status: 'DRAFT' },
          });

          const hashContent = (c: string) => createHash('sha256').update(c).digest('hex');
          for (const file of allFiles[0].files) {
            await prisma.docSourceLink.upsert({
              where: { documentId_sourceFileId: { documentId: doc.id, sourceFileId: file.id } },
              update: { fileContentHash: hashContent(file.content), lastCheckedAt: new Date(), stale: false },
              create: {
                documentId: doc.id,
                sourceFileId: file.id,
                sourceId: file.sourceId,
                fileContentHash: hashContent(file.content),
              },
            });
          }

          await prisma.generationJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED', progress: 100, message: 'Document ready', resultDocumentId: doc.id },
          });
        } else {
          await prisma.generationJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED', progress: 100, message: 'Document ready' },
          });
        }
      } catch (e) {
        await prisma.generationJob.update({
          where: { id: job.id },
          data: { status: 'FAILED', progress: 0, message: String(e) },
        });
      }
    })();

    return NextResponse.json(job, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
