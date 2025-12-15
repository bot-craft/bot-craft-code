// test-assistant-connection.js

// Configuración para las pruebas
const API_URL = `http://${process.env.REACT_APP_IP_ADDRESS}:4000`;
const testPrompt = 'Explain the structure of a Taskyto menu module';
const testContext = {
  projectSlug: 'test-project',
  currentFile: 'sample.yaml',
  currentFileContent: 'name: test-module\nkind: menu'
};

// Función de prueba asíncrona
async function testAssistantConnection() {
  // console.log('Testing connection to Taskyto Assistant API...');
  // console.log(`URL: ${API_URL}/api/chat`);
  // console.log('Test prompt:', testPrompt);
  
  try {
    // Usando fetch para mayor compatibilidad
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: testPrompt,
        context: testContext
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    // console.log('Response received:', data);
    
    if (data.status === 'success') {
      // console.log('✅ Test successful! Assistant is responding correctly.');
      // console.log('Response:', data.response);
      // console.log(`Processing time: ${data.processing_time_seconds.toFixed(2)}s`);
    } else {
      console.error('❌ Test failed! Assistant responded with an error:', data.error);
    }
  } catch (error) {
    console.error('❌ Connection test failed with error:', error);
  }
}

// Ejecutar la prueba
testAssistantConnection();