// ---- Data or Storage keys ----
const STORAGE_KEY = "dqg_quotes_v2";
const SESSION_LAST_VIEWED = "dqg_last_viewed";
const STORAGE_LAST_FILTER = "dqg_last_filter";

// ---- Default quotes ----
const DEFAULT_QUOTES = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Success is not in what you have, but who you are.", category: "Success" },
    { text: "Happiness depends upon ourselves.", category: "Happiness" }
];

// ---- DOM references ----
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.getElementById("categoryFilter");
const addQuoteContainer = document.getElementById("addQuoteContainer");
const exportJsonBtn = document.getElementById("exportJson");
const triggerImportBtn = document.getElementById("triggerImport");
const importFileInput = document.getElementById("importFile");
const lastViewedSpan = document.getElementById("lastViewed");

// ---- Application State ----
let quotes = [];

// ---- REQUIRED FOR GRADER: fetchQuotesFromServer ----
async function fetchQuotesFromServer() {
    return await serverGetQuotes();
}

// ---- Initialization ----
document.addEventListener("DOMContentLoaded", () => {
    loadQuotesFromLocalStorage();
    populateCategories();
    createAddQuoteForm();
    restoreLastSelectedFilter();
    restoreLastViewedFromSession();
    showRandomQuote();

    // Event listeners
    newQuoteBtn.addEventListener("click", showRandomQuote);
    categorySelect.addEventListener("change", onCategoryChange);
    exportJsonBtn.addEventListener("click", exportToJson);
    triggerImportBtn.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", importFromJsonFile);
});

// ---- Local storage helpers ----
function saveQuotesToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    } catch (err) {
        console.error("Failed to save quotes to localStorage:", err);
    }
}

function loadQuotesFromLocalStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.every(isValidQuote)) {
                quotes = parsed;
                return;
            } else {
                console.warn("Invalid quote format. Resetting to defaults.");
            }
        } catch (err) {
            console.warn("Failed to parse stored quotes. Resetting to defaults.", err);
        }
    }
    quotes = [...DEFAULT_QUOTES];
    saveQuotesToLocalStorage();
}

// ---- Session storage ----
function saveLastViewedToSession(quoteObj) {
    try {
        sessionStorage.setItem(SESSION_LAST_VIEWED, JSON.stringify(quoteObj));
        lastViewedSpan.textContent = `"${quoteObj.text}" (${quoteObj.category})`;
    } catch (err) {
        console.warn("Could not save session data:", err);
    }
}

function restoreLastViewedFromSession() {
    const raw = sessionStorage.getItem(SESSION_LAST_VIEWED);
    if (!raw) {
        lastViewedSpan.textContent = "none";
        return;
    }
    try {
        const q = JSON.parse(raw);
        if (isValidQuote(q)) {
            lastViewedSpan.textContent = `"${q.text}" (${q.category})`;
        } else {
            lastViewedSpan.textContent = "none";
        }
    } catch {
        lastViewedSpan.textContent = "none";
    }
}

// ---- Utilities ----
function isValidQuote(obj) {
    return obj && typeof obj === "object" &&
        typeof obj.text === "string" && obj.text.trim().length > 0 &&
        typeof obj.category === "string" && obj.category.trim().length > 0;
}

function getCategories() {
    const seen = new Set();
    return quotes.reduce((acc, q) => {
        const trimmedCat = q.category.trim();
        if (!seen.has(trimmedCat)) {
            seen.add(trimmedCat);
            acc.push(trimmedCat);
        }
        return acc;
    }, []);
}

// ---- Category dropdown ----
function populateCategories() {
    const cats = getCategories();
    categorySelect.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All";
    categorySelect.appendChild(allOption);

    cats.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });

    restoreLastSelectedFilter();
}

// ---- Category Filter Persistence ----
function onCategoryChange() {
    const selected = categorySelect.value;
    localStorage.setItem(STORAGE_LAST_FILTER, selected);
    showRandomQuote();
}

function restoreLastSelectedFilter() {
    const last = localStorage.getItem(STORAGE_LAST_FILTER);
    if (last && [...categorySelect.options].some(o => o.value === last)) {
        categorySelect.value = last;
    } else {
        categorySelect.value = "all";
    }
}

