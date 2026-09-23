/* ============================================================
   LIST EDITOR — reusable card-list section
   Used by: Socials, Resume, Projects, Reading List, Wishlist,
            Notes, Goals, Gallery.

   config = {
     mount:      DOM node to render into
     dataPath:   "data/reading-list.json"
     itemLabel:  "book"                 // used in buttons/messages
     emptyText:  "No books logged yet."
     tabClass:   "" | "tab-red"         // card-catalog tab color
     fields: [
       { key, label, type: text|textarea|url|date|select, role: title|meta|body|tags|link,
         options?: [...], required?: bool }
     ]
   }
   ============================================================ */

function renderListPage(config){
  const { mount, dataPath, itemLabel, emptyText, fields, tabClass="" } = config;
  let items = [];

  const toolbar = document.createElement("div");
  toolbar.className = "edit-toolbar edit-only";
  toolbar.innerHTML = `<button class="btn primary" type="button">+ Add ${itemLabel}</button>`;
  mount.appendChild(toolbar);

  const list = document.createElement("div");
  mount.appendChild(list);

  toolbar.querySelector("button").addEventListener("click", () => openForm());

  document.addEventListener("editmode:change", draw);

  load();

  async function load(){
    items = (await GHCMS.readJSON(dataPath)) || [];
    draw();
  }

  function draw(){
    if(!items.length){
      list.innerHTML = `<div class="empty-state">${escapeHtml(emptyText)}${GHCMS.isEditMode() ? " — click \u201c+ Add\u201d above to start." : ""}</div>`;
      return;
    }
    list.innerHTML = "";
    items.forEach(item => list.appendChild(cardFor(item)));
  }

  function cardFor(item){
    const card = document.createElement("div");
    card.className = `card ${tabClass}`;

    const titleField = fields.find(f => f.role === "title");
    const linkField  = fields.find(f => f.role === "link");
    const metaFields = fields.filter(f => f.role === "meta");
    const bodyField  = fields.find(f => f.role === "body");
    const tagsField  = fields.find(f => f.role === "tags");
    const imageField = fields.find(f => f.role === "image");

    let html = "";
    if(imageField && item[imageField.key]){
      html += `<img src="${escapeHtml(item[imageField.key])}" alt="" style="width:100%;border:1px solid var(--line);margin:-2px 0 10px;display:block;">`;
    }
    if(metaFields.length){
      html += `<div class="card-meta">${metaFields.map(f => escapeHtml(item[f.key]||"")).filter(Boolean).join(" \u00b7 ")}</div>`;
    }
    const titleText = escapeHtml(item[titleField?.key] || "Untitled");
    if(linkField && item[linkField.key]){
      html += `<h3 class="card-title"><a href="${escapeHtml(item[linkField.key])}" target="_blank" rel="noopener">${titleText}</a></h3>`;
    } else {
      html += `<h3 class="card-title">${titleText}</h3>`;
    }
    if(bodyField && item[bodyField.key]){
      html += `<p>${escapeHtml(item[bodyField.key])}</p>`;
    }
    if(tagsField && item[tagsField.key]){
      const tags = String(item[tagsField.key]).split(",").map(s=>s.trim()).filter(Boolean);
      html += `<div class="tags">${tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`;
    }
    card.innerHTML = html;

    const controls = document.createElement("div");
    controls.className = "item-controls";
    controls.innerHTML = `<button class="icon-btn" data-act="edit">edit</button><button class="icon-btn" data-act="del">delete</button>`;
    controls.querySelector('[data-act="edit"]').addEventListener("click", () => openForm(item));
    controls.querySelector('[data-act="del"]').addEventListener("click", () => remove(item));
    card.appendChild(controls);

    return card;
  }

  function openForm(existing){
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal">
        <h2>${existing ? "Edit" : "Add"} ${escapeHtml(itemLabel)}</h2>
        <form id="lf"></form>
        <div class="modal-actions">
          <button type="button" class="btn ghost" id="lfCancel">Cancel</button>
          <button type="submit" form="lf" class="btn primary">Save</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const form = backdrop.querySelector("#lf");
    fields.forEach(f => {
      const wrap = document.createElement("div");
      wrap.className = "field";
      const val = existing ? (existing[f.key] ?? "") : "";
      if(f.type === "textarea"){
        wrap.innerHTML = `<label>${escapeHtml(f.label)}</label><textarea name="${f.key}">${escapeHtml(val)}</textarea>`;
      } else if(f.type === "select"){
        wrap.innerHTML = `<label>${escapeHtml(f.label)}</label><select name="${f.key}">${
          f.options.map(o=>`<option value="${escapeHtml(o)}" ${o===val?"selected":""}>${escapeHtml(o)}</option>`).join("")
        }</select>`;
      } else {
        wrap.innerHTML = `<label>${escapeHtml(f.label)}</label><input type="${f.type==='url'?'url':f.type==='date'?'date':'text'}" name="${f.key}" value="${escapeHtml(val)}" ${f.required?"required":""}>`;
      }
      form.appendChild(wrap);
    });

    backdrop.querySelector("#lfCancel").addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", e => { if(e.target === backdrop) backdrop.remove(); });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if(existing){
        Object.assign(existing, data);
      } else {
        items.push({ id: uid(), ...data });
      }
      const ok = await GHCMS.saveJSON(dataPath, items, `${existing?"Update":"Add"} ${itemLabel}`);
      if(ok){ draw(); backdrop.remove(); }
    });
  }

  async function remove(item){
    if(!confirm(`Delete this ${itemLabel}?`)) return;
    items = items.filter(i => i.id !== item.id);
    const ok = await GHCMS.saveJSON(dataPath, items, `Remove ${itemLabel}`);
    if(ok) draw();
  }
}
