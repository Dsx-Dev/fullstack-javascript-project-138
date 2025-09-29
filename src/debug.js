import debug from 'debug';

// Habilita el logger principal para page-loader
export const log = debug('page-loader');

// Habilita un logger específico para errores
export const logError = debug('page-loader:error');
