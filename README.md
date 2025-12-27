# 🚫 BlockItOut | Digital Noise Cancellation

[![Status](https://img.shields.io/badge/Status-Stable-00d26a?style=for-the-badge)](https://github.com/vigneshrapaka/blockitout) [![License](https://img.shields.io/badge/License-Non--Commercial-red?style=for-the-badge)](LICENSE) [![Focus](https://img.shields.io/badge/Focus-Maximized-f09433?style=for-the-badge)](https://github.com/vigneshrapaka/blockitout)

> **Algorithms are designed to be sticky. This makes them slippery.**

Social media engineering is brilliant—it’s designed to interrupt your flow state and keep you scrolling. **BlockItOut** is an open-source Chrome Extension that strips away the addictive "sugar" (Shorts, Reels, Suggested Feeds) from Instagram and YouTube, leaving you with a functional tool rather than a time trap.

We don't block the sites; we just make them behave.

<br>

## ⚡ Why Use This?

Most blockers are all-or-nothing. You either block YouTube entirely (and can't watch that tutorial you need), or you keep it open and lose 2 hours to Shorts.

BlockItOut sits in the middle. It’s a **DOM-modifier** that surgically removes the slot-machine mechanics while keeping the utility intact.
* **Developers:** It’s lightweight, vanilla JS, and runs locally.
* **Users:** It saves your brain cells without requiring you to delete your accounts.

<br>

## 🛠 Features (v1.0.0)

### 📸 Instagram: The "Quiet" Mode
Turn Instagram into a portfolio viewer, not a dopamine drip.
* **Safe Feed:** Automatically hides "Sponsored" posts, "Suggested for you," and ads. You only see who you actually follow.
* **Blur Mode:** Blurs images by default. You have to hover to see them, which stops you from mindlessly scanning.
* **Metric Hiding:** Removes like counts, follower numbers, and comment counts to stop the comparison game.
* **Black Box Mode:** Turns addictive posts into static black boxes, keeping the layout intact but the distraction gone.
* **No "Story Hopping":** Hides the top Stories tray.

### ▶️ YouTube: Search & Destroy
Use YouTube as a search engine, not a TV channel.
* **Ad Accelerator:** Automatically mutes, speeds up (16x), and skips ads the instant they appear.
* **Shorts Nuke:** Removes the Shorts shelf, the Shorts tab, and redirects Shorts URLs to the normal video player.
* **Feed Wiper:** Cleans the homepage recommendations. You only see the search bar.
* **Theater Focus:** Fades out the sidebar, comments, and header while you watch. They only reappear if you ask for them (hover).
* **Stop Autoplay:** Forces the "Autoplay" toggle to stay OFF.

### 🧠 The "Reality Check"
* **Session Monitor:** Tracks how long you've been scrolling. If you go too long, it covers the screen with a gentle reminder of what else you could have done (e.g., "You could have done 20 pushups").

### ⚙️ Global
* **Grayscale Mode:** Turns supported sites black and white. Science says this lowers the dopamine reward of colorful icons.

<br>

## 📦 How to Install (Developer Mode)

*Note: This is currently a manual install for privacy and transparency.*

1.  **Download:** Clone this repo or download the ZIP and extract it.
2.  **Open Chrome Extensions:** Type `chrome://extensions` in your address bar.
3.  **Enable Dev Mode:** Toggle the **"Developer mode"** switch in the top right.
4.  **Load:** Click **"Load unpacked"** and select the folder where you extracted these files (the one containing `manifest.json`).

<br>

## 🎮 How to Use

BlockItOut runs in the background. When you want to change settings:

1.  **Open Dashboard:**
    * **Method A:** Click the BlockItOut icon <img src="icon16.png" height="16"/> in your browser toolbar.
    * **Method B:** Type `blockitout` into Google, Bing, or DuckDuckGo. A magic button will appear at the bottom of the search results.
2.  **Configure:** Flip the switches for the features you want.
3.  **Save:** Changes are instant.

<br>

## 💻 Tech Stack
* **Core:** Vanilla JavaScript (ES6+)
* **Architecture:** Chrome Extension Manifest V3
* **Storage:** `chrome.storage.local` for persisting settings
* **Privacy:** Zero data collection. Everything stays on your machine.

<br>

## ☕ Support the Dev

I'm a university student coding this between exams. If this tool saved you from a 3-hour doomscroll, consider buying me a coffee. It keeps the updates coming!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/vigneshrapaka)

<br>

## ⚖️ License & Legal

**Educational & Personal Productivity Use Only.**
This software is provided "as is." It modifies the DOM of websites locally on your machine to improve user experience.

* **Commercial Use:** Prohibited without a license.
* **Modification:** Feel free to tweak the code for your own personal use.
* **Disclaimer:** Use at your own risk. We are not responsible if platforms update their code and break a feature.

[View Full License](LICENSE)