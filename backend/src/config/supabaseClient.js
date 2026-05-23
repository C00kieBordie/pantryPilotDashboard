const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws'); 
require('dotenv').config();

const tenantSupabase = createClient(
    process.env.TENANT_SUPABASE_URL, 
    process.env.TENANT_SERVICE_KEY,
    {
        auth: {
            persistSession: false 
        },
        // THIS is the updated syntax the new SDK is asking for:
        realtime: {
            transport: WebSocket
        }
    }
);

module.exports = { tenantSupabase };