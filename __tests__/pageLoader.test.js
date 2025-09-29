import nock from 'nock';
import { promises as fs, readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

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
const cssPath = path.join(fixturesPath, 'application.css');
const pngPath = path.join(fixturesPath, 'nodejs.png');
const jsPath = path.join(fixturesPath, 'runtime.js');

// Variables para directorios temporales
let tempDir;
let downloadedHtmlPath;

// Función de ayuda para simular la descarga de recursos
const mockResource = (urlPath, fixturePath, isBinary = false) => {
    const fixtureData = readFileSync(fixturePath);
    const contentType = isBinary ? 'image/png' : 'text/plain';
    
    nock(`http://${baseHost}`)
        .get(urlPath)
        .reply(200, fixtureData, { 'Content-Type': contentType });
};

// Configuración de Nock para recursos externos
const mockExternalResource = (url, fixturePath, isBinary = false) => {
    const urlObject = new URL(url);
    const fixtureData = readFileSync(fixturePath);
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

    test('should download the page and save it with the correct name', async () => {
        await loadPage(baseUrl, tempDir);
        
        await fs.access(downloadedHtmlPath); 
        
        const resourcesDirPath = path.join(tempDir, resourcesDirName);
        await fs.access(resourcesDirPath);
    });

    test('should download resources and modify HTML links', async () => {
        await loadPage(baseUrl, tempDir);

        const downloadedHtml = await fs.readFile(downloadedHtmlPath, 'utf-8');
        const $ = cheerio.load(downloadedHtml);

        // Verificar que los recursos locales tienen las rutas correctas
        expect($('link[rel="stylesheet"]').eq(1).attr('href')).toBe('codica-la-cursos_files/codica-la-assets-application.css');
        expect($('img').attr('src')).toBe('codica-la-cursos_files/codica-la-assets-professions-nodejs.png');
        expect($('script').eq(1).attr('src')).toBe('codica-la-cursos_files/codica-la-packs-js-runtime.js');

        // Verificar que los recursos externos NO fueron modificados
        expect($('link[rel="stylesheet"]').eq(0).attr('href')).toBe('https://cdn2.codica.la/assets/menu.css');
        expect($('script').eq(0).attr('src')).toBe('https://js.stripe.com/v3/');

        // Verificar que los archivos de recursos existen
        const resourcesDirPath = path.join(tempDir, resourcesDirName);
        await fs.access(path.join(resourcesDirPath, 'codica-la-assets-application.css'));
        await fs.access(path.join(resourcesDirPath, 'codica-la-assets-professions-nodejs.png'));
        await fs.access(path.join(resourcesDirPath, 'codica-la-packs-js-runtime.js'));
    });

    test('should throw an error on network failures', async () => {
        nock.cleanAll();
        nock(`http://${baseHost}`).get('/cursos').reply(404);
        await expect(loadPage(baseUrl, tempDir)).rejects.toThrow('Error de red (HTTP 404)');
    });
});