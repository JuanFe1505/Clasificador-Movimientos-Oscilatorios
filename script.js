// =========================================================
// CÓDIGO CORREGIDO PARA script.js
// =========================================================

// =========================================================
// 1. LÓGICA DE INICIO Y DECLARACIÓN DE VARIABLES
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    
    // --- ML Variables ---
    const TM_MODEL_URL = "https://teachablemachine.withgoogle.com/models/Kc7rWFMTA/";
    const IMAGE_SIZE = 224;
    let model, maxPredictions;

    // --- Referencias HTML ---
    // NO se redeclaran las referencias si se obtienen en el mismo scope.
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    const selectFileBtn = document.getElementById('selectFileBtn'); 
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.querySelector('.flex.flex-col.items-center.gap-6.rounded-xl.border-2'); 
    
    const resultArea = document.getElementById('result-area');
    const uploadedImageElement = document.getElementById("uploaded-image");
    const labelContainer = document.getElementById("label-container");
    const analyzeButton = document.getElementById('analyze-button');

    // --- Canvas Setup ---
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_SIZE;
    canvas.height = IMAGE_SIZE;
    const ctx = canvas.getContext('2d');
    
    // =========================================================
    // 2. FUNCIONALIDAD DEL MENÚ MÓVIL (CORREGIDO)
    // =========================================================
    // Este código ahora es el ÚNICO lugar donde se define el toggle
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // =========================================================
    // 3. FUNCIONALIDAD DE SUBIDA Y DRAG & DROP
    // =========================================================
    
    // --- Evento del botón "Seleccionar Imagen" ---
    if (selectFileBtn && fileInput) {
        selectFileBtn.addEventListener('click', function() { fileInput.click(); });
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length > 0) { handleFileUpload(fileInput.files[0]); }
        });
    }
    
    // --- Lógica de Arrastrar y Soltar (Drag and Drop) ---
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { dropArea.addEventListener(eventName, preventDefaults, false); });
        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
        
        dropArea.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            if (dt.files.length > 0) { handleFileUpload(dt.files[0]); }
        }, false);
    }

    // --- Función Principal de Gestión de Archivos ---
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
        
        if (file.size > MAX_SIZE) { alert('Error: El tamaño máximo de imagen es 50MB.'); return false; }
        if (!SUPPORTED_TYPES.includes(file.type)) { alert(`Error: Formato no soportado. Use JPG, PNG o GIF.`); return false; }
        return true;
    }


    // =========================================================
    // 4. FUNCIONES DE TEACHABLE MACHINE Y REDIMENSIONAMIENTO
    // =========================================================

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

    async function predict(inputElement) { 
        
        const prediction = await model.predict(inputElement);
        let bestPrediction = { className: "No Clasificado", probability: 0 };
        
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = prediction[i];
            if (classPrediction.probability > bestPrediction.probability) {
                bestPrediction = classPrediction;
            }
        }

        const resultText = `Clasificación: ${bestPrediction.className} (Probabilidad: ${(bestPrediction.probability * 100).toFixed(2)}%)`;
        
        labelContainer.innerHTML = `
            <p class="text-2xl text-primary font-extrabold">RESULTADO FINAL:</p>
            <p class="mt-2 text-gray-900 dark:text-white">${resultText}</p>
        `;
        
        analyzeButton.style.display = 'block';
        analyzeButton.onclick = () => {
             window.location.href = 'analisis.html?result=' + encodeURIComponent(bestPrediction.className);
        };
    }
    
    // INICIO: Cargar el modelo al cargar la página
    init();
});



        document.addEventListener('DOMContentLoaded', () => {
            const menuButton = document.getElementById('menu-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            const icon = menuButton.querySelector('.material-symbols-outlined');

            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                if (mobileMenu.classList.contains('hidden')) {
                    icon.textContent = 'menu';
                } else {
                    icon.textContent = 'close';
                }
            });
        });