const DEFAULTS = {
  igSafeFeed: true,
  igNoDoubleTap: true,
  igHideReels: true,
  igHideStories: true,
  igHidePosts: false,
  igHideMetrics: true,
  igBlurImages: false,
  igFocusMode: false,
  igTimeMonitor: true,

  ytSkipAds: true,
  ytMuteAds: true,
  ytHideBanners: true,
  ytTheaterMode: false,
  ytStopAutoplay: true,
  ytCleanEndScreen: true,
  ytHideShorts: true,
  ytHideFeed: false,
  ytHideComments: false,
  ytFocusMode: false,

  globalMono: false,
  globalIntentWall: true,
  globalBreatheWall: true,
  globalHardBlock: false,
  globalCustomSites:
    'twitter.com, x.com, tiktok.com, facebook.com, linkedin.com, snapchat.com, instagram.com, netflix.com, hulu.com, disneyplus.com, primevideo.com, max.com, vimeo.com, dailymotion.com, twitch.tv, youtube.com, reddit.com, quora.com, 4chan.org, 9gag.com, tumblr.com, pinterest.com',
};

const SITE_CATEGORIES = {
  Socials: [
    'twitter.com',
    'x.com',
    'tiktok.com',
    'facebook.com',
    'linkedin.com',
    'snapchat.com',
    'instagram.com',
  ],
  Streaming: [
    'netflix.com',
    'hulu.com',
    'disneyplus.com',
    'primevideo.com',
    'max.com',
    'vimeo.com',
    'dailymotion.com',
    'twitch.tv',
    'youtube.com',
  ],
  Forums: [
    'reddit.com',
    'quora.com',
    '4chan.org',
    '9gag.com',
    'tumblr.com',
    'pinterest.com',
  ],
  News: [
    'nytimes.com',
    'cnn.com',
    'foxnews.com',
    'theverge.com',
    'techcrunch.com',
    'news.ycombinator.com',
    'tmz.com',
    'buzzfeed.com',
    'dailymail.co.uk',
  ],
  Shopping: [
    'amazon.com',
    'ebay.com',
    'temu.com',
    'aliexpress.com',
    'shein.com',
    'asos.com',
    'zara.com',
    'etsy.com',
  ],
  Gaming: [
    'roblox.com',
    'crazygames.com',
    'miniclip.com',
    'ign.com',
    'polygon.com',
  ],
  Dating: ['tinder.com', 'bumble.com', 'okcupid.com', 'hinge.co'],
  Webtoons: ['crunchyroll.com', 'webtoons.com', 'mangadex.org'],
};

let PREFS = { ...DEFAULTS };

document.addEventListener('DOMContentLoaded', () => {
  const logoIcon = document.getElementById('logo-icon');
  if (logoIcon) {
    logoIcon.onerror = function () {
      this.style.display = 'none';
    };
  }

  chrome.storage.local.get(['bio_pro_settings'], (result) => {
    if (result.bio_pro_settings) {
      PREFS = { ...DEFAULTS, ...result.bio_pro_settings };
    }
    renderContent('instagram');
    bindTabs();
  });

  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const fileInput = document.getElementById('import-file');

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(PREFS, null, 2));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute('href', dataStr);
      dlAnchorElem.setAttribute('download', 'blockitout-settings.json');
      document.body.appendChild(dlAnchorElem);
      dlAnchorElem.click();
      dlAnchorElem.remove();
    });
  }

  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (typeof imported === 'object' && imported !== null) {
            PREFS = { ...PREFS, ...imported };
            saveSettings();
            const activeTab = document.querySelector('.tab.active').dataset.tab;
            renderContent(activeTab);
            alert('Settings imported successfully!');
          } else {
            alert('Invalid JSON format.');
          }
        } catch (err) {
          alert('Failed to parse settings file.');
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
  }
});

function bindTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderContent(tab.dataset.tab);
    });
  });
}

function saveSettings() {
  chrome.storage.local.set({ bio_pro_settings: PREFS });
}

function createRow(title, desc, key) {
  return `
        <div class="row-item">
            <div>
                <div class="lbl">${title}</div>
                <div class="desc">${desc}</div>
            </div>
            <label class="switch">
                <input type="checkbox" data-key="${key}" ${PREFS[key] ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
    `;
}

