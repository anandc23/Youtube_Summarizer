// --- Utility: Extract YouTube Video ID ---
function extractVideoId(url) {
    const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// --- Tab Switcher ---
function switchTab(tab) {
    document.getElementById('tab-summary').classList.toggle('active', tab === 'summary');
    document.getElementById('tab-shorts').classList.toggle('active', tab === 'shorts');
    document.getElementById('summary-content').classList.toggle('active', tab === 'summary');
    document.getElementById('shorts-content').classList.toggle('active', tab === 'shorts');
}

// --- Global State ---
let lastUrl = "";

// --- Input preview (thumbnail + title) ---
document.getElementById('yt-url').addEventListener('input', async function () {
    const url = this.value.trim();
    const videoId = extractVideoId(url);
    const preview = document.getElementById('video-preview');
    const thumb = document.getElementById('video-thumbnail');
    const titleDiv = document.getElementById('video-title');
    if (videoId) {
        thumb.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        thumb.style.display = "block";
        preview.style.display = "flex";
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const info = await res.json();
            titleDiv.textContent = info.title || "";
        } catch {
            titleDiv.textContent = "";
        }
    } else {
        preview.style.display = "none";
        thumb.src = "";
        titleDiv.textContent = "";
    }
});

// --- Form Submit ---
document.getElementById('yt-form').onsubmit = async function (e) {
    e.preventDefault();
    const url = document.getElementById('yt-url').value.trim();
    if (!url) return;
    lastUrl = url;
    if (document.getElementById('tab-summary').classList.contains('active')) {
        await fetchSummary(url);
    } else {
        await fetchShorts(url);
    }
};

document.getElementById('yt-submit').onclick = () => document.getElementById('yt-form').onsubmit();

// --- Tab Click Triggers ---
document.getElementById('tab-summary').onclick = async () => {
    switchTab('summary');
    if (lastUrl) await fetchSummary(lastUrl);
};
document.getElementById('tab-shorts').onclick = async () => {
    switchTab('shorts');
    if (lastUrl) await fetchShorts(lastUrl);
};

// --- Fetch Summary ---
async function fetchSummary(url) {
    const videoId = extractVideoId(url);
    const loader = document.getElementById('summary-loader');
    const result = document.getElementById('summary-result');
    loader.style.display = 'block';
    result.innerHTML = "";
    let thumbHtml = "", titleHtml = "";
    if (videoId) {
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const info = await res.json();
            titleHtml = `<div class="summary-title">${info.title}</div>`;
            thumbHtml = `<div class="summary-thumb"><img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" alt="Video Thumbnail"></div>`;
        } catch {}
    }
    try {
        const response = await fetch("http://127.0.0.1:5000/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });
        const data = await response.json();
        if (response.ok && data.summary) {
            result.innerHTML = `
                <div class="summary-card">
                    ${thumbHtml}
                    ${titleHtml}
                    <div class="summary-text">${data.summary}</div>
                </div>`;
        } else {
            result.innerHTML = `<div class="error-msg">${data.error || "No summary available."}</div>`;
        }
    } catch {
        result.innerHTML = `<div class="error-msg">Failed to connect to backend.</div>`;
    } finally {
        loader.style.display = 'none';
    }
}

// --- Fetch Shorts ---
async function fetchShorts(url) {
    const loader = document.getElementById('shorts-loader');
    const result = document.getElementById('shorts-result');
    loader.style.display = 'block';
    result.innerHTML = "";
    try {
        const response = await fetch("http://127.0.0.1:5000/generate_shorts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, num_shorts: 1, clip_duration: 30 })
        });
        const data = await response.json();
        loader.style.display = 'none';
        result.innerHTML = '';
        if (data.status === "no_audio") {
            result.innerHTML = `<div style="color:#f43f5e;font-weight:500;padding:18px;">
                The selected video does not have an audio track. Shorts cannot be generated.
            </div>`;
            return;
        }
        if (data.status === "error" || !data.shorts || data.shorts.length === 0) {
            result.innerHTML = `<div style="color:#f43f5e;font-weight:500;padding:18px;">
                ${data.errors && data.errors.length ? data.errors.join("<br>") : "Failed to generate short."}
            </div>`;
            return;
        }
        data.shorts.forEach((short, idx) => {
            if (!short.url) return;
            const card = document.createElement('div');
            card.className = 'shorts-card';
            card.innerHTML = `
                <video class="shorts-thumb" src="${short.url}" controls playsinline preload="metadata"
                    style="width:100%;aspect-ratio:9/16;max-height:320px;border-radius:10px;object-fit:cover;margin-bottom:8px;background:#e0e7ff"
                    poster="${short.thumb || ''}">
                    Sorry, your browser doesn't support embedded videos.
                </video>
                <div class="shorts-title">${short.title || 'Short Clip'}</div>
                <div class="shorts-meta">${short.time || ''}</div>
                <div class="shorts-actions">
                    <button class="btn-download" data-url="${short.url}">Download</button>
                </div>
            `;
            result.appendChild(card);
            card.querySelector('.btn-download').onclick = () => {
                const a = document.createElement('a');
                a.href = short.url;
                a.download = '';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        });
    } catch {
        loader.style.display = 'none';
        result.innerHTML = '<div style="color:#f43f5e;font-weight:500;padding:18px;">Failed to connect to backend.</div>';
    }
}

// --- Minimal UI Reset ---
function resetUI() {
    document.getElementById('summary-loader').style.display = 'none';
    document.getElementById('shorts-loader').style.display = 'none';
    document.getElementById('summary-result').innerHTML = '';
    document.getElementById('shorts-result').innerHTML = '';
    document.getElementById('video-preview').style.display = "none";
}
resetUI();

document.getElementById('yt-url').addEventListener('input', resetUI);