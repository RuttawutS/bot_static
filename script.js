// Global variables to store fetched data
let allCardsData = [];
let typeMap, costMap, gemMap, symbolMap, cardColorMap, gemColorMap, isOnlyOneMap, rarityMap, powerMap;

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
        const response = await fetch('cards.json');
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
        cardElement.classList.add('card');
        cardElement.innerHTML = `
            <div class="card-inner-content" >
                <div class="row">
                    <h3>${card.name}</h3>
                    <h3> ${getMappedValue(isOnlyOneMap, card.isOnlyOne) == "มีได้เพียงใบเดียว" ? "#1" : "" }</h3>
                </div>
                
                <p><span class="label">Type:</span> ${getMappedValue(typeMap, card.type)}</p>
                <p><span class="label">Cost:</span> ${getMappedValue(costMap, card.cost)}</p>
                <p><span class="label">Symbol:</span> ${getMappedValue(symbolMap, card.symbol)}</p>
                <p><span class="label">Card Color:</span> ${getMappedValue(cardColorMap, card.cardColor)}</p>
                <p ><span class="label" >Gem:</span> ${getMappedValue(gemMap, card.gem)} (${getMappedValue(gemColorMap, card.gemColor)}) </span></p>
                <p><span class="label">Is Only One:</span> ${getMappedValue(isOnlyOneMap, card.isOnlyOne)}</p>
                <p><span class="label">Power:</span> ${getMappedValue(powerMap, card.power)}</p>
                <p><span class="label">Rarity:</span> ${getMappedValue(rarityMap, card.rarity)}</p>
                <p><span class="label">Ability:</span> ${card.ability_text || 'N/A'}</p>
            </div>
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
 * Applies all active filters and updates the displayed cards.
 */
function applyFilters() {
    let filteredCards = [...allCardsData]; // Start with all cards

    const typeFilter = document.getElementById('typeFilter').value;
    const symbolFilter = document.getElementById('symbolFilter').value;
    const costFilter = document.getElementById('costFilter').value;
    const cardColorFilter = document.getElementById('cardColorFilter').value;
    const gemFilter = document.getElementById('gemFilter').value;
    const gemColorFilter = document.getElementById('gemColorFilter').value;
    const powerFilter = document.getElementById('powerFilter').value;
    const rarityFilter = document.getElementById('rarityFilter').value;
    const isOnlyOneFilter = document.getElementById('isOnlyOneFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase(); // Get text search input

    // Apply filters sequentially
    if (typeFilter) {
        filteredCards = filteredCards.filter(card => card.type === typeFilter);
    }
    if (symbolFilter) {
        filteredCards = filteredCards.filter(card => card.symbol === symbolFilter);
    }
    if (costFilter) {
        filteredCards = filteredCards.filter(card => card.cost === costFilter);
    }
    if (cardColorFilter) {
        filteredCards = filteredCards.filter(card => card.cardColor === cardColorFilter);
    }
    if (gemFilter) {
        filteredCards = filteredCards.filter(card => card.gem === gemFilter);
    }
    if (gemColorFilter) {
        filteredCards = filteredCards.filter(card => card.gemColor === gemColorFilter);
    }
    if (powerFilter) {
        filteredCards = filteredCards.filter(card => card.power === powerFilter);
    }
    if (rarityFilter) {
        filteredCards = filteredCards.filter(card => card.rarity === rarityFilter);
    }
    if (isOnlyOneFilter) {
        filteredCards = filteredCards.filter(card => card.isOnlyOne === isOnlyOneFilter);
    }
    if (searchInput) {
        filteredCards = filteredCards.filter(card =>  card.name.toLowerCase().includes(searchInput));
    }

    displayCards(filteredCards);
}

/**
 * Main function to initialize the card viewer.
 */
async function main() {
    console.log('Starting Battle of Talingchan Card Viewer initialization...');

    // Fetch all data concurrently using the generic fetchDataMap
    [allCardsData, typeMap, costMap, gemMap, symbolMap,
        cardColorMap, gemColorMap, isOnlyOneMap, rarityMap, powerMap] = await Promise.all([
            fetchCardsData(),
            fetchDataMap('type.json', 'type data'),
            fetchDataMap('cost.json', 'cost data'),
            fetchDataMap('gem.json', 'gem data'),
            fetchDataMap('symbol.json', 'symbol data'),
            fetchDataMap('card_color.json', 'card color data'),
            fetchDataMap('gem_color.json', 'gem color data'),
            fetchDataMap('is_only_one.json', 'is only one data'),
            fetchDataMap('rarity.json', 'rarity data'),
            fetchDataMap('power.json', 'power data')
        ]);

    if (allCardsData.length > 0) {
        // Populate dropdowns with data
        populateDropdown('typeFilter', typeMap);
        populateDropdown('symbolFilter', symbolMap);
        populateDropdown('costFilter', costMap);
        populateDropdown('cardColorFilter', cardColorMap);
        populateDropdown('gemFilter', gemMap);
        populateDropdown('gemColorFilter', gemColorMap);
        populateDropdown('powerFilter', powerMap);
        populateDropdown('rarityFilter', rarityMap);
        populateDropdown('isOnlyOneFilter', isOnlyOneMap);

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
    document.getElementById('cardColorFilter').addEventListener('change', applyFilters);
    document.getElementById('gemFilter').addEventListener('change', applyFilters);
    document.getElementById('gemColorFilter').addEventListener('change', applyFilters);
    document.getElementById('powerFilter').addEventListener('change', applyFilters);
    document.getElementById('rarityFilter').addEventListener('change', applyFilters);
    document.getElementById('isOnlyOneFilter').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);

    // Add event listener for the Reset Filters button
    document.getElementById('resetBtn').addEventListener('click', () => {
        // Reset all filter dropdowns
        document.getElementById('typeFilter').value = '';
        document.getElementById('symbolFilter').value = '';
        document.getElementById('costFilter').value = '';
        document.getElementById('cardColorFilter').value = '';
        document.getElementById('gemFilter').value = '';
        document.getElementById('gemColorFilter').value = '';
        document.getElementById('powerFilter').value = '';
        document.getElementById('rarityFilter').value = '';
        document.getElementById('isOnlyOneFilter').value = '';
        document.getElementById('searchInput').value = ''; // Clear search input
        applyFilters(); // Re-apply filters to show all cards
    });
}

// Run the main function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', main);