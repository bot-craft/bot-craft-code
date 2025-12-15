class EditorChatService {
  // URL base para las peticiones al backend de Taskyto
  static API_BASE_URL = process.env.REACT_APP_API_URL || `http://${process.env.REACT_APP_IP_ADDRESS}:4000`;
  
  /**
   * Envía un mensaje al asistente de Taskyto
   * 
   * @param {string} message - Mensaje del usuario
   * @param {Object} context - Contexto del proyecto (archivos, contenido actual, etc.)
   * @param {Function} onStreamChunk - Callback para manejar streaming (opcional)
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async sendMessage(message, api_key, conversationId = null, onStreamChunk = null, context = {}) {
    try {
      // Preparar datos para la petición
      const requestData = {
        prompt: message,
        context: {
          projectFiles: context.projectFiles || [],
          currentFile: context.currentFile || null,
          currentFileContent: context.currentFileContent || null,
          conversationId: conversationId
        },
        api_key: api_key || null,
      };
      
      // Si no necesitamos streaming
      if (!onStreamChunk) {
        const response = await fetch(`${this.API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Unknown error occurred');
        }
        
        return {
          success: true,
          answer: data.response,
          processing_time: data.processing_time_seconds
        };
      } 
      // Si necesitamos streaming
      else {
        // Implementación futura: conexión por WebSockets o SSE
        // Por ahora realizamos una solicitud no-streaming y simulamos streaming
        const response = await fetch(`${this.API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Unknown error occurred');
        }
        
        // Simulación de streaming (dividir la respuesta en pedazos)
        if (data.response && onStreamChunk) {
          const chunks = this._simulateStreaming(data.response);
          for (const chunk of chunks) {
            onStreamChunk(chunk);
            // Esperar un poco entre chunks para simular latencia
            await new Promise(r => setTimeout(r, 10));
          }
        }
        
        return {
          success: true,
          answer: data.response,
          processing_time: data.processing_time_seconds,
        };
      }
    } catch (error) {
      console.error('Error sending message to assistant:', error);
      return {
        success: false,
        error: error.message || 'Failed to communicate with assistant'
      };
    }
  }
  
  /**
   * Obtiene la lista de archivos del proyecto para proporcionar contexto
   * 
   * @param {string} projectSlug - Identificador del proyecto
   * @returns {Promise<Array>} - Lista de archivos con su estructura
   */
  static async getProjectFiles(projectSlug) {
    try {
      const response = await fetch(`${this.API_BASE_URL.replace(/\/+$/, '')}/api/projects/${projectSlug}/files`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project files: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching project files:', error);
      return [];
    }
  }
  
  /**
   * Obtiene el contenido de un archivo específico
   * 
   * @param {string} projectSlug - Identificador del proyecto
   * @param {string} filePath - Ruta del archivo
   * @returns {Promise<String>} - Contenido del archivo
   */
  static async getFileContent(projectSlug, filePath) {
    try {
      const response = await fetch(
        `${this.API_BASE_URL.replace(/\/+$/, '')}/api/projects/${projectSlug}/files/${filePath}/get`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.status}`);
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching file content:', error);
      return null;
    }
  }
  
  /**
   * Procesa los archivos del proyecto para enviar solo la información relevante
   * @param {Array} fileTree - Árbol de archivos del proyecto
   * @param {string} projectSlug - Slug del proyecto
   * @returns {Promise<Array>} - Lista procesada de archivos con contenido
   */
  static async processProjectFiles(fileTree, projectSlug) {
    if (!fileTree || !fileTree.length) return [];
    
    const processNode = async (node) => {
      if (node.type === 'file') {
        // Solo procesar archivos YAML para el contexto
        if (node.path.endsWith('.yaml') || node.path.endsWith('.yml')) {
          const content = await this.getFileContent(projectSlug, node.path);
          return {
            path: node.path,
            type: 'file',
            name: node.name,
            content
          };
        }
        return {
          path: node.path,
          type: 'file',
          name: node.name
        };
      } else if (node.type === 'directory' && node.children) {
        const processedChildren = await Promise.all(
          node.children.map(child => processNode(child))
        );
        
        return {
          path: node.path,
          type: 'directory',
          name: node.name,
          children: processedChildren.filter(Boolean)
        };
      }
      return null;
    };
    
    const result = await Promise.all(fileTree.map(node => processNode(node)));
    return result.filter(Boolean);
  }
  
  /**
   * Obtiene el historial de conversaciones del almacenamiento local
   * 
   * @returns {Array} - Historial de conversaciones
   */
  static async getConversationHistory() {
    try {
      const history = localStorage.getItem('taskyto-chat-history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }
  }
  
  /**
   * Guarda el historial de conversaciones en el almacenamiento local
   * 
   * @param {Array} messages - Mensajes a guardar
   */
  static saveConversationHistory(messages) {
    try {
      localStorage.setItem('taskyto-chat-history', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }
  
  /**
   * Clears the conversation history on the backend by deleting the chat_history.json file
   * 
   * @returns {Promise<Object>} - Result of the operation
   */
  static async clearConversationHistoryBackend() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/chat/clear-history`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear conversation history: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error clearing backend conversation history:', error);
      throw error;
    }
  }
  
  /**
   * Método auxiliar para simular streaming dividiendo la respuesta en fragmentos
   * @private
   */
  static _simulateStreaming(fullResponse) {
    if (!fullResponse) return [];
    
    // Dividir en palabras, luego reagrupar en fragmentos
    const words = fullResponse.split(' ');
    const chunks = [];
    let currentChunk = '';
    
    words.forEach((word, index) => {
      // Añadir la palabra actual
      currentChunk += (index > 0 ? ' ' : '') + word;
      
      // // Cada 3-5 palabras, enviar un chunk (aleatoriamente para que parezca más natural)
      // if (index > 0 && index % (3 + Math.floor(Math.random() * 5)) === 0) {
      
      // Cada 9-18 palabras, enviar un chunk (aleatoriamente para que parezca más natural)
      if (index > 0 && index % (20 + Math.floor(Math.random() * 50)) === 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
    });
    
    // Añadir el último chunk si hay algo pendiente
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
}

export default EditorChatService;