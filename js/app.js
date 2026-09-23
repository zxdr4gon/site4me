/* ============================================================
   APP SHELL — nav, edit-mode state, toast
   ============================================================ */

const SECTIONS = [
  { id:"home",       label:"Home",        href:"index.html" },
  { id:"socials",    label:"Socials",     href:"socials.html" },
  { id:"resume",     label:"Resume",      href:"resume.html" },
  { id:"projects",   label:"Projects",    href:"projects.html" },
  { id:"reading",    label:"Reading List",href:"reading-list.html" },
  { id:"wishlist",   label:"Wishlist",    href:"wishlist.html" },
  { id:"cricket",    label:"Cricket",     href:"cricket.html" },
  { id:"learning",   label:"Learning",    href:"learning.html" },
  { id:"questions",  label:"Questions",   href:"questions.html" },
  { id:"notes",      label:"Notes",       href:"notes.html" },
  { id:"goals",      label:"Goals",       href:"goals.html" },
  { id:"gallery",    label:"Gallery",     href:"gallery.html" },
];

function renderShell(activeId){
  const head = document.createElement("header");
  head.className = "site-head";
  head.innerHTML = `
    <div class="head-inner">
      <div class="wordmark">THE ARCHIVE<small>a running record, kept by hand</small></div>
      <button id="lockBtn" class="lock-pill" type="button">&#128274; view only</button>
    </div>`;
  document.body.prepend(head);

  const nav = document.createElement("nav");
  nav.className = "catalog-nav";
  nav.innerHTML = SECTIONS.map(s =>
    `<a href="${s.href}" ${s.id===activeId ? 'aria-current="page"' : ""}>${s.label}</a>`
  ).join("");
  head.after(nav);

  const toast = document.createElement("div");
  toast.id = "toast";
  document.body.appendChild(toast);

  document.getElementById("lockBtn").addEventListener("click", GHCMS.toggleEditMode);
  GHCMS.reflectLockUI();
}

function showToast(msg, ms=2600){
  const t = document.getElementById("toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove("show"), ms);
}

function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
