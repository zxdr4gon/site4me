/* ============================================================
   GHCMS — the "editing system"
   ------------------------------------------------------------
   Viewing:  plain fetch() of the JSON files in /data — works
             for anyone, no auth, since they're static files
             served by GitHub Pages.

   Editing:  gated behind a GitHub Personal Access Token that
             ONLY you hold, pasted once and kept in YOUR
             browser's localStorage. It is never written into
             any file in this repo. Saving calls the GitHub
             Contents API directly from the browser to commit
             the updated JSON back to your repo. GitHub Pages
             then rebuilds (usually under a minute) and the
             change is live for every visitor.

   Anyone without your token sees "view only" and the Edit
   controls never appear for them — but be honest with
   yourself about the threat model: this is a *convenience*
   lock, not a server. The real access control is that only
   you can generate a token with write access to your repo.
   Use a fine-grained token scoped to ONLY this repository
   with ONLY "Contents: Read and write" permission, and revoke
   it immediately if you ever paste it somewhere else.
   ============================================================ */

const GH_CONFIG = {
  owner:  "zxdr4gon",
  repo:   "site4me",
  branch: "main",
};

const GHCMS = (() => {
  const TOKEN_KEY = "archive-site4me";

  function getToken(){ return localStorage.getItem(TOKEN_KEY) || ""; }
  function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
  function clearToken(){ localStorage.removeItem(TOKEN_KEY); }

  function isEditMode(){ return !!getToken(); }

  function reflectLockUI(){
    document.body.classList.toggle("edit-mode", isEditMode());
    const btn = document.getElementById("lockBtn");
    if(btn) btn.innerHTML = isEditMode() ? "&#128275; editing" : "&#128274; view only";
    document.dispatchEvent(new CustomEvent("editmode:change", { detail:{ on:isEditMode() } }));
  }

  async function toggleEditMode(){
    if(isEditMode()){
      clearToken();
      reflectLockUI();
      showToast("Locked — back to view only.");
      return;
    }
    const token = prompt(
      "Paste your GitHub personal access token to enable editing.\n" +
      "(Fine-grained token, scoped to this repo, Contents: read & write.)"
    );
    if(!token) return;
    // quick validation: try reading the repo
    try{
      const res = await fetch(
        `https://api.github.com/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}`,
        { headers:{ Authorization:`Bearer ${token}` } }
      );
      if(!res.ok) throw new Error("bad token");
      setToken(token);
      reflectLockUI();
      showToast("Unlocked — you can now edit this site.");
    }catch(e){
      showToast("Couldn't verify that token — nothing saved.");
    }
  }

  // ---- data access ----

  async function readJSON(path){
    const res = await fetch(path, { cache:"no-store" });
    if(!res.ok) return null;
    return res.json();
  }

  function b64EncodeUnicode(str){
    return btoa(unescape(encodeURIComponent(str)));
  }

  async function saveJSON(path, data, message){
    const token = getToken();
    if(!token){ showToast("You're in view-only mode."); return false; }

    const apiPath = `https://api.github.com/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/${path}`;

    let sha;
    try{
      const cur = await fetch(`${apiPath}?ref=${GH_CONFIG.branch}`, {
        headers:{ Authorization:`Bearer ${token}` }
      });
      if(cur.ok){ sha = (await cur.json()).sha; }
    }catch(e){ /* file may not exist yet — that's fine */ }

    try{
      const res = await fetch(apiPath, {
        method:"PUT",
        headers:{
          Authorization:`Bearer ${token}`,
          "Content-Type":"application/json",
        },
        body: JSON.stringify({
          message: message || `Update ${path}`,
          content: b64EncodeUnicode(JSON.stringify(data, null, 2)),
          branch: GH_CONFIG.branch,
          ...(sha ? { sha } : {}),
        }),
      });
      if(!res.ok){
        const err = await res.json().catch(()=>({}));
        throw new Error(err.message || "save failed");
      }
      showToast("Saved. Live on the site in about a minute.");
      return true;
    }catch(e){
      showToast("Save failed — check your token has write access.");
      return false;
    }
  }

  return { isEditMode, toggleEditMode, reflectLockUI, readJSON, saveJSON };
})();
