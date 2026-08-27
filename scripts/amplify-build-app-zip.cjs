const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REDIRECTS = `/                          /integracao/entrar     302
/entrar                    /integracao/entrar     302
/login                     /integracao/entrar     302
/integracao                /integracao/entrar     302
/*                         /index.html            200
`;

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

console.log('Build: app production (deploy-amplify.zip / integracao)');
execSync('npx ng build --configuration production', { stdio: 'inherit' });

const src = path.join('dist', 'novoangularbackv2', 'browser');
if (!fs.existsSync(src)) {
  console.error('ERROR: output not found:', src);
  process.exit(1);
}

const deployDir = path.join('dist', 'deploy-app');
fs.rmSync(deployDir, { recursive: true, force: true });
copyDir(src, deployDir);
fs.writeFileSync(path.join(deployDir, '_redirects'), REDIRECTS, 'utf8');

const indexPath = path.join(deployDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('ERROR: index.html missing');
  process.exit(1);
}

const zipPath = path.join('deploy-amplify.zip');
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

// Windows: tar -C dir . gera entradas ./index.html — Amplify exige index.html na raiz do zip.
const isWin = process.platform === 'win32';
if (isWin) {
  const absZip = path.resolve(zipPath);
  execSync(
    `powershell -NoProfile -Command "Set-Location -LiteralPath '${deployDir.replace(/'/g, "''")}'; tar -a -c -f '${absZip.replace(/'/g, "''")}' *"`,
    { stdio: 'inherit' }
  );
} else {
  execSync(`tar -a -c -f "${zipPath}" -C "${deployDir}" .`, { stdio: 'inherit' });
}

// Valida estrutura (index.html na raiz, sem prefixo ./)
try {
  const listing = execSync(`tar -tf "${zipPath}"`, { encoding: 'utf8' });
  if (!/^index\.html$/m.test(listing)) {
    console.error('ERROR: zip inválido — index.html deve estar na raiz (sem ./).');
    console.error(listing.split('\n').slice(0, 10).join('\n'));
    process.exit(1);
  }
} catch (e) {
  console.warn('Aviso: não foi possível validar o zip:', e.message);
}

const fileCount = fs.readdirSync(deployDir, { recursive: true })
  .filter(f => typeof f === 'string' && f.endsWith('.js')).length;
const main = fs.readdirSync(deployDir).find(f => f.startsWith('main-') && f.endsWith('.js'));
console.log(`deploy-amplify.zip OK | main=${main} | js files~${fileCount}`);
