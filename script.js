// =========================================================
// CLASIFICADOR DE MOVIMIENTO OSCILATORIO - VERSIÓN MEJORADA
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // --- ML Variables ---
    const TM_MODEL_URL = "https://teachablemachine.withgoogle.com/models/Kc7rWFMTA/";
    const IMAGE_SIZE = 224;
    let model, maxPredictions;
    let clasificacionActual = "";
    let confianzaClasificacion = 0;

    // --- Referencias HTML ---
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    const selectFileBtn = document.getElementById('selectFileBtn'); 
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.querySelector('.flex.flex-col.items-center.gap-6.rounded-xl.border-2'); 
    
    const resultArea = document.getElementById('result-area');
    const uploadedImageElement = document.getElementById("uploaded-image");
    const labelContainer = document.getElementById("label-container");
    
    const parametrosSection = document.getElementById('parametros-section');
    const tipoMovimientoDetectado = document.getElementById('tipo-movimiento-detectado');
    const betaContainer = document.getElementById('beta-container');
    const btnCalcular = document.getElementById('btnCalcular');
    const resultadoParametros = document.getElementById('resultadoParametros');

    // --- Canvas Setup ---
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_SIZE;
    canvas.height = IMAGE_SIZE;
    const ctx = canvas.getContext('2d');
    
    // =========================================================
    // MEJORA 1: GESTIÓN DE ESTADO GLOBAL
    // =========================================================
    const AppState = {
        modeloListo: false,
        imagenCargada: false,
        clasificacionCompleta: false,
        datos: {}
    };

    // =========================================================
    // FUNCIONALIDAD DEL MENÚ MÓVIL
    // =========================================================
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            const icon = menuToggle.querySelector('.material-symbols-outlined');
            icon.textContent = mobileMenu.classList.contains('hidden') ? 'menu' : 'close';
        });

        // Cerrar menú al hacer clic en un enlace
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuToggle.querySelector('.material-symbols-outlined').textContent = 'menu';
            });
        });
    }

    // =========================================================
    // MEJORA 2: VALIDACIÓN MEJORADA Y FEEDBACK VISUAL
    // =========================================================
    
    if (selectFileBtn && fileInput) {
        selectFileBtn.addEventListener('click', function() { fileInput.click(); });
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length > 0) { 
                handleFileUpload(fileInput.files[0]); 
            }
        });
    }
    
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { 
            dropArea.addEventListener(eventName, preventDefaults, false); 
        });
        
        function preventDefaults(e) { 
            e.preventDefault(); 
            e.stopPropagation(); 
        }
        
        // Feedback visual mejorado para drag & drop
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('border-primary', 'bg-primary/5');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('border-primary', 'bg-primary/5');
            }, false);
        });
        
        dropArea.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            if (dt.files.length > 0) { 
                handleFileUpload(dt.files[0]); 
            }
        }, false);
    }

    function handleFileUpload(file) {
        if (!validateFile(file)) { return; }
        
        // Mostrar indicador de carga mejorado
        resultArea.style.display = 'block';
        labelContainer.innerHTML = `
            <div class="flex flex-col items-center gap-3">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Procesando imagen...</p>
            </div>
        `;
        
        const fileURL = URL.createObjectURL(file);
        uploadedImageElement.src = fileURL;
        
        uploadedImageElement.onload = () => {
            AppState.imagenCargada = true;
            processAndPredict(uploadedImageElement);
        };

        uploadedImageElement.onerror = () => {
            mostrarError('Error al cargar la imagen. Intenta con otro archivo.');
        };
        
        fileInput.value = ""; 
    }
    
    function validateFile(file) {
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; 
        
        if (file.size > MAX_SIZE) { 
            mostrarNotificacion('El tamaño máximo de imagen es 50MB.', 'error');
            return false; 
        }
        if (!SUPPORTED_TYPES.includes(file.type)) { 
            mostrarNotificacion('Formato no soportado. Use JPG, PNG, GIF o WEBP.', 'error');
            return false; 
        }
        return true;
    }

    // =========================================================
    // MEJORA 3: SISTEMA DE NOTIFICACIONES
    // =========================================================
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const colores = {
            error: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-500 text-red-800 dark:text-red-200',
            success: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-500 text-green-800 dark:text-green-200',
            info: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-500 text-blue-800 dark:text-blue-200',
            warning: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-500 text-yellow-800 dark:text-yellow-200'
        };

        const iconos = {
            error: 'error',
            success: 'check_circle',
            info: 'info',
            warning: 'warning'
        };

        const notificacion = document.createElement('div');
        notificacion.className = `fixed top-20 right-4 z-50 p-4 rounded-lg border-2 ${colores[tipo]} shadow-lg flex items-center gap-3 max-w-md animate-slide-in`;
        notificacion.innerHTML = `
            <span class="material-symbols-outlined">${iconos[tipo]}</span>
            <p class="text-sm font-medium">${mensaje}</p>
            <button class="ml-auto" onclick="this.parentElement.remove()">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
        `;

        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.style.opacity = '0';
            notificacion.style.transform = 'translateX(100%)';
            setTimeout(() => notificacion.remove(), 300);
        }, 5000);
    }

    // =========================================================
    // MEJORA 4: CARGA OPTIMIZADA DEL MODELO CON RETRY
    // =========================================================
    async function init(intentos = 3) {
        const modelURL = TM_MODEL_URL + "model.json";
        const metadataURL = TM_MODEL_URL + "metadata.json";

        for (let i = 0; i < intentos; i++) {
            try {
                labelContainer.innerHTML = `
                    <div class="flex flex-col items-center gap-3">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p class="text-sm">Cargando modelo de IA... (Intento ${i + 1}/${intentos})</p>
                    </div>
                `;
                
                model = await tmImage.load(modelURL, metadataURL);
                maxPredictions = model.getTotalClasses();
                AppState.modeloListo = true;
                
                labelContainer.innerHTML = `
                    <div class="flex items-center gap-3 text-green-600 dark:text-green-400">
                        <span class="material-symbols-outlined text-3xl">check_circle</span>
                        <p class="text-lg font-semibold">Modelo cargado. Listo para clasificar.</p>
                    </div>
                `;
                
                mostrarNotificacion('Modelo de IA cargado exitosamente', 'success');
                return;
                
            } catch (error) {
                console.error(`Intento ${i + 1} fallido:`, error);
                
                if (i === intentos - 1) {
                    labelContainer.innerHTML = `
                        <div class="flex flex-col items-center gap-3 text-red-600 dark:text-red-400">
                            <span class="material-symbols-outlined text-3xl">error</span>
                            <p class="font-semibold">Error al cargar el modelo</p>
                            <p class="text-sm">Verifica tu conexión a internet</p>
                            <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                                Reintentar
                            </button>
                        </div>
                    `;
                    mostrarNotificacion('Error al cargar el modelo de IA. Revisa tu conexión.', 'error');
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2s antes de reintentar
                }
            }
        }
    }

    // =========================================================
    // MEJORA 5: PREDICCIÓN CON MÚLTIPLES MÉTRICAS
    // =========================================================
    async function processAndPredict(imageElement) {
        if (!model) {
            labelContainer.innerHTML = 'Modelo no cargado. Intentando inicializar...';
            await init(); 
            if (!model) return;
        }

        labelContainer.innerHTML = `
            <div class="flex flex-col items-center gap-3">
                <div class="animate-pulse">
                    <span class="material-symbols-outlined text-5xl text-primary">psychology</span>
                </div>
                <p class="text-sm">Analizando con IA...</p>
            </div>
        `;
        
        ctx.drawImage(imageElement, 0, 0, IMAGE_SIZE, IMAGE_SIZE); 
        await predict(canvas); 
    }

    async function predict(inputElement) { 
        const prediction = await model.predict(inputElement);
        
        // Ordenar predicciones por probabilidad
        const sortedPredictions = prediction
            .map((p, i) => ({ ...p, index: i }))
            .sort((a, b) => b.probability - a.probability);
        
        const bestPrediction = sortedPredictions[0];
        const secondBest = sortedPredictions[1];
        
        clasificacionActual = bestPrediction.className;
        confianzaClasificacion = bestPrediction.probability;
        
        // Determinar nivel de confianza
        let nivelConfianza, colorConfianza, mensajeConfianza;
        if (confianzaClasificacion >= 0.85) {
            nivelConfianza = 'Alta';
            colorConfianza = 'text-green-600 dark:text-green-400';
            mensajeConfianza = 'La clasificación es muy confiable';
        } else if (confianzaClasificacion >= 0.70) {
            nivelConfianza = 'Media';
            colorConfianza = 'text-yellow-600 dark:text-yellow-400';
            mensajeConfianza = 'La clasificación es moderadamente confiable';
        } else {
            nivelConfianza = 'Baja';
            colorConfianza = 'text-red-600 dark:text-red-400';
            mensajeConfianza = 'Considera tomar una mejor foto';
        }
        
        // Mostrar resultados mejorados
        labelContainer.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-lg">
                    <span class="material-symbols-outlined text-4xl text-primary">verified</span>
                    <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Clasificación Detectada:</p>
                        <p class="text-2xl font-black text-gray-900 dark:text-white">${bestPrediction.className}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="bg-gray-100 dark:bg-white/5 p-3 rounded-lg">
                        <p class="text-gray-600 dark:text-gray-400 mb-1">Confianza</p>
                        <p class="text-xl font-bold ${colorConfianza}">${(confianzaClasificacion * 100).toFixed(1)}%</p>
                        <p class="text-xs text-gray-500 mt-1">${mensajeConfianza}</p>
                    </div>
                    
                    <div class="bg-gray-100 dark:bg-white/5 p-3 rounded-lg">
                        <p class="text-gray-600 dark:text-gray-400 mb-1">Segunda opción</p>
                        <p class="text-sm font-bold text-gray-700 dark:text-gray-300">${secondBest.className}</p>
                        <p class="text-xs text-gray-500 mt-1">${(secondBest.probability * 100).toFixed(1)}%</p>
                    </div>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                    <p class="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Tip:</strong> Si la confianza es baja, intenta con mejor iluminación o un fondo más limpio.
                    </p>
                </div>
            </div>
        `;
        
        AppState.clasificacionCompleta = true;
        mostrarFormularioParametros(bestPrediction.className);
    }

    function mostrarFormularioParametros(tipoMovimiento) {
        parametrosSection.style.display = 'block';
        tipoMovimientoDetectado.textContent = tipoMovimiento;
        
        // Mostrar/ocultar campo de amortiguamiento
        const esAmortiguado = tipoMovimiento.toLowerCase().includes('moa') || 
                             tipoMovimiento.toLowerCase().includes('amortiguado') ||
                             tipoMovimiento.toLowerCase().includes('subamortiguado') ||
                             tipoMovimiento.toLowerCase().includes('crítico') ||
                             tipoMovimiento.toLowerCase().includes('sobreamortiguado');
        
        betaContainer.style.display = esAmortiguado ? 'block' : 'none';
        
        // Scroll suave
        setTimeout(() => {
            parametrosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }

    // =========================================================
    // MEJORA 6: AUTO-CÁLCULO EN TIEMPO REAL
    // =========================================================
    const inputs = ['amplitud', 'frecuencia', 'omega', 'periodo', 'masa', 'beta'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', () => {
                // Calcular valores relacionados automáticamente
                autoCalcularParametros();
            });
        }
    });

    function autoCalcularParametros() {
        const f = parseFloat(document.getElementById('frecuencia').value) || null;
        const omega = parseFloat(document.getElementById('omega').value) || null;
        const T = parseFloat(document.getElementById('periodo').value) || null;

        const PI = Math.PI;

        // Auto-completar frecuencia, periodo y omega
        if (f && !omega && !T) {
            document.getElementById('omega').value = (2 * PI * f).toFixed(4);
            document.getElementById('periodo').value = (1 / f).toFixed(4);
        } else if (omega && !f && !T) {
            document.getElementById('frecuencia').value = (omega / (2 * PI)).toFixed(4);
            document.getElementById('periodo').value = (2 * PI / omega).toFixed(4);
        } else if (T && !f && !omega) {
            document.getElementById('frecuencia').value = (1 / T).toFixed(4);
            document.getElementById('omega').value = (2 * PI / T).toFixed(4);
        }
    }

    // =========================================================
    // MEJORA 7: VALIDACIÓN AVANZADA Y CÁLCULOS MEJORADOS
    // =========================================================
    if (btnCalcular) {
        btnCalcular.addEventListener('click', calcularMovimiento);
    }

    function calcularMovimiento() {
        // Limpiar mensajes previos
        resultadoParametros.classList.add('hidden');

        const A = parseFloat(document.getElementById('amplitud').value) || null;
        const f = parseFloat(document.getElementById('frecuencia').value) || null;
        const omega = parseFloat(document.getElementById('omega').value) || null;
        const T = parseFloat(document.getElementById('periodo').value) || null;
        const m = parseFloat(document.getElementById('masa').value) || null;
        const beta = parseFloat(document.getElementById('beta').value) || null;

        // Validaciones mejoradas
        const errores = [];
        
        if (!A) {
            errores.push('La amplitud es obligatoria');
        } else if (A <= 0) {
            errores.push('La amplitud debe ser mayor que cero');
        }

        if (!f && !omega && !T) {
            errores.push('Debes ingresar al menos uno: frecuencia, periodo o frecuencia angular');
        }

        if (f && f <= 0) errores.push('La frecuencia debe ser positiva');
        if (omega && omega <= 0) errores.push('La frecuencia angular debe ser positiva');
        if (T && T <= 0) errores.push('El periodo debe ser positivo');
        if (m && m <= 0) errores.push('La masa debe ser positiva');
        if (beta && beta < 0) errores.push('El coeficiente de amortiguamiento no puede ser negativo');

        if (errores.length > 0) {
            mostrarError(errores.join('. ') + '.');
            return;
        }

        try {
            const parametros = calcularParametrosCompletos(A, f, omega, T, m, beta);
            
            // Validar coherencia física
            if (parametros.esAmortiguado && parametros.tipoAmortiguamiento === 'Subamortiguado') {
                if (parametros.beta >= parametros.omega) {
                    throw new Error('Para subamortiguamiento, β debe ser menor que ω₀');
                }
            }
            
            // Guardar datos mejorados
            const datosAnalisis = {
                clasificacion: clasificacionActual,
                confianza: confianzaClasificacion,
                parametros: parametros,
                imagenURL: uploadedImageElement.src,
                timestamp: new Date().toISOString()
            };

            localStorage.setItem('datosAnalisis', JSON.stringify(datosAnalisis));
            
            mostrarNotificacion('Cálculos completados exitosamente', 'success');
            
            setTimeout(() => {
                window.location.href = 'analisis.html';
            }, 500);
            
        } catch (error) {
            mostrarError(error.message);
        }
    }

    function calcularParametrosCompletos(A, f, omega, T, m, beta) {
        const PI = Math.PI;
        const G = 9.81; // Gravedad estándar
        let resultado = {};

        // PASO 1: Calcular parámetros temporales
        if (f) {
            resultado.frecuencia = f;
            resultado.periodo = 1 / f;
            resultado.omega = 2 * PI * f;
        } else if (T) {
            resultado.periodo = T;
            resultado.frecuencia = 1 / T;
            resultado.omega = 2 * PI / T;
        } else if (omega) {
            resultado.omega = omega;
            resultado.frecuencia = omega / (2 * PI);
            resultado.periodo = 2 * PI / omega;
        }

        resultado.amplitud = A;

        // PASO 2: Magnitudes cinemáticas
        resultado.velocidadMaxima = resultado.omega * A;
        resultado.aceleracionMaxima = Math.pow(resultado.omega, 2) * A;

        // PASO 3: Análisis energético
        if (m) {
            resultado.masa = m;
            resultado.energiaTotal = 0.5 * m * Math.pow(resultado.omega, 2) * Math.pow(A, 2);
            resultado.energiaCineticaMaxima = resultado.energiaTotal;
            resultado.energiaPotencialMaxima = resultado.energiaTotal;
            
            // Constante de resorte equivalente (si aplica)
            resultado.constanteResorte = m * Math.pow(resultado.omega, 2);
            
            // Longitud de péndulo equivalente (si aplica)
            resultado.longitudPendulo = G / Math.pow(resultado.omega, 2);
        }

        // PASO 4: Análisis de amortiguamiento
        if (beta !== null && beta > 0) {
            resultado.beta = beta;
            resultado.esAmortiguado = true;
            
            const omega0 = resultado.omega;
            resultado.omega0 = omega0;
            
            const discriminante = Math.pow(omega0, 2) - Math.pow(beta, 2);
            
            if (discriminante > 0) {
                resultado.tipoAmortiguamiento = 'Subamortiguado';
                resultado.omegaAmortiguado = Math.sqrt(discriminante);
                resultado.frecuenciaAmortiguada = resultado.omegaAmortiguado / (2 * PI);
                resultado.periodoAmortiguado = 2 * PI / resultado.omegaAmortiguado;
                
                // Decremento logarítmico
                resultado.decrementoLogaritmico = 2 * PI * beta / resultado.omegaAmortiguado;
                
                // Factor de calidad
                resultado.factorCalidad = omega0 / (2 * beta);
                
                // Número de oscilaciones antes de reducirse a 1/e
                resultado.numeroOscilaciones = 1 / resultado.decrementoLogaritmico;
                
            } else if (Math.abs(discriminante) < 0.0001) {
                resultado.tipoAmortiguamiento = 'Críticamente Amortiguado';
                resultado.omegaAmortiguado = 0;
                resultado.betaCritico = omega0;
                
            } else {
                resultado.tipoAmortiguamiento = 'Sobreamortiguado';
                resultado.gamma1 = beta + Math.sqrt(Math.pow(beta, 2) - Math.pow(omega0, 2));
                resultado.gamma2 = beta - Math.sqrt(Math.pow(beta, 2) - Math.pow(omega0, 2));
            }
            
            // Tiempo de relajación
            resultado.tiempoRelajacion = 1 / beta;
            
            // Coeficiente de amortiguamiento viscoso (si hay masa)
            if (m) {
                resultado.coeficienteAmortiguamiento = 2 * m * beta;
            }
            
        } else {
            resultado.esAmortiguado = false;
            resultado.tipoAmortiguamiento = 'Sin Amortiguamiento (MAS Ideal)';
        }

        return resultado;
    }

    function mostrarError(mensaje) {
        resultadoParametros.classList.remove('hidden');
        resultadoParametros.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-red-500 text-2xl">error</span>
                <div class="flex-1">
                    <p class="font-bold text-lg mb-2">Error en los datos ingresados</p>
                    <p class="text-sm">${mensaje}</p>
                </div>
            </div>
        `;
        resultadoParametros.scrollIntoView({ behavior: 'smooth' });
        mostrarNotificacion(mensaje, 'error');
    }

    // =========================================================
    // MEJORA 8: ATAJOS DE TECLADO
    // =========================================================
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + U para subir archivo
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            fileInput?.click();
        }
        
        // Enter para calcular si el formulario está visible
        if (e.key === 'Enter' && parametrosSection?.style.display !== 'none') {
            const focusedElement = document.activeElement;
            if (focusedElement.tagName === 'INPUT') {
                e.preventDefault();
                btnCalcular?.click();
            }
        }
    });

    // =========================================================
    // INICIALIZACIÓN
    // =========================================================
    init();

    // Agregar estilo para animaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slide-in {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .animate-slide-in {
            animation: slide-in 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
});