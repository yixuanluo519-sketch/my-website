// MorganGastro V7 Supabase Config
// Safe for frontend: publishable key only. Never put secret/service role keys here.

const MG_SUPABASE_URL = "https://omcytrhftuivfzbwcalp.supabase.co";
const MG_SUPABASE_KEY = "sb_publishable_XpUZl3GZyhSQ9-NR4xFzbw_Kf5pU_cQ";

async function mgFetchProducts(params = ""){
    const url = `${MG_SUPABASE_URL}/rest/v1/products${params}`;
    const response = await fetch(url,{
        headers:{
            apikey:MG_SUPABASE_KEY,
            Authorization:`Bearer ${MG_SUPABASE_KEY}`,
            "Content-Type":"application/json"
        }
    });

    if(!response.ok){
        throw new Error(`Supabase request failed: ${response.status}`);
    }

    return await response.json();
}

function mgImageFallback(url){
    return url || "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80";
}

function mgCleanText(value){
    return value ? String(value) : "";
}
