const fs = require('fs');
const axios = require('axios');
const core = require('@actions/core');

const DEEPL_API_KEY = core.getInput('deepl-api-key');
const localesPath = core.getInput('path');

if (!DEEPL_API_KEY || !localesPath) {
  core.setFailed("❌ Faltam inputs obrigatórios (deepl-api-key ou path)");
  process.exit(1);
}

console.log(`✅ API Key recebida: ${DEEPL_API_KEY}`);
console.log(`📂 Path dos arquivos: ${localesPath}`);

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
  console.log(`🔍 Comparando '${localesPath}' com '${targetFile}'...`);

  const baseContent = readJsonFile(localesPath);
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
