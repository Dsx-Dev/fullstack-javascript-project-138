import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Helper para generar el nombre del archivo de la página principal
const generateHtmlFileName = (url) => {
  const urlObj = new URL(url);
  const { hostname, pathname } = urlObj;
  const name = `${hostname}${pathname}`.replace(/[^a-zA-Z0-9]/g, '-');
  return `${name.endsWith('-') ? name.slice(0, -1) : name}.html`;
};

// Helper para generar el nombre del directorio de recursos
const generateResourceDirName = (htmlFileName) => {
  const name = path.basename(htmlFileName, '.html');
  return `${name}_files`;
};

// Helper para generar el nombre de archivo para un recurso
const generateResourceFileName = (url) => {
  const { pathname } = new URL(url);
  const name = pathname.replace(/[^a-zA-Z0-9]/g, '-');
  const ext = path.extname(pathname);
  return `${name.endsWith('-') ? name.slice(0, -1) : name}${ext}`;
};

// Función para descargar recursos (imágenes, etc.)
const downloadResources = (resources, resourceDir) => {
  const promises = resources.map((resource) => {
    const { url, localPath } = resource;
    return axios.get(url, { responseType: 'arraybuffer' })
      .then((response) => fs.writeFile(localPath, response.data))
      .catch((error) => console.error(`Error al descargar ${url}: ${error.message}`));
  });
  return Promise.all(promises);
};

// Función principal para descargar la página y sus recursos
const pageLoader = (url, outputPath = process.cwd()) => {
  const htmlFileName = generateHtmlFileName(url);
  const htmlFilePath = path.join(outputPath, htmlFileName);
  const resourceDirName = generateResourceDirName(htmlFileName);
  const resourceDirPath = path.join(outputPath, resourceDirName);

  return axios.get(url, { responseType: 'text' })
    .then((response) => {
      const htmlContent = response.data;
      const $ = cheerio.load(htmlContent);
      const resourcesToDownload = [];

      $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          const absoluteUrl = new URL(src, url).href;
          const resourceFileName = generateResourceFileName(absoluteUrl);
          const localPath = path.join(resourceDirPath, resourceFileName);
          
          resourcesToDownload.push({ url: absoluteUrl, localPath });
          $(el).attr('src', path.join(resourceDirName, resourceFileName));
        }
      });
      
      const modifiedHtml = $.html();

      return fs.mkdir(resourceDirPath, { recursive: true })
        .then(() => downloadResources(resourcesToDownload, resourceDirPath))
        .then(() => fs.writeFile(htmlFilePath, modifiedHtml));
    })
    .then(() => htmlFilePath)
    .catch((error) => {
      console.error(`Error al procesar la página: ${error.message}`);
      throw error;
    });
};

export default pageLoader;
