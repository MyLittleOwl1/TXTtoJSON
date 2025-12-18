    // Elementos del DOM
        document.addEventListener('DOMContentLoaded', function() {
            // Elementos del DOM
            const fileInput = document.getElementById('fileInput');
            const fileNameDisplay = document.getElementById('fileName');
            const txtPreview = document.getElementById('txtPreview');
            const jsonPreview = document.getElementById('jsonPreview');
            const convertBtn = document.getElementById('convertBtn');
            const downloadBtn = document.getElementById('downloadBtn');
            const resetBtn = document.getElementById('resetBtn');
            const jsonTypeSelect = document.getElementById('jsonType');
            const rootNameInput = document.getElementById('rootName');
            const hasHeadersCheckbox = document.getElementById('hasHeaders');
            const delimiterOptions = document.getElementById('delimiterOptions');
            const statusDiv = document.getElementById('status');
            const exampleTabs = document.querySelectorAll('.example-tab');
            
            let fileContent = '';
            let jsonOutput = '';
            let currentFileExtension = '';
            
            // Configurar pestañas de ejemplos
            exampleTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // Quitar clase active de todas las pestañas
                    exampleTabs.forEach(t => t.classList.remove('active'));
                    
                    // Añadir clase active a la pestaña clickeada
                    this.classList.add('active');
                    
                    // Ocultar todos los paneles de ejemplo
                    document.querySelectorAll('.example-pane').forEach(pane => {
                        pane.style.display = 'none';
                    });
                    
                    // Mostrar el panel correspondiente
                    const exampleId = this.getAttribute('data-example');
                    document.getElementById(`example-${exampleId}`).style.display = 'block';
                });
            });
            
            // Mostrar/ocultar opciones de delimitador según si hay encabezados
            hasHeadersCheckbox.addEventListener('change', function() {
                delimiterOptions.style.display = this.checked ? 'block' : 'none';
            });
            
            // Cambiar comportamiento según el tipo de JSON seleccionado
            jsonTypeSelect.addEventListener('change', function() {
                const type = this.value;
                
                // Mostrar advertencia si se selecciona "Objeto con encabezados" pero no se activó la opción de encabezados
                if (type === 'objectWithHeaders' && !hasHeadersCheckbox.checked) {
                    showStatus('Para usar "Objeto con encabezados" activa también "La primera línea contiene encabezados"', 'warning');
                    hasHeadersCheckbox.checked = true;
                    delimiterOptions.style.display = 'block';
                }
            });
            
            // Cuando se selecciona un archivo
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                
                if (!file) {
                    return;
                }
                
                // Obtener extensión del archivo
                const fileName = file.name;
                currentFileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
                
                // Verificar que sea un archivo .txt o .csv
                if (!['.txt', '.csv'].includes(currentFileExtension)) {
                    showStatus('Solo se admiten archivos .txt o .csv', 'error');
                    resetFileInput();
                    return;
                }
                
                // Mostrar nombre del archivo (truncado si es muy largo)
                const displayName = fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
                fileNameDisplay.textContent = `📄 ${displayName} (${currentFileExtension === '.csv' ? 'CSV' : 'TXT'})`;
                
                // Leer el contenido del archivo
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    fileContent = event.target.result;
                    txtPreview.textContent = fileContent.length > 1000 ? fileContent.substring(0, 1000) + '...' : fileContent;
                    convertBtn.disabled = false;
                    showStatus(`✅ Archivo cargado. ${fileContent.split('\n').length} líneas detectadas.`, 'success');
                    
                    // Configurar opciones por defecto según el tipo de archivo
                    configureDefaultsByFileType();
                    
                    // Intentar detectar automáticamente si tiene encabezados y delimitador
                    autoDetectHeadersAndDelimiter();
                };
                
                reader.onerror = function() {
                    showStatus('❌ Error al leer el archivo', 'error');
                    resetFileInput();
                };
                
                reader.readAsText(file, 'UTF-8');
            });
            
            // Configurar opciones por defecto según el tipo de archivo
            function configureDefaultsByFileType() {
                if (currentFileExtension === '.csv') {
                    // Para archivos CSV, por defecto activar encabezados y usar coma como delimitador
                    hasHeadersCheckbox.checked = true;
                    delimiterOptions.style.display = 'block';
                    document.getElementById('delimiterComma').checked = true;
                    jsonTypeSelect.value = 'objectWithHeaders';
                    
                    if (!rootNameInput.value) {
                        rootNameInput.value = 'datos';
                    }
                    
                    showStatus('📊 Archivo CSV detectado. Configuración automática aplicada.', 'warning');
                } else {
                    // Para archivos TXT
                    if (!rootNameInput.value) {
                        rootNameInput.value = 'contenido';
                    }
                }
            }
            
            // Función para detectar automáticamente si el archivo tiene encabezados y el delimitador
            function autoDetectHeadersAndDelimiter() {
                if (!fileContent) return;
                
                const lines = fileContent.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) return;
                
                const firstLine = lines[0].trim();
                const secondLine = lines[1].trim();
                
                // Detectar delimitador común
                const commonDelimiters = [
                    { char: ',', name: 'Comma', radioId: 'delimiterComma' },
                    { char: ';', name: 'Semicolon', radioId: 'delimiterSemicolon' },
                    { char: '\t', name: 'Tab', radioId: 'delimiterTab' },
                    { char: '|', name: 'Pipe', radioId: 'delimiterPipe' }
                ];
                
                // Contar ocurrencias de cada delimitador en la primera línea
                let maxCount = 0;
                let detectedDelimiter = null;
                
                commonDelimiters.forEach(delimiter => {
                    const count = firstLine.split(delimiter.char).length - 1;
                    if (count > maxCount) {
                        maxCount = count;
                        detectedDelimiter = delimiter;
                    }
                });
                
                // Si se detectó un delimitador con al menos 1 ocurrencia en la primera línea
                if (detectedDelimiter && maxCount >= 1) {
                    // Activar encabezados
                    hasHeadersCheckbox.checked = true;
                    delimiterOptions.style.display = 'block';
                    
                    // Seleccionar el delimitador detectado
                    document.getElementById(detectedDelimiter.radioId).checked = true;
                    
                    // Verificar si la segunda línea tiene la misma estructura
                    const secondLineCount = secondLine.split(detectedDelimiter.char).length - 1;
                    if (secondLineCount >= 1) {
                        showStatus(`✅ Detectado: delimitador "${detectedDelimiter.name}" y encabezados`, 'success');
                    }
                }
            }
            
            // Obtener el delimitador seleccionado
            function getDelimiter() {
                const delimiterRadios = document.querySelectorAll('input[name="delimiter"]');
                let selectedDelimiter = ',';
                
                for (const radio of delimiterRadios) {
                    if (radio.checked) {
                        if (radio.value === 'custom') {
                            const customDelimiter = document.getElementById('customDelimiter').value;
                            return customDelimiter || ',';
                        } else if (radio.value === '\\t') {
                            return '\t';
                        }
                        return radio.value;
                    }
                }
                
                return selectedDelimiter;
            }
            
            // Convertir a JSON
            convertBtn.addEventListener('click', function() {
                if (!fileContent) {
                    showStatus('❌ No hay contenido para convertir', 'error');
                    return;
                }
                
                try {
                    const jsonType = jsonTypeSelect.value;
                    const rootName = rootNameInput.value.trim() || (currentFileExtension === '.csv' ? 'datos' : 'contenido');
                    const hasHeaders = hasHeadersCheckbox.checked;
                    const delimiter = getDelimiter();
                    
                    // Dividir el contenido en líneas
                    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line !== '');
                    
                    // Verificar si hay suficientes líneas si se activaron encabezados
                    if (hasHeaders && lines.length < 2) {
                        showStatus('❌ Se necesitan al menos 2 líneas para usar encabezados', 'error');
                        return;
                    }
                    
                    let jsonObject = {};
                    let headers = [];
                    let dataLines = lines;
                    
                    // Si tiene encabezados, extraerlos
                    if (hasHeaders && lines.length > 0) {
                        headers = lines[0].split(delimiter).map(h => h.trim());
                        dataLines = lines.slice(1);
                    }
                    
                    // Crear el objeto JSON según la opción seleccionada
                    switch(jsonType) {
                        case 'object':
                            // Objeto con líneas numeradas
                            const linesObject = {};
                            
                            dataLines.forEach((line, index) => {
                                const lineNum = index + 1;
                                linesObject[`linea_${lineNum}`] = line;
                            });
                            
                            jsonObject = rootName ? { [rootName]: linesObject } : linesObject;
                            break;
                            
                        case 'array':
                            // Array de líneas
                            const linesArray = dataLines.map(line => line);
                            jsonObject = rootName ? { [rootName]: linesArray } : linesArray;
                            break;
                            
                        case 'keyValue':
                            // Pares clave-valor (líneas con formato "clave:valor")
                            const keyValueObject = {};
                            let validKeyValue = true;
                            
                            dataLines.forEach((line, index) => {
                                const parts = line.split(':');
                                if (parts.length >= 2) {
                                    const key = parts[0].trim();
                                    const value = parts.slice(1).join(':').trim();
                                    keyValueObject[key] = value;
                                } else {
                                    // Si no tiene formato clave:valor, usamos un formato alternativo
                                    keyValueObject[`linea_${index + 1}`] = line;
                                    validKeyValue = false;
                                }
                            });
                            
                            if (!validKeyValue) {
                                showStatus('⚠️ Algunas líneas no tenían formato "clave:valor". Se usó formato alternativo.', 'warning');
                            }
                            
                            jsonObject = rootName ? { [rootName]: keyValueObject } : keyValueObject;
                            break;
                            
                        case 'objectWithHeaders':
                            // Objeto con encabezados (tipo tabla)
                            if (!hasHeaders) {
                                showStatus('❌ Para "Objeto con encabezados" activa "La primera línea contiene encabezados"', 'error');
                                return;
                            }
                            
                            const tableData = [];
                            
                            dataLines.forEach(line => {
                                const values = line.split(delimiter).map(v => v.trim());
                                const rowObject = {};
                                
                                // Asignar valores a los encabezados correspondientes
                                headers.forEach((header, index) => {
                                    rowObject[header] = values[index] || '';
                                });
                                
                                tableData.push(rowObject);
                            });
                            
                            jsonObject = rootName ? { [rootName]: tableData } : tableData;
                            break;
                    }
                    
                    // Añadir metadatos
                    if (typeof jsonObject === 'object' && !Array.isArray(jsonObject)) {
                        jsonObject._metadata = {
                            archivo: fileInput.files[0]?.name || 'desconocido',
                            extension: currentFileExtension,
                            fechaConversion: new Date().toLocaleString(),
                            lineasTotales: lines.length,
                            lineasDatos: dataLines.length,
                            tipoConversion: jsonType,
                            tieneEncabezados: hasHeaders
                        };
                        
                        if (hasHeaders) {
                            jsonObject._metadata.encabezados = headers;
                            jsonObject._metadata.delimitador = delimiter === '\t' ? 'TAB' : delimiter;
                        }
                    }
                    
                    // Convertir a cadena JSON formateada
                    jsonOutput = JSON.stringify(jsonObject, null, 2);
                    
                    // Limitar la vista previa para no sobrecargar el móvil
                    const previewJson = jsonOutput.length > 1500 ? jsonOutput.substring(0, 1500) + '...' : jsonOutput;
                    jsonPreview.textContent = previewJson;
                    
                    // Habilitar el botón de descarga
                    downloadBtn.disabled = false;
                    
                    showStatus(`✅ Conversión completada. ${dataLines.length} registros procesados.`, 'success');
                    
                } catch (error) {
                    showStatus(`❌ Error: ${error.message}`, 'error');
                    console.error(error);
                }
            });
            
            // Descargar el JSON
            downloadBtn.addEventListener('click', function() {
                if (!jsonOutput) {
                    showStatus('❌ No hay contenido JSON para descargar', 'error');
                    return;
                }
                
                try {
                    const originalFileName = fileInput.files[0]?.name || 'archivo';
                    const fileName = originalFileName.replace(/\.[^/.]+$/, "") + '.json';
                    
                    // Crear un blob con el contenido JSON
                    const blob = new Blob([jsonOutput], { type: 'application/json' });
                    
                    // Crear un enlace para descargar
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    
                    // Para móviles, necesitamos agregar el enlace al DOM
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    
                    // Limpiar
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    showStatus(`✅ JSON descargado como "${fileName}"`, 'success');
                    
                } catch (error) {
                    showStatus(`❌ Error al descargar: ${error.message}`, 'error');
                }
            });
            
            // Limpiar todo
            resetBtn.addEventListener('click', function() {
                resetFileInput();
                fileContent = '';
                jsonOutput = '';
                txtPreview.textContent = 'El contenido aparecerá aquí...';
                jsonPreview.textContent = 'La salida JSON aparecerá aquí...';
                fileNameDisplay.textContent = 'Ningún archivo seleccionado';
                convertBtn.disabled = true;
                downloadBtn.disabled = true;
                rootNameInput.value = '';
                jsonTypeSelect.value = 'objectWithHeaders';
                hasHeadersCheckbox.checked = true;
                delimiterOptions.style.display = 'block';
                document.getElementById('delimiterComma').checked = true;
                document.getElementById('customDelimiter').value = '';
                currentFileExtension = '';
                hideStatus();
                
                // Mostrar mensaje de confirmación
                showStatus('🔄 Todo limpiado. Puedes cargar un nuevo archivo.', 'success');
            });
            
            // Función para reiniciar el input de archivo
            function resetFileInput() {
                fileInput.value = '';
            }
            
            // Función para mostrar mensajes de estado
            function showStatus(message, type) {
                statusDiv.textContent = message;
                statusDiv.className = 'status ' + type;
                statusDiv.style.display = 'block';
                
                // Ocultar automáticamente después de 5 segundos
                setTimeout(hideStatus, 5000);
            }
            
            // Función para ocultar mensajes de estado
            function hideStatus() {
                statusDiv.style.display = 'none';
            }
            
            // Ejemplo de archivo CSV precargado para demostración
            window.addEventListener('load', function() {
                const demoContent = `Nombre,Edad,Ciudad,Profesion
Juan Pérez,30,Madrid,Desarrollador
María García,25,Barcelona,Diseñadora
Carlos López,35,Valencia,Ingeniero
Ana Martínez,28,Sevilla,Arquitecta`;

                txtPreview.textContent = demoContent;
                fileContent = demoContent;
                currentFileExtension = '.csv';
                convertBtn.disabled = false;
                fileNameDisplay.textContent = "📄 ejemplo.csv (CSV) - Toca para cargar tu archivo";
                hasHeadersCheckbox.checked = true;
                delimiterOptions.style.display = 'block';
                document.getElementById('delimiterComma').checked = true;
                jsonTypeSelect.value = 'objectWithHeaders';
                rootNameInput.value = 'datos';
                showStatus("✅ Ejemplo cargado. Toca 'Convertir a JSON' para probar.", "success");
            });
        });
