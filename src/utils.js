import path from 'path';
import { URL } from 'url';

/**
 * Normaliza una URL (combinando host y pathname) y reemplaza todos 
 * los caracteres no alfanuméricos por un guión.
 * @param {string} url - La URL a normalizar.
 * @returns {string} El nombre base normalizado (sin extensión).
 */
const normalizeUrl = (url) => {
  const urlObj = new URL(url);
  
  // Combina host y pathname: "codica.la/cursos" o "codica.la/assets/img.png"
  const urlPath = `${urlObj.host}${urlObj.pathname}`
    // Elimina cualquier '/' al inicio o al final
    .replace(/^\/+|\/+$/g, ''); 
    
  // Reemplaza caracteres no alfanuméricos (incluyendo '/') por un guión '-'
  return urlPath.replace(/[^a-zA-Z0-9]/g, '-');
};


// Genera un nombre de archivo a partir de una URL (página principal)
export const getFileName = (url, extension = '.html') => {
  return `${normalizeUrl(url)}${extension}`;
};

// Genera el nombre del directorio de recursos
export const getResourceDirName = (url) => {
  const baseName = getFileName(url, '');
  return `${baseName}_files`;
};

// Obtiene el nombre del archivo de recurso
export const getResourceFileName = (url, baseUrl) => {
  // 1. Resuelve la URL del recurso a su forma absoluta para su normalización
  const absoluteUrl = new URL(url, baseUrl).toString();

  // 2. Obtiene la extensión original (ej. .png)
  const ext = path.extname(absoluteUrl);

  // 3. Normaliza la URL absoluta para crear el nombre base
  const baseName = normalizeUrl(absoluteUrl);
  
  // 4. Quita la extensión del nombre base normalizado (si existe) y añade la extensión original
  // Esto previene que tengamos doble extensión si la URL ya tenía el punto final (ej. /style.css.)
  // y asegura que el nombre del archivo sea limpio.
  const nameWithoutExt = baseName.endsWith('-') 
    ? baseName.slice(0, -ext.length -1) // Si el normalizado terminó en guion antes de la ext.
    : baseName.slice(0, -ext.length);
  
  return `${nameWithoutExt}${ext}`;
};
