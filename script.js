// Global variables to store fetched data
let allCardsData = [];
let typeMap, costMap, gemMap, symbolMap, isOnlyOneMap, rarityMap, powerMap, soiMap, packMap, costColorMap;

// Modal elements
const filterModal = document.getElementById('filterModal');
const openFilterBtn = document.getElementById('openFilterBtn');
const closeButton = document.querySelector('.close-button');
const applyFilterButton = document.getElementById('applyFilterBtn'); // New apply button

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
            <button class="card-add-btn" title="เพิ่มลง Deck">+</button>
        `;

        // เพิ่ม event ให้ปุ่ม + สำหรับ deck builder
        const addBtn = cardElement.querySelector('.card-add-btn');
        addBtn.addEventListener('click', () => addToDeck(card));

        cardContainer.appendChild(cardElement);
    });

}

// --- Deck Builder Feature ---
// เก็บ deck เป็น object { cardId: {card, count} }
const deck = {};

function addToDeck(card) {
    const rightSidebar = document.getElementById('right-sidebar');
    const cardKey = card.name;

    if (deck[cardKey]) {
        deck[cardKey].count += 1;
    } else {
        deck[cardKey] = { card: card, count: 1 };
    }
    renderDeck();
}

function removeFromDeck(cardKey) {
    if (deck[cardKey]) {
        deck[cardKey].count -= 1;
        if (deck[cardKey].count <= 0) {
            delete deck[cardKey];
        }
        renderDeck();
    }
}

function renderDeck() {
    const rightSidebar = document.getElementById('right-sidebar');
    rightSidebar.innerHTML = ''; // ลบของเก่า

    // กล่องแสดงการ์ดใน deck
    Object.entries(deck).forEach(([cardKey, entry]) => {
        const { card, count } = entry;
        const deckCardBox = document.createElement('div');
        deckCardBox.className = 'deck-card-box';
        deckCardBox.innerHTML = `
            <div class="deck-card-info">
                <div class="deck-card-name">${card.name} <span class="deck-card-count">x${count}</span></div>
                <div class="deck-card-type">${getMappedValue(typeMap, card.type)}</div>
            </div>
            <button class="deck-card-remove-btn" title="นำออกจาก Deck">−</button>
        `;
        // เพิ่ม event ให้ปุ่มลบ
        const removeBtn = deckCardBox.querySelector('.deck-card-remove-btn');
        removeBtn.addEventListener('click', () => removeFromDeck(cardKey));
        rightSidebar.appendChild(deckCardBox);
    });

    // --- ปุ่มด้านล่างสุดของ right-sidebar ---
    // Container สำหรับปุ่ม
    let deckActionBox = document.getElementById('deck-action-box');
    if (!deckActionBox) {
        deckActionBox = document.createElement('div');
        deckActionBox.id = 'deck-action-box';
        rightSidebar.appendChild(deckActionBox);
    }
    deckActionBox.innerHTML = `
        <button id="showDeckBtn" class="deck-action-btn">ดูการ์ดใน Deck</button>
        <button id="clearDeckBtn" class="deck-action-btn danger">ลบการ์ดทั้งหมด</button>
    `;

    // Event: Show Deck Modal
    document.getElementById('showDeckBtn').onclick = showDeckModal;
    // Event: Clear Deck
    document.getElementById('clearDeckBtn').onclick = () => {
        Object.keys(deck).forEach(key => delete deck[key]);
        renderDeck();
    };
}

// Modal สำหรับแสดงการ์ดใน Deck
function showDeckModal() {
    // ลบ modal เดิมถ้ามี
    let oldModal = document.getElementById('deck-modal');
    if (oldModal) oldModal.remove();

    // สร้าง modal
    const modal = document.createElement('div');
    modal.id = 'deck-modal';
    modal.className = 'deck-modal';

    // เตรียมข้อมูลแถวของ table
    let tableRows = '';
    if (Object.values(deck).length === 0) {
        tableRows = `<tr><td colspan="3" style="text-align:center;color:#888;">ยังไม่มีการ์ดใน Deck</td></tr>`;
    } else {
        tableRows = Object.values(deck).map(entry => `
            <tr>
                <td>
                    <img src="${entry.card.image}" alt="${entry.card.name}">
                    ${entry.card.name}
                </td>
                <td style="text-align:center;">${entry.count}</td>
            </tr>
        `).join('');
    }

    modal.innerHTML = `
        <div class="deck-modal-content">
            <span class="deck-modal-close">&times;</span>
            <h2>การ์ดใน Deck</h2>
            <table class="deck-modal-table">
                <thead>
                    <tr>
                        <th>ชื่อการ์ด</th>
                        <th style="text-align:center;">จำนวน</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
    document.body.appendChild(modal);

    // Add Export Button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export';
    exportBtn.className = 'deck-action-btn';
    exportBtn.style.marginTop = '18px';
    exportBtn.style.padding = '13px';
    exportBtn.onclick = function () {
        // Build export string: card1.print:count;card2.print:count;...
        const exportStr = Object.values(deck)
            .filter(entry => entry.card.print && entry.count > 0)
            .map(entry => `${entry.card.print}:${entry.count}`)
            .join(';');
        // Copy to clipboard
        navigator.clipboard.writeText(exportStr).then(() => {
            alert('copied to your cardboard');
        });
    };
    modal.querySelector('.deck-modal-content').appendChild(exportBtn);

    // ปิด modal
    modal.querySelector('.deck-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
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
    console.log('Applying filters...');
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
 * Function to reset all filter dropdowns and search input.
 */
function resetFilters() {
    document.getElementById('typeFilter').value = '';
    document.getElementById('symbolFilter').value = '';
    document.getElementById('costFilter').value = '';
    document.getElementById('costColorFilter').value = '';
    document.getElementById('gemFilter').value = '';
    document.getElementById('powerFilter').value = '';
    document.getElementById('rarityFilter').value = '';
    document.getElementById('isOnlyOneFilter').value = '';
    document.getElementById('nameSearchInput').value = '';
    document.getElementById('soiFilter').value = '';
    document.getElementById('packFilter').value = '';
}


/**
 * Main function to initialize the card viewer.
 */
async function main() {
    console.log('Starting Battle of Talingchan Card Viewer initialization...');

    // Fetch all data concurrently using the generic fetchDataMap
    [allCardsData, typeMap, symbolMap, costMap, gemMap, isOnlyOneMap, rarityMap, powerMap, soiMap, packMap, costColorMap] = await Promise.all([
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

    // Event listeners for Modal
    openFilterBtn.addEventListener('click', () => {
        filterModal.style.display = 'flex'; // ใช้ flex เพื่อจัดกลาง
    });

    closeButton.addEventListener('click', () => {
        filterModal.style.display = 'none';
    });

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === filterModal) {
            filterModal.style.display = 'none';
        }
    });

    // Event listener for the new "Apply Filters" button inside the modal
    applyFilterButton.addEventListener('click', () => {
        applyFilters();
        filterModal.style.display = 'none'; // Close modal after applying filters
    });

    // Add event listener for the Reset Filters button
    document.getElementById('resetBtn').addEventListener('click', () => {
        resetFilters(); // Call the new reset function
        applyFilters(); // Re-apply filters to show all cards
    });

    // Debounced search input, still applies filters when typing
    document.getElementById('nameSearchInput').addEventListener('input', debounce(applyFilters, 300));
}

