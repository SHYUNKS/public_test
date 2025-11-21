// Initialize Icons
lucide.createIcons();

// --- Logic ---

const html = document.documentElement;
const container = document.getElementById("novel-container");
const fontIconLabel = document.getElementById("font-icon");
const apiKey = ""; // Injected by environment

// 1. Theme Management
function toggleTheme() {
  if (html.classList.contains("dark")) {
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

if (
  localStorage.getItem("theme") === "dark" ||
  (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  html.classList.add("dark");
} else {
  html.classList.remove("dark");
}

// 2. Font Size Management
let currentFontSize = 18;
function adjustFontSize(delta) {
  currentFontSize += delta;
  if (currentFontSize < 14) currentFontSize = 14;
  if (currentFontSize > 32) currentFontSize = 32;
  container.style.fontSize = `${currentFontSize}px`;
}

// 3. Font Family Toggle
let isSerif = true;
function toggleFont() {
  const body = document.body;
  isSerif = !isSerif;
  if (isSerif) {
    body.classList.remove("font-sans");
    body.classList.add("font-serif");
    fontIconLabel.innerText = "Serif";
  } else {
    body.classList.remove("font-serif");
    body.classList.add("font-sans");
    fontIconLabel.innerText = "Sans";
  }
}

// 4. AI Image Generation Logic (Modified for Anime Style & Loop)
async function generateImage(element) {
  if (!element) return;

  // Get the prompt from the data attribute
  const userPrompt = element.getAttribute("data-prompt");

  // Create a strict instruction for Anime style
  const enhancedPrompt = `Japanese Anime style illustration, high quality, detailed, 2D animation style, cel shaded. Scene description: ${userPrompt}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: enhancedPrompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const candidate = data.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);

    if (imagePart && imagePart.inlineData) {
      const base64Data = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType || "image/png";

      const img = new Image();
      img.src = `data:${mimeType};base64,${base64Data}`;
      img.alt = "Anime Style Illustration";

      img.onload = () => {
        element.innerHTML = ""; // Clear loader
        element.appendChild(img);
        setTimeout(() => img.classList.add("loaded"), 50);
      };
    } else {
      throw new Error("No image data found");
    }
  } catch (error) {
    console.error("Image Generation Failed:", error);
    element.innerHTML = `<div class="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded text-center">
                    <p>이미지 생성 실패</p>
                </div>`;
  }
}

// Automatic Generation Loop on Load
window.onload = function () {
  const imageContainers = document.querySelectorAll(".ai-image-container");

  // Loop through all containers found
  imageContainers.forEach((container, index) => {
    // Stagger calls by 2.5 seconds to avoid rate limits and visual clutter
    setTimeout(() => {
      generateImage(container);
    }, index * 2500 + 500);
  });
};
