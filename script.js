// Global variables to store fetched data
let allCardsData = [];
let typeMap, costMap, gemMap, symbolMap, isOnlyOneMap, rarityMap, powerMap, soiMap, packMap, costColorMap;

/**
 * Safely retrieves a value from a Map.
 * If the map or code is not found, it falls back to the code or 'N/A'.
 * @param {Map<string, string>} map The Map to query.
 * @param {string} code The code to look up in the map.
 * @returns {string} The mapped name or the original code/ 'N/A'.
 */
function getMappedValue(map, code) {
    return map && map.has(code) ? map.get(code) : (code || 'N/A');
}

/**
 * Generic function to fetch JSON data and convert it into a Map.
 * Assumes JSON structure is an array of objects with 'code' and 'name' properties.
 * @param {string} url The URL of the JSON file.
 * @param {string} errorContext A string to describe the data being fetched for error messages.
 * @returns {Promise<Map<string, string>>} A Promise that resolves to a Map.
 */
async function fetchDataMap(url, errorContext = 'data') {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} from ${url}`);
        }
        const data = await response.json(); // Attempt to parse JSON
        const map = new Map();
        data.forEach(item => {
            if (item.code && item.name) { // Ensure items have code and name
                map.set(item.code, item.name);
            } else {
                console.warn(`Skipping malformed item in ${url}:`, item);
            }
        });
        return map;
    } catch (error) {
        console.error(`Error fetching ${errorContext} from ${url}:`, error);
        return new Map(); // Always return a Map to prevent further errors
    }
}

/**
 * Function to fetch main card data.
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of card objects.
 */
async function fetchCardsData() {
    try {
        const response = await fetch('database/cards_20250627.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} from card.json`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching card data:', error);
        return []; // Return an empty array if card data fetch fails
    }
}

/**
 * Displays cards in the card container based on the provided array.
 * @param {Array<Object>} cards The array of card objects to display.
 */
function displayCards(cards) {
    const cardContainer = document.getElementById('card-container');
    cardContainer.innerHTML = ''; // Clear previous cards

    if (cards.length === 0) {
        cardContainer.innerHTML = '<p class="no-results">ไม่พบการ์ดที่ตรงกับเงื่อนไขการค้นหา</p>';
        return;
    }

    cards.forEach(card => {
        const cardElement = document.createElement('div');
        const colorCircle = `<span class="color-dot" style="background-color: ${getColorHex(card.costColor)};"></span>`;

        cardElement.classList.add('card');
        cardElement.innerHTML = `
            <h4>${card.name}</h4>
            <img src="${card.image}" alt="${card.name}" class="card-image">
            <p><span class="label">Type:</span> ${getMappedValue(typeMap, card.type)}</p>
            <p><span class="label">Symbol:</span> ${getMappedValue(symbolMap, card.symbol)}</p>
            <span class="label">Cost:</span><span>${getMappedValue(costMap, card.cost)} ${colorCircle}</span>
            <p ><span class="label" >Gem:</span> ${getMappedValue(gemMap, card.gem)} </span></p>
            <p><span class="label">Power:</span> ${getMappedValue(powerMap, card.power)}</p>
            <p><span class="label">Rarity:</span> ${getMappedValue(rarityMap, card.rarity)}</p>
            <p><span class="label">Ability:</span> ${card.ability || 'N/A'}</p>
             
        `;
        cardContainer.appendChild(cardElement);
    });

}

/**
 * Populates a dropdown select element with options from a Map.
 * @param {string} dropdownId The ID of the select element.
 * @param {Map<string, string>} dataMap The Map containing code-name pairs.
 */
function populateDropdown(dropdownId, dataMap) {
    const selectElement = document.getElementById(dropdownId);
    // Use optional chaining for dataset for safety
    selectElement.innerHTML = `<option value="">-- เลือก ${selectElement.dataset?.placeholder || 'ตัวกรอง'} --</option>`;
    if (dataMap) { // Ensure dataMap exists before iterating
        dataMap.forEach((name, code) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            selectElement.appendChild(option);
        });
    }
}

/**
 * Debounce function to limit how often a function is called.
 * @param {Function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Applies all active filters and updates the displayed cards.
 */