// Run the main function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', main);

const backToTopBtn = document.getElementById("backToTopBtn");
window.addEventListener("scroll", () => {
  backToTopBtn.style.display = window.scrollY > 300 ? "flex" : "none"; // เปลี่ยนเป็น flex
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

// Improved: Add a single event listener to the sidebar for all input/select changes
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('#sidebar .sidebar-content');
    if (!sidebar) return;

    // Listen for input (for text fields) and change (for selects) in one place
    sidebar.addEventListener('input', function(e) {
        if (e.target.matches('input, select')) {
            filterCards();
        }
    });
    sidebar.addEventListener('change', function(e) {
        if (e.target.matches('select')) {
            filterCards();
        }
    });
});

// ตัวอย่างฟังก์ชัน filterCards
function filterCards() {
    // Get all filter values from sidebar-content
    const sidebar = document.querySelector('#sidebar .sidebar-content');
    const nameSearchInput = sidebar.querySelector('#nameSearchInput');
    const typeFilter = sidebar.querySelector('#typeFilter');
    const symbolFilter = sidebar.querySelector('#symbolFilter');
    const costFilter = sidebar.querySelector('#costFilter');
    const costColorFilter = sidebar.querySelector('#costColorFilter');
    const gemFilter = sidebar.querySelector('#gemFilter');
    const powerFilter = sidebar.querySelector('#powerFilter');
    const isOnlyOneFilter = sidebar.querySelector('#isOnlyOneFilter');
    const rarityFilter = sidebar.querySelector('#rarityFilter');
    const packFilter = sidebar.querySelector('#packFilter');
    const soiFilter = sidebar.querySelector('#soiFilter');

    // Read values and trim
    const searchValue = nameSearchInput.value.trim().toLowerCase();
    const typeValue = typeFilter.value;
    const symbolValue = symbolFilter.value;
    const costValue = costFilter.value;
    const costColorValue = costColorFilter.value;
    const gemValue = gemFilter.value;
    const powerValue = powerFilter.value;
    const isOnlyOneValue = isOnlyOneFilter.value;
    const rarityValue = rarityFilter.value;
    const packValue = packFilter.value;
    const soiValue = soiFilter.value;

    // Filter allCardsData
    let filtered = allCardsData.filter(card => {
        // Search by name or ability
        const matchesSearch = !searchValue ||
            (card.name && card.name.toLowerCase().includes(searchValue)) ||
            (card.ability && card.ability.toLowerCase().includes(searchValue));

        // Match each filter if selected
        const matchesType = !typeValue || card.type === typeValue;
        const matchesSymbol = !symbolValue || card.symbol === symbolValue;
        const matchesCost = !costValue || card.cost === costValue;
        const matchesCostColor = !costColorValue || card.costColor === costColorValue;
        const matchesGem = !gemValue || card.gem === gemValue;
        const matchesPower = !powerValue || card.power === powerValue;
        const matchesIsOnlyOne = !isOnlyOneValue || card.isOnlyOne === isOnlyOneValue;
        const matchesRarity = !rarityValue || card.rarity === rarityValue;
        const matchesPack = !packValue || card.pack === packValue;
        const matchesSoi = !soiValue || card.soi === soiValue;

        return (
            matchesSearch &&
            matchesType &&
            matchesSymbol &&
            matchesCost &&
            matchesCostColor &&
            matchesGem &&
            matchesPower &&
            matchesIsOnlyOne &&
            matchesRarity &&
            matchesPack &&
            matchesSoi
        );
    });

    displayCards(filtered);
}

