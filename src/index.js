import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import { promises as fs } from 'fs';
import Listr from 'listr';
import { URL } from 'url';
import { getFileName, getResourceDirName, getResourceFileName } from './utils.js';
import { log, logError } from './debug.js';

const mapping = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const downloadResource = (url, outputDir, resourceName) => {
  const filePath = path.join(outputDir, resourceName);
  log(`Descargando recurso: ${url} a ${filePath}`);

  return axios.get(url, { 
    responseType: 'arraybuffer', // Siempre descargar como buffer para evitar problemas de codificación
  })
    .then((response) => {
      return fs.writeFile(filePath, response.data);
    })
    .catch((error) => {
      const errorMessage = error.message || `Código: ${error.code}`;
      logError(`Error al descargar recurso ${url}: ${errorMessage}`);
      throw new Error(`Error de red al descargar recurso '${url}': ${errorMessage}`);
    });
};

const loadPage = (url, outputDir) => {
  const htmlFileName = getFileName(url);
  const resourcesDirName = getResourceDirName(url);
  const htmlFilePath = path.join(outputDir, htmlFileName);
  const resourcesDirPath = path.join(outputDir, resourcesDirName);

  log(`Iniciando descarga de ${url}`);

  return axios.get(url)
    .then(async (response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      const resourcesToDownload = [];
      const urlObject = new URL(url); 
      const mainPathname = urlObject.pathname; 

      // 1. Crear directorio de recursos
      await fs.mkdir(resourcesDirPath).catch((err) => {
        if (err.code !== 'EEXIST') throw err; 
      });

      // 2. Encontrar y procesar recursos
      Object.keys(mapping).forEach((tag) => {
        const attr = mapping[tag];
        $(tag).each((i, element) => {
          const resourceUrlRaw = $(element).attr(attr);
          if (!resourceUrlRaw) return;

          try {
            const absoluteUrl = new URL(resourceUrlRaw, url);
            const isLocal = absoluteUrl.origin === urlObject.origin;
            
            if (isLocal) {
              // FILTRO CRÍTICO: Ignorar el enlace canónico o cualquier recurso que apunte a la página principal.
              // Normalizamos ambos pathnames para ignorar la barra final (trailing slash)
              const resourcePathname = absoluteUrl.pathname.replace(/\/$/, '');
              const mainPagePathname = mainPathname.replace(/\/$/, '');
              if (resourcePathname === mainPagePathname) {
                  log(`Ignorando enlace canónico o principal: ${resourceUrlRaw}`);
                  return;
              }

              const resourceName = getResourceFileName(absoluteUrl.toString(), url);
              const resourceFullUrl = absoluteUrl.toString();
              
              // Usamos path.join para crear la ruta, pero la normalizaremos a '/' para el HTML
              const newLocalPath = path.join(resourcesDirName, resourceName).replace(/\\/g, '/');
              
              $(element).attr(attr, newLocalPath);

              resourcesToDownload.push({ 
                title: `Descargando ${resourceName}`,
                task: () => downloadResource(resourceFullUrl, resourcesDirPath, resourceName),
              });
            }
          } catch (e) {
            logError(`Error al procesar URL ${resourceUrlRaw}: ${e.message}`);
          }
        });
      });

      // 3. Descargar recursos con Listr (en paralelo)
      if (resourcesToDownload.length > 0) {
        const listrTasks = new Listr(resourcesToDownload, { concurrent: true });
        await listrTasks.run().catch(err => {
            throw new Error(`Fallo en la descarga de recursos: ${err.message}`);
        });
      }

      // 4. Guardar HTML modificado
      const modifiedHtml = $.html();
      await fs.writeFile(htmlFilePath, modifiedHtml);
      log(`HTML modificado guardado en ${htmlFilePath}`);

      return htmlFilePath; 
    })
    .catch((error) => {
        logError(`Error principal de la descarga: ${error.message}`);
        if (error.response) {
            // Error HTTP (404, 500, etc)
            throw new Error(`Error de red (HTTP ${error.response.status})`);
        }
        if (error.code && ['EACCES', 'ENOENT'].includes(error.code)) {
            // Error de permisos o directorio
            throw new Error(`Error de sistema de archivos: ${error.message}. Verifica permisos o que el directorio exista.`);
        }
        // Otros errores de red o DNS
        throw new Error(`Error de red: ${error.message}`);
    });
};

export default loadPage;