function applyFilters() {
    let filteredCards = [...allCardsData]; // Start with all cards

    const searchTerm = document.getElementById('nameSearchInput').value.toLowerCase(); // Get combined text search input

    const typeFilter = document.getElementById('typeFilter').value;
    const costFilter = document.getElementById('costFilter').value;
    const gemFilter = document.getElementById('gemFilter').value;
    const powerFilter = document.getElementById('powerFilter').value;
    const symbolFilter = document.getElementById('symbolFilter').value;
    const costColorFilter = document.getElementById('costColorFilter').value;
    const isOnlyOneFilter = document.getElementById('isOnlyOneFilter').value;
    const soiFilter = document.getElementById('soiFilter').value;
    const packFilter = document.getElementById('packFilter').value;
    const rarityFilter = document.getElementById('rarityFilter').value;
    
    // Apply combined text search filter
    if (searchTerm) {
        filteredCards = filteredCards.filter(card => 
            (card.name && card.name.toLowerCase().includes(searchTerm)) || 
            (card.ability && card.ability.toLowerCase().includes(searchTerm))
        );
    }

    // Apply other filters sequentially
    if (typeFilter) {
        filteredCards = filteredCards.filter(card => card.type === typeFilter);
    }
    
    if (costFilter) {
        filteredCards = filteredCards.filter(card => card.cost === costFilter);
    }

    if (gemFilter) {
        filteredCards = filteredCards.filter(card => card.gem === gemFilter);
    }

    if (powerFilter) {
        filteredCards = filteredCards.filter(card => card.power === powerFilter);
    }

    if (symbolFilter) {
        filteredCards = filteredCards.filter(card => card.symbol === symbolFilter);
    }

    if (costColorFilter) {
        filteredCards = filteredCards.filter(card => card.costColor === costColorFilter);
    }
   
    if (isOnlyOneFilter) {
        filteredCards = filteredCards.filter(card => card.isOnlyOne === isOnlyOneFilter);
    }
    if (soiFilter) {
        filteredCards = filteredCards.filter(card => card.soi === soiFilter);
    }

    if (packFilter) {
        filteredCards = filteredCards.filter(card => card.pack === packFilter);
    }
    
    if (rarityFilter) {
        filteredCards = filteredCards.filter(card => card.rarity === rarityFilter);
    }
    
    displayCards(filteredCards);
}

/**
 * Main function to initialize the card viewer.
 */
async function main() {
    console.log('Starting Battle of Talingchan Card Viewer initialization...');

    // Fetch all data concurrently using the generic fetchDataMap
    [allCardsData, typeMap, symbolMap, costMap, gemMap,  isOnlyOneMap, rarityMap, powerMap, soiMap, packMap, costColorMap] = await Promise.all([
            fetchCardsData(),
            fetchDataMap('database/type.json', 'type data'),
            fetchDataMap('database/symbol.json', 'symbol data'),
            fetchDataMap('database/cost.json', 'cost data'),
            fetchDataMap('database/gem.json', 'gem data'),
            fetchDataMap('database/is_only_one.json', 'is only one data'),
            fetchDataMap('database/rarity.json', 'rarity data'),
            fetchDataMap('database/power.json', 'power data'),
            fetchDataMap('database/soi.json', 'soi data'),
            fetchDataMap('database/pack.json', 'pack data') ,
            fetchDataMap('database/cost_color.json', 'cost color data')
        ]);

    if (allCardsData.length > 0) {
        // Populate dropdowns with data
        populateDropdown('typeFilter', typeMap);
        populateDropdown('costFilter', costMap);
        populateDropdown('gemFilter', gemMap);
        populateDropdown('powerFilter', powerMap);
        populateDropdown('symbolFilter', symbolMap);
        populateDropdown('costColorFilter', costColorMap);
        populateDropdown('isOnlyOneFilter', isOnlyOneMap);
        populateDropdown('rarityFilter', rarityMap);
        populateDropdown('soiFilter', soiMap);
        populateDropdown('packFilter', packMap);
        

        // Initial display of all cards
        applyFilters(); // Call applyFilters to display all cards initially
        console.log('Cards and filters initialized successfully.');
    } else {
        console.warn('No card data was loaded. Please check "card.json" and your network.');
    }

    // Add event listeners for instant filtering
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('symbolFilter').addEventListener('change', applyFilters);
    document.getElementById('costFilter').addEventListener('change', applyFilters);
    document.getElementById('costColorFilter').addEventListener('change', applyFilters);
    document.getElementById('gemFilter').addEventListener('change', applyFilters);
    document.getElementById('powerFilter').addEventListener('change', applyFilters);
    document.getElementById('rarityFilter').addEventListener('change', applyFilters);
    document.getElementById('isOnlyOneFilter').addEventListener('change', applyFilters);
    document.getElementById('soiFilter').addEventListener('change', applyFilters);
    document.getElementById('packFilter').addEventListener('change', applyFilters);
    
    // Use debounced function for the combined search input
    document.getElementById('nameSearchInput').addEventListener('input', debounce(applyFilters, 300));
    

    // Add event listener for the Reset Filters button
    document.getElementById('resetBtn').addEventListener('click', () => {
        // Reset all filter dropdowns
        document.getElementById('typeFilter').value = '';
        document.getElementById('symbolFilter').value = '';
        document.getElementById('costFilter').value = '';
        document.getElementById('costColorFilter').value = '';
        document.getElementById('gemFilter').value = '';
        document.getElementById('powerFilter').value = '';
        document.getElementById('rarityFilter').value = '';
        document.getElementById('isOnlyOneFilter').value = '';
        document.getElementById('nameSearchInput').value = ''; // Reset combined search input
        document.getElementById('soiFilter').value = '';
        document.getElementById('packFilter').value = '';
        applyFilters(); // Re-apply filters to show all cards
    });
}

// Run the main function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', main);

const backToTopBtn = document.getElementById("backToTopBtn");
window.addEventListener("scroll", () => {
  backToTopBtn.style.display = window.scrollY > 300 ? "block" : "none";
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function getColorHex(code) {
  // Map your costColor codes to real color values
  const colorMap = {
    RED: "#dc3545",
    BLU: "#0f4c7a",
    GRN: "#1da149",
    YELLOW: "#ffc107",
    WHT: "#ffffff",
    BLK: "#542d6c",
    // Add your actual codes from cost_color.json here
  };
  return colorMap[code] || "#ccc"; // fallback to gray
}