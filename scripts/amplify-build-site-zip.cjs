const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

process.env.DEPLOY_TARGET = 'site';
execSync('node scripts/amplify-build.cjs', { stdio: 'inherit' });

const deployDir = path.join('dist', 'deploy');
fs.writeFileSync(
  path.join(deployDir, '_redirects'),
  '/*    /index.html   200\n',
  'utf8'
);

const zipPath = path.join('deploy-amplify-site.zip');
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

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

console.log('deploy-amplify-site.zip created (site institucional / contfy.com.br)');
