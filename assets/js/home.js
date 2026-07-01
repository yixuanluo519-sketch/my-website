// MorganGastro V7 Home Page Logic

let mgAllProducts = [];

function mgProductCard(product){
    const name = mgCleanText(product.name);
    const brand = mgCleanText(product.brand);
    const category = mgCleanText(product.category);
    const image = mgImageFallback(product.image_url);

    return `
        <article class="product-card reveal">
            <a class="product-image" href="product.html?id=${product.id}">
                <img src="${image}" alt="${name}">
            </a>
            <div class="product-body">
                <div class="product-brand">${brand || "MorganGastro"}</div>
                <h3>${name}</h3>
                <div class="product-meta">${category}</div>
                <div class="quote-price">Request a Quote for Pricing</div>
                <div class="product-actions">
                    <a class="product-view" href="product.html?id=${product.id}">View</a>
                    <a class="product-quote" href="product.html?id=${product.id}#quote">Quote</a>
                </div>
            </div>
        </article>
    `;
}

async function mgLoadHomeProducts(){
    const featuredBox = document.getElementById("featuredProducts");
    const latestBox = document.getElementById("latestProducts");

    try{
        mgAllProducts = await mgFetchProducts("?select=*&order=id.desc&limit=80");

        const featured = mgAllProducts.filter(product => product.featured === true).slice(0,8);
        const latest = mgAllProducts.slice(0,8);

        if(featuredBox){
            const productsToShow = featured.length ? featured : latest;
            featuredBox.innerHTML = productsToShow.length
                ? productsToShow.map(mgProductCard).join("")
                : `<div class="loading">No products available yet.</div>`;
        }

        if(latestBox){
            latestBox.innerHTML = latest.length
                ? latest.map(mgProductCard).join("")
                : `<div class="loading">No products available yet.</div>`;
        }

        mgInitReveal();
        mgInitGlobalSearch();

    }catch(error){
        console.error(error);

        if(featuredBox){
            featuredBox.innerHTML = `<div class="loading">Unable to load featured products. Please check Supabase policies.</div>`;
        }

        if(latestBox){
            latestBox.innerHTML = `<div class="loading">Unable to load latest products. Please check Supabase policies.</div>`;
        }
    }
}

function mgInitGlobalSearch(){
    const input = document.getElementById("globalSearchInput");
    const button = document.getElementById("globalSearchButton");
    const results = document.getElementById("globalSearchResults");

    if(!input || !button || !results){
        return;
    }

    function goSearch(){
        const query = input.value.trim();
        if(query){
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }else{
            window.location.href = "search.html";
        }
    }

    button.addEventListener("click",goSearch);

    input.addEventListener("keydown",(event)=>{
        if(event.key === "Enter"){
            goSearch();
        }
    });

    input.addEventListener("input",()=>{
        const term = input.value.toLowerCase().trim();

        if(term.length < 2){
            results.style.display = "none";
            results.innerHTML = "";
            return;
        }

        const filtered = mgAllProducts.filter(product =>
            mgCleanText(product.name).toLowerCase().includes(term) ||
            mgCleanText(product.category).toLowerCase().includes(term) ||
            mgCleanText(product.brand).toLowerCase().includes(term) ||
            mgCleanText(product.model).toLowerCase().includes(term) ||
            mgCleanText(product.description).toLowerCase().includes(term)
        ).slice(0,8);

        results.style.display = "block";

        if(!filtered.length){
            results.innerHTML = `
                <div class="search-result-item">
                    <div>
                        <h4>No products found</h4>
                        <p>Try another keyword.</p>
                    </div>
                </div>
            `;
            return;
        }

        results.innerHTML = filtered.map(product => `
            <a class="search-result-item" href="product.html?id=${product.id}">
                <img src="${mgImageFallback(product.image_url)}" alt="${mgCleanText(product.name)}">
                <div>
                    <h4>${mgCleanText(product.name)}</h4>
                    <p>${mgCleanText(product.category)}</p>
                    <p>Request a Quote for Pricing</p>
                </div>
            </a>
        `).join("");
    });

    document.addEventListener("click",(event)=>{
        if(!event.target.closest(".search-box")){
            results.style.display = "none";
        }
    });
}

document.addEventListener("DOMContentLoaded",()=>{
    mgLoadHomeProducts();
});
