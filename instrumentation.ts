export async function register() {
  const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/nusantara_hris?schema=public';
  if (!process.env.DATABASE_URL || (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://'))) {
    process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
  }

  if (process.platform === 'linux') {
    try {
      const { exec } = await import('child_process');
      exec('pg_isready -h localhost -p 5432 -q 2>/dev/null || su - postgres -c "pg_ctlcluster 15 main start" 2>/dev/null || true');
    } catch {
      // Ignore if child process cannot be spawned
    }
  }
}
