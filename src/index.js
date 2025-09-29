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

  const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.svg'].some(ext => resourceName.endsWith(ext));

  return axios.get(url, { responseType: isBinary ? 'arraybuffer' : 'text' })
    .then((response) => fs.writeFile(filePath, response.data))
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

            // --- FILTRO CRÍTICO ---
            if (absoluteUrl.pathname === mainPathname) {
                log(`Ignorando enlace canónico o principal: ${resourceUrlRaw}`);
                return;
            }
            // --- FIN FILTRO CRÍTICO ---

            if (isLocal) {
              const resourceName = getResourceFileName(absoluteUrl.toString(), url);
              const resourceFullUrl = absoluteUrl.toString();
              const newLocalPath = path.join(resourcesDirName, resourceName);

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
            throw new Error(`Error de red (HTTP ${error.response.status}) al cargar '${url}'`);
        }
        if (error.code && ['EACCES', 'ENOENT'].includes(error.code)) {
            throw new Error(`Error de sistema de archivos: ${error.message}. Verifica permisos o que el directorio exista.`);
        }
        throw new Error(`Error de red: ${error.message}`);
    });
};

export default loadPage;