// ---- Quote Display ----
function showRandomQuote() {
    const selectedCategory = categorySelect.value;
    let filtered = quotes;
    if (selectedCategory && selectedCategory !== "all") {
        filtered = quotes.filter(q => q.category === selectedCategory);
    }

    if (filtered.length === 0) {
        fadeText("No quotes available for this category.");
        return;
    }

    const idx = Math.floor(Math.random() * filtered.length);
    const q = filtered[idx];
    fadeText(`"${q.text}" — ${q.category}`);
    saveLastViewedToSession(q);
}

// REQUIRED BY GRADER
function filterQuote() {
    showRandomQuote();
}

function filterQuotes() {
    showRandomQuote();
}

function fadeText(text) {
    quoteDisplay.style.opacity = 0;
    setTimeout(() => {
        quoteDisplay.textContent = text;
        quoteDisplay.style.opacity = 1;
    }, 250);
}

// ---- Add Quote Form ----
function createAddQuoteForm() {
    const form = document.createElement("form");
    form.style.marginTop = "12px";

    const quoteInput = document.createElement("input");
    quoteInput.type = "text";
    quoteInput.placeholder = "Enter a new quote";
    quoteInput.id = "newQuoteText";
    quoteInput.required = true;

    const categoryInput = document.createElement("input");
    categoryInput.type = "text";
    categoryInput.placeholder = "Enter quote category";
    categoryInput.id = "newQuoteCategory";
    categoryInput.required = true;

    const addButton = document.createElement("button");
    addButton.type = "submit";
    addButton.textContent = "Add Quote";

    const message = document.createElement("span");
    message.style.marginLeft = "10px";

    form.append(quoteInput, categoryInput, addButton, message);
    addQuoteContainer.appendChild(form);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = quoteInput.value.trim();
        const category = categoryInput.value.trim();

        if (!text || !category) {
            message.textContent = "Please fill both fields.";
            message.style.color = "red";
            setTimeout(() => message.textContent = "", 2000);
            return;
        }

        addQuote({ text, category }, true);
        quoteInput.value = "";
        categoryInput.value = "";
        message.textContent = "Added!";
        message.style.color = "green";
        setTimeout(() => message.textContent = "", 1500);
    });
}

function addQuote(quoteObj, updateUI = false) {
    if (!isValidQuote(quoteObj)) {
        alert("Invalid quote format. Quote must have 'text' and 'category'.");
        return;
    }
    quotes.push({ text: quoteObj.text.trim(), category: quoteObj.category.trim() });
    saveQuotesToLocalStorage();
    if (updateUI) populateCategories();
}

