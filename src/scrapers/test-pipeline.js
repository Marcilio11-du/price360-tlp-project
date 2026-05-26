/**
 * Test script para verificar se o pipeline de scrapers funciona
 * Uso: node src/scrapers/test-pipeline.js
 */

const { ScraperPipeline, DatabaseUpsert, logger } = require('./index');

async function testPipeline() {
  console.log('🧪 Iniciando teste do pipeline de scrapers...\n');

  try {
    // 1. Mostrar status da BD
    console.log('📊 Estatísticas da base de dados:');
    const stats = await DatabaseUpsert.getStats();
    console.log(JSON.stringify(stats.data, null, 2));
    console.log();

    // 2. Executar pipeline com um termo de busca simples
    console.log('🔄 Executando pipeline com termos: ["Laptop"]\n');
    const startTime = Date.now();
    
    const pipeline = new ScraperPipeline();
    const result = await pipeline.execute(['Laptop']);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Pipeline completado em ${duration}s`);
    console.log(`\n📈 Resultado do pipeline:`);
    console.log(JSON.stringify(result, null, 2));

    // 3. Mostrar estatísticas atualizadas
    console.log('\n\n📊 Estatísticas após scraping:');
    const statsAfter = await DatabaseUpsert.getStats();
    console.log(JSON.stringify(statsAfter.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar pipeline:', error);
    logger.error('Erro no teste do pipeline', { error: error.message });
  }
  
  process.exit(0);
}

testPipeline();