function renderContent(section) {
  const content = document.getElementById('content');
  let html = '';

  const sectionHeader = (title) =>
    `<h3 style="font-size: 13px; font-weight: 800; color: #000; margin: 16px 0 8px 4px; text-transform: uppercase; letter-spacing: 0.05em;">${title}</h3>`;

  if (section === 'instagram') {
    html = `
            ${sectionHeader('Core Distractions')}
            <div class="card-group">
                ${createRow('Hide Reels', 'Hide reels & sidebar.', 'igHideReels')}
                ${createRow('Focus Mode', 'Messaging Only. Hides Feed.', 'igFocusMode')}
                ${createRow('Safe Feed', 'Hide Sponsored & Suggested posts.', 'igSafeFeed')}
            </div>
            ${sectionHeader('Content Filters')}
            <div class="card-group">
                ${createRow('Hide Stories', 'Remove the stories tray.', 'igHideStories')}
                ${createRow('Hide Posts', 'Turn posts into black boxes.', 'igHidePosts')}
                ${createRow('Blur Thumbnails', 'Blur feed images until hover.', 'igBlurImages')}
            </div>
            ${sectionHeader('Metrics & Tracking')}
            <div class="card-group">
                ${createRow('Time Tracker', 'Track wasted time.', 'igTimeMonitor')}
                ${createRow('Hide Metrics', 'Hide like/follower counts.', 'igHideMetrics')}
                ${createRow('Disable Double Tap', 'Prevent accidental likes.', 'igNoDoubleTap')}
            </div>
        `;
  } else if (section === 'youtube') {
    html = `
            ${sectionHeader('Core Distractions')}
            <div class="card-group">
                ${createRow('Hide Shorts', 'Remove Shelves & Tabs.', 'ytHideShorts')}
                ${createRow('Focus Mode', 'No Sidebar, No Feed.', 'ytFocusMode')}
                ${createRow('Hide Feed', 'Clean Homepage recommendations.', 'ytHideFeed')}
            </div>
            ${sectionHeader('Ad Controls')}
            <div class="card-group">
                ${createRow('Ad Accelerator', 'Auto-skips & speeds up ads.', 'ytSkipAds')}
                ${createRow('Auto-Mute Ads', 'Silence player during ads.', 'ytMuteAds')}
                ${createRow('Close Banners', 'Auto-close overlay banners.', 'ytHideBanners')}
            </div>
            ${sectionHeader('Player & Content')}
            <div class="card-group">
                ${createRow('Theater Focus', 'Hide header and sidebar clutter.', 'ytTheaterMode')}
                ${createRow('Kill Autoplay', 'Force Autoplay toggle to OFF.', 'ytStopAutoplay')}
                ${createRow('Hide End Cards', 'Hide thumbnail cards.', 'ytCleanEndScreen')}
                ${createRow('Hide Comments', 'Remove discussion sections.', 'ytHideComments')}
            </div>
        `;
  } else {
    html = `
            ${sectionHeader('Mindfulness Walls')}
            <div class="card-group">
                ${createRow('Hard Block', 'Completely block access.', 'globalHardBlock')}
                ${createRow('Intent Wall', 'Force an intention before visiting.', 'globalIntentWall')}
                ${createRow('Breathe Wall', 'Force a 30s delay before entry.', 'globalBreatheWall')}
            </div>
            ${sectionHeader('Focus Modifiers')}
            <div class="card-group">
                ${createRow('Grayscale Mode', 'Reduce dopamine with no colors.', 'globalMono')}
            </div>
            ${sectionHeader('Restricted Sites')}
            <div class="card-group" style="padding: 16px; display: block;">
                <div class="lbl">Quick Category Toggles</div>
                <div class="desc" style="margin-bottom: 8px;">Quickly block or unblock entire categories.</div>
                <div id="category-toggles" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px;"></div>
                <div style="height: 1px; background: #eee; margin-bottom: 16px;"></div>
                <div class="lbl">Sites to Restrict</div>
                <div class="desc" style="margin-bottom: 12px;">Add specific websites you want to block.</div>
                <div class="site-input-row">
                    <input type="text" id="domain-input" placeholder="e.g. reddit.com">
                    <button id="add-domain-btn" class="btn-dark">Add</button>
                </div>
                <ul id="domain-list" class="site-list"></ul>
            </div>
        `;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  content.replaceChildren(...doc.body.childNodes);

  const renderList = () => {
    const listEl = document.getElementById('domain-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    const sites = PREFS.globalCustomSites
      .split(/[\n,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s);
    sites.forEach((site) => {
      const li = document.createElement('li');
      li.innerHTML = `
                    <span class="domain-name"></span>
                    <button class="delete-btn" style="background: none; border: none; cursor: pointer; color: #555; padding: 0;">
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                `;
      li.querySelector('.domain-name').textContent = site;
      li.querySelector('.delete-btn').dataset.domain = site;
      listEl.appendChild(li);
    });
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.onclick = (e) => {
        const toRemove = e.currentTarget.dataset.domain;
        let arr = PREFS.globalCustomSites
          .split(/[\n,]+/)
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s);
        arr = arr.filter((s) => s !== toRemove);
        PREFS.globalCustomSites = arr.join(', ');
        saveSettings();
        renderList();
      };
    });
  };

  if (section === 'global') {
    renderList();

    const toggleContainer = document.getElementById('category-toggles');
    if (toggleContainer) {
      const currentSites = PREFS.globalCustomSites
        .split(/[\n,]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s);

      Object.entries(SITE_CATEGORIES).forEach(([name, domains]) => {
        const isActive = domains.every((d) => currentSites.includes(d));
        const btn = document.createElement('button');
        btn.textContent = (isActive ? '- ' : '+ ') + name;
        btn.style.cssText = `
                        padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; border: 2px solid #000;
                        background: ${isActive ? '#000' : '#fff'}; color: ${isActive ? '#fff' : '#000'};
                        transition: all 0.1s; box-shadow: 2px 2px 0px #000;
                    `;
        btn.onmouseover = () => {
          btn.style.transform = 'translate(-1px, -1px)';
          btn.style.boxShadow = '3px 3px 0px #000';
        };
        btn.onmouseout = () => {
          btn.style.transform = 'translate(0, 0)';
          btn.style.boxShadow = '2px 2px 0px #000';
        };
        btn.onmousedown = () => {
          btn.style.transform = 'translate(2px, 2px)';
          btn.style.boxShadow = '0px 0px 0px #000';
        };
        btn.onmouseup = () => {
          btn.style.transform = 'translate(-1px, -1px)';
          btn.style.boxShadow = '3px 3px 0px #000';
        };

        btn.onclick = () => {
          const current = PREFS.globalCustomSites
            .split(/[\n,]+/)
            .map((s) => s.trim().toLowerCase())
            .filter((s) => s);
          const newSites = new Set(current);
          if (isActive) {
            domains.forEach((d) => newSites.delete(d));
          } else {
            domains.forEach((d) => newSites.add(d));
          }
          PREFS.globalCustomSites = Array.from(newSites).join(', ');
          saveSettings();
          renderContent('global');
        };
        toggleContainer.appendChild(btn);
      });
    }

    const input = document.getElementById('domain-input');
    const btn = document.getElementById('add-domain-btn');

    if (input) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            if (url.protocol.startsWith('http')) {
              const hostname = url.hostname.replace(/^www\./, '');
              const currentSites = PREFS.globalCustomSites
                .split(/[\n,]+/)
                .map((s) => s.trim().toLowerCase())
                .filter((s) => s);
              if (!currentSites.includes(hostname)) {
                input.value = hostname;
              }
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      });
    }

    const addDomain = () => {
      const val = input.value.trim().toLowerCase();
      if (val) {
        const arr = PREFS.globalCustomSites
          .split(/[\n,]+/)
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s);
        if (!arr.includes(val)) {
          arr.push(val);
          PREFS.globalCustomSites = arr.join(', ');
          saveSettings();
          renderList();
        }
        input.value = '';
      }
    };

    if (btn && input) {
      btn.onclick = addDomain;
      input.onkeypress = (e) => {
        if (e.key === 'Enter') addDomain();
      };
    }
  }

  content.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.onchange = (e) => {
      const key = e.target.dataset.key;
      PREFS[key] = e.target.checked;
      saveSettings();
    };
  });
}