// --- Add Import Button near BackToTopBtn ---
document.addEventListener('DOMContentLoaded', function () {
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (!backToTopBtn) return;

    // Create Import Button
    const importBtn = document.createElement('button');
    importBtn.id = 'importDeckBtn';
    importBtn.textContent = 'Import';
    importBtn.className = 'deck-action-btn';
    importBtn.style.position = 'fixed';
    importBtn.style.bottom = '80px';
    importBtn.style.right = '32px';
    importBtn.style.zIndex = '1001';

    document.body.appendChild(importBtn);

    importBtn.addEventListener('click', showImportModal);
});

// --- Import Modal ---
function showImportModal() {
    // Remove old modal if exists
    let oldModal = document.getElementById('import-modal');
    if (oldModal) oldModal.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'import-modal';
    modal.className = 'deck-modal';
    modal.innerHTML = `
        <div class="deck-modal-content">
            <span class="deck-modal-close">&times;</span>
            <h2>Import Deck</h2>
            <textarea id="importDeckInput" rows="4" style="width:100%;margin-bottom:16px;" placeholder="เช่น BT01-002:2;BT01-003:1"></textarea>
            <button id="importDeckSubmit" class="deck-action-btn">นำเข้า Deck</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Close modal
    modal.querySelector('.deck-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };

    // Handle import
    document.getElementById('importDeckSubmit').onclick = function () {
        const input = document.getElementById('importDeckInput').value.trim();
        if (!input) return;
        importDeckFromString(input);
        modal.remove();
    };
}

// --- Import Logic ---
function importDeckFromString(importStr) {
    // Clear current deck
    Object.keys(deck).forEach(key => delete deck[key]);
    // Split by ';'
    const entries = importStr.split(';').map(s => s.trim()).filter(Boolean);
    entries.forEach(entry => {
        const [print, countStr] = entry.split(':');
        const count = parseInt(countStr, 10) || 1;
        // Find card by print
        const card = allCardsData.find(c => c.print === print);
        if (card && count > 0) {
            deck[card.name] = { card, count };
        }
    });
    renderDeck();
}