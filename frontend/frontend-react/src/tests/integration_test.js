/**
 * Script de prueba de integración
 * Prueba la comunicación entre el frontend y el backend de Taskyto Assistant
 * 
 * Este script prueba:
 * 1. Servicios de chat
 * 2. Servicios de edición de archivos
 * 3. Servicios de persistencia de conversaciones
 */

import EditorChatService from '../components/specific/code_editor/chat/EditorChatService';

// Configuración
const API_BASE_URL = process.env.REACT_APP_API_URL || `http://${process.env.REACT_APP_IP_ADDRESS}:4000`;
const PROJECT_NAME = 'integration-test-project';

/**
 * Ejecuta una secuencia de pruebas de integración
 */
async function runIntegrationTests() {
  // console.log('🧪 Iniciando pruebas de integración');
  // console.log(`🔗 Usando API en: ${API_BASE_URL}`);
  
  try {
    // 1. Prueba de Chat
    // console.log('\n📝 Prueba 1: Envío de mensajes al chat');
    const chatResult = await testChatService();
    // console.log(chatResult.success ? '✅ Prueba de chat completada' : '❌ Prueba de chat falló');
    
    // 2. Prueba de edición de archivos
    // console.log('\n📝 Prueba 2: Edición de archivos');
    const fileResult = await testFileEditing();
    // console.log(fileResult.success ? '✅ Prueba de edición completada' : '❌ Prueba de edición falló');
    
    // 3. Prueba de persistencia de conversaciones
    // console.log('\n📝 Prueba 3: Persistencia de conversaciones');
    const convResult = await testConversationPersistence();
    // console.log(convResult.success ? '✅ Prueba de persistencia completada' : '❌ Prueba de persistencia falló');
    
    // Resultados finales
    // console.log('\n📊 Resultados de las pruebas:');
    // console.log(`Chat: ${chatResult.success ? 'Exitoso ✅' : 'Fallido ❌'}`);
    // console.log(`Archivos: ${fileResult.success ? 'Exitoso ✅' : 'Fallido ❌'}`);
    // console.log(`Conversaciones: ${convResult.success ? 'Exitoso ✅' : 'Fallido ❌'}`);
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

/**
 * Prueba el servicio de chat
 */
async function testChatService() {
  try {
    // console.log('- Enviando mensaje de prueba al asistente...');
    
    const message = 'Hola, esto es un mensaje de prueba para verificar la integración.';
    const context = {
      currentFile: 'test.js',
      currentFileContent: 'console.log("Hola mundo");',
      projectFiles: ['test.js', 'README.md']
    };
    
    const response = await EditorChatService.sendMessage(message, null, null, context);
    
    if (response.success) {
      // console.log('- Respuesta recibida:', response.answer.slice(0, 50) + '...');
      return { success: true, response };
    } else {
      console.error('- Error en la respuesta:', response.error);
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.error('- Error en la prueba de chat:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Prueba el servicio de edición de archivos
 */
async function testFileEditing() {
  try {
    // Crear un archivo
    // console.log('- Creando archivo de prueba...');
    const createResult = await EditorChatService.createFile(
      `test-${Date.now()}.js`,
      'console.log("Este es un archivo de prueba de integración");'
    );
    
    if (!createResult.success) {
      console.error('- Error al crear archivo:', createResult.error);
      return { success: false, error: createResult.error };
    }
    
    // console.log('- Archivo creado:', createResult.file_path);
    
    // Editar el archivo
    // console.log('- Editando archivo...');
    const editResult = await EditorChatService.editFile(
      createResult.file_path,
      'console.log("Este archivo ha sido modificado");\nconsole.log("Prueba de integración exitosa");'
    );
    
    if (!editResult.success) {
      console.error('- Error al editar archivo:', editResult.error);
      return { success: false, error: editResult.error };
    }
    
    // console.log('- Archivo editado correctamente');
    // console.log('- Diff:', editResult.diff ? editResult.diff.slice(0, 100) + '...' : 'No disponible');
    
    // Formatear código
    // console.log('- Probando formateador de código...');
    const codeToFormat = `function testFunction() {
  console.log("Sin formatear");
for(let i=0;i<5;i++){
console.log(i)
}
}`;

    const formatResult = await EditorChatService.formatCode(codeToFormat, 'javascript');
    
    if (!formatResult.success) {
      console.error('- Error al formatear código:', formatResult.error);
      return { success: false, error: formatResult.error };
    }
    
    // console.log('- Código formateado correctamente');
    
    return { success: true, createResult, editResult, formatResult };
  } catch (error) {
    console.error('- Error en la prueba de edición:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Prueba el servicio de persistencia de conversaciones
 */
async function testConversationPersistence() {
  try {
    // 1. Crear una conversación de prueba
    // console.log('- Creando conversación de prueba...');
    const testConversation = {
      messages: [
        {
          text: '¿Cómo puedo crear un módulo en Taskyto?',
          isUser: true,
          timestamp: new Date()
        },
        {
          text: 'Para crear un módulo en Taskyto, necesitas crear un archivo YAML con la estructura adecuada...',
          isUser: false,
          timestamp: new Date()
        },
        {
          text: '¿Puedes mostrarme un ejemplo?',
          isUser: true,
          timestamp: new Date()
        }
      ]
    };
    
    // 2. Guardar la conversación
    // console.log('- Guardando conversación...');
    const saveResult = await EditorChatService.saveConversationToServer(PROJECT_NAME, testConversation);
    
    if (!saveResult.success) {
      console.error('- Error al guardar la conversación:', saveResult.error);
      return { success: false, error: saveResult.error };
    }
    
    // console.log('- Conversación guardada con ID:', saveResult.conversation_id);
    const conversationId = saveResult.conversation_id;
    
    // 3. Listar conversaciones
    // console.log('- Listando conversaciones...');
    const listResult = await EditorChatService.getServerConversations(PROJECT_NAME);
    
    if (!listResult.success) {
      console.error('- Error al listar conversaciones:', listResult.error);
      return { success: false, error: listResult.error };
    }
    
    // console.log('- Conversaciones encontradas:', listResult.conversations.length);
    
    // 4. Cargar la conversación
    // console.log('- Cargando conversación específica...');
    const loadResult = await EditorChatService.loadConversationFromServer(PROJECT_NAME, conversationId);
    
    if (!loadResult.success) {
      console.error('- Error al cargar la conversación:', loadResult.error);
      return { success: false, error: loadResult.error };
    }
    
    // console.log('- Conversación cargada correctamente');
    
    // 5. Cargar con limitación de pasos
    // console.log('- Probando carga limitada (últimos 2 mensajes)...');
    const stepsResult = await EditorChatService.loadConversationFromServer(PROJECT_NAME, conversationId, 2);
    
    if (!stepsResult.success) {
      console.error('- Error al cargar conversación limitada:', stepsResult.error);
      return { success: false, error: stepsResult.error };
    }
    
    const truncatedMessages = stepsResult.conversation.messages || [];
    // console.log(`- Mensajes obtenidos: ${truncatedMessages.length} de ${testConversation.messages.length}`);
    
    // 6. Eliminar la conversación
    // console.log('- Eliminando conversación...');
    const deleteResult = await EditorChatService.deleteConversation(PROJECT_NAME, conversationId);
    
    if (!deleteResult.success) {
      console.error('- Error al eliminar conversación:', deleteResult.error);
      return { success: false, error: deleteResult.error };
    }
    
    // console.log('- Conversación eliminada correctamente');
    
    return { success: true, saveResult, listResult, loadResult, stepsResult, deleteResult };
  } catch (error) {
    console.error('- Error en la prueba de persistencia:', error);
    return { success: false, error: error.message };
  }
}

// Exportar función para uso en navegador o consola
window.runIntegrationTests = runIntegrationTests;

// Exportar para uso como módulo
export { 
  runIntegrationTests, 
  testChatService, 
  testFileEditing, 
  testConversationPersistence 
};