import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import nock from 'nock';
import loadPage from '../src/index.js';
import { getFileName, getResourceDirName, getResourceFileName } from '../src/utils.js';
import { URL } from 'url';

// --- CONFIGURACIÓN DE FIXTURES Y CARGA ASÍNCRONA ---
nock.disableNetConnect();

const getFixturePath = (name) => path.join('__tests__', 'fixtures', name);
const testUrl = 'https://codica.la/cursos';
const origin = new URL(testUrl).origin;

// Carga asíncrona de fixtures (funciona gracias a "type": "module" en package.json)
const htmlFixture = await fs.readFile(getFixturePath('page.html'), 'utf-8');
const expectedHtmlContent = await fs.readFile(getFixturePath('page_expected.html'), 'utf-8');
const imageFixture = await fs.readFile(getFixturePath('image.png')); // Contenido binario real (Buffer)
const cssFixture = await fs.readFile(getFixturePath('resource.css'), 'utf-8'); // Contenido de texto real

let tempDir;

// Se ejecuta antes de cada prueba para crear un directorio temporal aislado
beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

// Se ejecuta después de cada prueba para limpiar el directorio temporal
afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('Page Loader functionality', () => {
  
  // PRUEBA 1: Descarga básica
  test('should download the page and save it with the correct name', async () => {
    // 1. Mock de la página principal
    nock(new URL(testUrl).origin)
      .get(new URL(testUrl).pathname)
      .reply(200, htmlFixture); // <- Este HTML tiene enlaces a recursos

    // 2. Mocks de recursos MÍNIMOS para evitar el fallo de Nock/Axios
    // Tu código los intentará descargar, pero Nock los interceptará silenciosamente.
    const origin = new URL(testUrl).origin;

    nock(origin).get('/assets/professions/nodejs.png').reply(200, 'fake image');
    nock(origin).get('/assets/application.css').reply(200, 'fake css');
    nock(origin).get('/packs/js/runtime.js').reply(200, 'fake js');

    const expectedFileName = getFileName(testUrl);
    const expectedPath = path.join(tempDir, expectedFileName);

    const actualPath = await loadPage(testUrl, tempDir);
    // ... (el resto de las aserciones)
  });

  // PRUEBA 2: Descarga de recursos y modificación de HTML
  test('should download resources and modify HTML links', async () => {
    const mainPath = new URL(testUrl).pathname;
    
    // 1. Mock de la página principal (usa el HTML que contiene los enlaces)
    nock(origin)
      .get(mainPath)
      .reply(200, htmlFixture);

    const resourceDirName = getResourceDirName(testUrl);
    const resourceDirPath = path.join(tempDir, resourceDirName);
    
    // 2. Mocks de recursos locales (Deben coincidir con los enlaces en page.html)
    const imagePath = '/assets/professions/nodejs.png';
    const cssPath = '/assets/application.css';
    const scriptPath = '/packs/js/runtime.js'; // Añadido para completar el test

    // Mock para imagen
    nock(origin)
      .get(imagePath)
      .reply(200, imageFixture, { 'Content-Type': 'image/png' });
      
    // Mock para CSS
    nock(origin)
      .get(cssPath)
      // Usa el fixture real de CSS cargado
      .reply(200, cssFixture, { 'Content-Type': 'text/css' }); 
      
    // Mock para Script
    nock(origin)
      .get(scriptPath)
      .reply(200, 'console.log("js");', { 'Content-Type': 'application/javascript' });

    // Mock para recurso externo (debe ser ignorado)
    nock('https://cdn2.codica.la')
      .get('/assets/menu.css')
      .reply(200, 'external body {}');

    await loadPage(testUrl, tempDir);

    // 3. Comprobar que el directorio de recursos existe
    await expect(fs.stat(resourceDirPath)).resolves.toBeDefined();

    // 4. Comprobar que los recursos se descargaron y tienen el nombre correcto
    const expectedImageName = getResourceFileName(imagePath, testUrl);
    const expectedCssName = getResourceFileName(cssPath, testUrl);
    const expectedScriptName = getResourceFileName(scriptPath, testUrl);
    
    // Verifica que los archivos existan
    await expect(fs.stat(path.join(resourceDirPath, expectedImageName))).resolves.toBeDefined();
    await expect(fs.stat(path.join(resourceDirPath, expectedCssName))).resolves.toBeDefined();
    await expect(fs.stat(path.join(resourceDirPath, expectedScriptName))).resolves.toBeDefined();
    
    // Verifica el contenido (solo CSS para ejemplo, ya que la imagen es binaria)
    const downloadedCss = await fs.readFile(path.join(resourceDirPath, expectedCssName), 'utf-8');
    expect(downloadedCss).toBe(cssFixture);

    // 5. Comprobar el HTML modificado (comparar con el fixture esperado)
    const downloadedHtml = await fs.readFile(path.join(tempDir, getFileName(testUrl)), 'utf-8');
    
    // **¡Aserción final clave!** Usa .trim() para ignorar diferencias de whitespace.
    expect(downloadedHtml.trim()).toBe(expectedHtmlContent.trim());
  });
});