document.addEventListener("DOMContentLoaded", () => {
    const checkbox = document.querySelector("#checkbox");
    checkbox.addEventListener('change', () => {
    const isDarkMode = checkbox.checked;
        // Add or remove the 'dark-theme' class based on the checkbox state
        document.documentElement.classList.toggle("dark-theme", isDarkMode);
    });

});