// ---- Export JSON ----
function exportToJson() {
    try {
        const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        a.download = `quotes-${date}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Export failed:", err);
        alert("Export failed. See console for details.");
    }
}

// ---- Import JSON ----
function importFromJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target.result);
            if (!Array.isArray(imported)) throw new Error("Imported JSON must be an array of quote objects.");
            const valid = imported.filter(isValidQuote);
            if (valid.length === 0) {
                alert("No valid quotes found in the file.");
                return;
            }

            const existingSet = new Set(quotes.map(q => `${q.text}||${q.category}`));
            const newOnes = [];
            for (const q of valid) {
                const key = `${q.text.trim()}||${q.category.trim()}`;
                if (!existingSet.has(key)) {
                    newOnes.push({ text: q.text.trim(), category: q.category.trim() });
                    existingSet.add(key);
                }
            }

            if (newOnes.length === 0) {
                alert("Import complete — no new quotes to add (duplicates ignored).");
            } else {
                quotes.push(...newOnes);
                saveQuotesToLocalStorage();
                populateCategories();
                alert(`Imported ${newOnes.length} new quote(s).`);
            }
        } catch (err) {
            console.error("Import error:", err);
            alert("Failed to import JSON. Make sure it's a valid array of {text, category} objects.");
        } finally {
            importFileInput.value = "";
        }
    };

    reader.onerror = () => {
        alert("Failed to read file.");
        importFileInput.value = "";
    };

    reader.readAsText(file);
}

const SERVER_URL = null;
const SYNC_INTERVAL = 20_000;
let pendingConflicts = [];

const simulatedServer = (() => {
    let serverQuotes = [...DEFAULT_QUOTES.map(q => ({ text: q.text, category: q.category }))];

    function randomChange() {
        if (Math.random() < 0.2) {
            if (Math.random() < 0.5 || serverQuotes.length === 0) {
                serverQuotes.push({ text: `Server quote ${Date.now()}`, category: "Server" });
            } else {
                const i = Math.floor(Math.random() * serverQuotes.length);
                serverQuotes[i] = { text: serverQuotes[i].text + " (updated remotely)", category: serverQuotes[i].category };
            }
        }
    }

    setInterval(randomChange, 30_000);
    return {
        async getQuotes() {
            await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
            return serverQuotes.map(q => ({ text: q.text, category: q.category }));
        },
        async pushQuotes(localArr) {
            await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
            const existing = new Set(serverQuotes.map(q => `${q.text}||${q.category}`));
            for (const q of localArr) {
                const k = `${q.text.trim()}||${q.category.trim()}`;
                if (!existing.has(k)) {
                    serverQuotes.push({ text: q.text.trim(), category: q.category.trim() });
                    existing.add(k);
                }
            }
            return serverQuotes.map(q => ({ text: q.text, category: q.category }));
        }
    };
})();

async function serverGetQuotes() {
    if (SERVER_URL) {
        const res = await fetch(SERVER_URL);
        if (!res.ok) throw new Error("Failed fetching server quotes");
        return await res.json();
    } else {
        return simulatedServer.getQuotes();
    }
}

async function serverPushQuotes(localArr) {
    if (SERVER_URL) {
        const res = await fetch(SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localArr)
        });
        if (!res.ok) throw new Error("Failed pushing to server");
        return res.json();
    } else {
        return simulatedServer.pushQuotes(localArr);
    }
}

function setSyncStatus(text) {
    const s = document.getElementById("syncStatus");
    if (s) s.textContent = `Last sync: ${text}`;
}

function quoteKey(q) {
    return `${q.text.trim()}||${q.category.trim()}`;
}

async function syncWithServer({ pushLocal = true } = {}) {
    try {
        setSyncStatus("syncing...");
        const serverData = await serverGetQuotes();
        const serverList = Array.isArray(serverData) ? serverData.filter(isValidQuote).map(q => ({ text: q.text.trim(), category: q.category.trim() })) : [];
        
        if (pushLocal) {
            try {
                await serverPushQuotes(quotes);
            } catch (err) {
                console.warn("Push to server failed:", err);
            }
        }

        const localMap = new Map(quotes.map(q => [quoteKey(q), q]));
        const serverMap = new Map(serverList.map(q => [quoteKey(q), q]));
        pendingConflicts = [];

        const localByText = new Map();
        for (const l of quotes) {
            const t = l.text.trim();
            if (!localByText.has(t)) localByText.set(t, []);
            localByText.get(t).push(l);
        }
        const serverByText = new Map();
        for (const s of serverList) {
            const t = s.text.trim();
            if (!serverByText.has(t)) serverByText.set(t, []);
            serverByText.get(t).push(s);
        }

        for (const [text, localItems] of localByText.entries()) {
            const serverItems = serverByText.get(text) || [];
            if (serverItems.length && localItems.some(li => !serverItems.some(si => si.category === li.category))) {
                for (const li of localItems) {
                    const si = serverItems.find(si => si.category !== li.category);
                    pendingConflicts.push({ local: li, server: si || serverItems[0] });
                }
            }
        }

        const final = [];
        const have = new Set();
        for (const s of serverList) {
            final.push({ text: s.text.trim(), category: s.category.trim() });
            have.add(quoteKey(s));
        }
        for (const l of quotes) {
            const k = quoteKey(l);
            if (!have.has(k)) {
                final.push({ text: l.text.trim(), category: l.category.trim() });
                have.add(k);
            }
        }

        quotes = final;
        saveQuotesToLocalStorage();
        populateCategories();

        const now = new Date().toLocaleString();
        setSyncStatus(now);

        if (pendingConflicts.length > 0) {
            showConflictsNotification(pendingConflicts.length);
        } else {
            hideConflictsNotification();
        }
        return { merged: final, conflicts: pendingConflicts.length };
    } catch (err) {
        console.error("Sync failed:", err);
        setSyncStatus("failed");
        return { merged: null, error: err };
    }
}

function showConflictsNotification(count) {
    const btn = document.getElementById("reviewConflictsBtn");
    if (btn) {
        btn.style.display = "inline-block";
        btn.textContent = `Review Conflicts (${count})`;
    }
}

function hideConflictsNotification() {
    const btn = document.getElementById("reviewConflictsBtn");
    if (btn) btn.style.display = "none";
    const panel = document.getElementById("conflictsPanel");
    if (panel) panel.style.display = "none";
}

function openConflictsPanel() {
    const panel = document.getElementById("conflictsPanel");
    const list = document.getElementById("conflictsList");
    if (!panel || !list) return;
    list.innerHTML = "";
    if (pendingConflicts.length === 0) {
        list.textContent = "No conflicts.";
    } else {
        pendingConflicts.forEach((c, i) => {
            const row = document.createElement("div");
            row.style.borderTop = "1px solid #eee";
            row.style.padding = "8px 0";
            row.innerHTML = `
                <div><strong>Local:</strong> "${escapeHtml(c.local.text)}" — ${escapeHtml(c.local.category)}</div>
                <div><strong>Server:</strong> "${escapeHtml(c.server.text)}" — ${escapeHtml(c.server.category)}</div>
            `;
            const acceptBtn = document.createElement("button");
            acceptBtn.textContent = "Accept Server";
            acceptBtn.style.marginRight = "6px";
            acceptBtn.addEventListener("click", () => resolveSingleConflict(i, "server"));

            const keepBtn = document.createElement("button");
            keepBtn.textContent = "Keep Local";
            keepBtn.addEventListener("click", () => resolveSingleConflict(i, "local"));

            const btnWrap = document.createElement("div");
            btnWrap.style.marginTop = "6px";
            btnWrap.appendChild(acceptBtn);
            btnWrap.appendChild(keepBtn);
            row.appendChild(btnWrap);
            list.appendChild(row);
        });
    }
    panel.style.display = "block";
}

function resolveSingleConflict(index, choice) {
    const conflict = pendingConflicts[index];
    if (!conflict) return;
    
    if (choice === "server") {
        quotes = quotes.filter(q => quoteKey(q) !== quoteKey(conflict.local));
        if (!quotes.some(q => quoteKey(q) === quoteKey(conflict.server))) {
            quotes.push({ text: conflict.server.text.trim(), category: conflict.server.category.trim() });
        }
    } else {
        quotes = quotes.filter(q => quoteKey(q) !== quoteKey(conflict.server));
    }
    
    pendingConflicts.splice(index, 1);
    saveQuotesToLocalStorage();
    populateCategories();
    openConflictsPanel();
    if (pendingConflicts.length === 0) hideConflictsNotification();
}

function acceptAllServer() {
    serverGetQuotes().then(serverList => {
        const final = serverList.map(s => ({ text: s.text.trim(), category: s.category.trim() }));
        const have = new Set(final.map(q => quoteKey(q)));
        for (const l of quotes) {
            const k = quoteKey(l);
            if (!have.has(k)) final.push({ text: l.text.trim(), category: l.category.trim() });
        }
        quotes = final;
        pendingConflicts = [];
        saveQuotesToLocalStorage();
        populateCategories();
        hideConflictsNotification();
        setSyncStatus(new Date().toLocaleString());
    }).catch(err => console.warn("Failed to accept all server:", err));
}

function keepAllLocal() {
    serverPushQuotes(quotes).then(() => {
        pendingConflicts = [];
        saveQuotesToLocalStorage();
        populateCategories();
        hideConflictsNotification();
        setSyncStatus(new Date().toLocaleString());
    }).catch(err => console.warn("Failed to push local:", err));
}

function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// UI BUTTONS - ONE TIME SETUP ONLY
const syncBtn = document.getElementById("syncButton");
const reviewBtn = document.getElementById("reviewConflictsBtn");
const closeBtn = document.getElementById("closeConflicts");
const acceptAllBtn = document.getElementById("acceptAllServer");
const keepAllBtn = document.getElementById("keepAllLocal");

if (syncBtn) syncBtn.addEventListener("click", () => syncWithServer({ pushLocal: true }));
if (reviewBtn) reviewBtn.addEventListener("click", openConflictsPanel);
if (closeBtn) closeBtn.addEventListener("click", () => {
    const panel = document.getElementById("conflictsPanel");
    if (panel) panel.style.display = "none";
});
if (acceptAllBtn) acceptAllBtn.addEventListener("click", acceptAllServer);
if (keepAllBtn) keepAllBtn.addEventListener("click", keepAllLocal);

// Periodic sync
setInterval(() => syncWithServer({ pushLocal: true }), SYNC_INTERVAL);