import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, '../..');
const backendRoot = path.resolve(process.env.E2E_BACKEND_ROOT ?? path.join(workspaceRoot, '..', 'pitell'));

const databaseName = 'pitell_e2e';
const databaseUser = 'pitell_e2e';
const databasePassword = 'pitell_e2e';
const minioAccessKey = 'pitell-e2e';
const minioSecretKey = 'pitell-e2e-secret';

if (process.platform === 'darwin' && !process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE) {
  process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = '/var/run/docker.sock';
}

let postgres: StartedPostgreSqlContainer | undefined;
let minio: StartedTestContainer | undefined;
let brregStub: Server | undefined;
let child: ReturnType<typeof spawn> | undefined;
let shuttingDown = false;

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Could not allocate a local port')));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function waitForTcpPort(host: string, port: number, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError: Error | undefined;

  while (Date.now() < deadline) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({ host, port });
        socket.setTimeout(1_000);
        socket.once('connect', () => {
          socket.destroy();
          resolve();
        });
        socket.once('timeout', () => socket.destroy(new Error(`Timed out connecting to ${host}:${port}`)));
        socket.once('error', reject);
      });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`Container port ${host}:${port} did not become reachable`, { cause: lastError });
}

async function startBrregStub(): Promise<{ server: Server; url: string }> {
  const company = {
    organisasjonsnummer: '927491745',
    navn: 'Fredrikstad Barbershop Bahar',
    organisasjonsform: { kode: 'ENK', beskrivelse: 'Enkeltpersonforetak' },
    forretningsadresse: {
      kommune: 'FREDRIKSTAD',
      landkode: 'NO',
      postnummer: '1608',
      adresse: ['Brogata 12'],
      land: 'Norge',
      kommunenummer: '3107',
      poststed: 'FREDRIKSTAD',
    },
  };

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    response.setHeader('Content-Type', 'application/json');

    if (url.pathname === `/enheter/${company.organisasjonsnummer}`) {
      response.writeHead(200);
      response.end(JSON.stringify(company));
      return;
    }

    if (url.pathname === '/enheter') {
      const requested = new Set((url.searchParams.get('organisasjonsnummer') ?? '').split(','));
      const companies = requested.has(company.organisasjonsnummer) ? [company] : [];
      response.writeHead(200);
      response.end(
        JSON.stringify({
          _embedded: { enheter: companies },
          page: { size: companies.length, totalElements: companies.length, totalPages: 1, number: 0 },
        }),
      );
      return;
    }

    response.writeHead(404);
    response.end(JSON.stringify({ message: 'Not found' }));
  });

  const port = await getFreePort();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  return { server, url: `http://127.0.0.1:${port}` };
}

async function closeServer(server: Server | undefined) {
  if (!server?.listening) return;
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

async function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;

  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
  }

  await Promise.allSettled([minio?.stop(), postgres?.stop(), closeServer(brregStub)]);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void cleanup().finally(() => process.exit(130));
  });
}

async function main() {
  const backendGradleWrapper = path.join(backendRoot, 'gradlew');
  const backendExists = await import('node:fs/promises').then((fs) => fs.stat(backendGradleWrapper).catch(() => null));
  if (!backendExists) {
    throw new Error(
      `Backend not found at ${backendRoot}. Set E2E_BACKEND_ROOT to the backend repository before running the suite.`,
    );
  }

  const frontendPort = await getFreePort();
  const backendPort = await getFreePort();
  const brreg = await startBrregStub();
  brregStub = brreg.server;

  [postgres, minio] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase(databaseName)
      .withUsername(databaseUser)
      .withPassword(databasePassword)
      .withStartupTimeout(120_000)
      .start(),
    new GenericContainer('minio/minio:latest')
      .withEnvironment({
        MINIO_ROOT_USER: minioAccessKey,
        MINIO_ROOT_PASSWORD: minioSecretKey,
      })
      .withCommand(['server', '/data'])
      .withExposedPorts(9000)
      .withWaitStrategy(Wait.forAll([Wait.forListeningPorts(), Wait.forLogMessage(/API:/)]))
      .withStartupTimeout(120_000)
      .start(),
  ]);

  await Promise.all([
    waitForTcpPort(postgres.getHost(), postgres.getPort()),
    waitForTcpPort(minio.getHost(), minio.getMappedPort(9000)),
  ]);

  const environment = {
    ...process.env,
    E2E_BACKEND_ROOT: backendRoot,
    E2E_BACKEND_PORT: String(backendPort),
    E2E_FRONTEND_PORT: String(frontendPort),
    E2E_DATABASE_URL: postgres.getConnectionUri(),
    PORT: String(backendPort),
    DATABASE_HOST: postgres.getHost(),
    DATABASE_PORT: String(postgres.getPort()),
    DATABASE_NAME: postgres.getDatabase(),
    DATABASE_USER: postgres.getUsername(),
    DATABASE_PASSWORD: postgres.getPassword(),
    STORAGE_S3_ENDPOINT: `http://${minio.getHost()}:${minio.getMappedPort(9000)}`,
    STORAGE_S3_BUCKET: 'pitell-e2e',
    STORAGE_S3_ACCESS_KEY: minioAccessKey,
    STORAGE_S3_SECRET_KEY: minioSecretKey,
    STORAGE_S3_REGION: 'eu-north-1',
    BRREG_BASE_URL: brreg.url,
    VITE_API_GATEWAY_URL: `http://127.0.0.1:${backendPort}`,
    pitell_PORTAL_BASE_URL: `http://127.0.0.1:${frontendPort}`,
    SPRING_PROFILES_ACTIVE: 'default',
    SPRING_FLYWAY_LOCATIONS: 'classpath:db/migration-monolith',
  } satisfies NodeJS.ProcessEnv;

  const forwardedArguments = process.argv.slice(2);
  child = spawn(
    process.execPath,
    [
      path.join(workspaceRoot, 'node_modules/playwright/cli.js'),
      'test',
      '--config=playwright.booking.config.ts',
      ...forwardedArguments,
    ],
    {
      cwd: workspaceRoot,
      env: environment,
      stdio: 'inherit',
    },
  );

  const exitCode = await new Promise<number>((resolve, reject) => {
    child?.once('error', reject);
    child?.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });

  process.exitCode = exitCode;
}

try {
  await main();
} finally {
  await cleanup();
}
