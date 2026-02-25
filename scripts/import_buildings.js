const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../data/building_overrides_rows.csv');
const BUILDINGS_TS_PATH = path.join(__dirname, '../data/buildings.ts');
const OUTPUT_SQL_PATH = path.join(__dirname, '../data/buildings_import.sql');

async function generateImportSQL() {
    console.log('--- Generating Building Import SQL ---');

    // 1. Read CSV
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV file not found at: ${CSV_PATH}`);
        return;
    }
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const csvLines = csvContent.trim().split('\n').slice(1);
    const overrides = {};
    csvLines.forEach(line => {
        const [id, lat, lng, isDeleted, updatedAt] = line.split(',');
        const normalizedId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
        overrides[normalizedId] = {
            id: id, // Keep original ID for reference if needed
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            is_deleted: isDeleted === 'true',
            updated_at: updatedAt
        };
    });

    // 2. Read buildings.ts Content
    if (!fs.existsSync(BUILDINGS_TS_PATH)) {
        console.error(`Buildings TS file not found at: ${BUILDINGS_TS_PATH}`);
        return;
    }
    const tsContent = fs.readFileSync(BUILDINGS_TS_PATH, 'utf-8');
    const buildingRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',\s*coordinates:\s*\{\s*latitude:\s*([0-9.]+),\s*longitude:\s*([0-9.]+)\s*\},\s*description:\s*'([^']*)',\s*imageUrl:\s*'([^']*)'\s*\}/g;

    const buildings = [];
    let match;
    while ((match = buildingRegex.exec(tsContent)) !== null) {
        const [_, fullId, name, category, lat, lng, description, imageUrl] = match;
        const shortId = name.toLowerCase().replace(/[^a-z0-9]/g, '');

        const building = {
            id: fullId,
            name,
            category,
            description,
            image_url: imageUrl,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            is_deleted: false
        };

        if (overrides[shortId]) {
            console.log(`Overriding coordinates for: ${fullId} (${shortId})`);
            building.lat = overrides[shortId].lat;
            building.lng = overrides[shortId].lng;
            building.is_deleted = overrides[shortId].is_deleted;
            overrides[shortId].used = true;
        }
        buildings.push(building);
    }

    // 3. Add buildings from CSV only
    Object.keys(overrides).forEach(id => {
        if (!overrides[id].used) {
            console.log(`Adding new building from CSV: ${id}`);
            buildings.push({
                id: id,
                name: id.toUpperCase().replace(/-/g, ' '),
                category: 'Other',
                description: 'Imported from override CSV',
                image_url: '',
                lat: overrides[id].lat,
                lng: overrides[id].lng,
                is_deleted: overrides[id].is_deleted
            });
        }
    });

    // 4. Generate SQL
    let sql = '-- HKCampus Building Import Data\n';
    sql += 'DELETE FROM public.buildings;\n\n';

    buildings.forEach(b => {
        const escape = (str) => str ? str.replace(/'/g, "''") : '';
        sql += `INSERT INTO public.buildings (id, name, category, description, image_url, lat, lng, is_deleted) \n`;
        sql += `VALUES ('${escape(b.id)}', '${escape(b.name)}', '${escape(b.category)}', '${escape(b.description)}', '${escape(b.image_url)}', ${b.lat}, ${b.lng}, ${b.is_deleted});\n\n`;
    });

    fs.writeFileSync(OUTPUT_SQL_PATH, sql);
    console.log(`Successfully generated SQL in: ${OUTPUT_SQL_PATH}`);
}

generateImportSQL();
