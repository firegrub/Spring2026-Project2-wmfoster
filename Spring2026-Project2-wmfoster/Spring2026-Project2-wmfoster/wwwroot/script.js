const SERPER_API_KEY = "e0a6d89db0f7489c46cf98c6ea337b321dec1fdb";

const backgrounds = ["images/bg1.jpg", "images/bg2.jpg", "images/bg3.jpg"];
let bgIndex = 0;

function escapeHtml(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showResults() {
    $("#searchResults").css("visibility", "visible");
}

function showTimeDiv() {
    $("#time").css("visibility", "visible");
}

function hhmm(d) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

async function serperSearch(query) {
    const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": SERPER_API_KEY
        },
        body: JSON.stringify({
            q: query,
            gl: "us",
            hl: "en"
        })
    });

    if (!res.ok) throw new Error(`Serper request failed: ${res.status} ${res.statusText}`);
    return await res.json();
}

function renderKnowledgeGraph(kg) {
    if (!kg) return "";
    const title = escapeHtml(kg.title || "");
    const type = escapeHtml(kg.type || "");
    const desc = escapeHtml(kg.description || "");
    const website = kg.website
        ? `<a class="resultLink" href="${escapeHtml(kg.website)}" target="_blank" rel="noreferrer">Official site</a>`
        : "";

    return `
    <div class="sectionTitle">Knowledge Graph</div>
    <div class="card">
      <div style="font-size:20px;font-weight:900;">${title}</div>
      ${type ? `<div class="muted">${type}</div>` : ""}
      ${desc ? `<p class="muted">${desc}</p>` : ""}
      ${website ? `<p>${website}</p>` : ""}
    </div>
  `;
}

function renderOrganic(list) {
    if (!Array.isArray(list) || list.length === 0) return "";
    const items = list.map(r => {
        const title = escapeHtml(r.title || "Untitled");
        const link = escapeHtml(r.link || "#");
        const snippet = escapeHtml(r.snippet || "");
        const displayedLink = escapeHtml(r.displayedLink || "");
        return `
      <div class="card">
        <a class="resultLink" href="${link}" target="_blank" rel="noreferrer">${title}</a>
        ${displayedLink ? `<div class="muted">${displayedLink}</div>` : ""}
        ${snippet ? `<p class="muted">${snippet}</p>` : ""}
      </div>
    `;
    }).join("");
    return `<div class="sectionTitle">Organic Results</div>${items}`;
}

function renderPeopleAlsoAsk(paa) {
    if (!Array.isArray(paa) || paa.length === 0) {
        return `<div class="sectionTitle">People also ask</div><div class="muted">Not available for this search.</div>`;
    }

    const items = paa.slice(0, 6).map(x => {
        const q = escapeHtml(x.question || "");
        const a = escapeHtml(x.snippet || "");
        return `
          <div class="card">
            <div style="font-weight:900;">${q}</div>
            ${a ? `<p class="muted">${a}</p>` : ""}
          </div>
        `;
    }).join("");

    return `<div class="sectionTitle">People also ask</div>${items}`;
}

function renderRelatedSearches(related) {
    if (!Array.isArray(related) || related.length === 0) return "";
    const pills = related
        .slice(0, 12)
        .map(x => `<span class="pill">${escapeHtml(x.query || "")}</span>`)
        .join("");
    return `
    <div class="sectionTitle">Related Searches</div>
    <div class="pillRow">${pills}</div>
  `;
}

function renderAll(data) {
    const leftHtml =
        renderOrganic(data?.organic) +
        renderPeopleAlsoAsk(data?.peopleAlsoAsk || data?.paa || data?.people_also_ask || []) +
        renderRelatedSearches(data?.relatedSearches);

    const rightHtml =
        renderKnowledgeGraph(data?.knowledgeGraph);

    $("#leftCol").html(leftHtml || "");
    $("#rightCol").html(rightHtml || "");

    showResults();
    $(".main").addClass("resultsMode");
    $("#searchResults").addClass("resultsMode");
}

function cycleBackground() {
    bgIndex = (bgIndex + 1) % backgrounds.length;
    document.body.style.backgroundImage = `url("${backgrounds[bgIndex]}")`;

    const logo = document.getElementById("brand");
    if (bgIndex === 1) {
        logo.style.color = "white";
    } else {
        logo.style.color = "red";
    }
}

function showTimeDialog() {
    const now = new Date();
    $("#time").html(`<div style="font-size:28px;font-weight:900;text-align:center;">${hhmm(now)}</div>`);
    showTimeDiv();
    $("#time").dialog({ modal: true, width: 320, resizable: false });
}

async function doSearch(isLucky) {
    const query = $("#query").val().trim();
    if (!query) return;

    document.body.classList.add("searched");

    showResults();
    $(".main").addClass("resultsMode");
    $("#searchResults").addClass("resultsMode");

    $("#leftCol").html(`<p class="muted">Searching…</p>`);
    $("#rightCol").html("");

    try {
        const data = await serperSearch(query);

        if (isLucky) {
            const first = data?.organic?.[0]?.link;
            if (first) {
                window.location.href = first;
                return;
            }
        }

        renderAll(data);
    } catch (err) {
        console.error(err);
        $("#leftCol").html(`<p class="muted">Search failed. Check console.</p>`);
        $("#rightCol").html("");
        showResults();
    }
}

$(function () {
    $("#brand").on("click", cycleBackground);
    $("#searchBtn").on("click", () => doSearch(false));
    $("#luckyBtn").on("click", () => doSearch(true));
    $("#timeBtn").on("click", showTimeDialog);

    $("#query").on("keydown", (e) => {
        if (e.key === "Enter") doSearch(false);
    });
});