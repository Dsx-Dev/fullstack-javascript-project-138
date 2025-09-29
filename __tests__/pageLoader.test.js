import nock from 'nock';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url'; // ¡NUEVO! Para manejar rutas en ESM

import loadPage from '../src/index.js';
import { getFileName, getResourceDirName } from '../src/utils.js';

// --- CONFIGURACIÓN GLOBAL DE PRUEBAS ---
const baseHost = 'codica.la';
const baseUrl = `http://${baseHost}/cursos`;

// Cálculo robusto de la ruta de fixtures
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.join(__dirname, '..', '__fixtures__'); 

const resourcesDirName = getResourceDirName(baseUrl);
const htmlFileName = getFileName(baseUrl);

// Rutas de archivos fixtures
const pageHtmlPath = path.join(fixturesPath, 'page.html');
const pageExpectedHtmlPath = path.join(fixturesPath, 'page_expected.html');
const cssPath = path.join(fixturesPath, 'application.css');
const pngPath = path.join(fixturesPath, 'nodejs.png');
const jsPath = path.join(fixturesPath, 'runtime.js');

// Variables para directorios temporales
let tempDir;
let downloadedHtmlPath;

// Función de ayuda para simular la descarga de recursos
const mockResource = (urlPath, fixturePath, isBinary = false) => {
    // Usamos readFileSync aquí porque estamos dentro de beforeEach/mock
    const fixtureData = fs.readFileSync(fixturePath);
    const contentType = isBinary ? 'image/png' : 'text/plain';
    
    // Mocks de recursos locales (codica.la)
    nock(`http://${baseHost}`)
        .get(urlPath)
        .reply(200, fixtureData, { 'Content-Type': contentType });
};

// Configuración de Nock para recursos externos
const mockExternalResource = (url, fixturePath, isBinary = false) => {
    const urlObject = new URL(url);
    const fixtureData = fs.readFileSync(fixturePath);
    const contentType = isBinary ? 'image/png' : 'text/plain';
    
    nock(`${urlObject.origin}`)
        .get(urlObject.pathname)
        .reply(200, fixtureData, { 'Content-Type': contentType });
};


// Antes de cada prueba: crear directorio temporal y configurar mocks
beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    downloadedHtmlPath = path.join(tempDir, htmlFileName);

    // Mock principal: la página HTML
    const pageHtml = await fs.readFile(pageHtmlPath, 'utf-8');
    nock(`http://${baseHost}`)
        .get('/cursos')
        .reply(200, pageHtml);

    // Mocks de los 3 recursos locales
    mockResource('/assets/application.css', cssPath);
    mockResource('/assets/professions/nodejs.png', pngPath, true);
    mockResource('/packs/js/runtime.js', jsPath);
    
    // Mock de recurso externo
    mockExternalResource('https://cdn2.codica.la/assets/menu.css', cssPath);
});

// Después de cada prueba: limpiar
afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    nock.cleanAll();
});

// --- SUITE DE PRUEBAS ---

describe('Page Loader functionality', () => {

    // Test 1: Comprueba que la página principal se descarga y se guarda
    test('should download the page and save it with the correct name', async () => {
        await loadPage(baseUrl, tempDir);
        
        // 1. Verificar que el archivo HTML existe
        await fs.access(downloadedHtmlPath); 
        
        // 2. Verificar que el directorio de recursos existe
        const resourcesDirPath = path.join(tempDir, resourcesDirName);
        await fs.access(resourcesDirPath);
    });


    // Test 2: Comprueba que los recursos se descargan y los enlaces HTML se modifican
    test('should download resources and modify HTML links', async () => {
        await loadPage(baseUrl, tempDir);

        // --- VERIFICACIÓN DE CONTENIDO Y FORMATO HTML ---
        const downloadedHtml = await fs.readFile(downloadedHtmlPath, 'utf-8');
        const expectedHtmlContent = await fs.readFile(pageExpectedHtmlPath, 'utf-8');

        // Función para convertir barras invertidas (\) a barras diagonales (/)
        const normalizePathSeparators = (html) => html.replace(/\\/g, '/');

        // 1. Normalizar las barras en AMBOS archivos
        const htmlWithNormalizedPaths = normalizePathSeparators(downloadedHtml);
        const expectedWithNormalizedPaths = normalizePathSeparators(expectedHtmlContent);
        
        // 2. Usar Cheerio para normalizar el formato HTML
        // Esto resuelve las diferencias de espaciado, <!DOCTYPE> y cierres de etiquetas.
        const normalizedReceivedHtml = cheerio.load(htmlWithNormalizedPaths).html();
        const normalizedExpectedHtml = cheerio.load(expectedWithNormalizedPaths).html();

        // 3. Aserción final: compara el contenido normalizado
        expect(normalizedReceivedHtml.trim()).toBe(normalizedExpectedHtml.trim());
        
        // --- VERIFICACIÓN DE ARCHIVOS DE RECURSOS ---
        const resourcesDirPath = path.join(tempDir, resourcesDirName);
        
        // 1. CSS local
        await fs.access(path.join(resourcesDirPath, 'codica-la-assets-application.css'));
        
        // 2. Imagen PNG
        await fs.access(path.join(resourcesDirPath, 'codica-la-assets-professions-nodejs.png'));

        // 3. JS local
        await fs.access(path.join(resourcesDirPath, 'codica-la-packs-js-runtime.js'));
    });

    // Test 3: Manejo de errores de red (404)
    test('should throw an error on network failures', async () => {
        nock(`http://${baseHost}`).get('/cursos').reply(404);
        // La aserción espera el mensaje de error que definiste en src/index.js
        await expect(loadPage(baseUrl, tempDir)).rejects.toThrow('Error de red (HTTP 404)');
    });
});