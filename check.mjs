import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzscgodomoighbommzmy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c2Nnb2RvbW9pZ2hib21tem15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDI5NDEsImV4cCI6MjA4NjQ3ODk0MX0.avvjBf1X8yQUdpQdBPs997oMv-FHbguFJTRuTK9ak0c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: applied, error: fetchErr } = await supabase
        .from('opportunities')
        .select('id, title, status')
        .limit(3);

    console.log('Current items:', applied);

    if (applied && applied.length > 0) {
        const testId = applied[0].id;
        console.log('Testing update on:', testId, applied[0].title);

        // Test updating to 'accepted'
        const { data: updated, error: updErr } = await supabase
            .from('opportunities')
            .update({ status: 'accepted' })
            .eq('id', testId)
            .select();

        if (updErr) {
            console.error('FAILED TO UPDATE TO ACCEPTED:', updErr);
        } else {
            console.log('SUCCESSFULLY UPDATED TO ACCEPTED:', updated);
        }
    }
}

check();
