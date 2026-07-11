const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SITE_APP_ID = 'd64oxvnbymsbo';

function logEnv() {
  console.log('=== Amplify build ===');
  console.log('AWS_APP_ID=' + (process.env.AWS_APP_ID || '<unset>'));
  console.log('AWS_BRANCH=' + (process.env.AWS_BRANCH || '<unset>'));
  console.log('DEPLOY_TARGET=' + (process.env.DEPLOY_TARGET || '<unset>'));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

logEnv();

const isSite =
  process.env.DEPLOY_TARGET === 'site' || process.env.AWS_APP_ID === SITE_APP_ID;

let src;
if (isSite) {
  console.log('Build: site (SiteContfy / contfy.com.br)');
  execSync('npx ng build --configuration site', { stdio: 'inherit' });
  src = 'dist/contfy-site/browser';
} else {
  console.log('Build: app (contabilcontfy.com.br)');
  execSync('npx ng build --configuration production', { stdio: 'inherit' });
  src = 'dist/novoangularbackv2/browser';
}

if (!fs.existsSync(src)) {
  console.error('ERROR: output directory not found:', src);
  if (fs.existsSync('dist')) {
    console.error('dist contents:', fs.readdirSync('dist'));
  }
  process.exit(1);
}

const deployDir = 'dist/deploy';
fs.rmSync(deployDir, { recursive: true, force: true });
copyDir(src, deployDir);

if (isSite) {
  const siteIndex = path.join(deployDir, 'index.site.html');
  const mainIndex = path.join(deployDir, 'index.html');
  if (fs.existsSync(siteIndex) && !fs.existsSync(mainIndex)) {
    fs.copyFileSync(siteIndex, mainIndex);
    console.log('Created index.html from index.site.html');
  }
}

if (!fs.existsSync(path.join(deployDir, 'index.html'))) {
  console.error('ERROR: index.html missing in', deployDir);
  console.error('deploy contents:', fs.readdirSync(deployDir));
  process.exit(1);
}

console.log('Deploy artifacts ready in dist/deploy');
