import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import pageLoader from '../src/page-loader.js';

let tempDir;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('Page Loader functionality', () => {
  test('should download a page with an image and save it correctly', async () => {
    const url = 'https://codica.la/cursos';
    const htmlFixture = `
      <!DOCTYPE html>
      <html lang="es">
        <body>
          <img src="/assets/professions/nodejs.png" alt="Ícono de Node.js" />
        </body>
      </html>
    `;
    const imageFixture = '...binary image data...'; // Simula datos binarios

    nock('https://codica.la')
      .get('/cursos')
      .reply(200, htmlFixture);

    nock('https://codica.la')
      .get('/assets/professions/nodejs.png')
      .reply(200, imageFixture);

    const expectedHtmlFileName = 'codica-la-cursos.html';
    const expectedResourceDirName = 'codica-la-cursos_files';
    const expectedImageFileName = 'codica-la-assets-professions-nodejs.png';

    const expectedHtmlPath = path.join(tempDir, expectedHtmlFileName);
    const expectedResourceDirPath = path.join(tempDir, expectedResourceDirName);
    const expectedImagePath = path.join(expectedResourceDirPath, expectedImageFileName);

    await pageLoader(url, tempDir);

    // 1. Verificar que el directorio de recursos existe
    await expect(fs.stat(expectedResourceDirPath)).resolves.toBeTruthy();

    // 2. Verificar que la imagen se ha descargado
    const downloadedImage = await fs.readFile(expectedImagePath, 'utf-8');
    expect(downloadedImage).toBe(imageFixture);

    // 3. Verificar que el HTML ha sido modificado correctamente
    const downloadedHtml = await fs.readFile(expectedHtmlPath, 'utf-8');
    const expectedModifiedHtml = `<html><head></head><body>\n          <img src="codica-la-cursos_files/codica-la-assets-professions-nodejs.png" alt="Ícono de Node.js">\n        \n</body></html>`; // Cheerio modifica los espacios y añade etiquetas básicas
    
    // Una forma más robusta de probar el HTML modificado es cargándolo de nuevo con Cheerio
    const $ = cheerio.load(downloadedHtml);
    expect($('img').attr('src')).toBe(path.join(expectedResourceDirName, expectedImageFileName));
  });

  // Agrega más pruebas para manejar errores y otros escenarios
  // ...
});
