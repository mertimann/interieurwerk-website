/* ============================================================
   InterieurWERK – Inline-Editor (Weg B)
   Aktiviert sich NUR, wenn die URL ".../#bearbeiten" enthält.
   Besucher der normalen Seite merken davon nichts.
   Veröffentlicht über den Netlify-Server /.netlify/functions/publish
   ============================================================ */
(function () {
  "use strict";
  if (!/bearbeiten/i.test(location.hash + location.search)) return;

  var FN = "/.netlify/functions/publish";

  var DEFAULT_TEAM = [
    { name: "Christian Schummers", role: "Inhaber", badge: "25+ Jahre",
      desc: "Mit über 25 Jahren Erfahrung in der Fliesenbranche ein Ideengeber und Experte auf dem Gebiet der Bodenbeläge.",
      img: "https://www.interieurwerk-viersen.de/wp-content/uploads/go-x/u/71fd9304-aae7-490f-b448-ba1bb829a9ad/l0,t0,w1080,h1080/image-384x384.png" },
    { name: "Stefan Kreuer", role: "Kundenberater", badge: "",
      desc: "Seit 25 Jahren an Christians Seite. Bietet mit enormem Fachwissen professionelle Beratung und erstklassigen Service.",
      img: "https://www.interieurwerk-viersen.de/wp-content/uploads/go-x/u/be736284-11f0-486d-8e32-24456a467694/l0,t0,w1080,h1080/image-384x384.png" },
    { name: "Andreas Körl", role: "Leiter Fliesenverlegung", badge: "",
      desc: "Ausgebildeter Fliesen-, Platten- und Mosaiklegermeister mit langjähriger Erfahrung — und Ausbilder im Betrieb.",
      img: "" },
    { name: "Unser Verlegeteam", role: "Fliesen- & Bodenleger", badge: "",
      desc: "Ein kleines, professionelles Team mit langjähriger Erfahrung, spezialisiert darauf, individuelle Wünsche auf höchstem Niveau umzusetzen.",
      img: "https://www.interieurwerk-viersen.de/wp-content/uploads/go-x/u/cbe6d17a-6791-44d5-8809-105c8313c9ad/l200,t0,w1200,h1200/image-384x384.jpg" }
  ];

  var CONTENT = {}, team = [], dirty = false, pendingIdx = null, fileInput;
  var imgInput, pendingImgEl = null, TEXTED = [], IMGED = [], imgCounter = 0;

  injectCSS();
  gate(start);

  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function esc(s){ return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function $(id){ return document.getElementById(id); }

  /* ---------- Passwort-Schleuse ---------- */
  function gate(cb){
    if (sessionStorage.getItem("iw_pw")) { cb(); return; }
    var ov = document.createElement("div"); ov.className = "iw-gate";
    ov.innerHTML =
      '<div class="iw-gate-box">' +
        '<div class="iw-gate-logo">InterieurWERK · Bearbeiten</div>' +
        '<p>Bitte mit dem Bearbeiten-Passwort anmelden.</p>' +
        '<input type="password" id="iwpw" placeholder="Passwort" autocomplete="current-password" />' +
        '<button id="iwgo" class="iw-btn iw-btn--mint">Anmelden</button>' +
        '<div class="iw-gate-err" id="iwerr"></div>' +
      '</div>';
    document.body.appendChild(ov);
    var inp = $("iwpw"); setTimeout(function(){ inp.focus(); }, 50);
    function go(){ var v=(inp.value||"").trim(); if(!v) return; sessionStorage.setItem("iw_pw", v); ov.remove(); cb(); }
    $("iwgo").onclick = go;
    inp.addEventListener("keydown", function(e){ if(e.key==="Enter") go(); });
  }

  /* ---------- Start ---------- */
  function start(){
    fileInput = document.createElement("input");
    fileInput.type="file"; fileInput.accept="image/*"; fileInput.style.display="none";
    fileInput.addEventListener("change", onFile);
    document.body.appendChild(fileInput);

    imgInput = document.createElement("input");
    imgInput.type="file"; imgInput.accept="image/*"; imgInput.style.display="none";
    imgInput.addEventListener("change", onImgFile);
    document.body.appendChild(imgInput);

    document.body.classList.add("iw-editing");
    fetchContent().then(function(){
      renderTeam();
      enhanceGeneric();   // alle übrigen Texte + Bilder editierbar machen
      buildBar();
    });
  }

  /* ---------- Generisch: alle Texte + Bilder editierbar ---------- */
  function enhanceGeneric(){
    TEXTED = []; IMGED = [];
    document.querySelectorAll("[data-content]").forEach(function(el){ regText(el, el.getAttribute("data-content"), false); });
    document.querySelectorAll("[data-content-html]").forEach(function(el){ regText(el, el.getAttribute("data-content-html"), true); });
    (window.iwEditableNodes ? window.iwEditableNodes() : []).forEach(function(el,i){ regText(el, "t"+i, el.children.length>0); });
    document.querySelectorAll("[data-content-src]").forEach(function(el){ regImg(el, el.getAttribute("data-content-src")); });
    (window.iwImageNodes ? window.iwImageNodes() : []).forEach(function(el,i){ regImg(el, "img"+i); });
  }
  function regText(el, key, html){
    if (el.closest("#iwTeam") || el.closest("#iwGallery")) return;
    if (el.getAttribute("data-iwbound")) return;
    el.setAttribute("data-iwbound","1");
    el.classList.add("iw-gen-ed");
    el.setAttribute("contenteditable","true");
    el.addEventListener("input", markDirty);
    el.addEventListener("paste", function(e){ e.preventDefault(); var t=(e.clipboardData||window.clipboardData).getData("text"); document.execCommand("insertText",false,t); });
    el.addEventListener("keydown", function(e){ if(e.key==="Enter" && !html && el.tagName!=="P"){ e.preventDefault(); el.blur(); } });
    TEXTED.push({ el:el, key:key, html:html });
  }
  function regImg(el, key){
    if (el.closest("#iwTeam") || el.closest("#iwGallery")) return;
    if (el.getAttribute("data-iwbound")) return;
    el.setAttribute("data-iwbound","1");
    el.classList.add("iw-gen-img");
    el.setAttribute("title","Klicken, um das Bild zu ersetzen");
    el.addEventListener("click", function(e){
      if (document.body.classList.contains("iw-preview")) return;
      e.preventDefault(); e.stopPropagation();
      pendingImgEl = el; imgInput.value=""; imgInput.click();
    });
    IMGED.push({ el:el, key:key });
  }
  function onImgFile(){
    var f = imgInput.files && imgInput.files[0]; if(!f || !pendingImgEl) return;
    var elRef = pendingImgEl; pendingImgEl = null;
    var r = new FileReader();
    r.onload = function(ev){
      var img = new Image();
      img.onload = function(){
        var max=1600, w=img.width, h=img.height;
        if(w>max||h>max){ if(w>=h){ h=Math.round(h*max/w); w=max; } else { w=Math.round(w*max/h); h=max; } }
        var c=document.createElement("canvas"); c.width=w; c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        elRef.setAttribute("src", c.toDataURL("image/jpeg", 0.85));
        markDirty();
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(f);
  }

  function fetchContent(){
    return fetch("/content.json?cb=" + Date.now(), {cache:"no-store"})
      .then(function(r){ return r.ok ? r.json() : {}; })
      .then(function(j){ CONTENT = j || {}; team = (Array.isArray(CONTENT.team) && CONTENT.team.length) ? CONTENT.team.map(clone) : DEFAULT_TEAM.map(clone); })
      .catch(function(){ CONTENT = {}; team = DEFAULT_TEAM.map(clone); });
  }

  /* ---------- Team editierbar rendern ---------- */
  function renderTeam(){
    var box = $("iwTeam"); if(!box) return;
    box.innerHTML = "";
    team.forEach(function(m,i){
      var a = document.createElement("article"); a.className="member iw-edit-card";
      var pos = (typeof m.pos === "number") ? m.pos : 22;
      var photo = m.img ? '<img src="'+esc(m.img)+'" alt="'+esc(m.name)+'" style="object-position:center '+pos+'%"/>' :
        '<div class="iw-ph"><span>Foto<br>hochladen</span></div>';
      var badge = '<span class="badge iw-ed" data-f="badge" data-i="'+i+'" contenteditable="true">'+esc(m.badge||"")+'</span>';
      a.innerHTML =
        '<button class="iw-del" title="Person entfernen" data-del="'+i+'">×</button>' +
        '<div class="member__img iw-photo" data-i="'+i+'">'+photo+
          '<div class="iw-photo-tools">'+
            '<span class="iw-pos-hint">'+(m.img?"↕ ziehen = ausrichten":"")+'</span>'+
            '<button class="iw-photo-up" data-up="'+i+'">'+(m.img?"Foto ändern":"Foto wählen")+'</button>'+
          '</div>'+ badge +
        '</div>' +
        '<h3 class="iw-ed" data-f="name" data-i="'+i+'" contenteditable="true">'+esc(m.name)+'</h3>' +
        '<div class="role iw-ed" data-f="role" data-i="'+i+'" contenteditable="true">'+esc(m.role)+'</div>' +
        '<p class="iw-ed" data-f="desc" data-i="'+i+'" contenteditable="true">'+esc(m.desc)+'</p>';
      box.appendChild(a);
    });
    var add = document.createElement("button"); add.className="iw-addcard"; add.id="iwAdd";
    add.innerHTML = '<span class="iw-plus">＋</span>Person hinzufügen';
    box.appendChild(add);
    bind();
  }

  function bind(){
    var box = $("iwTeam");
    box.querySelectorAll(".iw-ed").forEach(function(el){
      el.addEventListener("input", function(){ team[+el.getAttribute("data-i")][el.getAttribute("data-f")] = el.textContent; markDirty(); });
      el.addEventListener("paste", function(e){ e.preventDefault(); var t=(e.clipboardData||window.clipboardData).getData("text"); document.execCommand("insertText",false,t); });
      el.addEventListener("keydown", function(e){ if(e.key==="Enter" && el.tagName!=="P"){ e.preventDefault(); el.blur(); } });
    });
    box.querySelectorAll(".iw-photo").forEach(function(cell){
      var i = +cell.getAttribute("data-i");
      var img = cell.querySelector("img");
      if (img) {
        var dragging=false, startY=0, startPos=22;
        cell.addEventListener("pointerdown", function(e){
          if (document.body.classList.contains("iw-preview")) return;
          if (e.target.closest(".iw-photo-up") || e.target.closest(".iw-ed")) return;
          dragging=true; startY=e.clientY; startPos=(typeof team[i].pos==="number"?team[i].pos:22);
          try{ cell.setPointerCapture(e.pointerId); }catch(_){}
          e.preventDefault();
        });
        cell.addEventListener("pointermove", function(e){
          if(!dragging) return;
          var p = Math.max(0, Math.min(100, Math.round(startPos - (e.clientY-startY)*0.25)));
          team[i].pos = p; img.style.objectPosition = "center "+p+"%";
        });
        function end(){ if(dragging){ dragging=false; markDirty(); } }
        cell.addEventListener("pointerup", end);
        cell.addEventListener("pointercancel", end);
      }
    });
    box.querySelectorAll(".iw-photo-up").forEach(function(b){
      b.addEventListener("click", function(e){ e.stopPropagation(); pendingIdx=+b.getAttribute("data-up"); fileInput.value=""; fileInput.click(); });
    });
    box.querySelectorAll("[data-del]").forEach(function(b){
      b.addEventListener("click", function(){ var i=+b.getAttribute("data-del"); if(confirm('„'+(team[i].name||"Person")+'" entfernen?')){ team.splice(i,1); markDirty(); renderTeam(); } });
    });
    var add = $("iwAdd");
    if (add) add.addEventListener("click", function(){
      team.push({ name:"Neue Person", role:"Funktion", badge:"", desc:"Kurzbeschreibung …", img:"" });
      markDirty(); renderTeam();
      var n = box.querySelectorAll('.iw-ed[data-f="name"]'); var last=n[n.length-1];
      if(last){ last.focus(); document.execCommand("selectAll", false, null); }
    });
  }

  /* ---------- Foto-Upload + Verkleinern ---------- */
  function onFile(){
    var f = fileInput.files && fileInput.files[0]; if(!f || pendingIdx===null) return;
    var r = new FileReader();
    r.onload = function(ev){
      var img = new Image();
      img.onload = function(){
        var max=900, w=img.width, h=img.height;
        if(w>max||h>max){ if(w>=h){ h=Math.round(h*max/w); w=max; } else { w=Math.round(w*max/h); h=max; } }
        var c=document.createElement("canvas"); c.width=w; c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        team[pendingIdx].img = c.toDataURL("image/jpeg", 0.85);
        pendingIdx=null; markDirty(); renderTeam();
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(f);
  }

  /* ---------- Werkzeugleiste + Veröffentlichen ---------- */
  function buildBar(){
    var bar = document.createElement("div"); bar.className="iw-bar";
    bar.innerHTML =
      '<div class="iw-bar-in">' +
        '<div class="iw-status" id="iwStatus">Bearbeiten-Modus. Klick auf einen Text oder ein Bild, um es zu ändern. „Veröffentlichen" macht alles für Besucher live.</div>' +
        '<div class="iw-grp">' +
          '<button class="iw-btn iw-btn--ghost" id="iwPrev">👁 Vorschau</button>' +
          '<button class="iw-btn iw-btn--mint" id="iwPub">Veröffentlichen</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);
    $("iwPub").onclick = publish;
    $("iwPrev").onclick = function(){
      document.body.classList.toggle("iw-preview");
      var on = document.body.classList.contains("iw-preview");
      this.textContent = on ? "✎ Weiter bearbeiten" : "👁 Vorschau";
      $("iwTeam").querySelectorAll(".iw-ed").forEach(function(el){ el.setAttribute("contenteditable", on?"false":"true"); });
      document.querySelectorAll(".iw-gen-ed").forEach(function(el){ el.setAttribute("contenteditable", on?"false":"true"); });
    };
  }

  function markDirty(){ dirty=true; setStatus("Nicht veröffentlichte Änderungen …"); }
  function setStatus(t){ var s=$("iwStatus"); if(s) s.textContent=t; }

  function publish(){
    var btn=$("iwPub"); btn.disabled=true; setStatus("Veröffentliche …");
    var images=[];
    function imgName(ext){ return "bild-"+Date.now()+"-"+(imgCounter++)+"."+ext; }
    function extOf(dataUrl){ return dataUrl.slice(5, dataUrl.indexOf(",")).indexOf("png")>-1 ? "png" : "jpg"; }

    var content = clone(CONTENT);

    // 1) Team (Liste)
    content.team = team.map(function(m){
      var mm={ name:m.name||"", role:m.role||"", badge:m.badge||"", desc:m.desc||"", img:m.img||"" };
      if(typeof m.pos==="number") mm.pos=m.pos;
      if(mm.img.indexOf("data:")===0){ var fn=imgName(extOf(mm.img)); images.push({ name:fn, base64: mm.img.slice(mm.img.indexOf(",")+1) }); mm.img="/uploads/"+fn; }
      return mm;
    });

    // 2) Alle Texte (benannte Felder + automatisch erkannte)
    TEXTED.forEach(function(t){ content[t.key] = t.html ? t.el.innerHTML : t.el.textContent; });

    // 3) Alle Bilder
    IMGED.forEach(function(im){
      var src = im.el.getAttribute("src") || "";
      if(src.indexOf("data:")===0){ var fn=imgName(extOf(src)); images.push({ name:fn, base64: src.slice(src.indexOf(",")+1) }); content[im.key]="/uploads/"+fn; }
      else if(src){ content[im.key]=src; }
    });

    var pw = sessionStorage.getItem("iw_pw") || "";
    fetch(FN, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ password:pw, content:content, images:images, message:"Inhalte über Editor aktualisiert" }) })
      .then(function(r){ return r.text().then(function(t){ return {status:r.status, t:t}; }); })
      .then(function(res){
        btn.disabled=false;
        if(res.status===200){ CONTENT=content; dirty=false; setStatus("Veröffentlicht ✓ — in etwa 10–30 Sekunden für alle live."); }
        else if(res.status===401){ sessionStorage.removeItem("iw_pw"); setStatus("Falsches Passwort. Bitte Seite neu laden und erneut anmelden."); }
        else { setStatus("Fehler beim Veröffentlichen: " + res.t.slice(0,160)); }
      })
      .catch(function(e){ btn.disabled=false; setStatus("Netzwerkfehler: " + e); });
  }

  /* ---------- Styles ---------- */
  function injectCSS(){
    var css =
    ".iw-gate{position:fixed;inset:0;z-index:100000;background:rgba(10,20,18,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif}" +
    ".iw-gate-box{background:#fff;border-radius:16px;padding:28px;width:min(92vw,360px);box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center}" +
    ".iw-gate-logo{font-family:'Space Grotesk',sans-serif;font-weight:700;color:#0F4D42;margin-bottom:6px}" +
    ".iw-gate-box p{color:#5C6B66;font-size:14px;margin-bottom:14px}" +
    ".iw-gate-box input{width:100%;padding:12px 14px;border:1px solid #cfe3dd;border-radius:10px;font-size:15px;margin-bottom:12px;outline:none}" +
    ".iw-gate-box input:focus{border-color:#6FE0C6;box-shadow:0 0 0 3px rgba(111,224,198,.4)}" +
    ".iw-gate-err{color:#c0392b;font-size:13px;margin-top:8px}" +
    ".iw-btn{font-family:'Space Grotesk',sans-serif;font-weight:600;border:none;border-radius:100px;padding:11px 20px;cursor:pointer;font-size:14px}" +
    ".iw-btn--mint{background:#6FE0C6;color:#0E1413;width:100%}" +
    ".iw-btn--ghost{background:transparent;color:#0F4D42;box-shadow:inset 0 0 0 1.5px #0F4D42}" +
    /* Team im Edit-Modus: Fotos in Farbe, Karten klar */
    "body.iw-editing #iwTeam .member__img img{filter:none!important}" +
    /* Generisch editierbare Texte/Bilder auf der ganzen Seite */
    "body.iw-editing:not(.iw-preview) .iw-gen-ed{outline:none;border-radius:5px;transition:background .15s,box-shadow .15s;cursor:text}" +
    "body.iw-editing:not(.iw-preview) .iw-gen-ed:hover{background:rgba(111,224,198,.28)}" +
    "body.iw-editing:not(.iw-preview) .iw-gen-ed:focus{background:rgba(255,255,255,.92);box-shadow:0 0 0 2px #6FE0C6}" +
    "body.iw-editing:not(.iw-preview) .iw-gen-img{cursor:pointer;outline-offset:2px;transition:outline .12s}" +
    "body.iw-editing:not(.iw-preview) .iw-gen-img:hover{outline:3px solid #6FE0C6}" +
    "#iwTeam .iw-edit-card{position:relative}" +
    "#iwTeam .iw-ed{outline:none;border-radius:6px;cursor:text;transition:background .15s,box-shadow .15s}" +
    "body.iw-editing:not(.iw-preview) #iwTeam .iw-ed:hover{background:#BCEEE3}" +
    "body.iw-editing:not(.iw-preview) #iwTeam .iw-ed:focus{background:#fff;box-shadow:0 0 0 2px #6FE0C6}" +
    "#iwTeam .iw-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#7d968f;font-size:13px;text-align:center}" +
    "body.iw-editing:not(.iw-preview) #iwTeam .iw-photo{cursor:grab}" +
    "body.iw-editing:not(.iw-preview) #iwTeam .iw-photo:active{cursor:grabbing}" +
    "#iwTeam .iw-photo img{touch-action:none;user-select:none;-webkit-user-drag:none}" +
    "#iwTeam .iw-photo-tools{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;opacity:0;transition:.2s;background:linear-gradient(transparent,rgba(15,77,66,.6))}" +
    "body.iw-editing:not(.iw-preview) #iwTeam .member__img:hover .iw-photo-tools{opacity:1}" +
    "#iwTeam .iw-pos-hint{color:#fff;font-size:11px;font-weight:600;font-family:'Space Grotesk',sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.4)}" +
    "#iwTeam .iw-photo-up{background:#fff;color:#0F4D42;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;padding:6px 11px;border:none;border-radius:100px;cursor:pointer;white-space:nowrap}" +
    "#iwTeam .iw-del{position:absolute;top:-9px;right:-9px;width:28px;height:28px;border-radius:50%;border:none;background:#fff;color:#c0392b;box-shadow:0 4px 12px rgba(0,0,0,.18);cursor:pointer;font-size:16px;line-height:1;opacity:0;transition:.15s;z-index:3}" +
    "body.iw-editing:not(.iw-preview) #iwTeam .member:hover .iw-del{opacity:1}" +
    "#iwTeam .iw-addcard{border:2px dashed #6FE0C6;border-radius:18px;min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1E8A73;font-family:'Space Grotesk',sans-serif;font-weight:600;cursor:pointer;background:transparent}" +
    "#iwTeam .iw-addcard:hover{background:#BCEEE3}" +
    "#iwTeam .iw-plus{font-size:28px;line-height:1;margin-bottom:6px}" +
    "body.iw-preview #iwTeam .iw-del,body.iw-preview #iwTeam .iw-photo-tools,body.iw-preview #iwTeam .iw-addcard{display:none!important}" +
    /* untere Leiste */
    ".iw-bar{position:fixed;left:0;right:0;bottom:0;z-index:99990;background:#0F4D42;color:#EAF8F3;box-shadow:0 -6px 24px rgba(0,0,0,.2);font-family:Inter,system-ui,sans-serif}" +
    ".iw-bar-in{max-width:1180px;margin:0 auto;display:flex;gap:14px;align-items:center;justify-content:space-between;padding:12px 22px;flex-wrap:wrap}" +
    ".iw-status{font-size:13px;opacity:.95}" +
    ".iw-grp{display:flex;gap:10px}" +
    ".iw-bar .iw-btn--ghost{color:#EAF8F3;box-shadow:inset 0 0 0 1.5px rgba(234,248,243,.5)}" +
    "body.iw-editing{padding-bottom:70px}";
    var s=document.createElement("style"); s.textContent=css; document.head.appendChild(s);
  }
})();
