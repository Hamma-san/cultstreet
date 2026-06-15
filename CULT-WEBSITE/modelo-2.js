const loader=document.querySelector(".cinema-loader"),header=document.querySelector(".lux-header"),menu=document.querySelector(".menu-trigger"),nav=document.querySelector(".lux-nav"),type=document.querySelector("[data-typewriter]"),counter=document.querySelector("[data-lux-cart]");
setTimeout(()=>{loader.classList.add("hide");document.body.classList.remove("is-loading");write()},2000);
function write(){const text=type.dataset.typewriter;let i=0;const tick=()=>{type.textContent=text.slice(0,i++);if(i<=text.length)setTimeout(tick,text[i-1]==="\n"?180:35)};tick()}
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
window.addEventListener("scroll",()=>{document.documentElement.style.setProperty("--scroll",window.scrollY);header.classList.toggle("scrolled",window.scrollY>40)},{passive:true});
menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open))});nav.addEventListener("click",()=>nav.classList.remove("open"));
document.querySelectorAll("[data-buy]").forEach(button=>button.addEventListener("click",()=>counter.textContent=String(Number(counter.textContent)+1)));
document.querySelector(".exclusive-list form").addEventListener("submit",event=>{event.preventDefault();event.currentTarget.reset();alert("Você entrou para a lista CultStreet.")});


