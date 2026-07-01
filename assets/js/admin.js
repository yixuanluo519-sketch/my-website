// MorganGastro Admin V7 Secure Login + CRM
// Uses Supabase Auth. Frontend uses publishable key only.

const ADMIN_SUPABASE_URL = "https://omcytrhftuivfzbwcalp.supabase.co";
const ADMIN_SUPABASE_KEY = "sb_publishable_XpUZl3GZyhSQ9-NR4xFzbw_Kf5pU_cQ";

const adminClient = supabase.createClient(ADMIN_SUPABASE_URL, ADMIN_SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;
let allProducts = [];
let allQuotes = [];
let editingProductId = null;

const quoteStatuses = ["New","Contacted","Quoted","Negotiating","Won","Lost","Closed"];

function $(id){
    return document.getElementById(id);
}

function clean(value){
    return value === null || value === undefined ? "" : String(value);
}

function showMessage(id, text, type=""){
    const el = $(id);
    if(!el) return;
    el.textContent = text;
    el.className = `message ${type}`;
}

function formatDate(value){
    if(!value) return "";
    return new Date(value).toLocaleString();
}

function canManageProducts(){
    return ["owner","admin"].includes(currentProfile?.role);
}

function canManageQuotes(){
    return ["owner","admin","sales"].includes(currentProfile?.role);
}

function canDeleteData(){
    return ["owner","admin"].includes(currentProfile?.role);
}

async function initAuth(){
    const { data } = await adminClient.auth.getSession();

    if(data.session){
        await loadUser(data.session.user);
    }else{
        showLogin();
    }

    adminClient.auth.onAuthStateChange(async (event, session)=>{
        if(event === "SIGNED_IN" && session?.user){
            await loadUser(session.user);
        }

        if(event === "SIGNED_OUT"){
            currentUser = null;
            currentProfile = null;
            showLogin();
        }
    });
}

function showLogin(){
    $("loginScreen").classList.remove("hidden");
    $("adminApp").classList.add("hidden");
}

function showAdmin(){
    $("loginScreen").classList.add("hidden");
    $("adminApp").classList.remove("hidden");
}

async function loadUser(user){
    currentUser = user;

    const { data: profile, error } = await adminClient
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .eq("active", true)
        .maybeSingle();

    if(error || !profile){
        await adminClient.auth.signOut();
        showLogin();
        showMessage("loginMessage","This account is not authorized for MorganGastro Admin.","error");
        return;
    }

    currentProfile = profile;
    $("userBox").innerHTML = `
        <strong>${clean(profile.email)}</strong><br>
        Role: ${clean(profile.role)}<br>
        Status: ${profile.active ? "Active" : "Inactive"}
    `;
    $("settingsRole").textContent = profile.role;

    showAdmin();
    await loadAllData();
}

async function login(){
    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

    if(!email || !password){
        showMessage("loginMessage","Please enter email and password.","error");
        return;
    }

    $("loginBtn").disabled = true;
    $("loginBtn").textContent = "Logging in...";

    const { error } = await adminClient.auth.signInWithPassword({
        email,
        password
    });

    $("loginBtn").disabled = false;
    $("loginBtn").textContent = "Login";

    if(error){
        showMessage("loginMessage", error.message, "error");
    }
}

async function logout(){
    await adminClient.auth.signOut();
}

async function loadAllData(){
    await Promise.all([
        loadProducts(),
        loadQuotes()
    ]);

    renderDashboard();
    renderProducts();
    renderQuotes();
    renderCustomers();
}

async function loadProducts(){
    const { data, error } = await adminClient
        .from("products")
        .select("*")
        .order("id",{ascending:false})
        .limit(200);

    if(error){
        console.error(error);
        allProducts = [];
        return;
    }

    allProducts = data || [];
}

async function loadQuotes(){
    const { data, error } = await adminClient
        .from("quotes")
        .select("*")
        .order("created_at",{ascending:false})
        .limit(300);

    if(error){
        console.error(error);
        allQuotes = [];
        return;
    }

    allQuotes = data || [];
}

function renderDashboard(){
    $("statProducts").textContent = allProducts.length;
    $("statQuotes").textContent = allQuotes.length;
    $("statNewQuotes").textContent = allQuotes.filter(q => clean(q.status) === "New" || !q.status).length;

    const customerKeys = new Set(
        allQuotes.map(q => clean(q.email) || clean(q.phone) || clean(q.name)).filter(Boolean)
    );
    $("statCustomers").textContent = customerKeys.size;

    const latest = allQuotes.slice(0,8);
    $("latestQuotesBody").innerHTML = latest.length ? latest.map(q=>`
        <tr>
            <td>
                <strong>${clean(q.name)}</strong><br>
                <small>${clean(q.company)}</small>
            </td>
            <td>${clean(q.product_name)}</td>
            <td><span class="badge ${clean(q.status || "New")}">${clean(q.status || "New")}</span></td>
            <td>${formatDate(q.created_at)}</td>
        </tr>
    `).join("") : `<tr><td colspan="4">No quotes yet.</td></tr>`;
}

function renderQuotes(){
    const search = $("quoteSearch")?.value.toLowerCase().trim() || "";
    const status = $("quoteStatusFilter")?.value || "";

    let quotes = allQuotes.filter(q=>{
        const blob = [
            q.name,q.company,q.email,q.phone,q.country,
            q.product_name,q.quantity,q.message,q.status
        ].map(clean).join(" ").toLowerCase();

        const matchSearch = !search || blob.includes(search);
        const matchStatus = !status || clean(q.status || "New") === status;

        return matchSearch && matchStatus;
    });

    $("quotesBody").innerHTML = quotes.length ? quotes.map(q=>`
        <tr>
            <td>
                <strong>${clean(q.name)}</strong><br>
                <small>${clean(q.company)}</small>
            </td>
            <td>
                ${clean(q.email)}<br>
                <small>${clean(q.phone)}</small>
            </td>
            <td>${clean(q.product_name)}</td>
            <td>${clean(q.quantity)}</td>
            <td>${clean(q.country)}</td>
            <td>
                <select onchange="updateQuoteStatus(${q.id}, this.value)" ${canManageQuotes() ? "" : "disabled"}>
                    ${quoteStatuses.map(s=>`
                        <option value="${s}" ${clean(q.status || "New") === s ? "selected" : ""}>${s}</option>
                    `).join("")}
                </select>
            </td>
            <td>${formatDate(q.created_at)}</td>
            <td>
                <div class="action-row">
                    <button onclick="openQuote(${q.id})">View</button>
                    ${canDeleteData() ? `<button class="danger" onclick="deleteQuote(${q.id})">Delete</button>` : ""}
                </div>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="8">No quote requests found.</td></tr>`;
}

function openQuote(id){
    const q = allQuotes.find(item => item.id === id);
    if(!q) return;

    $("quoteDetailContent").innerHTML = `
        <div class="detail-grid">
            <div class="detail-item"><strong>Name</strong>${clean(q.name)}</div>
            <div class="detail-item"><strong>Company</strong>${clean(q.company)}</div>
            <div class="detail-item"><strong>Email</strong>${clean(q.email)}</div>
            <div class="detail-item"><strong>Phone</strong>${clean(q.phone)}</div>
            <div class="detail-item"><strong>Country</strong>${clean(q.country)}</div>
            <div class="detail-item"><strong>Quantity</strong>${clean(q.quantity)}</div>
            <div class="detail-item"><strong>Product</strong>${clean(q.product_name)}</div>
            <div class="detail-item"><strong>Status</strong>${clean(q.status || "New")}</div>
            <div class="detail-item full"><strong>Message</strong>${clean(q.message)}</div>
            <div class="detail-item full"><strong>Created</strong>${formatDate(q.created_at)}</div>
        </div>

        <div class="action-row" style="margin-top:18px">
            ${quoteStatuses.map(s=>`<button onclick="updateQuoteStatus(${q.id}, '${s}')">${s}</button>`).join("")}
        </div>
    `;

    $("quoteModal").classList.remove("hidden");
}

async function updateQuoteStatus(id, status){
    if(!canManageQuotes()){
        alert("Your role cannot update quotes.");
        return;
    }

    const { error } = await adminClient
        .from("quotes")
        .update({ status })
        .eq("id", id);

    if(error){
        alert(error.message);
        return;
    }

    await loadQuotes();
    renderDashboard();
    renderQuotes();
    renderCustomers();
}

async function deleteQuote(id){
    if(!canDeleteData()){
        alert("Your role cannot delete data.");
        return;
    }

    if(!confirm("Delete this quote request?")){
        return;
    }

    const { error } = await adminClient
        .from("quotes")
        .delete()
        .eq("id", id);

    if(error){
        alert(error.message);
        return;
    }

    await loadQuotes();
    renderDashboard();
    renderQuotes();
    renderCustomers();
}

function renderCustomers(){
    const map = new Map();

    allQuotes.forEach(q=>{
        const key = clean(q.email) || clean(q.phone) || clean(q.name) || `quote-${q.id}`;

        if(!map.has(key)){
            map.set(key,{
                name:q.name,
                company:q.company,
                email:q.email,
                phone:q.phone,
                country:q.country,
                total:0,
                status:q.status || "New",
                latest:q.created_at
            });
        }

        const item = map.get(key);
        item.total += 1;

        if(new Date(q.created_at) > new Date(item.latest)){
            item.status = q.status || "New";
            item.latest = q.created_at;
        }
    });

    const customers = Array.from(map.values());

    $("customersBody").innerHTML = customers.length ? customers.map(c=>`
        <tr>
            <td>${clean(c.name)}</td>
            <td>${clean(c.company)}</td>
            <td>${clean(c.email)}</td>
            <td>${clean(c.phone)}</td>
            <td>${clean(c.country)}</td>
            <td>${c.total}</td>
            <td><span class="badge ${clean(c.status)}">${clean(c.status)}</span></td>
        </tr>
    `).join("") : `<tr><td colspan="7">No customers yet.</td></tr>`;
}

function renderProducts(){
    const search = $("productSearch")?.value.toLowerCase().trim() || "";

    const products = allProducts.filter(p=>{
        const blob = [p.name,p.category,p.brand,p.model,p.description]
            .map(clean).join(" ").toLowerCase();
        return !search || blob.includes(search);
    });

    $("productsBody").innerHTML = products.length ? products.map(p=>`
        <tr>
            <td>
                <strong>${clean(p.name)}</strong><br>
                <small>${clean(p.brand)} ${clean(p.model)}</small>
            </td>
            <td>${clean(p.category)}</td>
            <td>${p.featured ? "Yes" : "No"}</td>
            <td>
                <div class="action-row">
                    <button onclick="editProduct(${p.id})">Edit</button>
                    ${canManageProducts() ? `<button class="danger" onclick="deleteProduct(${p.id})">Delete</button>` : ""}
                </div>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="4">No products found.</td></tr>`;
}

function editProduct(id){
    const p = allProducts.find(item => item.id === id);
    if(!p) return;

    editingProductId = id;
    $("productFormTitle").textContent = `Edit Product #${id}`;
    $("productName").value = clean(p.name);
    $("productCategory").value = clean(p.category);
    $("productBrand").value = clean(p.brand);
    $("productModel").value = clean(p.model);
    $("productPrice").value = clean(p.price);
    $("productImageUrl").value = clean(p.image_url);
    $("productDescription").value = clean(p.description);
    $("productFeatured").checked = p.featured === true;

    showPage("products");
    window.scrollTo({top:0,behavior:"smooth"});
}

function clearProductForm(){
    editingProductId = null;
    $("productFormTitle").textContent = "Add Product";
    $("productName").value = "";
    $("productCategory").value = "";
    $("productBrand").value = "";
    $("productModel").value = "";
    $("productPrice").value = "";
    $("productImageUrl").value = "";
    $("productImageFile").value = "";
    $("productDescription").value = "";
    $("productFeatured").checked = false;
    showMessage("productMessage","");
}

async function uploadProductImageIfNeeded(){
    const file = $("productImageFile").files[0];
    if(!file){
        return $("productImageUrl").value.trim();
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g,"-");
    const path = `admin/${Date.now()}-${safeName}`;

    const { error } = await adminClient.storage
        .from("products")
        .upload(path, file, { upsert:false });

    if(error){
        throw error;
    }

    const { data } = adminClient.storage
        .from("products")
        .getPublicUrl(path);

    return data.publicUrl;
}

async function saveProduct(){
    if(!canManageProducts()){
        showMessage("productMessage","Your role cannot manage products.","error");
        return;
    }

    const name = $("productName").value.trim();

    if(!name){
        showMessage("productMessage","Product name is required.","error");
        return;
    }

    $("saveProductBtn").disabled = true;
    $("saveProductBtn").textContent = "Saving...";

    try{
        const imageUrl = await uploadProductImageIfNeeded();

        const payload = {
            name,
            category:$("productCategory").value.trim(),
            brand:$("productBrand").value.trim(),
            model:$("productModel").value.trim(),
            price:$("productPrice").value.trim(),
            image_url:imageUrl,
            description:$("productDescription").value.trim(),
            featured:$("productFeatured").checked
        };

        let result;

        if(editingProductId){
            result = await adminClient
                .from("products")
                .update(payload)
                .eq("id", editingProductId);
        }else{
            result = await adminClient
                .from("products")
                .insert(payload);
        }

        if(result.error){
            throw result.error;
        }

        showMessage("productMessage","Product saved successfully.","success");
        clearProductForm();
        await loadProducts();
        renderProducts();
        renderDashboard();

    }catch(error){
        showMessage("productMessage",error.message,"error");
    }

    $("saveProductBtn").disabled = false;
    $("saveProductBtn").textContent = "Save Product";
}

async function deleteProduct(id){
    if(!canManageProducts()){
        alert("Your role cannot delete products.");
        return;
    }

    if(!confirm("Delete this product?")){
        return;
    }

    const { error } = await adminClient
        .from("products")
        .delete()
        .eq("id", id);

    if(error){
        alert(error.message);
        return;
    }

    await loadProducts();
    renderProducts();
    renderDashboard();
}

function exportQuotesCSV(){
    if(!allQuotes.length){
        alert("No quotes to export.");
        return;
    }

    const headers = ["id","created_at","name","company","email","phone","country","product_name","quantity","status","message"];
    const rows = allQuotes.map(q => headers.map(h => {
        const value = clean(q[h]).replaceAll('"','""');
        return `"${value}"`;
    }).join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "morgangastro-quotes.csv";
    a.click();

    URL.revokeObjectURL(url);
}

function showPage(page){
    document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));

    $(`${page}Page`).classList.add("active");

    const nav = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if(nav) nav.classList.add("active");

    const titles = {
        dashboard:"Dashboard",
        quotes:"Quote CRM",
        customers:"Customers",
        products:"Products",
        settings:"Settings"
    };

    $("pageTitle").textContent = titles[page] || "Dashboard";
}

function bindEvents(){
    $("loginBtn").addEventListener("click",login);
    $("loginPassword").addEventListener("keydown",(e)=>{
        if(e.key === "Enter") login();
    });
    $("logoutBtn").addEventListener("click",logout);
    $("refreshBtn").addEventListener("click",loadAllData);

    document.querySelectorAll(".nav-btn").forEach(btn=>{
        btn.addEventListener("click",()=>showPage(btn.dataset.page));
    });

    document.querySelectorAll("[data-page-shortcut]").forEach(btn=>{
        btn.addEventListener("click",()=>showPage(btn.dataset.pageShortcut));
    });

    $("quoteSearch").addEventListener("input",renderQuotes);
    $("quoteStatusFilter").addEventListener("change",renderQuotes);
    $("productSearch").addEventListener("input",renderProducts);
    $("exportQuotesBtn").addEventListener("click",exportQuotesCSV);
    $("saveProductBtn").addEventListener("click",saveProduct);
    $("clearProductFormBtn").addEventListener("click",clearProductForm);

    $("closeQuoteModal").addEventListener("click",()=>$("quoteModal").classList.add("hidden"));
    $("quoteModal").addEventListener("click",(e)=>{
        if(e.target.id === "quoteModal"){
            $("quoteModal").classList.add("hidden");
        }
    });
}

document.addEventListener("DOMContentLoaded",()=>{
    bindEvents();
    initAuth();
});
