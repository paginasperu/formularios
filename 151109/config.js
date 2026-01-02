const CONFIG = {
    // Google Sheets CSV URL (Export as CSV)
    // Example: https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pub?output=csv
    SHEET_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRUcc0qpHG3yPnGv714JJlzLkry_VWsKvIdrPCS-2fIM5oSLPL0a_MmyzUk9eQomrBkplUL5auyxhmV/pub?gid=0&single=true&output=csv",

    // Business Information
    STORE_NAME: "Antigravity Liquors",
    STORE_DESCRIPTION: "Premium selection of wines, spirits, and craft beers. Fast delivery to your doorstep.",
    LOGO_URL: "https://via.placeholder.com/150x50?text=LOGO", // User should replace with actual logo

    // UI Customization
    PRIMARY_COLOR: "#d4af37", // Gold/Alcoholic Amber
    SECONDARY_COLOR: "#1a1a1a", // Deep Black
    CURRENCY: "S/ ",

    // Social Media Links
    WHATSAPP_NUMBER: "51900000000", // International format without +
    INSTAGRAM: "https://instagram.com/liquorstore",
    FACEBOOK: "https://facebook.com/liquorstore",
    TIKTOK: "https://tiktok.com/@liquorstore",
    YOUTUBE: "https://youtube.com/@liquorstore",

    // Caching Settings
    CACHE_TTL: 3600, // 1 hour in seconds
    CART_PREFIX: "liquor_store_"
};

window.CONFIG = CONFIG;
