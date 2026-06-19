interface GitHubFile {
  path: string;
  content: string;
  sha?: string;
}

function headers(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { 'User-Agent': 'docflow-ai', Accept: 'application/vnd.github.v3+json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchRepoFiles(repoUrl: string, token?: string | null): Promise<GitHubFile[]> {
  token = token || process.env.GITHUB_TOKEN;
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) throw new Error('Invalid GitHub URL');

  const [, owner, repo] = match;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  const treeRes = await fetch(`${apiBase}/git/trees/HEAD?recursive=1`, {
    headers: headers(token),
  });
  if (!treeRes.ok) throw new Error(`Failed to fetch repo tree (${treeRes.status}). ${token ? 'Check your token permissions.' : 'Try adding a GitHub token for higher rate limits.'}`);

  const treeData = await treeRes.json();
  const blobs = (treeData.tree as { path: string; type: string; sha: string }[])
    .filter((f) => f.type === 'blob');

  const batchSize = 10;
  const files: GitHubFile[] = [];

  for (let i = 0; i < blobs.length; i += batchSize) {
    const batch = blobs.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (blob) => {
        const res = await fetch(`${apiBase}/git/blobs/${blob.sha}`, {
          headers: headers(token),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const content = data.encoding === 'base64'
          ? Buffer.from(data.content, 'base64').toString('utf-8')
          : data.content;
        return { path: blob.path, content, sha: blob.sha };
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) files.push(r.value);
    }
  }

  return files;
}

const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.js', '.ts', '.tsx', '.jsx', '.py', '.rb', '.go', '.rs',
  '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.swift', '.kt',
  '.yaml', '.yml', '.json', '.xml', '.toml', '.cfg', '.ini', '.env',
  '.sql', '.sh', '.bash', '.zsh', '.css', '.scss', '.less', '.html',
  '.vue', '.svelte', '.astro', '.mjs', '.cjs', '.mts', '.cts',
]);

export function isTextFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  return TEXT_EXTENSIONS.has(ext);
}

export function isDocRelevantFile(path: string): boolean {
  const lower = path.toLowerCase();
  if (lower.startsWith('node_modules/') || lower.startsWith('.git/') ||
    lower.startsWith('dist/') || lower.startsWith('build/') ||
    lower.startsWith('.next/') || lower.startsWith('vendor/') ||
    lower.startsWith('coverage/') || lower.startsWith('__pycache__/')) return false;
  return isTextFile(path);
}

export function categorizeFiles(files: GitHubFile[]): Record<string, GitHubFile[]> {
  return {
    readme: files.filter((f) => /^readme\.md$/i.test(f.path)),
    api: files.filter((f) => /openapi|swagger|api.*\.(yaml|yml|json)$/i.test(f.path)),
    config: files.filter((f) => /package\.json|tsconfig|\.env|docker/i.test(f.path)),
    source: files.filter((f) => /\.(ts|js|tsx|jsx|py|go|rs|rb|java)$/.test(f.path)),
    docs: files.filter((f) => /\.md$/.test(f.path) && !/^readme\.md$/i.test(f.path)),
    changelog: files.filter((f) => /changelog|changes|release-notes/i.test(f.path)),
  };
}
