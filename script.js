document.getElementById("summarize-btn").onclick = async function () {
    const url = document.getElementById("youtube-url").value.trim();
    if (!url) return;

    document.querySelector(".loader").classList.add("active");
    document.getElementById("result").classList.remove("active");
    document.getElementById("result").innerHTML = "";

    try {
        const response = await fetch("http://127.0.0.1:5000/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (response.ok) {
            displayResults(data);
        } else {
            showError(data.error || "An error occurred.");
        }
    } catch (err) {
        showError("Failed to connect to backend.");
    } finally {
        document.querySelector(".loader").classList.remove("active");
    }
};

function extractVideoId(url) {
    const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

async function fetchVideoInfo(videoId) {
    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

document.getElementById("youtube-url").addEventListener("input", async function () {
    const url = this.value.trim();
    const videoId = extractVideoId(url);
    const preview = document.getElementById("video-preview");
    const thumb = document.getElementById("video-thumbnail");
    const titleDiv = document.getElementById("video-title");
    const descDiv = document.getElementById("video-description");

    if (videoId) {
        const videoInfo = await fetchVideoInfo(videoId);
        thumb.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        thumb.style.width = "320px";
        thumb.style.height = "180px";
        thumb.style.objectFit = "cover";
        thumb.style.display = "block";
        thumb.style.margin = "0 auto 0.5rem auto";
        thumb.style.borderRadius = "12px";
        thumb.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
        thumb.style.cursor = "pointer";
        thumb.onclick = function () {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
        };
        titleDiv.textContent = videoInfo && videoInfo.title ? videoInfo.title : "Video found";
        descDiv.textContent = videoInfo && videoInfo.author_name ? `By ${videoInfo.author_name}` : "";
        if (videoInfo && videoInfo.description) {
            descDiv.textContent += "\n" + videoInfo.description;
        }
        preview.style.display = "flex";
    } else {
        preview.style.display = "none";
        thumb.src = "";
        thumb.onclick = null;
        titleDiv.textContent = "";
        descDiv.textContent = "";
    }
});

document.getElementById("clear-btn").onclick = function () {
    document.getElementById("youtube-url").value = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("result").classList.remove("active");
    const preview = document.getElementById("video-preview");
    const thumb = document.getElementById("video-thumbnail");
    const titleDiv = document.getElementById("video-title");
    const descDiv = document.getElementById("video-description");
    preview.style.display = "none";
    thumb.src = "";
    thumb.onclick = null;
    titleDiv.textContent = "";
    descDiv.textContent = "";
};

document.getElementById("check-connection").onclick = async function () {
    const statusElement = document.getElementById("connection-status");
    try {
        const response = await fetch("http://127.0.0.1:5000/ping");
        if (response.ok) {
            const data = await response.json();
            if (data.status === "ok") {
                statusElement.textContent = "✓ Connected";
                statusElement.className = "connected";
            } else {
                statusElement.textContent = "✗ Not Connected";
                statusElement.className = "disconnected";
            }
        } else {
            statusElement.textContent = "✗ Not Connected";
            statusElement.className = "disconnected";
        }
    } catch (err) {
        statusElement.textContent = "✗ Not Connected";
        statusElement.className = "disconnected";
    }
};

function displayResults(data) {
    let html = "";
    if (data.title) html += `<div class="video-title">${data.title}</div>`;
    if (data.intro) html += `<div class="video-intro">${data.intro}</div>`;
    if (data.summary) html += `<div class="summary">${data.summary}</div>`;
    document.getElementById("result").innerHTML = html;
    document.getElementById("result").classList.add("active");
}

function showError(message) {
    document.getElementById("result").innerHTML = `<span style="color: var(--error);">${message}</span>`;
    document.getElementById("result").classList.add("active");
}

document.getElementById("download-pdf")?.addEventListener("click", function () {
    alert("PDF download coming soon!");
});

async function authRequest(endpoint, body) {
    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
    });
    return res.json();
}

document.getElementById("login-btn")?.addEventListener("click", async function () {
    const username = prompt("Enter username:");
    const password = prompt("Enter password:");
    if (!username || !password) return;
    const data = await authRequest("/login", { username, password });
    alert(data.message || data.error);
});

document.getElementById("register-btn")?.addEventListener("click", async function () {
    const username = prompt("Choose a username:");
    const password = prompt("Choose a password:");
    if (!username || !password) return;
    const data = await authRequest("/register", { username, password });
    alert(data.message || data.error);
});

document.getElementById("logout-btn")?.addEventListener("click", async function () {
    const data = await authRequest("/logout", {});
    alert(data.message || data.error);
});
