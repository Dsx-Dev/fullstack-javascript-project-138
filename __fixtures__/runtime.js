// Archivo JavaScript de prueba para el page loader
// Este archivo es solo un fixture de prueba y no debe ejecutarse

(function() {
  'use strict';
  
  var appConfig = {
    name: 'Codica Runtime',
    version: '1.0.0'
  };
  
  function init() {
    return appConfig;
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init: init };
  }
})();
