/* ============================================================
   BOARD — reusable infinite-canvas pinboard
   Used by: Cricket, Learning, Questions.

   data shape:  { items: [{ id, x, y, title, body, links:[ids] }] }
   ============================================================ */

function renderBoard(config){
  const { mount, dataPath, itemLabel, emptyText } = config;
  let data = { items: [] };
  let view = { x:0, y:0, scale:0.85 };
  let stringsOn = JSON.parse(localStorage.getItem("board_strings_" + dataPath) || "true");
  let connectMode = false;
  let connectFrom = null;

  mount.innerHTML = `
    <div class="board-toolbar">
      <button class="btn" id="stringsBtn" type="button"></button>
      <div class="spacer"></div>
      <button class="btn edit-only" id="connectBtn" type="button">Connect pins</button>
      <button class="btn primary edit-only" id="addPinBtn" type="button">+ Add ${escapeHtml(itemLabel)}</button>
    </div>
    <div class="board-viewport" id="vp">
      <svg class="board-strings" id="strings"></svg>
      <div class="board-surface" id="surface"></div>
    </div>
    <div class="board-hint">drag empty space to pan &middot; scroll to zoom${GHCMS.isEditMode() ? " &middot; drag a pin to move it &middot; \u201cConnect pins\u201d then click two pins to link them" : ""}</div>
  `;

  const vp = mount.querySelector("#vp");
  const surface = mount.querySelector("#surface");
  const svg = mount.querySelector("#strings");
  const stringsBtn = mount.querySelector("#stringsBtn");
  const connectBtn = mount.querySelector("#connectBtn");
  const addPinBtn = mount.querySelector("#addPinBtn");

  stringsBtn.addEventListener("click", () => {
    stringsOn = !stringsOn;
    localStorage.setItem("board_strings_" + dataPath, JSON.stringify(stringsOn));
    updateStringsBtn();
    drawStrings();
  });
  function updateStringsBtn(){
    stringsBtn.textContent = stringsOn ? "\u2713 pinboard strings" : "pinboard strings off";
  }

  connectBtn.addEventListener("click", () => {
    connectMode = !connectMode;
    connectFrom = null;
    vp.classList.toggle("connect-mode", connectMode);
    connectBtn.classList.toggle("primary", connectMode);
    connectBtn.textContent = connectMode ? "Click two pins\u2026" : "Connect pins";
  });

  addPinBtn.addEventListener("click", () => openForm());

  document.addEventListener("editmode:change", () => { render(); });

  load();

  async function load(){
    data = (await GHCMS.readJSON(dataPath)) || { items: [] };
    updateStringsBtn();
    applyView();
    render();
  }

  function applyView(){
    surface.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  }

  function render(){
    surface.querySelectorAll(".pin, [data-placeholder]").forEach(n => n.remove());
    if(!data.items.length){
      const msg = document.createElement("div");
      msg.style.cssText = "position:absolute;left:24px;top:20px;max-width:260px;";
      msg.innerHTML = `<div class="empty-state">${escapeHtml(emptyText)}${GHCMS.isEditMode() ? ` — click \u201c+ Add ${escapeHtml(itemLabel)}\u201d.` : ""}</div>`;
      msg.dataset.placeholder = "1";
      surface.appendChild(msg);
    }
    data.items.forEach(item => surface.appendChild(pinFor(item)));
    drawStrings();
  }

  function pinFor(item){
    const el = document.createElement("div");
    el.className = "pin";
    el.style.left = item.x + "px";
    el.style.top = item.y + "px";
    el.dataset.id = item.id;
    el.innerHTML = `
      <div class="pin-controls">
        <button class="icon-btn" data-act="edit">edit</button>
        <button class="icon-btn" data-act="del">del</button>
      </div>
      <h4>${escapeHtml(item.title||"Untitled")}</h4>
      ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ""}
    `;
    el.querySelector('[data-act="edit"]')?.addEventListener("click", e => { e.stopPropagation(); openForm(item); });
    el.querySelector('[data-act="del"]')?.addEventListener("click", e => { e.stopPropagation(); removePin(item); });

    el.addEventListener("pointerdown", e => onPinPointerDown(e, item, el));
    return el;
  }

  function onPinPointerDown(e, item, el){
    if(connectMode){
      e.stopPropagation();
      if(!connectFrom){
        connectFrom = item.id;
        el.classList.add("selected");
      } else if(connectFrom !== item.id){
        toggleLink(connectFrom, item.id);
        surface.querySelectorAll(".pin.selected").forEach(n=>n.classList.remove("selected"));
        connectFrom = null;
      }
      return;
    }
    if(!GHCMS.isEditMode()) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const origX = item.x, origY = item.y;
    function onMove(ev){
      const dx = (ev.clientX - startX) / view.scale;
      const dy = (ev.clientY - startY) / view.scale;
      item.x = origX + dx; item.y = origY + dy;
      el.style.left = item.x + "px"; el.style.top = item.y + "px";
      drawStrings();
    }
    function onUp(){
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      GHCMS.saveJSON(dataPath, data, `Move ${itemLabel}`);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function toggleLink(aId, bId){
    const a = data.items.find(i=>i.id===aId);
    if(!a) return;
    a.links = a.links || [];
    const idx = a.links.indexOf(bId);
    if(idx >= 0) a.links.splice(idx,1); else a.links.push(bId);
    drawStrings();
    GHCMS.saveJSON(dataPath, data, "Update connections");
  }

  function drawStrings(){
    svg.innerHTML = "";
    if(!stringsOn) return;
    const seen = new Set();
    data.items.forEach(item => {
      (item.links||[]).forEach(targetId => {
        const key = [item.id, targetId].sort().join("|");
        if(seen.has(key)) return;
        seen.add(key);
        const t = data.items.find(i=>i.id===targetId);
        if(!t) return;
        const x1=item.x+95, y1=item.y+16, x2=t.x+95, y2=t.y+16;
        const sag = Math.min(60, Math.hypot(x2-x1,y2-y1)/4) + 18;
        const mx=(x1+x2)/2, my=(y1+y2)/2 + sag;
        const path = document.createElementNS("http://www.w3.org/2000/svg","path");
        path.setAttribute("d", `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
        svg.appendChild(path);
      });
    });
  }

  function openForm(existing){
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal">
        <h2>${existing?"Edit":"Add"} ${escapeHtml(itemLabel)}</h2>
        <form id="bf">
          <div class="field"><label>Title</label><input name="title" value="${existing?escapeHtml(existing.title||""):""}" required></div>
          <div class="field"><label>Notes</label><textarea name="body">${existing?escapeHtml(existing.body||""):""}</textarea></div>
        </form>
        <div class="modal-actions">
          <button type="button" class="btn ghost" id="bfCancel">Cancel</button>
          <button type="submit" form="bf" class="btn primary">Save</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector("#bfCancel").addEventListener("click", ()=>backdrop.remove());
    backdrop.addEventListener("click", e=>{ if(e.target===backdrop) backdrop.remove(); });
    backdrop.querySelector("#bf").addEventListener("submit", async e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      if(existing){
        Object.assign(existing, fd);
      } else {
        const centerX = (-view.x + vp.clientWidth/2) / view.scale - 95;
        const centerY = (-view.y + vp.clientHeight/2) / view.scale - 16;
        data.items.push({ id:uid(), x:Math.round(centerX), y:Math.round(centerY), links:[], ...fd });
      }
      const ok = await GHCMS.saveJSON(dataPath, data, `${existing?"Update":"Add"} ${itemLabel}`);
      if(ok){ render(); backdrop.remove(); }
    });
  }

  async function removePin(item){
    if(!confirm(`Remove this ${itemLabel}?`)) return;
    data.items.forEach(i => { if(i.links) i.links = i.links.filter(id => id !== item.id); });
    data.items = data.items.filter(i => i.id !== item.id);
    const ok = await GHCMS.saveJSON(dataPath, data, `Remove ${itemLabel}`);
    if(ok) render();
  }

  // ---- pan + zoom ----
  let panning = false, panStart = null;
  vp.addEventListener("pointerdown", e => {
    if(e.target.closest(".pin") || connectMode) return;
    panning = true;
    vp.classList.add("panning");
    panStart = { x:e.clientX, y:e.clientY, vx:view.x, vy:view.y };
  });
  window.addEventListener("pointermove", e => {
    if(!panning) return;
    view.x = panStart.vx + (e.clientX - panStart.x);
    view.y = panStart.vy + (e.clientY - panStart.y);
    applyView();
  });
  window.addEventListener("pointerup", () => { panning = false; vp.classList.remove("panning"); });

  vp.addEventListener("wheel", e => {
    e.preventDefault();
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const prev = view.scale;
    const next = Math.min(2, Math.max(0.35, prev * (e.deltaY > 0 ? 0.9 : 1.1)));
    view.x = mx - ((mx - view.x) / prev) * next;
    view.y = my - ((my - view.y) / prev) * next;
    view.scale = next;
    applyView();
  }, { passive:false });
}
