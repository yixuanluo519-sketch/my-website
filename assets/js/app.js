// MorganGastro V7 Shared App Functions

function mgInitReveal(){
    const observer = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                entry.target.classList.add("show");
            }
        });
    },{threshold:.12});

    document.querySelectorAll(".reveal").forEach(el=>{
        observer.observe(el);
    });
}

function mgInitBackToTop(){
    const btn = document.getElementById("backToTop");
    if(!btn){
        return;
    }

    window.addEventListener("scroll",()=>{
        btn.style.display = window.scrollY > 500 ? "block" : "none";
    });

    btn.addEventListener("click",()=>{
        window.scrollTo({top:0,behavior:"smooth"});
    });
}

function mgInitMobileMenu(){
    const btn = document.getElementById("mobileMenuBtn");
    const menu = document.getElementById("mobileMenu");

    if(!btn || !menu){
        return;
    }

    btn.addEventListener("click",()=>{
        menu.classList.toggle("show");
    });

    menu.querySelectorAll("a").forEach(link=>{
        link.addEventListener("click",()=>{
            menu.classList.remove("show");
        });
    });
}

document.addEventListener("DOMContentLoaded",()=>{
    mgInitSlider();
    mgInitReveal();
    mgInitBackToTop();
    mgInitMobileMenu();
});
