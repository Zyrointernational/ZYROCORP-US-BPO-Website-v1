const $ = (s) => document.querySelector(s);
const menu = $(".menu-toggle");
const nav = $(".main-nav");
menu?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open"); menu?.setAttribute("aria-expanded","false");
}));
$("#year").textContent = new Date().getFullYear();

const slider = $("#team-size");
const money = n => "$" + Math.round(n).toLocaleString("en-US");
function updateSavings(){
  const count = Number(slider.value);
  const inhouse = count * 4600;
  const managed = count * 1600;
  const saving = inhouse - managed;
  const pct = Math.round(saving / inhouse * 100);
  $("#team-count").textContent = `${count} ${count===1?"agent":"agents"}`;
  $("#inhouse-cost").textContent = money(inhouse);
  $("#zyro-cost").textContent = money(managed);
  $("#monthly-savings").innerHTML = `${money(saving)} <i>(${pct}%)</i>`;
  $("#annual-savings").textContent = money(saving * 12);
}
slider.addEventListener("input", updateSavings); updateSavings();

const form = $("#lead-form"), status = $("#form-status"), submit = $("#submit-button");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.className = "form-status"; status.textContent = "";
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.website) return; // honeypot
  delete data.website;
  submit.disabled = true; submit.textContent = "Sending request…";
  try {
    const response = await fetch("/api/leads", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)
    });
    const result = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(result.error || "Unable to submit your request right now.");
    status.classList.add("success");
    status.textContent = "Thank you. Your consultation request has been received.";
    form.reset();
  } catch (error) {
    status.classList.add("error");
    status.textContent = error.message || "Submission failed. Please email hello@zyrocorp.com.";
  } finally {
    submit.disabled = false; submit.innerHTML = 'Request a Consultation <span>→</span>';
  }
});
