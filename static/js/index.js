document.addEventListener("DOMContentLoaded", function () {

    // Toggle inputs based on checkbox selection
    const dropCheckbox = document.getElementById("price-drop");
    const riseCheckbox = document.getElementById("price-rise");
    const dropInput = document.getElementById("drop-input");
    const riseInput = document.getElementById("rise-input");

    function toggleInputs(event) {
        if (event.target === dropCheckbox) {
            riseCheckbox.checked = false; // Uncheck "Rise to"
            dropInput.style.display = dropCheckbox.checked ? "inline-block" : "none";
            riseInput.style.display = "none";
        } else if (event.target === riseCheckbox) {
            dropCheckbox.checked = false; // Uncheck "Drop to"
            riseInput.style.display = riseCheckbox.checked ? "inline-block" : "none";
            dropInput.style.display = "none";
        }
    }

    dropCheckbox.addEventListener("change", toggleInputs);
    riseCheckbox.addEventListener("change", toggleInputs);

    // Hide inputs initially
    dropInput.style.display = "none";
    riseInput.style.display = "none";

   

    const dropNameBtn = document.querySelector('.dropbtn.name');
    const nameDropdown = document.getElementById('nameDropdown');
    const dropPriceBtn = document.querySelector('.dropbtn.price');
    const priceDropdown = document.getElementById('priceDropdown');

    dropNameBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (nameDropdown.classList.contains('show')) {
        document.getElementById('name').disabled=true;
        document.getElementById('name').value="";
        nameDropdown.classList.remove('show');
      } else {
        document.getElementById('name').disabled=false;
        nameDropdown.classList.add('show');
      }
    });
    
    dropPriceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (priceDropdown.classList.contains('show')) {
        document.getElementById('price').disabled=true;
        document.getElementById('price').value="";
        priceDropdown.classList.remove('show');
      } else {
        document.getElementById('price').disabled=false;
        priceDropdown.classList.add('show');
      }
    });

 
})