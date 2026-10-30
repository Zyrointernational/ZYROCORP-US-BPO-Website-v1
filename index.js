const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
});
const clean = (v, max=3000) => String(v ?? "").trim().slice(0,max);
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ok:true, service:"zyrocorp-leads-api", version:"1.0"});
    }
    if (!url.pathname.startsWith("/api/")) {
      // Serve the static website through the Cloudflare Assets binding.
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Static assets binding is not configured", {status:500});
    }
    if (url.pathname !== "/api/leads") return json({error:"Not found"},404);
    if (request.method !== "POST") return json({error:"Method not allowed"},405);
    const origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(x=>x.trim()).filter(Boolean);
    if (origin && allowed.length && !allowed.includes(origin)) return json({error:"Origin not allowed"},403);
    const type = request.headers.get("Content-Type") || "";
    if (!type.includes("application/json")) return json({error:"Expected JSON"},415);
    let body;
    try { body = await request.json(); } catch { return json({error:"Invalid request"},400); }
    // A hidden field is a basic bot trap. Do not persist honeypot submissions.
    if (clean(body.website,200)) return json({ok:true});
    const fullName=clean(body.fullName,100), email=clean(body.email,254).toLowerCase();
    const company=clean(body.company,120), phone=clean(body.phone,40);
    const service=clean(body.service,120), teamSize=clean(body.teamSize,40), message=clean(body.message,3000);
    if (!fullName || !emailOk(email) || !company || !service) return json({error:"Please complete the required fields with a valid work email."},422);
    if (!env.DB) return json({error:"Lead storage is not configured yet. Please email hello@zyrocorp.com."},503);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    try {
      await env.DB.prepare(`INSERT INTO leads
        (id, created_at, full_name, email, phone, company, service, team_size, message, status, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', 'website')`)
        .bind(id,createdAt,fullName,email,phone,company,service,teamSize,message).run();
      if (env.LEAD_NOTIFY_WEBHOOK) {
        // Optional: configure a private automation/CRM webhook as a Worker secret.
        fetch(env.LEAD_NOTIFY_WEBHOOK, {method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({id,createdAt,fullName,email,phone,company,service,teamSize,message})}).catch(()=>{});
      }
      return json({ok:true,id},201);
    } catch (err) {
      return json({error:"We could not save your request. Please try again or email hello@zyrocorp.com."},500);
    }
  }
};
