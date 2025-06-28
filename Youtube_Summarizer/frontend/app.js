const apiUrl = "http://localhost:5000"; // Change this to your backend URL if needed

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("summarize-form");
    const resultDiv = document.getElementById("result");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const urlInput = document.getElementById("url-input").value;

        if (!urlInput) {
            alert("Please enter a YouTube video URL.");
            return;
        }

        resultDiv.innerHTML = "Loading...";

        try {
            const response = await fetch(`${apiUrl}/summarize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url: urlInput }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            if (data.error) {
                resultDiv.innerHTML = `Error: ${data.error}`;
            } else {
                resultDiv.innerHTML = `
                    <h3>Introduction:</h3>
                    <p>${data.intro}</p>
                    <h3>Summary:</h3>
                    <p>${data.summary}</p>
                    <h3>Title:</h3>
                    <p>${data.title}</p>
                `;
            }
        } catch (error) {
            resultDiv.innerHTML = `Error: ${error.message}`;
        }
    });
});