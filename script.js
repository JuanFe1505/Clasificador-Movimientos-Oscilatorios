// =========================================================
// CLASIFICADOR DE MOVIMIENTO OSCILATORIO - SCRIPT COMPLETO
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // --- ML Variables ---
    const TM_MODEL_URL = "https://teachablemachine.withgoogle.com/models/Kc7rWFMTA/";
    const IMAGE_SIZE = 224;
    let model, maxPredictions;
    let clasificacionActual = "";

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
    // FUNCIONALIDAD DEL MENÚ MÓVIL
    // =========================================================
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            const icon = menuToggle.querySelector('.material-symbols-outlined');
            icon.textContent = mobileMenu.classList.contains('hidden') ? 'menu' : 'close';
        });
    }

    // =========================================================
    // FUNCIONALIDAD DE SUBIDA Y DRAG & DROP
    // =========================================================
    
    if (selectFileBtn && fileInput) {
        selectFileBtn.addEventListener('click', function() { fileInput.click(); });
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length > 0) { handleFileUpload(fileInput.files[0]); }
        });
    }
    
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { 
            dropArea.addEventListener(eventName, preventDefaults, false); 
        });
        
        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
        
        dropArea.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            if (dt.files.length > 0) { handleFileUpload(dt.files[0]); }
        }, false);
    }

    function handleFileUpload(file) {
        if (!validateFile(file)) { return; }
        
        resultArea.style.display = 'block';
        labelContainer.innerHTML = 'Cargando imagen y modelo...';
        
        const fileURL = URL.createObjectURL(file);
        uploadedImageElement.src = fileURL;
        
        uploadedImageElement.onload = () => {
            processAndPredict(uploadedImageElement);
        };
        
        fileInput.value = ""; 
    }
    
    function validateFile(file) {
        const MAX_SIZE = 50 * 1024 * 1024;
        const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; 
        
        if (file.size > MAX_SIZE) { 
            alert('Error: El tamaño máximo de imagen es 50MB.'); 
            return false; 
        }
        if (!SUPPORTED_TYPES.includes(file.type)) { 
            alert(`Error: Formato no soportado. Use JPG, PNG o GIF.`); 
            return false; 
        }
        return true;
    }

    // =========================================================
    // TEACHABLE MACHINE - INICIALIZACIÓN Y PREDICCIÓN
    // =========================================================

    async function init() {
        const modelURL = TM_MODEL_URL + "model.json";
        const metadataURL = TM_MODEL_URL + "metadata.json";

        try {
            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();
            labelContainer.innerHTML = 'Modelo de ML listo. Sube una imagen.';
        } catch (error) {
            labelContainer.innerHTML = 'Error al cargar el modelo de ML. Revisa tu conexión a internet.';
            console.error("Error al cargar el modelo de Teachable Machine:", error);
        }
    }

    async function processAndPredict(imageElement) {
        if (!model) {
            labelContainer.innerHTML = 'Modelo no cargado. Intentando inicializar...';
            await init(); 
            if (!model) return;
        }

        labelContainer.innerHTML = 'Redimensionando a 224x224px y analizando imagen...';
        ctx.drawImage(imageElement, 0, 0, IMAGE_SIZE, IMAGE_SIZE); 
        predict(canvas); 
    }

    async function predict(inputElement) { 
        const prediction = await model.predict(inputElement);
        let bestPrediction = { className: "No Clasificado", probability: 0 };
        
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = prediction[i];
            if (classPrediction.probability > bestPrediction.probability) {
                bestPrediction = classPrediction;
            }
        }

        clasificacionActual = bestPrediction.className;
        
        const resultText = `Clasificación: ${bestPrediction.className} (Probabilidad: ${(bestPrediction.probability * 100).toFixed(2)}%)`;
        
        labelContainer.innerHTML = `
            <p class="text-2xl text-primary font-extrabold">RESULTADO CLASIFICACIÓN:</p>
            <p class="mt-2 text-gray-900 dark:text-white">${resultText}</p>
        `;
        
        // Mostrar formulario de parámetros
        mostrarFormularioParametros(bestPrediction.className);
    }

    function mostrarFormularioParametros(tipoMovimiento) {
        parametrosSection.style.display = 'block';
        tipoMovimientoDetectado.textContent = tipoMovimiento;
        
        // Mostrar campo de amortiguamiento solo si es MOA
        if (tipoMovimiento.toLowerCase().includes('moa') || 
            tipoMovimiento.toLowerCase().includes('amortiguado')) {
            betaContainer.style.display = 'block';
        } else {
            betaContainer.style.display = 'none';
        }
        
        // Scroll suave hacia el formulario
        parametrosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // =========================================================
    // CÁLCULOS FÍSICOS DEL MOVIMIENTO OSCILATORIO
    // =========================================================

    if (btnCalcular) {
        btnCalcular.addEventListener('click', calcularMovimiento);
    }

    function calcularMovimiento() {
        // Obtener valores ingresados
        const A = parseFloat(document.getElementById('amplitud').value) || null;
        const f = parseFloat(document.getElementById('frecuencia').value) || null;
        const omega = parseFloat(document.getElementById('omega').value) || null;
        const T = parseFloat(document.getElementById('periodo').value) || null;
        const m = parseFloat(document.getElementById('masa').value) || null;
        const beta = parseFloat(document.getElementById('beta').value) || null;

        // Validar que al menos haya algunos datos
        if (!A && !f && !omega && !T) {
            mostrarError('Por favor, ingresa al menos la amplitud y la frecuencia (o periodo).');
            return;
        }

        try {
            // Calcular parámetros derivados
            let parametros = calcularParametrosCompletos(A, f, omega, T, m, beta);
            
            // Guardar en localStorage y redirigir
            localStorage.setItem('datosAnalisis', JSON.stringify({
                clasificacion: clasificacionActual,
                parametros: parametros,
                imagenURL: uploadedImageElement.src
            }));
            
            window.location.href = 'analisis.html';
            
        } catch (error) {
            mostrarError(error.message);
        }
    }

    function calcularParametrosCompletos(A, f, omega, T, m, beta) {
        const PI = Math.PI;
        let resultado = {};

        // PASO 1: Calcular parámetros temporales (f, T, ω)
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
        } else {
            throw new Error('Debes ingresar al menos: frecuencia, periodo o frecuencia angular.');
        }

        // PASO 2: Amplitud
        if (!A) {
            throw new Error('La amplitud (A) es obligatoria.');
        }
        resultado.amplitud = A;

        // PASO 3: Velocidad y aceleración máximas (MAS)
        resultado.velocidadMaxima = resultado.omega * A; // v_max = ωA
        resultado.aceleracionMaxima = Math.pow(resultado.omega, 2) * A; // a_max = ω²A

        // PASO 4: Masa y energía
        if (m) {
            resultado.masa = m;
            // Energía mecánica total (MAS): E = (1/2) * m * ω² * A²
            resultado.energiaTotal = 0.5 * m * Math.pow(resultado.omega, 2) * Math.pow(A, 2);
        }

        // PASO 5: Análisis de amortiguamiento (solo si hay beta)
        if (beta !== null && beta > 0) {
            resultado.beta = beta;
            resultado.esAmortiguado = true;
            
            // Frecuencia natural (ω₀ = ω para MAS sin amortiguamiento)
            const omega0 = resultado.omega;
            
            // Clasificación del amortiguamiento
            // ω_d = sqrt(ω₀² - β²)
            const discriminante = Math.pow(omega0, 2) - Math.pow(beta, 2);
            
            if (discriminante > 0) {
                resultado.tipoAmortiguamiento = 'Subamortiguado';
                resultado.omegaAmortiguado = Math.sqrt(discriminante);
                resultado.frecuenciaAmortiguada = resultado.omegaAmortiguado / (2 * PI);
                resultado.periodoAmortiguado = 2 * PI / resultado.omegaAmortiguado;
            } else if (Math.abs(discriminante) < 0.0001) {
                resultado.tipoAmortiguamiento = 'Críticamente Amortiguado';
                resultado.omegaAmortiguado = 0;
            } else {
                resultado.tipoAmortiguamiento = 'Sobreamortiguado';
                resultado.omegaAmortiguado = Math.sqrt(Math.abs(discriminante)); // imaginario
            }
            
            // Factor de calidad Q (solo para subamortiguado)
            if (resultado.tipoAmortiguamiento === 'Subamortiguado') {
                resultado.factorCalidad = omega0 / (2 * beta);
            }
            
            // Tiempo de relajación τ = 1/β
            resultado.tiempoRelajacion = 1 / beta;
            
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
                <span class="material-symbols-outlined text-red-500">error</span>
                <div>
                    <p class="font-bold">Error en los datos ingresados</p>
                    <p class="text-sm mt-1">${mensaje}</p>
                </div>
            </div>
        `;
        resultadoParametros.scrollIntoView({ behavior: 'smooth' });
    }

    // INICIALIZACIÓN
    init();
});