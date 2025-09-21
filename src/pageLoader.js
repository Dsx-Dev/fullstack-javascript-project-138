import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// Esta función ahora coincide con la lógica que tus pruebas esperan.
const generateFileName = (url) => {
  const urlObj = new URL(url);
  const { hostname, pathname } = urlObj;
  // Combina hostname y pathname, y reemplaza todos los caracteres no alfanuméricos con guiones.
  const name = `${hostname}${pathname}`.replace(/[^a-zA-Z0-9]/g, '-');
  // Limpia guiones al final si los hay (ej. de una URL que termina en /)
  const cleanedName = name.endsWith('-') ? name.slice(0, -1) : name;
  return `${cleanedName}.html`;
};

const pageLoader = async (url, outputDir) => {
  const fileName = generateFileName(url);
  const filePath = path.join(outputDir, fileName);

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(filePath, response.data);
    return filePath;
  } catch (error) {
    // Lanza un error más descriptivo dependiendo de la causa.
    if (error.isAxiosError) {
      throw new Error(`Failed to download page from ${url}. Status: ${error.response?.status || 'Network Error'}`);
    }
    // Asume que otros errores son del sistema de archivos.
    throw new Error(`Failed to write file to ${filePath}. ${error.message}`);
  }
};

export default pageLoader;
