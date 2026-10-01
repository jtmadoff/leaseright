import { mkdir, readdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';

// Stage only public assets. The browser key is restricted by referrer and API;
// keep its source configuration out of Git and inject it into the public HTML.
let key = process.env.LEASERIGHT_MAPS_KEY?.trim() || '';
if (!key) {
  try { key = (await readFile('.netlify/maps-key', 'utf8')).trim(); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
if (key && !/^[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Maps browser key format');
await mkdir('.netlify-publish', { recursive: true });
for (const name of await readdir('.netlify-publish')) {
  await rm(`.netlify-publish/${name}`, { recursive: true, force: true });
}
await mkdir('.netlify-publish/components', { recursive: true });
await copyFile('index.html', '.netlify-publish/index.html');
const html = await readFile('LeaseRight.html', 'utf8');
await writeFile('.netlify-publish/LeaseRight.html', html.replace(
  '<meta name="leaseright-maps-key" content="" />',
  `<meta name="leaseright-maps-key" content="${key}" />`
));
for (const name of await readdir('components')) {
  if (name.endsWith('.jsx')) await copyFile(`components/${name}`, `.netlify-publish/components/${name}`);
}
console.log(`Static site staged; address lookup ${key ? 'configured' : 'disabled (manual entry available)'}.`);
