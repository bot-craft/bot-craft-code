// components/specific/code_editor/yamlEditorConfig.js

export const configureYamlEditor = (monaco, projectSlug, filesRef, moduleHandlers) => {
    const disposables = [];
    let currentModel = null;

    // Función auxiliar para obtener los módulos existentes
    const getExistingModules = () => {
        if (!filesRef.current) return [];
        
        const processFiles = (fileList, currentPath = '') => {
            return fileList.flatMap(file => {
                if (file.children) {
                    return processFiles(file.children, `${currentPath}${file.name}/`);
                }
                if (file.path.endsWith('.yaml')) {
                    const moduleName = file.name.replace('.yaml', '');
                    // Remove projectSlug from currentPath if it exists
                    const cleanPath = currentPath.startsWith(projectSlug + '/') 
                        ? currentPath.slice(projectSlug.length + 1) 
                        : currentPath.split('/').slice(1).join('/');
                    return cleanPath ? [`${cleanPath}${moduleName}`] : [moduleName];
                }
                return [];
            });
        };

        return processFiles(filesRef.current);
    };

    // Validación de referencias
    const validateReferences = (model) => {
        if (!model) return;
        currentModel = model;
        
        const markers = [];
        const existingModules = getExistingModules();
        const allLines = model.getLinesContent();

        // console.log("existingModules: ", existingModules);
        
        // === PARTE 1: Validar secciones "references:" (lista de referencias) ===
        // Encontrar todas las líneas "references:"
        const refLines = allLines.map((l, i) => ({
            indent: l.match(/^\s*/)[0].length,
            hasRef: l.includes('references:'),
            lineNumber: i + 1
        })).filter(l => l.hasRef);
        
        if (refLines.length > 0) {
            // Validar referencias para cada sección de referencias
            refLines.forEach(refLine => {
                let inReferences = false;
                let currentIndent = refLine.indent;
                
                allLines.forEach((line, index) => {
                    const lineNumber = index + 1;
                    const indent = line.match(/^\s*/)[0].length;
                    
                    if (lineNumber === refLine.lineNumber) {
                        inReferences = true;
                        return;
                    }
                    
                    if (inReferences && indent <= currentIndent) {
                        inReferences = false;
                        return;
                    }
                    
                    if (inReferences) {
                        const match = line.match(/^\s*-\s*([\w/]+)/);
                        if (match) {
                            const modulePath = match[1];
                            const moduleExists = existingModules.some(m => {
                                // Normalizar las rutas para comparación
                                const normalizedExisting = m.replace(/\.yaml$/, '');
                                return normalizedExisting === modulePath;
                            });

                            if (!moduleExists) {
                                const markerData = {
                                    moduleName: modulePath.split('/').pop(),
                                    modulePath: modulePath,
                                    isRelativePath: modulePath.includes('/')
                                };

                                markers.push({
                                    severity: monaco.MarkerSeverity.Error,
                                    message: `Module '${modulePath}' does not exist`,
                                    startLineNumber: lineNumber,
                                    startColumn: line.indexOf(modulePath) + 1,
                                    endLineNumber: lineNumber,
                                    endColumn: line.indexOf(modulePath) + modulePath.length + 1,
                                    code: 'missing-module',
                                    source: 'yaml-validator',
                                    // Usar relatedInformation para preservar los datos
                                    relatedInformation: [{
                                        message: JSON.stringify(markerData),
                                        resource: model.uri,
                                        startLineNumber: lineNumber,
                                        startColumn: line.indexOf(modulePath) + 1
                                    }]
                                });
                            }
                        }
                    }
                });
            });
        }
        
        // === PARTE 2: Validar campos "reference:" (referencia única) ===
        // Encontrar todas las líneas "reference:"
        const singleRefLines = allLines.map((line, index) => {
            const match = line.match(/^(\s*)reference\s*:\s*([\w/]+)\s*$/);
            if (match) {
                const indent = match[1].length;
                const modulePath = match[2];
                return {
                    lineNumber: index + 1,
                    indent,
                    modulePath
                };
            }
            return null;
        }).filter(Boolean);
        
        // Validar cada referencia única
        singleRefLines.forEach(refInfo => {
            const { lineNumber, modulePath } = refInfo;
            
            const moduleExists = existingModules.some(m => {
                const normalizedExisting = m.replace(/\.yaml$/, '');
                return normalizedExisting === modulePath;
            });
            
            if (!moduleExists) {
                const markerData = {
                    moduleName: modulePath.split('/').pop(),
                    modulePath: modulePath,
                    isRelativePath: modulePath.includes('/')
                };
                
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: `Module '${modulePath}' does not exist`,
                    startLineNumber: lineNumber,
                    startColumn: allLines[lineNumber - 1].indexOf(modulePath) + 1,
                    endLineNumber: lineNumber,
                    endColumn: allLines[lineNumber - 1].indexOf(modulePath) + modulePath.length + 1,
                    code: 'missing-module', // Mismo código para aprovechar el mismo quick fix
                    source: 'yaml-validator',
                    relatedInformation: [{
                        message: JSON.stringify(markerData),
                        resource: model.uri,
                        startLineNumber: lineNumber,
                        startColumn: allLines[lineNumber - 1].indexOf(modulePath) + 1
                    }]
                });
            }
        });

        monaco.editor.setModelMarkers(model, 'yaml-validator', markers);
    };

    const dg_action_keywords = new Set(["type", "examples", "values", "required"]);

    // Objeto con las palabras clave válidas por tipo de módulo
    const validKeywordsByType = {
        menu: new Set([
            'modules', 'name', 'kind', 'presentation', 'fallback', 
            'items', 'title', 'answer', 'reference', 'references', 
            'memory', 'goback'
        ]),
        question_answering: new Set([
            'name', 'kind', 'description', 'questions', 'question',
            'answer', 'on-success', 'execute', 'language', 'code',
            'response', 'text', 'rephrase'
        ]),
        data_gathering: new Set([
            'name', 'kind', 'description', 'on-success', 'execute',
            'language', 'code', 'response', 'text', 'data', 'rephrase',
            ...dg_action_keywords
        ]),
        action: new Set([
            'name', 'kind', 'description', 'on-success', 'execute',
            'language', 'code', 'response', 'text', 'data', 'rephrase',
            ...dg_action_keywords
        ])
    };

    // Función para validar las palabras clave del módulo
    const validateModuleKeywords = (model) => {
        if (!model) return;
        
        const markers = [];
        const allLines = model.getLinesContent();

        let inMultilineBlock = false;
        let multilineIndent = 0;
        let inTextField = false;
        let textIndent = 0;

        let moduleType = null;
        let minIndent = Infinity;

        // Detectar kind principal
        allLines.forEach((line) => {
            const kindMatch = line.match(/^(\s*)kind\s*:\s*(\w+)\s*$/);
            if (kindMatch) {
                const [, indent, type] = kindMatch;
                if (indent.length < minIndent) {
                    minIndent = indent.length;
                    moduleType = type;
                }
            }
        });

        if (!moduleType || !validKeywordsByType[moduleType]) return markers;
        
        // Extraer los campos de datos solo si es un módulo de tipo data_gathering o action
        let dataFields = new Set();
        if (moduleType === 'data_gathering' || moduleType === 'action') {
            dataFields = extractDataFields(model);
        }

        allLines.forEach((line, index) => {
            // ... código existente para detectar palabras clave inválidas ...
            
            // Gestión de bloques multiline
            if (!inMultilineBlock) {
                // Detectar si estamos en un bloque de texto
                const textMatch = line.match(/^(\s*)text\s*:\s*(\|)?/);
                if (textMatch) {
                    inTextField = true;
                    textIndent = textMatch[1].length;
                    
                    // Si no tiene pipe, analizar esta línea también
                    if (!textMatch[2]) {
                        validateTextVariables(line, index, dataFields, markers, model, monaco);
                    }
                    return;
                }
                
                // Detectar inicio de bloque multiline
                const blockStart = line.match(/^(\s*)(\w+)\s*:\s*\|/);
                if (blockStart) {
                    const [ , indent, keyword ] = blockStart;
                    
                    // Si es un bloque de texto, marcarlo
                    if (keyword === 'text') {
                        inTextField = true;
                        textIndent = indent.length;
                    }
                    
                    // Subrayar si la clave no es válida
                    if (keyword !== 'kind' && !validKeywordsByType[moduleType].has(keyword)) {
                        markers.push({
                            severity: monaco.MarkerSeverity.Warning,
                            message: `Invalid keyword '${keyword}' for ${moduleType} module`,
                            startLineNumber: index + 1,
                            startColumn: indent.length + 1,
                            endLineNumber: index + 1,
                            endColumn: indent.length + keyword.length + 1,
                            code: 'invalid-keyword',
                            source: 'yaml-validator',
                            relatedInformation: [{
                                message: JSON.stringify({
                                    keyword,
                                    suggestion: '' // No hay sugerencia
                                }),
                                resource: model.uri,
                                startLineNumber: index + 1,
                                startColumn: indent.length + 1
                            }]
                        });
                    }

                    inMultilineBlock = true;
                    multilineIndent = indent.length;
                    return;
                }
            } else if (inTextField) {
                // Verificar si seguimos en el bloque de texto
                const indent = line.match(/^(\s*)/)[1].length;
                
                // Si tiene menor o igual indentación, salimos del bloque de texto
                if (indent <= textIndent) {
                    inTextField = false;
                } else {
                    // Analizar variables en la línea del bloque de texto
                    validateTextVariables(line, index, dataFields, markers, model, monaco);
                    return;
                }
            }
            
            // Ignorar líneas dentro del bloque multiline que no son de texto
            if (inMultilineBlock) {
                // Detectar si aparece una nueva clave con igual o menor indentación
                const nextKey = line.match(/^(\s*)(\w+)\s*:/);
                if (nextKey && nextKey[1].length <= multilineIndent) {
                    inMultilineBlock = false;
                    inTextField = false; // También salimos del campo de texto
                } else {
                    return;
                }
            }

            // Validación normal si no es multiline
            const keywordMatch = line.match(/^(\s*)(\w+)\s*:/);
            if (keywordMatch) {
                const [, indent, keyword] = keywordMatch;
                if (keyword === 'kind' || validKeywordsByType[moduleType].has(keyword)) {
                    // Si es 'text' sin pipe, analizar por variables
                    if (keyword === 'text' && moduleType === 'data_gathering' || moduleType === 'action') {
                        validateTextVariables(line, index, dataFields, markers, model, monaco);
                    }
                    return;
                }

                markers.push({
                    severity: monaco.MarkerSeverity.Warning,
                    message: `Invalid keyword '${keyword}' for ${moduleType} module`,
                    startLineNumber: index + 1,
                    startColumn: indent.length + 1,
                    endLineNumber: index + 1,
                    endColumn: indent.length + keyword.length + 1,
                    code: 'invalid-keyword',
                    source: 'yaml-validator',
                    relatedInformation: [{
                        message: JSON.stringify({ keyword, suggestion: '' }),
                        resource: model.uri,
                        startLineNumber: index + 1,
                        startColumn: indent.length + 1
                    }]
                });
            }
        });

        const existingMarkers = monaco.editor.getModelMarkers({ owner: 'yaml-validator' });
        const referenceMarkers = existingMarkers.filter(m => m.code === 'missing-module');
        monaco.editor.setModelMarkers(model, 'yaml-validator', [...markers, ...referenceMarkers]);
    };

    // Modificamos la función validateTextVariables para capturar y preservar el contenido completo
    const validateTextVariables = (line, lineIndex, dataFields, markers, model, monaco) => {
        // Expresión regular para encontrar variables entre llaves
        const variableRegex = /\{([^{}]+)\}/g;
        let match;
        
        // Si no hay campos de datos definidos o la línea no contiene llaves, salir
        if (dataFields.size === 0 || !line.includes('{')) {
            return;
        }
        
        // Buscar todas las variables entre llaves en la línea
        while ((match = variableRegex.exec(line)) !== null) {
            const varName = match[1].trim();
            const fullMatch = match[0]; // Captura "{variable}"
            const startPos = match.index; // Posición de la llave de apertura
            const endPos = match.index + fullMatch.length; // Posición después de la llave de cierre
            
            // Verificar si la variable existe en dataFields
            if (!dataFields.has(varName)) {
                // Encontrar la sugerencia más cercana
                let closestMatch = '';
                let minDistance = Infinity;
                
                dataFields.forEach(field => {
                    const distance = levenshteinDistance(varName, field);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestMatch = field;
                    }
                });
                
                // Crear un marker para la variable no reconocida que incluya las llaves
                markers.push({
                    severity: monaco.MarkerSeverity.Warning,
                    message: `Variable '${varName}' not defined in data section`,
                    startLineNumber: lineIndex + 1,
                    startColumn: startPos + 1, // +1 porque Monaco usa índices basados en 1
                    endLineNumber: lineIndex + 1,
                    endColumn: endPos + 1,
                    code: 'unknown-variable',
                    source: 'yaml-validator',
                    relatedInformation: [{
                        message: JSON.stringify({
                            variable: varName,
                            suggestion: closestMatch,
                            fullReplacement: `{${closestMatch}}`,
                            originalSpacing: fullMatch  // Guardar el formato original para preservar espacios
                        }),
                        resource: model.uri,
                        startLineNumber: lineIndex + 1,
                        startColumn: startPos + 1
                    }]
                });
            }
        }
    };

    // Eliminar el MutationObserver y usar un método público para actualizar
    const updateValidation = () => {
        if (currentModel) {
            validateReferences(currentModel);
        }
    };

    // Single completion provider for 'kind' field
    const kindCompletionProvider = monaco.languages.registerCompletionItemProvider('yaml', {
        triggerCharacters: [':'],
        provideCompletionItems: (model, position) => {
            const line = model.getLineContent(position.lineNumber);
            // Modified regex to be more flexible with whitespace
            const kindPattern = /^\s*kind\s*:/;
            const currentIndent = line.match(/^\s*/)[0].length;

            if (!kindPattern.test(line)) {
                return { suggestions: [] };
            }

            // Find all lines containing 'kind:' in the document
            const allLines = model.getLinesContent();
            const kindIndents = allLines
                .map((line, index) => {
                    const match = kindPattern.test(line);
                    return {
                        indent: line.match(/^\s*/)[0].length,
                        hasKind: match,
                        lineNumber: index + 1,
                        line: line // For debugging
                    };
                })
                .filter(l => l.hasKind);

            // console.log('Found kind declarations:', kindIndents);

            // Check if current line has smallest indent of all kind declarations
            const isLeftmostKind = !kindIndents.some(k => 
                k.lineNumber !== position.lineNumber && k.indent < currentIndent
            );
            
            // console.log('Current indent:', currentIndent, 'Is leftmost kind:', isLeftmostKind);

            const suggestions = isLeftmostKind
                ? ['menu', 'question_answering', 'data_gathering', 'action']
                : ['module', 'sequence', 'answer'];

            return {
                suggestions: suggestions.map(value => ({
                    label: value,
                    kind: monaco.languages.CompletionItemKind.Value,
                    insertText: value,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: line.length + 1,
                        endLineNumber: position.lineNumber,
                        endColumn: line.length + 1
                    }
                }))
            };
        }
    });
    disposables.push(kindCompletionProvider);

    // Referencias completion provider mejorado
    const referencesCompletionProvider = monaco.languages.registerCompletionItemProvider('yaml', {
        triggerCharacters: ['-', ' '],
        provideCompletionItems: (model, position) => {
            const line = model.getLineContent(position.lineNumber);
            const allLines = model.getLinesContent();
            
            // Encontrar la línea "references:" menos indentada
            const refLines = allLines.map((l, i) => ({
                indent: l.match(/^\s*/)[0].length,
                hasRef: l.includes('references:'),
                lineNumber: i + 1
            })).filter(l => l.hasRef);
            
            if (refLines.length === 0) return { suggestions: [] };
            
            const minIndentRef = refLines.reduce((min, curr) => 
                curr.indent < min.indent ? curr : min
            );
            
            // Solo sugerir si estamos en la sección de referencias correcta
            const currentIndent = line.match(/^\s*/)[0].length;
            if (currentIndent <= minIndentRef.indent) return { suggestions: [] };
            
            const existingModules = getExistingModules();
            
            return {
                suggestions: existingModules.map(value => ({
                    label: value,
                    kind: monaco.languages.CompletionItemKind.Reference,
                    insertText: `- ${value}`
                }))
            };
        }
    });
    disposables.push(referencesCompletionProvider);

    // Modificar el code action provider para corregir el problema del quick fix
    const codeActionProvider = monaco.languages.registerCodeActionProvider('yaml', {
        providedCodeActionKinds: ['quickfix'],
        provideCodeActions: (model, range, context) => {
            const actions = [];
            
            context.markers
                .filter(marker => marker.code === 'missing-module')
                .forEach(marker => {
                    const markerData = marker.relatedInformation?.[0] ? 
                        JSON.parse(marker.relatedInformation[0].message) : null;

                    if (!markerData) {
                        console.warn('Marker missing data:', marker);
                        return;
                    }

                    const { moduleName, modulePath, isRelativePath } = markerData;
                    const basePath = isRelativePath ? modulePath.split('/').slice(0, -1).join('/') : '';

                    const action = {
                        title: `Create module '${modulePath}'`,
                        kind: "quickfix",
                        diagnostics: [marker],
                        isPreferred: true,
                        command: {
                            id: 'yaml.createModule',
                            title: 'Create Module',
                            arguments: [{
                                moduleName,
                                modulePath,
                                basePath,
                                moduleType: 'module',
                                fromQuickFix: true
                            }]
                        }
                    };
                    
                    // console.log('Creating action:', action);
                    actions.push(action);
                });
                
            // Añadir acciones para palabras clave inválidas
            context.markers
                .filter(marker => marker.code === 'invalid-keyword')
                .forEach(marker => {
                    const markerData = marker.relatedInformation?.[0] ? 
                        JSON.parse(marker.relatedInformation[0].message) : null;

                    if (!markerData) return;

                    const { keyword, suggestion } = markerData;
                    
                    actions.push({
                        title: `Replace '${keyword}' with '${suggestion}'`,
                        kind: "quickfix",
                        diagnostics: [marker],
                        isPreferred: true,
                        edit: {
                            edits: [{
                                resource: model.uri,
                                edit: {
                                    range: {
                                        startLineNumber: marker.startLineNumber,
                                        startColumn: marker.startColumn,
                                        endLineNumber: marker.endLineNumber,
                                        endColumn: marker.endColumn
                                    },
                                    text: suggestion
                                }
                            }]
                        }
                    });
                });
                
            // Corregir el quick fix para variables desconocidas
            context.markers
                .filter(marker => marker.code === 'unknown-variable')
                .forEach(marker => {
                    const markerData = marker.relatedInformation?.[0] ? 
                        JSON.parse(marker.relatedInformation[0].message) : null;

                    if (!markerData || !markerData.suggestion) return;

                    const { variable, suggestion, originalSpacing } = markerData;
                    
                    // Crear un reemplazo que preserve el formato original 
                    // pero reemplace el nombre de la variable
                    const preservedReplacement = originalSpacing.replace(
                        variable,
                        suggestion
                    );
                    
                    actions.push({
                        title: `Replace '${variable}' with '${suggestion}'`,
                        kind: "quickfix",
                        diagnostics: [marker],
                        isPreferred: true,
                        edit: {
                            edits: [{
                                resource: model.uri,
                                textEdit: {
                                    range: {
                                        startLineNumber: marker.startLineNumber,
                                        startColumn: marker.startColumn - 1, // Para incluir la llave de apertura
                                        endLineNumber: marker.endLineNumber,
                                        endColumn: marker.endColumn + 1 // Para incluir la llave de cierre
                                    },
                                    text: preservedReplacement
                                }
                            }]
                        }
                    });
                });
                
            return {
                actions,
                dispose: () => {}
            };
        }
    });

    // Modificar el registro del comando
    const commandDisposable = monaco.editor.registerCommand('yaml.createModule', (editor, ...args) => {
        // console.log('Command executed with editor:', editor);
        // console.log('Command executed with args:', args);
        
        if (!moduleHandlers) {
            console.warn('Missing moduleHandlers');
            return;
        }

        const commandArgs = args[0];
        // console.log('Command args:', commandArgs);

        if (!commandArgs) {
            console.warn('Missing command arguments');
            return;
        }

        const { moduleName, basePath, moduleType } = commandArgs;
        
        // Primero establecer el nombre y tipo
        moduleHandlers.setModuleName(moduleName);
        // moduleHandlers.setModuleType(moduleType || 'module');
        moduleHandlers.setModuleType('');
        
        // Luego establecer el nodo seleccionado
        moduleHandlers.setSelectedNode({
            type: 'directory',
            path: basePath || '',
            fromQuickFix: true
        });
        
        // Finalmente abrir el diálogo
        moduleHandlers.setModuleDialogOpen(true);
    });

    disposables.push(commandDisposable);

    // Model validation con referencias
    const modelDisposable = monaco.editor.onDidCreateModel((model) => {
        if (model.getLanguageId() !== 'yaml') return;

        currentModel = model;
        const validateDebounced = debounce(() => {
            validateReferences(model);
            validateModuleKeywords(model);
        }, 500);

        const contentChangeDisposable = model.onDidChangeContent(validateDebounced);
        disposables.push(contentChangeDisposable);

        // Validación inicial
        validateReferences(model);
        validateModuleKeywords(model);
    });
    disposables.push(modelDisposable);

    // Función para extraer campos de datos del módulo
    const extractDataFields = (model) => {
        const allLines = model.getLinesContent();
        const fields = new Set();
        let inDataSection = false;
        let dataIndent = 0;
        
        // Primero encontrar el kind menos indentado
        const kindLine = allLines.find(line => /^\s*kind\s*:\s*(action|data_gathering)\s*$/.test(line));
        if (!kindLine) {
          // console.log('No kind line found');
          return fields
        };

        // Buscar la sección data
        allLines.forEach((line, index) => {
            const dataMatch = line.match(/^(\s*)data\s*:/);
            if (dataMatch) {
                inDataSection = true;
                dataIndent = dataMatch[1].length;
                return;
            }

            if (inDataSection) {
                const indent = line.match(/^(\s*)/)[1].length;
                if (indent <= dataIndent) {
                    inDataSection = false;
                    return;
                }

                // Capturar solo campos de primer nivel
                const fieldMatch = line.match(/^\s*-\s*([^:]+):/);
                if (fieldMatch && indent === dataIndent + 2) {
                    fields.add(fieldMatch[1]);
                }
            }
        });

        // console.log('Data fields:', fields);

        return fields;
    };

    // Proveedor de autocompletado para variables en texto
    const textVariablesProvider = monaco.languages.registerCompletionItemProvider('yaml', {
        triggerCharacters: ['{', '}'],
        provideCompletionItems: (model, position) => {
            const line = model.getLineContent(position.lineNumber);
            
            // Verificar si estamos en una sección de texto
            const textPattern = /^\s*text\s*:/;
            if (!textPattern.test(line)) {
                return { suggestions: [] };
            }

            // Extraer campos de datos
            const dataFields = extractDataFields(model);
            const wordUntilPosition = model.getWordUntilPosition(position);
            
            // Crear sugerencias basadas en los campos disponibles
            const suggestions = Array.from(dataFields).map(field => ({
                label: field,
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: field,
                // Calcular la relevancia basada en la similitud con la palabra actual
                sortText: levenshteinDistance(wordUntilPosition.word, field).toString().padStart(5, '0')
            }));

            return { suggestions };
        }
    });
    disposables.push(textVariablesProvider);

    // Función auxiliar para calcular la distancia de Levenshtein
    const levenshteinDistance = (a, b) => {
        if (!a || !b) return 0;
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i-1) === a.charAt(j-1)) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i-1][j-1] + 1,
                        matrix[i][j-1] + 1,
                        matrix[i-1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    };

    return {
        dispose: () => {
            disposables.forEach(d => {
                try {
                    if (d && typeof d.dispose === 'function') {
                        d.dispose();
                    }
                } catch (e) {
                    console.warn('Error disposing editor resource:', e);
                }
            });
            disposables.length = 0;
            currentModel = null;
        },
        updateValidation // Exponemos el método para actualizar validaciones
    };
};

// Helper function
function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}