document.addEventListener("DOMContentLoaded", function () {


    /* Toggle inputs based on checkbox selection */

   

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


    const dropdownInners = document.querySelectorAll('.dropdown-inner');

    dropdownInners.forEach(function(inner) {
      const addBtn = inner.querySelector('.add-input');
      const removeBtn = inner.querySelector('.remove-input');
      const container = inner.querySelector('.dynamic-inputs-container');

      // Determine the type from the data attribute (either 'name' or 'price')
      const type = inner.dataset.type;

      addBtn.addEventListener("click", function(e) {
        e.preventDefault();
        // Create a new input field
        const newInput = document.createElement('input');
        newInput.type = "text";
        newInput.placeholder = "HTML Element Name";
        // Set the name attribute based on the type for separation
        if (type === "name") {
          newInput.setAttribute("name", "listOfNames[]");
        } else if (type === "price") {
          newInput.setAttribute("name", "listOfPrices[]");
        }
        container.appendChild(newInput);
      });

      removeBtn.addEventListener("click", function(e) {
        e.preventDefault();
        // Remove the last input field, if one exists
        if (container.lastElementChild) {
          container.removeChild(container.lastElementChild);
        }
      });
    });


 
})