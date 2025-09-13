import nock from 'nock';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import pageLoader from '../src/pageLoader.js';

// Esto es una simplificación. En un caso real, usarías una librería para mockear el FS.
const tempDir = os.tmpdir();

describe('page-loader', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  it('debe descargar una página y guardarla en el directorio especificado', () => {
    const url = 'https://codica.la/cursos';
    const mockHtml = '<html><body><h1>Hello, World!</h1></body></html>';
    const expectedPath = path.join(tempDir, 'codica-la-cursos.html');

    nock('https://codica.la')
      .get('/cursos')
      .reply(200, mockHtml);

    return pageLoader(url, tempDir)
      .then((downloadedPath) => {
        expect(downloadedPath).toBe(expectedPath);
        return fs.readFile(downloadedPath, 'utf-8');
      })
      .then((content) => {
        expect(content).toBe(mockHtml);
      });
  });

  // Agrega más pruebas para errores 404, errores de red, etc.
});