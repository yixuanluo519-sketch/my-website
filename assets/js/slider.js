// MorganGastro V7 Hero Slider

let mgCurrentSlide = 0;
let mgSliderTimer = null;

function mgInitSlider(){
    const slides = document.querySelectorAll(".hero-slide");
    const dotsContainer = document.getElementById("sliderDots");
    const prev = document.getElementById("sliderPrev");
    const next = document.getElementById("sliderNext");

    if(!slides.length || !dotsContainer){
        return;
    }

    dotsContainer.innerHTML = "";

    slides.forEach((slide,index)=>{
        const dot = document.createElement("button");
        dot.className = index === 0 ? "slider-dot active" : "slider-dot";
        dot.setAttribute("aria-label",`Go to slide ${index + 1}`);
        dot.addEventListener("click",()=>{
            mgShowSlide(index);
            mgRestartSlider();
        });
        dotsContainer.appendChild(dot);
    });

    if(prev){
        prev.addEventListener("click",()=>{
            mgShowSlide(mgCurrentSlide - 1);
            mgRestartSlider();
        });
    }

    if(next){
        next.addEventListener("click",()=>{
            mgShowSlide(mgCurrentSlide + 1);
            mgRestartSlider();
        });
    }

    mgStartSlider();
}

function mgShowSlide(index){
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".slider-dot");

    if(!slides.length){
        return;
    }

    if(index >= slides.length){
        mgCurrentSlide = 0;
    }else if(index < 0){
        mgCurrentSlide = slides.length - 1;
    }else{
        mgCurrentSlide = index;
    }

    slides.forEach(slide => slide.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));

    slides[mgCurrentSlide].classList.add("active");

    if(dots[mgCurrentSlide]){
        dots[mgCurrentSlide].classList.add("active");
    }
}

function mgStartSlider(){
    mgSliderTimer = setInterval(()=>{
        mgShowSlide(mgCurrentSlide + 1);
    },5000);
}

function mgRestartSlider(){
    clearInterval(mgSliderTimer);
    mgStartSlider();
}
