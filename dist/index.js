/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 622:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 405:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const fs = __nccwpck_require__(896);
const axios = __nccwpck_require__(405);
const core = __nccwpck_require__(622);

const DEEPL_API_KEY = core.getInput('deepl-api-key');
const localesPath = core.getInput('path');
const baseFile = core.getInput('base-file');

if (!DEEPL_API_KEY || !localesPath) {
  core.setFailed("❌ Faltam inputs obrigatórios (deepl-api-key ou path)");
  process.exit(1);
}

console.log(`✅ API Key recebida: ${DEEPL_API_KEY}`);
console.log(`📂 Path dos arquivos: ${localesPath}`);
console.log(`📄 Arquivo base: ${baseFile}`);

const getLanguages = () => { 
  const files = fs.readdirSync(localesPath);
  return files.filter(file =>
    file.endsWith(".json") && file !== "pt-BR.json" && file !== "fr-FR.json"
  ).map(file => file.split(".")[0]);
}
const readJsonFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Erro ao ler JSON: ${filePath}`, error.message);
    return null;
  }
};
const getMissingKeys = (baseContent, targetContent) => {
  return Object.entries(baseContent)
    .filter(([key]) => !targetContent[key] || targetContent[key] === "")
    .map(([key, value]) => ({ key, value }));
};
const translateTexts = async (texts, lang) => {
  try {
    const response = await axios.post("https://api-free.deepl.com/v2/translate", {
      text: texts,
      target_lang: lang.split('-')[0].toUpperCase(),
      source_lang: "PT",
    }, {
      headers: {
        "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    return response.data.translations.map(t => t.text);
  } catch (error) {
    console.error("❌ Erro ao traduzir:", error.response?.data || error.message);
    return [];
  }
};
const updateTranslations = (targetFile, targetContent, missingKeys, translatedTexts) => {
  missingKeys.forEach((item, index) => {
    targetContent[item.key] = translatedTexts[index];
  });
  fs.writeFileSync(targetFile, JSON.stringify(targetContent, null, 2));
};
const processTranslation = async (lang) => {
  const targetFile = `${localesPath}/${lang}.json`;
  console.log(`🔍 Comparando '${baseFile}' com '${targetFile}'...`);

  const baseContent = readJsonFile(baseFile);
  const targetContent = readJsonFile(targetFile) || {};

  if (!baseContent) {
    console.error("❌ Base JSON inválido, abortando...");
    return;
  }

  const missingKeys = getMissingKeys(baseContent, targetContent);
  console.log("📝 Chaves faltando para", lang, missingKeys);
  
  if (missingKeys.length === 0) {
    console.log(`✅ Nenhuma chave para traduzir para ${lang}`);
    return;
  }

  console.log(`🌍 Enviando para tradução (${lang})...`);
  const texts = missingKeys.map(({ value }) => value);
  const translatedTexts = await translateTexts(texts, lang);

  if (translatedTexts.length > 0) {
    updateTranslations(targetFile, targetContent, missingKeys, translatedTexts);
    console.log(`✅ Traduções aplicadas para ${lang}`);
  }
};

(async () => {
  getLanguages().forEach(lang => processTranslation(lang));
})();

module.exports = __webpack_exports__;
/******/ })()
;