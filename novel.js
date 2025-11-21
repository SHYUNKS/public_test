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

// Load Saved Theme
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
  // Limits
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

// 4. AI Image Generation Logic
async function generateImage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const prompt = element.getAttribute("data-prompt");

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
              parts: [{ text: "Create a high quality illustration for a novel: " + prompt }],
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

    // Extract Base64 Image
    // Typically format is candidates[0].content.parts[0].inlineData.data
    // But we need to find the part with inlineData since multimodal response might vary
    const candidate = data.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);

    if (imagePart && imagePart.inlineData) {
      const base64Data = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType || "image/png";

      // Create Image Element
      const img = new Image();
      img.src = `data:${mimeType};base64,${base64Data}`;
      img.alt = "AI Generated Illustration";

      img.onload = () => {
        element.innerHTML = ""; // Clear loader
        element.appendChild(img);
        // Trigger reflow to enable transition
        setTimeout(() => img.classList.add("loaded"), 50);
      };
    } else {
      throw new Error("No image data found in response");
    }
  } catch (error) {
    console.error("Image Generation Failed:", error);
    element.innerHTML = `<div class="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded text-center">
                    <p>이미지 생성 실패</p>
                    <p class="text-xs mt-1 opacity-70">트래픽이 많거나 키 오류일 수 있습니다.</p>
                </div>`;
  }
}

// Run on Window Load
window.onload = function () {
  // Delay slightly to prioritize text rendering
  setTimeout(() => {
    generateImage("image-slot-1");
    // Stagger the second request slightly to be nice to the API limit
    setTimeout(() => {
      generateImage("image-slot-2");
    }, 2000);
  }, 500);
};
