// Add event listener for the Reset Filters button in sidebar (if present)
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetFilters();
            applyFilters();
        });
    }
// --- Simple symmetric encryption/decryption using AES (CryptoJS) ---
// Requires CryptoJS library. If not present, add via CDN in index.html
// Key: 'BOTDB'

// Encrypts a string using AES
function encryptText(plainText) {
    if (!window.CryptoJS) {
        alert('CryptoJS library not loaded.');
        return '';
    }
    return CryptoJS.AES.encrypt(plainText, 'BOTDB').toString();
}

// Decrypts a string using AES
function decryptText(cipherText) {
    if (!window.CryptoJS) {
        alert('CryptoJS library not loaded.');
        return '';
    }
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, 'BOTDB');
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return '';
    }
}
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
        const response = await fetch('database/cards.json');
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
        // Prepare rarity HTML as spans with data-index
        let rarityHtml = '';
        if (Array.isArray(card.rarity)) {
            rarityHtml = card.rarity.map((r, i) => `<span class="rarity-span rarity-box" data-index="${i}" style="display:inline-block;padding:2px 8px;margin:0 2px;border-radius:6px;background:#f3f3f3;border:1px solid #bbb;cursor:pointer;min-width:40px;text-align:center;">${getMappedValue(rarityMap, r)}</span>`).join(' ');
        } else {
            rarityHtml = `<span class="rarity-span rarity-box" data-index="0" style="display:inline-block;padding:2px 8px;margin:0 2px;border-radius:6px;background:#f3f3f3;border:1px solid #bbb;min-width:40px;text-align:center;">${getMappedValue(rarityMap, card.rarity)}</span>`;
        }
        cardElement.innerHTML = `
            <h4>${card.name}</h4>
            <img src="${Array.isArray(card.image) ? card.image[0] : card.image}" alt="${card.name}" class="card-image">
            <p><span class="label">Type:</span> ${getMappedValue(typeMap, card.type)}</p>
            <p><span class="label">Symbol:</span> ${getMappedValue(symbolMap, card.symbol)}</p>
            <span class="label">Cost:</span><span>${getMappedValue(costMap, card.cost)} ${colorCircle}</span>
            <p ><span class="label" >Gem:</span> ${getMappedValue(gemMap, card.gem)} </span></p>
            <p><span class="label">Power:</span> ${getMappedValue(powerMap, card.power)}</p>
            <p><span class="label">Rarity:</span> ${rarityHtml}</p>
            <p><span class="label">Ability:</span> ${card.ability || 'N/A'}</p>
            <button class="card-add-btn" title="เพิ่มลง Deck">+</button>
        `;
        // Hover logic for rarity
        const imgEl = cardElement.querySelector('img.card-image');
        const raritySpans = cardElement.querySelectorAll('.rarity-span');
        if (imgEl && Array.isArray(card.image) && card.image.length > 1) {
            raritySpans.forEach(span => {
                span.addEventListener('mouseenter', function() {
                    const idx = parseInt(this.dataset.index);
                    if (card.image[idx]) imgEl.src = card.image[idx];
                });
                span.addEventListener('mouseleave', function() {
                    imgEl.src = card.image[0];
                });
            });
        }
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
    // --- เงื่อนไข deck ---
    // 1. card.isOnlyOne มีได้เพียง 1 ใบ
    if (card.isOnlyOne === 'Y' && deck[cardKey] && deck[cardKey].count >= 1) {
        alert('การ์ดนี้เป็นแบบ #1 ใส่ได้เพียง 1 ใบในเด็ค');
        return;
    }
    // 2. card.name ซ้ำกันได้ 4 ใบ (ยกเว้น type L)
    if (card.type !== 'L' && deck[cardKey] && deck[cardKey].count >= 4) {
        alert('การ์ดนี้ใส่ได้สูงสุด 4 ใบในเด็ค');
        return;
    }
    // 3. card.type = "L" มีได้ 5 ใบใน deck และ card.name ห้ามซ้ำกัน
    if (card.type === 'L') {
        // นับจำนวน type L ใน deck
        const lCount = Object.values(deck).filter(entry => entry.card.type === 'L').length;
        if (!deck[cardKey] && lCount >= 5) {
            alert('การ์ดประเภท Life ใส่ได้สูงสุด 5 ใบในเด็ค และห้ามซ้ำกัน');
            return;
        }
        if (deck[cardKey]) {
            alert('การ์ดประเภท Life ห้ามซ้ำกันในเด็ค');
            return;
        }
    }
    // 4. จำนวน card ทั้งหมดใน deck มีได้ 50 ใบ
    const totalCount = Object.values(deck).reduce((sum, entry) => sum + entry.count, 0);
    if (totalCount >= 50) {
        alert('เด็คมีการ์ดครบ 50 ใบแล้ว');
        return;
    }
    // --- เพิ่มการ์ด ---
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

    // --- กล่องแสดงผลพิเศษ (สูง 20% ของ right-sidebar) ---
    let infoBox = document.createElement('div');
    infoBox.id = 'deck-info-box';
    infoBox.style.height = '20%';
    infoBox.style.background = '#eaf6fb';
    infoBox.style.borderRadius = '10px';
    infoBox.style.marginBottom = '18px';
    infoBox.style.display = 'flex';
    infoBox.style.flexDirection = 'column';
    infoBox.style.alignItems = 'center';
    infoBox.style.justifyContent = 'center';
    infoBox.style.fontWeight = 'bold';
    infoBox.style.fontSize = '1.1em';
    infoBox.style.color = '#2193b0';


    // --- Input field and submit button for deck import (decrypt) ---
    // Render only once, always visible under deck-info-box
    let importBox = document.getElementById('deck-import-box');
    if (!importBox) {
        importBox = document.createElement('div');
        importBox.id = 'deck-import-box';
        importBox.style.display = 'flex';
        importBox.style.flexDirection = 'row';
        importBox.style.gap = '6px';
        importBox.style.margin = '12px 0 18px 0';
        importBox.innerHTML = `
          <input id="deckImportInput" type="text" placeholder="Paste deck code..." style="flex:2; padding:7px 10px; border-radius:6px; border:1px solid #ccc; font-size:1em;">
          <button id="deckImportBtn" style="flex:1; border-radius:6px; background:#2F18E7; color:#fff; border:none; font-weight:bold; cursor:pointer;">submit</button>
        `;
        rightSidebar.appendChild(importBox);

        // Bind import button event (only once)
        const importBtn = importBox.querySelector('#deckImportBtn');
        importBtn.onclick = function() {
            const input = importBox.querySelector('#deckImportInput').value.trim();
            if (!input) return alert('กรุณาใส่ข้อความ deck ที่เข้ารหัส');
            let decrypted = decryptText(input);
            if (!decrypted) return alert('ถอดรหัสไม่สำเร็จ');
            // Parse format: card1.print:amount,card2.print:amount,...
            const newDeck = {};
            decrypted.split(',').forEach(pair => {
                const [print, amount] = pair.split(':');
                if (!print || !amount) return;
                // Find card by print (first match)
                const card = allCardsData.find(c => c.print === print);
                if (card) {
                    newDeck[card.name] = { card, count: parseInt(amount) || 1 };
                }
            });
            // Replace deck
            Object.keys(deck).forEach(key => delete deck[key]);
            Object.entries(newDeck).forEach(([k, v]) => deck[k] = v);
            renderDeck();
        };
    }

    // --- สรุปจำนวนการ์ดทั้งหมดและแยกตาม type ---
    const totalCount = Object.values(deck).reduce((sum, entry) => sum + entry.count, 0);
    const typeCount = {};
    Object.values(deck).forEach(entry => {
        const type = entry.card.type || 'N/A';
        if (!typeCount[type]) typeCount[type] = 0;
        typeCount[type] += entry.count;
    });

    let typeSummary = '';
    for (const [type, count] of Object.entries(typeCount)) {
        typeSummary += `<div>${getMappedValue(typeMap, type)}  : <span style="color:#e67e22;">${count}</span></div>`;
    }

    infoBox.innerHTML = `
        <div>จำนวนการ์ดใน Deck  : <span style="color:#e67e22;">${totalCount}</span> /50</div>
        <div style="margin-top:1px; font-weight:normal;">
            ${typeSummary}
        </div>
    `;


    rightSidebar.appendChild(infoBox);

    // --- กล่อง scroll สำหรับแสดง deck-card-box ---
    let deckScrollBox = document.getElementById('deck-scroll-box');
    if (!deckScrollBox) {
        deckScrollBox = document.createElement('div');
        deckScrollBox.id = 'deck-scroll-box';
        deckScrollBox.style.flex = '1 1 auto';
        deckScrollBox.style.overflowY = 'auto';
        deckScrollBox.style.maxHeight = '1080px';
        deckScrollBox.style.marginBottom = '12px';
        deckScrollBox.style.paddingRight = '4px';
        rightSidebar.appendChild(deckScrollBox);
    } else {
        deckScrollBox.innerHTML = '';
    }

    // --- จัดเรียง deck ตาม priority ที่กำหนด ---
    const deckEntries = Object.entries(deck);
    deckEntries.sort((a, b) => {
        const getPriority = (entry) => {
            const card = entry[1].card;
            if (card.isOnlyOne === "Y") return 0;
            if (card.type === "A") return 1;
            if (card.type === "M") return 2;
            if (card.type === "C") return 3;
            if (card.type === "L") return 4;
            return 5;
        };
        return getPriority(a) - getPriority(b);
    });

    // กล่องแสดงการ์ดใน deck (เรียงตาม priority) ใน deckScrollBox
    deckEntries.forEach(([cardKey, entry]) => {
        const { card, count } = entry;
        const deckCardBox = document.createElement('div');
        deckCardBox.className = 'deck-card-box';
        let onlyOneText = '';
        if (card.isOnlyOne === 'Y') {
            onlyOneText = ' <span style="color:#dc3545;font-weight:bold;">#1</span>';
        }
        // กำหนดสีของ type
        let typeColor = '';
        if (card.type === 'A') typeColor = '#dc3545';
        else if (card.type === 'M') typeColor = '#036ba8';
        else if (card.type === 'C') typeColor = '#f6cf0f';
        else if (card.type === 'L') typeColor = '#373535';
        deckCardBox.innerHTML = `
            <div class="deck-card-info">
                <div class="deck-card-name">${card.name} <span class="deck-card-count">x${count}</span></div>
                <div class="deck-card-type" style="color:${typeColor};">${getMappedValue(typeMap, card.type)}${onlyOneText}</div>
            </div>
            <button class="deck-card-add-btn" title="เพิ่มจำนวนการ์ดใน Deck">+</button>
            <button class="deck-card-remove-btn" title="นำออกจาก Deck">−</button>
        `;
        // ปุ่มเพิ่ม
        const addBtn = deckCardBox.querySelector('.deck-card-add-btn');
        addBtn.addEventListener('click', () => {
            deck[cardKey].count += 1;
            renderDeck();
        });
        // ปุ่มลบ
        const removeBtn = deckCardBox.querySelector('.deck-card-remove-btn');
        removeBtn.addEventListener('click', () => removeFromDeck(cardKey));
        deckScrollBox.appendChild(deckCardBox);
    });

    // --- ปุ่มด้านล่างสุดของ right-sidebar ---
    let deckActionBox = document.getElementById('deck-action-box');
    if (!deckActionBox) {
        deckActionBox = document.createElement('div');
        deckActionBox.id = 'deck-action-box';
        rightSidebar.appendChild(deckActionBox);
    }
    // ปุ่มแนวนอน 2 ปุ่ม: share, clear
    deckActionBox.innerHTML = `
      <div style="display: flex; flex-direction: row; gap: 5px; width: 100%; justify-content: space-between;">
        <button id="shareDeckBtn" class="deck-action-btn" style="flex:1;">share</button>
        <button id="clearDeckBtn" class="deck-action-btn danger" style="flex:1;">clear</button>
      </div>
    `;

    // ต้อง bind event หลังจาก innerHTML ถูกเซ็ตใหม่
    const clearDeckBtn = deckActionBox.querySelector('#clearDeckBtn');
    if (clearDeckBtn) {
        clearDeckBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            Object.keys(deck).forEach(key => delete deck[key]);
            renderDeck();
        };
    }

    // --- share button logic ---
    const shareDeckBtn = deckActionBox.querySelector('#shareDeckBtn');
    if (shareDeckBtn) {
        shareDeckBtn.onclick = function () {
        const deckString = Object.values(deck)
                .map(entry => `${entry.card.print}:${entry.count}`)
                .join(',');
        const encrypted = encryptText(deckString);
        navigator.clipboard.writeText(encrypted).then(() => {
            alert('copied to your cardboard');
        });
    };

    }
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

    /**
     * Group cards by name, keeping the first card's data and collecting all images and rarities as arrays.
     * @param {Array<Object>} cards - The array of card objects to group.
     * @returns {Array<Object>} - The grouped card objects.
     */
    function groupCardsByName(cards) {
        const grouped = new Map();
        cards.forEach(card => {
            if (!card.name) return;
            if (!grouped.has(card.name)) {
                // Clone the card object to avoid mutating the original
                grouped.set(card.name, {
                    ...card,
                    image: [card.image],
                    rarity: [card.rarity]
                });
            } else {
                const group = grouped.get(card.name);
                // Add image if not already present
                if (card.image && !group.image.includes(card.image)) {
                    group.image.push(card.image);
                }
                // Add rarity if not already present
                if (card.rarity && !group.rarity.includes(card.rarity)) {
                    group.rarity.push(card.rarity);
                }
            }
        });
        return Array.from(grouped.values());
    }

    // Group cards by name and use the grouped data
    allCardsData = groupCardsByName(allCardsData);

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
        renderDeck(); // Always show deck import box and deck info on first load
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

    // Event listener for the "search" button in sidebar
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            applyFilters();
        });
    }

    // Event listener for the Reset Filters button in sidebar
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetFilters();
            applyFilters();
        });
    }

    // Debounced search input, still applies filters when typing
    const nameSearchInput = document.getElementById('nameSearchInput');
    if (nameSearchInput) {
        nameSearchInput.addEventListener('input', debounce(applyFilters, 300));
    }
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

