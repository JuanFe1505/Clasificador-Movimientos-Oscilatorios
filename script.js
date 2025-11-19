// Espera a que el documento HTML esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Obtiene referencias al botón y al menú móvil por sus ID
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    // Agrega un "escuchador de eventos" para el clic en el botón
    menuToggle.addEventListener('click', function() {
        // La función clave de Tailwind: 'classList.toggle("hidden")'
        // Si el menú está oculto (tiene la clase 'hidden'), la quita (lo muestra).
        // Si el menú está visible (no tiene 'hidden'), la pone (lo oculta).
        mobileMenu.classList.toggle('hidden');
    });
});

//subir img

document.addEventListener('DOMContentLoaded', function() {
    
    // =========================================================
    // 1. VARIABLES GLOBALES DE ML (Teachable Machine)
    // =========================================================
    const TM_MODEL_URL = "https://teachablemachine.withgoogle.com/models/Kc7rWFMTA/";
    const IMAGE_SIZE = 224; // Tamaño requerido: 224x224px
    let model, maxPredictions;

    // =========================================================
    // 2. REFERENCIAS HTML
    // =========================================================
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    const selectFileBtn = document.getElementById('selectFileBtn'); 
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.querySelector('.flex.flex-col.items-center.gap-6.rounded-xl.border-2'); 
    
    const resultArea = document.getElementById('result-area');
    const uploadedImageElement = document.getElementById("uploaded-image");
    const labelContainer = document.getElementById("label-container");
    const analyzeButton = document.getElementById('analyze-button');

    // Crea un elemento canvas oculto para el redimensionamiento
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_SIZE;
    canvas.height = IMAGE_SIZE;
    const ctx = canvas.getContext('2d');
    
    // =========================================================
    // 3. FUNCIONALIDAD DEL MENÚ MÓVIL
    // =========================================================
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // =========================================================
    // 4. FUNCIONALIDAD DE SUBIDA Y DRAG & DROP (Solo imágenes)
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
        // Prevenir comportamiento por defecto
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
        
        // Mostrar la imagen subida (crea una URL local)
        const fileURL = URL.createObjectURL(file);
        uploadedImageElement.src = fileURL;
        
        // Proceso de redimensionamiento y predicción después de la carga visual
        uploadedImageElement.onload = () => {
            processAndPredict(uploadedImageElement);
        };
        
        fileInput.value = ""; 
    }
    
    function validateFile(file) {
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        // Solo tipos de imagen
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
    // 5. FUNCIONES DE TEACHABLE MACHINE Y REDIMENSIONAMIENTO
    // =========================================================

    // Función que redimensiona y llama a la predicción
    async function processAndPredict(imageElement) {
        if (!model) {
            labelContainer.innerHTML = 'Modelo no cargado. Intentando inicializar...';
            await init(); // Intenta cargar el modelo si no lo está
            if (!model) return;
        }

        labelContainer.innerHTML = 'Redimensionando a 224x224px y analizando imagen...';
        
        // Dibuja la imagen en el canvas, forzando el redimensionamiento a 224x224
        ctx.drawImage(imageElement, 0, 0, IMAGE_SIZE, IMAGE_SIZE); 
        
        // Ejecuta la predicción usando el canvas como fuente de datos
        predict(canvas); 
    }

    // Cargar el modelo
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

    // Ejecutar la predicción (Ahora recibe el elemento canvas redimensionado)
    async function predict(inputElement) { // inputElement es el canvas
        
        const prediction = await model.predict(inputElement);
        let bestPrediction = { className: "No Clasificado", probability: 0 };
        
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = prediction[i];
            if (classPrediction.probability > bestPrediction.probability) {
                bestPrediction = classPrediction;
            }
        }

        // Formatear y mostrar el resultado
        const resultText = `Clasificación: ${bestPrediction.className} (Probabilidad: ${(bestPrediction.probability * 100).toFixed(2)}%)`;
        
        labelContainer.innerHTML = `
            <p class="text-2xl text-primary font-extrabold">RESULTADO FINAL:</p>
            <p class="mt-2 text-gray-900 dark:text-white">${resultText}</p>
        `;
        
        analyzeButton.style.display = 'block';
        analyzeButton.onclick = () => {
             // Pasa el resultado a la página de análisis
             window.location.href = 'analisis.html?result=' + encodeURIComponent(bestPrediction.className);
        };
    }
    
    // INICIO: Cargar el modelo al cargar la página
    init();
});