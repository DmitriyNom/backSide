console.log('=== TEST SCRIPT STARTED ===');

// Ждем немного чтобы сервер запустился
setTimeout(async () => {
  try {
    console.log('Loading MinioService...');
    const MinioService = require('./service/minioService.js');
    console.log('✅ MinioService loaded');
    
    // Тестируем соединение
    console.log('Testing connection...');
    const connected = await MinioService.testConnection();
    console.log('Connection test:', connected ? '✅ SUCCESS' : '❌ FAILED');
    
    // Диагностика
    console.log('\n=== Running diagnostics ===');
    const diagnostics = await MinioService.debugEndpointIssue();
    console.log('Diagnostics complete');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}, 3000);
