// src/controllers/inventoryController.js
const { tenantSupabase } = require('../config/supabaseClient');
// 1. Save Full Receipt and Items to Supabase
exports.saveReceiptData = async (req, res) => {
    try {
        // In a real app, user_id comes from your Auth Middleware (e.g., req.user.id)
        // For testing in Postman, we will expect it in the JSON body
        const { user_id, vendor_name, total_amount, items } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: "user_id is required for multi-tenant storage." });
        }

        // --- STEP 1: Create the Invoice ---
        const { data: invoice, error: invoiceError } = await tenantSupabase
            .from('invoices')
            .insert([{ 
                user_id: user_id, 
                vendor_name: vendor_name, 
                total_amount: total_amount, 
                status: 'pending_expiry' // Sets to pending because some items might need manual scans
            }])
            .select()
            .single();

        if (invoiceError) throw invoiceError;

        // --- STEP 2 & 3: Process Items (Catalog -> Batches) ---
        for (const item of items) {
            // Check if this item already exists in the global catalog
            let { data: catalogItem } = await tenantSupabase
                .from('inventory_items')
                .select('item_id')
                .ilike('name', item.product_name) // Case-insensitive search
                .single();

            let currentItemId;

            if (catalogItem) {
                // Item exists, grab its ID
                currentItemId = catalogItem.item_id;
            } else {
                // Brand new item! Add it to the catalog first
                const { data: newItem, error: newItemError } = await tenantSupabase
                    .from('inventory_items')
                    .insert([{ 
                        name: item.product_name, 
                        category: 'Uncategorized', // Default category until a manager sorts it
                        reorder_level: 0 
                    }])
                    .select()
                    .single();
                
                if (newItemError) throw newItemError;
                currentItemId = newItem.item_id;
            }

            // Determine the correct expiration source for your constraint
            let expSource = item.requires_manual_expiry ? 'pending' : 'ai_estimated';

            // Insert the physical stock into the Batches table
            const { error: batchError } = await tenantSupabase
                .from('inventory_batches')
                .insert([{
                    item_id: currentItemId,
                    user_id: user_id,
                    invoice_id: invoice.invoice_id,
                    qty_received: item.quantity,
                    qty_remaining: item.quantity,
                    unit_cost: item.unit_price,
                    expiration_date: item.estimated_expiry_date,
                    expiration_source: expSource,
                    requires_manual_expiry: item.requires_manual_expiry
                }]);

            if (batchError) throw batchError;
        }

        return res.status(201).json({ 
            message: "Receipt and all batches saved successfully to Supabase!", 
            invoice_id: invoice.invoice_id 
        });

    } catch (error) {
        console.error("Supabase Save Error:", error);
        return res.status(500).json({ error: "Failed to save data to Supabase.", details: error.message });
    }
};

// 2. Update a single batch after scanning for example the Tuna Can
exports.updateBatchExpiry = async (req, res) => {
    try {
        const { batch_id, expiry_date } = req.body;

        const { data, error } = await tenantSupabase
            .from('inventory_batches')
            .update({ 
                expiration_date: expiry_date, 
                requires_manual_expiry: false,
                expiration_source: 'ai_item_scan' // Update source per your constraints
            })
            .eq('batch_id', batch_id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: "Batch not found." });

        return res.status(200).json({ 
            message: "Batch expiry date permanently updated!", 
            batch: data[0] 
        });

    } catch (error) {
        console.error("Supabase Update Error:", error);
        return res.status(500).json({ error: "Failed to update expiry date.", details: error.message });
    }
};

// 3. Get All Active Inventory
exports.getActiveInventory = async (req, res) => {
    try {
        // We fetch the batches, and tell Supabase to reach into 'inventory_items' to grab the name
        const { data, error } = await tenantSupabase
            .from('inventory_batches')
            .select(`
                batch_id,
                qty_remaining,
                unit_cost,
                expiration_date,
                requires_manual_expiry,
                inventory_items (
                    name,
                    category,
                    reorder_level
                )
            `)
            .gt('qty_remaining', 0) // Only get items still in stock
            .order('expiration_date', { ascending: true, nullsFirst: false }); // Expiring soonest at the top!

        if (error) throw error;

        return res.status(200).json({
            message: "Active inventory fetched successfully",
            count: data.length,
            inventory: data
        });

    } catch (error) {
        console.error("Fetch Inventory Error:", error);
        return res.status(500).json({ error: "Failed to fetch active inventory.", details: error.message });
    }
};

