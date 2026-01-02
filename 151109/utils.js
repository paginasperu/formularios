/**
 * RFC 4180 CSV Parser
 * Handles quoted fields, escaped quotes, and commas within values.
 */
function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++; // Skip next quote
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField.trim());
                currentField = '';
            } else if (char === '\n' || char === '\r') {
                currentRow.push(currentField.trim());
                if (currentRow.length > 0 && currentRow.some(field => field !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
                if (char === '\r' && nextChar === '\n') i++; // Handle CRLF
            } else {
                currentField += char;
            }
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    // Convert to objects based on headers
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.toLowerCase());
    return rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });
}

/**
 * Normalizes text for search (removes accents, lowercase)
 */
function normalizeText(text) {
    if (!text) return '';
    return text.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Data Management
 */
const DataManager = {
    async fetchData() {
        const cacheKey = 'liquor_store_data_cache';
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            const now = Date.now();
            if (now - timestamp < CONFIG.CACHE_TTL * 1000) {
                console.log('Serving from cache');
                return data;
            }
        }

        try {
            const response = await fetch(CONFIG.SHEET_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const csvText = await response.text();
            const data = parseCSV(csvText);

            // Expected fields mapping and data cleaning
            const cleanedData = data.map(item => ({
                name: item.nombre || item.name || '',
                price: parseFloat(item.precio_regular || item.regular_price || 0),
                salePrice: parseFloat(item.precio_rebajado || item.sale_price || 0),
                category: item.categoria || item.category || 'Otros',
                description: item.descripcion || item.description || '',
                image: item.imagen || item.image || '',
                id: btoa(item.nombre + item.descripcion).substring(0, 10) // Simple unique ID
            }));

            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: cleanedData
            }));

            return cleanedData;
        } catch (error) {
            console.error('Fetch error:', error);
            return cached ? JSON.parse(cached).data : [];
        }
    }
};

window.DataManager = DataManager;
window.normalizeText = normalizeText;
