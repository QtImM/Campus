
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://baihmybeajpfitionsbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaWhteWJlYWpwZml0aW9uc2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mzc4MjksImV4cCI6MjA4NjExMzgyOX0.wS-XzFRyZAJhaxl21rT32Ij2dCbWLDdCGl1hObk9OOo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function dumpBuildings() {
    const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('id');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

dumpBuildings();
