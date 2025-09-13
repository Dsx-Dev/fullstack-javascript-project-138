import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// Función auxiliar para generar el nombre del archivo
const generateFileName = (url) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const pathname = urlObj.pathname.slice(1).replace(/\//g, '-').replace(/\./g, '-');
  return `${hostname}-${pathname}.html`;
};

const pageLoader = (url, outputDir) => {
  return axios.get(url)
    .then((response) => {
      const fileName = generateFileName(url);
      const filePath = path.join(outputDir, fileName);
      return fs.writeFile(filePath, response.data)
        .then(() => filePath);
    })
    .catch((error) => {
      // Maneja diferentes tipos de errores (ej. 404, error de red)
      if (error.response) {
        throw new Error(`Failed to download page. Status: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('Failed to download page. No response received.');
      } else {
        throw new Error(`An unexpected error occurred: ${error.message}`);
      }
    });
};

export default pageLoader;