// 4. Get Pending Expiry Scans (The "To-Do" List)
exports.getPendingScans = async (req, res) => {
    try {
        const { data, error } = await tenantSupabase
            .from('inventory_batches')
            .select(`
                batch_id,
                qty_remaining,
                logged_at,
                inventory_items ( name )
            `)
            .eq('requires_manual_expiry', true) // Only grab the items that need a second photo
            .gt('qty_remaining', 0); 

        if (error) throw error;

        return res.status(200).json({
            message: "Pending scans fetched successfully",
            count: data.length,
            tasks: data
        });

    } catch (error) {
        console.error("Fetch Pending Scans Error:", error);
        return res.status(500).json({ error: "Failed to fetch pending scans.", details: error.message });
    }
};

exports.getActivityLog = async (req, res) => {
  try {
    const { data, error } = await tenantSupabase
      .from('inventory_activity_log')
      .select(`
        log_id,
        action,
        details,
        logged_at,
        inventory_batches (
          batch_id,
          inventory_items ( name )
        ),
        users ( username )
      `)
      .order('logged_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.status(200).json({ log: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch activity log.', details: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { range } = req.query;

    let interval;
    if (range === 'week')  interval = '7 days';
    else if (range === 'year') interval = '1 year';
    else interval = '1 month';

    const spendingResult = await tenantSupabase.rpc ? null : null;

    const { data: invoices, error: invoiceError } = await tenantSupabase
      .from('invoices')
      .select('scanned_at, total_amount')
      .gte('scanned_at', new Date(Date.now() - getMs(range)).toISOString())
      .order('scanned_at', { ascending: true });

    if (invoiceError) throw invoiceError;

    const { data: expiredBatches, error: expiredError } = await tenantSupabase
      .from('inventory_batches')
      .select(`
        unit_cost,
        qty_remaining,
        expiration_date,
        logged_at,
        inventory_items ( name )
      `)
      .lt('expiration_date', new Date().toISOString().split('T')[0])
      .gt('qty_remaining', 0)
      .eq('status', 'available')
      .order('expiration_date', { ascending: true });

    if (expiredError) throw expiredError;

    const totalSpent = invoices.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
    const totalLost  = expiredBatches.reduce((sum, b) => sum + (parseFloat(b.unit_cost || 0) * b.qty_remaining), 0);

    return res.status(200).json({
      totalSpent,
      totalLost,
      invoices,
      expiredBatches,
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats.', details: error.message });
  }
};

function getMs(range) {
  if (range === 'week')  return 7  * 24 * 60 * 60 * 1000;
  if (range === 'year')  return 365 * 24 * 60 * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000; // month
}

exports.updateBatch = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const { qty_remaining, unit_cost, expiration_date, user_id } = req.body;

    // Fetch current values before update
    const { data: current, error: fetchError } = await tenantSupabase
      .from('inventory_batches')
      .select('qty_remaining, unit_cost, expiration_date')
      .eq('batch_id', batch_id)
      .single();

    if (fetchError) throw fetchError;

    const status = qty_remaining === 0 ? 'consumed' : 'available';

    const { data, error } = await tenantSupabase
      .from('inventory_batches')
      .update({ qty_remaining, unit_cost, expiration_date, status })
      .eq('batch_id', batch_id)
      .select('batch_id, qty_remaining, unit_cost, expiration_date')
      .single();

    if (error) throw error;

    // Build one log entry per changed field
    const logs = [];

    if (Number(current.qty_remaining) !== Number(qty_remaining)) {
      logs.push({
        batch_id,
        user_id:        user_id ?? null,
        action_type:    qty_remaining === 0 ? 'batch_consumed' : 'qty_updated',
        change_summary: `qty: ${current.qty_remaining} → ${qty_remaining}`,
      });
    }

    if (parseFloat(current.unit_cost) !== parseFloat(unit_cost)) {
      logs.push({
        batch_id,
        user_id:        user_id ?? null,
        action_type:    'cost_updated',
        change_summary: `cost: $${current.unit_cost} → $${unit_cost}`,
      });
    }

    if (current.expiration_date !== expiration_date) {
      logs.push({
        batch_id,
        user_id:        user_id ?? null,
        action_type:    'expiry_updated',
        change_summary: `expiry: ${current.expiration_date ?? 'none'} → ${expiration_date ?? 'none'}`,
      });
    }

    if (logs.length > 0) {
      const { error: logError } = await tenantSupabase
        .from('inventory_activity_log')
        .insert(logs);

      if (logError) console.error('Activity log insert error:', logError.message);
    }

    return res.status(200).json({ message: 'Batch updated successfully.', batch: data });
  } catch (error) {
    console.error('Update Batch Error:', error);
    return res.status(500).json({ error: 'Failed to update batch.', details: error.message });
  }
};