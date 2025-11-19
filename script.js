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