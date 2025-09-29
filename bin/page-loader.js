#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import process from 'process';
import loadPage from '../src/index.js'; // Importa la lógica principal
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .version('1.0.0') // Reemplaza con la versión real
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir', path.resolve(process.cwd())) // Establece el directorio de salida por defecto en cwd
  .arguments('<url>')
  .action(async (url, options) => {
    try {
      const outputPath = options.output;
      console.log(`Descargando página de: ${url} a ${outputPath}`);
      const filePath = await loadPage(url, outputPath); // Llama a la función principal
      console.log(`Página descargada exitosamente en: ${filePath}`);
      process.exit(0); // Éxito
    } catch (error) {
      console.error(`\nError al descargar la página: ${error.message}`);
      // Lógica para manejar errores específicos, como errores de red o de sistema de archivos
      // Si el error es de red (Axios) o de sistema de archivos (fs), el código de salida debe ser diferente a 0.
      // Aquí se simplifica a un código de salida general de error.
      process.exit(1); // Error
    }
  });

program.parse(process.argv);
