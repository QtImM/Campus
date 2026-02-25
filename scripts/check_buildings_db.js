const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://baihmybeajpfitionsbv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaWhteWJlYWpwZml0aW9uc2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mzc4MjksImV4cCI6MjA4NjExMzgyOX0.wS-XzFRyZAJhaxl21rT32Ij2dCbWLDdCGl1hObk9OOo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuildings() {
    const { data, error } = await supabase.from('buildings').select('name').limit(10);
    if (error) {
        console.error(error);
        return;
    }
    console.log('Sample Building Names from DB:');
    data.forEach(b => console.log(`- "${b.name}"`));
}

checkBuildings();
