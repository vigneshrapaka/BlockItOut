(function () {
    'use strict';

    const ENV = {
        IG: window.location.hostname.includes('instagram.com'),
        YT: window.location.hostname.includes('youtube.com'),
        SEARCH: /(google|bing|duckduckgo|yahoo)/.test(window.location.hostname)
    };

    const DEFAULTS = {
        igHideReels: false,
        igHideStories: false,
        igHidePosts: false,
        igSafeFeed: false, 
        igNoDoubleTap: false,
        igTimeMonitor: false,
        igFocusMode: false,
        igHideMetrics: false,
        igBlurImages: false,
        ytHideShorts: false,
        ytHideFeed: false,
        ytHideComments: false,
        ytFocusMode: false,
        ytSkipAds: false,
        ytMuteAds: false,
        ytHideBanners: false,
        ytTheaterMode: false,
        ytStopAutoplay: false,
        ytCleanEndScreen: false,
        globalMono: false
    };

    let PREFS = { ...DEFAULTS };

    const StorageManager = {
        load(callback) {
            chrome.storage.local.get(['bio_pro_settings'], (result) => {
                if (result.bio_pro_settings) {
                    PREFS = { ...DEFAULTS, ...result.bio_pro_settings };
                } else {
                    PREFS = { ...DEFAULTS };
                }
                if(callback) callback();
            });
        },

        save(settings) {
            PREFS = settings;
            chrome.storage.local.set({ 'bio_pro_settings': settings });
            window.dispatchEvent(new CustomEvent('bio:settings-update', { detail: settings }));
        }
    };

    const StyleInjector = {
        add(id, css) {
            if (document.getElementById(id)) return;
            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
        },
        toggle(id, css, condition) {
            const el = document.getElementById(id);
            if (condition) {
                if (!el) this.add(id, css);
            } else {
                if (el) el.remove();
            }
        }
    };

    class SessionMonitor {
        constructor() {
            this.timer = null;
            this.pill = null;
            this.startTime = 0;
            this.alternatives = {
                1: ["Breathed deeply", "Looked at the sky", "Smelled a rose", "Drank water"],
                30: ["Added a task for the day", "Closed distracting tabs", "Stretched your back"],
                60: ["Pet your pet", "Ate a healthy snack", "Cleaned your desk", "Did 1 minute of deep breathing"],
                3600: ["Cooked dinner", "Gone shopping", "Painted a picture", "Learned a code concept", "Gardened"]
            };
        }

        init() {
            if (PREFS.globalMono) {
                StyleInjector.add('bio-mono', 'html { filter: grayscale(100%) !important; }');
            }

            if (PREFS.igTimeMonitor && ENV.IG) this.toggle(true);

            document.addEventListener("visibilitychange", () => {
                document.hidden ? this.pause() : this.resume();
            });
        }

        toggle(active) {
            active ? this.start() : this.stop();
        }

        start() {
            if (this.timer) return;
            this.renderPill();
            this.startTime = Date.now();
            this.timer = setInterval(() => this.tick(), 1000);
        }

        stop() {
            clearInterval(this.timer);
            this.timer = null;
            this.pill?.remove();
            this.pill = null;
        }

        pause() {
            if (this.timer) clearInterval(this.timer);
        }

        resume() {
            if (PREFS.igTimeMonitor) {
                this.startTime = Date.now();
                this.timer = setInterval(() => this.tick(), 1000);
            }
        }

        getStoredSeconds() {
            return parseFloat(localStorage.getItem("bio_session_seconds") || "0");
        }

        formatTime(seconds) {
            if (seconds > (3600 * 24)) return `${(seconds / (3600 * 24)).toFixed(1)}d`;
            else if (seconds > 3600) return `${(seconds / 3600).toFixed(1)}h`;
            else if (seconds > 60) return `${(seconds / 60).toFixed(0)}m`;
            else return `${seconds.toFixed(0)}s`;
        }

        tick() {
            const now = Date.now();
            const elapsed = (now - this.startTime) / 1000;
            this.startTime = now;
            
            const total = this.getStoredSeconds() + elapsed;
            localStorage.setItem("bio_session_seconds", total.toString());

            if (!this.pill) this.renderPill();
            this.pill.innerHTML = `<span>⏳</span> ${this.formatTime(total)}`;
        }

        renderPill() {
            if (document.getElementById('bio-time-pill')) return;
            
            this.pill = document.createElement('div');
            this.pill.id = 'bio-time-pill';
            this.pill.style.cssText = `
                position: fixed !important;
                right: 20px !important;
                left: auto !important;
                bottom: 20px !important;
                padding: 8px 16px !important;
                border-radius: 20px !important;
                background: rgba(20, 10, 10, 0.85) !important; 
                border: 1px solid rgba(255, 94, 91, 0.5) !important;
                backdrop-filter: blur(10px) !important;
                color: #FF5E5B !important;
                font-family: sans-serif !important;
                font-size: 13px !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                z-index: 2147483647 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
                min-width: 80px !important;
                transition: transform 0.2s;
            `;
            
            this.pill.onmouseover = () => { this.pill.style.background = 'rgba(255, 94, 91, 0.2)'; this.pill.style.transform = 'scale(1.05)'; };
            this.pill.onmouseout = () => { this.pill.style.background = 'rgba(20, 10, 10, 0.85)'; this.pill.style.transform = 'scale(1)'; };
            this.pill.onclick = (e) => {
                e.stopPropagation();
                this.showRealityCheck();
            };
            
            document.body.appendChild(this.pill);
        }

        showRealityCheck() {
            const seconds = this.getStoredSeconds();
            const threshold = seconds > 3600 ? 3600 : (seconds > 60 ? 60 : 1);
            const altList = this.alternatives[threshold];
            const suggestion = altList[Math.floor(Math.random() * altList.length)];
            const count = Math.max(1, Math.floor(seconds / threshold));

            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                background: 'rgba(5, 2, 2, 0.9)', backdropFilter: 'blur(25px)',
                zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexDirection: 'column'
            });
            
            const card = document.createElement('div');
            Object.assign(card.style, {
                background: 'rgba(30, 15, 15, 0.6)', padding: '60px 40px', borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.08)', width: '440px', textAlign: 'center',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)', color: '#F5F5F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            });

            card.innerHTML = `
                <div style="font-size:64px; margin-bottom:24px; line-height:1; animation: float 3s ease-in-out infinite;">💀</div>
                <h3 style="margin:0 0 12px 0; color:#FF5E5B; font-size:13px; text-transform:uppercase; letter-spacing:3px; font-weight:700; opacity:0.9;">Time Wasted</h3>
                <div style="font-size:60px; font-weight:800; color:#fff; margin:0 0 32px 0; line-height:1; text-shadow: 0 0 30px rgba(255,94,91,0.2); font-variant-numeric: tabular-nums;">${this.formatTime(seconds)}</div>
                <div style="background:rgba(255,255,255,0.03); border-radius:16px; padding:24px; margin-bottom:32px; border:1px solid rgba(255,255,255,0.05);">
                    <p style="color:#C0C0C5; font-size:15px; line-height:1.6; margin:0;">
                         You could have <b>${suggestion}</b> roughly ${count} times.
                    </p>
                </div>
                <button id="bio-go-work" style="
                    background: linear-gradient(135deg, #FF5E5B, #FF3B30); color: #fff; border: none; width:100%;
                    padding: 20px 0; border-radius: 16px; font-size: 18px; font-weight: 700; cursor: pointer;
                    box-shadow: 0 8px 30px rgba(255, 69, 58, 0.3); transition: all 0.2s ease; letter-spacing: -0.01em;
                ">GO TO WORK</button>
                <div id="bio-insight-close" style="
                    margin-top: 24px; color: #666; font-size: 13px; font-weight: 500; cursor: pointer;
                    transition: 0.2s; text-decoration: none; opacity: 0.7;
                ">I give up, back to doomscrolling</div>
                <style>@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }</style>
            `;
            
            overlay.appendChild(card);
            document.body.appendChild(overlay);
            document.getElementById('bio-go-work').onclick = () => { history.back(); overlay.remove(); };
            document.getElementById('bio-insight-close').onclick = () => overlay.remove();
            overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
        }
    }

    const InstagramHandler = {
        observer: null,
        
        init() {
            this.injectCSS();
            this.setupInteractions();
            this.startObserver();
            this.routeCheck();
            setInterval(() => this.routeCheck(), 600);
        },

        injectCSS() {
            const blurCSS = `
                body:not([class*="direct"]) article img, 
                body:not([class*="direct"]) main a[href^="/p/"] img, 
                body:not([class*="direct"]) main a[href^="/reels/"] img,
                body:not([class*="direct"]) a[href*="/p/"] img, 
                body:not([class*="direct"]) a[href*="/reels/"] img { 
                    filter: blur(40px) !important; 
                    transition: filter 0.3s ease-in-out !important; 
                }
                
                body:not([class*="direct"]) article:hover img, 
                body:not([class*="direct"]) main a:hover img,
                body:not([class*="direct"]) a[href*="/p/"]:hover img, 
                body:not([class*="direct"]) a[href*="/reels/"]:hover img { 
                    filter: blur(0) !important; 
                }
            `;

            const metricsCSS = `
                article a[href*="/liked_by/"], article a[href*="/comments/"], 
                header ul li span:first-child,
                article span:has(svg[aria-label="Like"]) + span,
                article span:has(svg[aria-label="Comment"]) + span
                { display: none !important; }
            `;
            
            if (PREFS.igBlurImages) StyleInjector.add('bio-ig-blur', blurCSS);
            if (PREFS.igHideMetrics) StyleInjector.add('bio-ig-metrics', metricsCSS);

            if (PREFS.igFocusMode || PREFS.igHideReels || PREFS.igHidePosts) {
                const exploreCSS = `a[href="/explore/"], svg[aria-label="Explore"] { display: none !important; }`;
                StyleInjector.add('bio-ig-explore-kill', exploreCSS);
            }

            if (PREFS.igFocusMode) {
                const focusCSS = `
                    /* Hide Navigation Bar Items: Home, Search, Explore, Reels */
                    div:not(:first-child) > div > a[href="/"], 
                    div:not(:first-child) > div > a[href="/explore/"], 
                    div:not(:first-child) > div > a[href="/reels/"],
                    div:not(:first-child) > div > div > a[href="#"], 
                    svg[aria-label="Home"], 
                    svg[aria-label="Search"], 
                    svg[aria-label="Explore"], 
                    svg[aria-label="Reels"] {
                        display: none !important;
                    }
                    /* Ensure Main Feed is hidden if route check lags */
                    main[role="main"] { display: none !important; }
                    /* But allow Direct Inbox main container */
                    section main[role="main"] { display: block !important; }
                `;
                StyleInjector.add('bio-ig-focus', focusCSS);
            }
        },

        setupInteractions() {
            if (PREFS.igNoDoubleTap) {
                const preventLike = (event) => {
                    if (window.location.pathname.startsWith('/direct/')) return;
                    
                    const target = event.target;
                    if (target.tagName.toLowerCase() === 'img' ||
                        target.closest('article') ||
                        target.closest('[role="presentation"]')) {
                        event.stopPropagation();
                        event.preventDefault();
                        return false;
                    }
                };
                document.addEventListener('dblclick', preventLike, true);
                let lastTap = 0;
                document.addEventListener('touchend', (event) => {
                    if (window.location.pathname.startsWith('/direct/')) return;

                    if (event.touches.length === 0 && event.changedTouches.length === 1) {
                        const now = Date.now();
                        if (now - lastTap < 300) { preventLike(event); }
                        lastTap = now;
                    }
                }, true);
            }
        },

        routeCheck() {
            const path = window.location.pathname;

            if (PREFS.igFocusMode) {
                const allowedPrefixes = ['/direct/', '/accounts/', '/challenge/', '/two_factor/', '/emails/', '/login/'];
                const isAllowed = allowedPrefixes.some(p => path.startsWith(p));
                if (!isAllowed) {
                    window.location.replace('https://www.instagram.com/direct/inbox/');
                }
            }
            
            if (PREFS.igHideReels && (path.includes('/reels/') || path === '/reels')) {
                window.location.replace('https://www.instagram.com/');
            }

            if ((PREFS.igHideReels || PREFS.igHidePosts) && path.includes('/explore')) {
                window.location.replace('https://www.instagram.com/');
            }
        },

        startObserver() {
            this.observer = new MutationObserver(() => this.cleanseDOM());
            this.observer.observe(document.body, { childList: true, subtree: true });
        },

        cleanseDOM() {
            const remove = (sel) => document.querySelectorAll(sel).forEach(el => el.style.display = 'none');

            if (PREFS.igHideStories || PREFS.igFocusMode) {
                remove('main div[role="menu"]'); 
                remove('div[role="button"]:has(canvas)');
            }

            if (PREFS.igHideReels || PREFS.igFocusMode) {
                remove('a[href="/reels/"]');
                remove('svg[aria-label="Clips"]');
                remove('svg[aria-label="Reels"]');
                document.querySelectorAll('article').forEach(art => {
                    if (art.querySelector('a[href*="/reels/"]') || art.querySelector('video')) {
                        if (!art.dataset.bioBlocked) {
                            art.dataset.bioBlocked = "true";
                            Object.assign(art.style, {
                                backgroundColor: '#000', color: '#000', pointerEvents: 'none',
                                position: 'relative', border: '1px solid #1a1a1a', marginBottom: '10px', minHeight: '100px'
                            });
                            Array.from(art.children).forEach(child => { child.style.visibility = 'hidden'; });
                        }
                    }
                });
            }

            if (PREFS.igFocusMode || PREFS.igHideReels || PREFS.igHidePosts) {
                remove('svg[aria-label="Explore"]');
                remove('a[href="/explore/"]');
            }

            if (PREFS.igFocusMode) {
                remove('svg[aria-label="Search"]');
                remove('svg[aria-label="Explore"]');
                if (window.location.pathname === '/') remove('main');
            }

            if (PREFS.igHidePosts) {
                document.querySelectorAll('article').forEach(art => {
                   if (!art.dataset.bioBlocked) {
                        art.dataset.bioBlocked = "true";
                        Object.assign(art.style, {
                            backgroundColor: '#000', color: '#000', pointerEvents: 'none',
                            position: 'relative', border: '1px solid #1a1a1a', marginBottom: '10px', minHeight: '100px'
                        });
                        Array.from(art.children).forEach(child => { child.style.visibility = 'hidden'; });
                    }
                });
            }

            if (PREFS.igSafeFeed && !PREFS.igHidePosts) {
                this.removeSponsored();
            }
        },

        removeSponsored() {
            const articles = document.querySelectorAll('article:not([data-bio-checked])');
            articles.forEach(art => {
                art.dataset.bioChecked = "true";
                let isDistraction = false;
                const divs = art.querySelectorAll('div');
                for (const div of divs) {
                    const t = div.innerText.trim().toLowerCase();
                    if (t === 'follow' || t === 'sponsored') {
                        isDistraction = true; break;
                    }
                }
                if (!isDistraction) {
                    const textElements = art.querySelectorAll('span, div, section, h2');
                    for (const el of textElements) {
                        const t = el.innerText.trim().toLowerCase();
                        if (t.includes('suggested for you') || t.includes('suggested posts')) {
                            isDistraction = true; break;
                        }
                    }
                }
                if (isDistraction) {
                    art.style.visibility = 'hidden';
                    art.style.height = '0px';
                    art.style.overflow = 'hidden';
                    art.dataset.bioHidden = "true";
                }
            });
        }
    };

    const YouTubeHandler = {
        init() {
            this.applyCSS();
            this.loop();
            window.addEventListener('yt-navigate-finish', () => this.loop());
        },

        applyCSS() {
            if (PREFS.ytCleanEndScreen) {
                StyleInjector.add('bio-yt-ends', '.ytp-ce-element, .ytp-ce-cover-overlay { display: none !important; }');
            }
            if (PREFS.ytTheaterMode) {
                StyleInjector.add('bio-yt-theater', `
                    ytd-masthead, #secondary, #comments { opacity: 0; transition: opacity 0.4s ease !important; }
                    ytd-masthead:hover, #secondary:hover, #comments:hover { opacity: 1 !important; }
                `);
            }
        },

        loop() {
            setInterval(() => {
                this.blockElements();
                if (PREFS.ytSkipAds) this.mitigateAds();
                if (PREFS.ytStopAutoplay) this.killAutoplay();
            }, 500);
        },

        blockElements() {
            const hide = (sel) => document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
            const isHome = window.location.pathname === '/';
            const isShorts = window.location.pathname.startsWith('/shorts/');

            if (PREFS.ytHideShorts || PREFS.ytFocusMode) {
                if (isShorts) window.location.replace('https://www.youtube.com/');
                hide('a[title="Shorts"]');
                hide('ytd-reel-shelf-renderer');
                hide('ytd-rich-shelf-renderer[is-shorts]');
                hide('a[href^="/shorts/"]');
            }

            if ((PREFS.ytHideFeed || PREFS.ytFocusMode) && isHome) {
                hide('ytd-browse[page-subtype="home"] #primary');
            }

            if (PREFS.ytHideComments || PREFS.ytFocusMode) {
                hide('#comments');
                hide('ytd-comments');
            }

            if (PREFS.ytFocusMode) {
                hide('#secondary'); 
                hide('ytd-mini-guide-renderer');
                hide('ytd-guide-renderer');
            }
        },

        killAutoplay() {
            const toggle = document.querySelector('.ytp-autonav-toggle-button');
            if (toggle && toggle.getAttribute('aria-checked') === 'true') toggle.click();
        },

        mitigateAds() {
            const video = document.querySelector('video');
            const adOverlay = document.querySelector('.ytp-ad-module');
            if (!video || !adOverlay || adOverlay.children.length === 0) return;

            const isAd = document.querySelector('.ad-showing') || document.querySelector('.ytp-ad-player-overlay');
            if (isAd) {
                if (PREFS.ytMuteAds) video.muted = true;
                if (!isNaN(video.duration)) { video.playbackRate = 16.0; video.currentTime = video.duration; }
                const skipSelectors = ['.ytp-ad-skip-button', '.ytp-ad-skip-button-modern', '.videoAdUiSkipButton'];
                const btn = document.querySelector(skipSelectors.join(','));
                if (btn) btn.click();
                if (PREFS.ytHideBanners) {
                    const closeBtn = document.querySelector('.ytp-ad-overlay-close-button');
                    if (closeBtn) closeBtn.click();
                }
            } else {
                if (PREFS.ytMuteAds && video.muted && video.volume > 0) video.muted = false;
            }
        }
    };

    const Dashboard = {
        state: { section: 'instagram' },
        
        init() {
            if (ENV.SEARCH) {
                const params = new URLSearchParams(window.location.search);
                const query = (params.get('q') || params.get('p') || '').toLowerCase();
                if (query.includes('blockitout')) {
                    this.injectTrigger();
                }
            }
            
            if (window.location.href.includes('blockitout-dashboard')) {
                this.render();
            }
        },

        injectTrigger() {
            if(document.getElementById('bio-pill')) return;
            const btn = document.createElement('div');
            btn.id = 'bio-pill';
            Object.assign(btn.style, {
                position: 'fixed', bottom: '50px', left: '50%', transform: 'translateX(-50%)',
                padding: '16px 32px', borderRadius: '50px',
                background: 'rgba(255, 94, 91, 0.15)',
                border: '1px solid rgba(255, 94, 91, 0.4)',
                backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)',
                color: '#FF5E5B', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontWeight: '600',
                cursor: 'pointer', zIndex: '2147483647', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto'
            });
            btn.innerHTML = `<span>🛑</span> Open Dashboard`;
            btn.onmouseover = () => { btn.style.transform = 'translateX(-50%) scale(1.05)'; btn.style.background = 'rgba(255, 94, 91, 0.25)'; };
            btn.onmouseout = () => { btn.style.transform = 'translateX(-50%) scale(1)'; btn.style.background = 'rgba(255, 94, 91, 0.15)'; };
            btn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopImmediatePropagation();
                this.render();
            }, true);
            
            if (document.body) document.body.appendChild(btn);
            else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
        },

        render() {
            if (document.getElementById('bio-dashboard-overlay')) return;
            
            const css = `
                #bio-dashboard-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    z-index: 2147483647; background: #050202; color: #F5F5F7;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    display: flex; box-sizing: border-box; text-align: left;
                }
                #bio-dashboard-overlay * { box-sizing: border-box; font-family: inherit; }
                #bio-dashboard-overlay .sidebar {
                    width: 280px; height: 100%; border-right: 1px solid rgba(255, 94, 91, 0.15);
                    background: rgba(10, 5, 5, 0.6); backdrop-filter: blur(50px);
                    padding: 40px 20px; display: flex; flex-direction: column;
                }
                #bio-dashboard-overlay .logo { 
                    font-size: 24px; font-weight: 800; letter-spacing: -0.02em; 
                    margin-bottom: 40px; padding-left: 10px;
                    background: linear-gradient(135deg, #FF5E5B, #ffb3b3);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                #bio-dashboard-overlay .nav-item {
                    padding: 14px 18px; border-radius: 12px; margin-bottom: 8px;
                    cursor: pointer; color: #86868B; font-weight: 500; font-size: 15px;
                    transition: all 0.2s; display: flex; align-items: center; gap: 12px;
                }
                #bio-dashboard-overlay .nav-item:hover { background: rgba(255, 94, 91, 0.05); color: #F5F5F7; }
                #bio-dashboard-overlay .nav-item.active { 
                    background: rgba(255, 94, 91, 0.15); color: #FF5E5B; 
                    box-shadow: 0 0 0 1px rgba(255, 94, 91, 0.2) inset;
                }
                #bio-dashboard-overlay .main { flex: 1; padding: 60px 80px; overflow-y: auto; background-image: radial-gradient(circle at 0% 0%, rgba(255, 94, 91, 0.15), transparent 40%), radial-gradient(circle at 100% 100%, rgba(100, 20, 20, 0.2), transparent 40%); }
                #bio-dashboard-overlay h2 { font-size: 32px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: -0.02em; color: #F5F5F7; line-height: 1.2; }
                #bio-dashboard-overlay p.sub { color: #86868B; margin: 0 0 40px 0; font-size: 16px; }
                #bio-dashboard-overlay .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
                #bio-dashboard-overlay .card {
                    background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 94, 91, 0.15);
                    border-radius: 20px; padding: 24px; transition: 0.3s;
                    position: relative; overflow: hidden;
                }
                #bio-dashboard-overlay .card:hover { 
                    background: rgba(255, 255, 255, 0.05); transform: translateY(-2px); 
                    border-color: rgba(255, 94, 91, 0.25); 
                }
                #bio-dashboard-overlay .row { display: flex; justify-content: space-between; align-items: center; }
                #bio-dashboard-overlay .lbl { font-size: 16px; font-weight: 600; margin-bottom: 4px; color: #F5F5F7; }
                #bio-dashboard-overlay .desc { font-size: 13px; color: #86868B; line-height: 1.4; }
                #bio-dashboard-overlay .switch { position: relative; width: 44px; height: 26px; cursor: pointer; display: inline-block; margin: 0; }
                #bio-dashboard-overlay .switch input { opacity: 0; width: 0; height: 0; }
                #bio-dashboard-overlay .slider {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background-color: rgba(255, 255, 255, 0.1); border-radius: 30px; transition: .4s;
                }
                #bio-dashboard-overlay .slider:before {
                    position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px;
                    background-color: white; border-radius: 50%; transition: .4s;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                #bio-dashboard-overlay input:checked + .slider { background-color: #FF5E5B; }
                #bio-dashboard-overlay input:checked + .slider:before { transform: translateX(18px); }
                #bio-dashboard-overlay .bmc-btn {
                    margin-top: auto; margin-bottom: 12px; padding: 12px 16px;
                    text-align: center; background: #FFDD00; color: #000000;
                    border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 700;
                    line-height: 1.5; letter-spacing: 0.01em;
                    transition: 0.2s; display: block;
                    box-shadow: 0 2px 10px rgba(255, 221, 0, 0.3);
                }
                #bio-dashboard-overlay .bmc-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 221, 0, 0.4); }
                #bio-dashboard-overlay .btn-exit {
                    padding: 14px; text-align: center;
                    background: rgba(255,255,255,0.05); color: #86868B;
                    border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 500;
                    transition: 0.2s;
                }
                #bio-dashboard-overlay .btn-exit:hover { background: rgba(255,255,255,0.1); color: #F5F5F7; }
            `;
            
            StyleInjector.add('bio-dash-styles', css);
            
            const overlay = document.createElement('div');
            overlay.id = 'bio-dashboard-overlay';
            overlay.innerHTML = `
                <div class="sidebar">
                    <div class="logo">BlockItOut</div>
                    <div class="nav-item ${this.state.section === 'instagram' ? 'active' : ''}" id="bio-nav-ig">📸 Instagram</div>
                    <div class="nav-item ${this.state.section === 'youtube' ? 'active' : ''}" id="bio-nav-yt">▶️ YouTube</div>
                    <div class="nav-item ${this.state.section === 'global' ? 'active' : ''}" id="bio-nav-global">⚙️ Global</div>
                    <a href="https://buymeacoffee.com/vigneshrapaka" target="_blank" class="bmc-btn">Buy me a coffee ☕</a>
                    <div class="btn-exit" id="bio-btn-exit">Exit Dashboard</div>
                </div>
                <div class="main" id="bio-main-content"></div>
            `;
            
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            this.bindEvents();
            this.renderContent();
        },

        bindEvents() {
            document.getElementById('bio-nav-ig').onclick = () => { this.state.section = 'instagram'; this.renderContent(); };
            document.getElementById('bio-nav-yt').onclick = () => { this.state.section = 'youtube'; this.renderContent(); };
            document.getElementById('bio-nav-global').onclick = () => { this.state.section = 'global'; this.renderContent(); };
            document.getElementById('bio-btn-exit').onclick = () => {
                document.getElementById('bio-dashboard-overlay').remove();
                document.body.style.overflow = '';
            };
        },

        renderContent() {
            const content = document.getElementById('bio-main-content');
            document.querySelectorAll('#bio-dashboard-overlay .nav-item').forEach(n => n.classList.remove('active'));
            const map = { instagram: 'bio-nav-ig', youtube: 'bio-nav-yt', global: 'bio-nav-global' };
            document.getElementById(map[this.state.section]).classList.add('active');

            let html = '';
            
            const createCard = (title, desc, key) => `
                <div class="card">
                    <div class="row">
                        <div>
                            <div class="lbl">${title}</div>
                            <div class="desc">${desc}</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" data-key="${key}" ${PREFS[key] ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            `;

            if (this.state.section === 'instagram') {
                html = `
                    <h2>Instagram Controls</h2>
                    <p class="sub">Manage distractions on your feed.</p>
                    <div class="grid">
                        ${createCard('Time Tracker', 'Track wasted time & show reality checks.', 'igTimeMonitor')}
                        ${createCard('Safe Feed', 'Hide Sponsored & Suggested posts (Safe Mode).', 'igSafeFeed')}
                        ${createCard('Disable Double Tap', 'Prevent accidental likes on images.', 'igNoDoubleTap')}
                        ${createCard('Hide Reels', 'Turn feed reels into black boxes & hide sidebar.', 'igHideReels')}
                        ${createCard('Hide Stories', 'Remove the top stories tray.', 'igHideStories')}
                        ${createCard('Hide Posts', 'Turn feed posts into black boxes.', 'igHidePosts')}
                        ${createCard('Hide Metrics', 'Hide like counts, follower counts and comment counts.', 'igHideMetrics')}
                        ${createCard('Blur Thumbnails', 'Blur feed images until you hover.', 'igBlurImages')}
                        ${createCard('Focus Mode', 'Messaging Only. Hides Feed, Explore & Search.', 'igFocusMode')}
                    </div>
                `;
            } else if (this.state.section === 'youtube') {
                html = `
                    <h2>YouTube Controls</h2>
                    <p class="sub">Tailor your viewing experience.</p>
                    <div class="grid">
                        ${createCard('Ad Accelerator', 'Auto-skips & speeds up ads.', 'ytSkipAds')}
                        ${createCard('Auto-Mute Ads', 'Silence the player during ads.', 'ytMuteAds')}
                        ${createCard('Close Banners', 'Auto-close overlay banners.', 'ytHideBanners')}
                        ${createCard('Theater Focus', 'Hide header and sidebar clutter.', 'ytTheaterMode')}
                        ${createCard('Kill Autoplay', 'Force Autoplay toggle to stay OFF.', 'ytStopAutoplay')}
                        ${createCard('Hide End Cards', 'Hide thumbnail cards at end of video.', 'ytCleanEndScreen')}
                        ${createCard('Hide Shorts', 'Remove Shelves, Tabs & Redirect URLs.', 'ytHideShorts')}
                        ${createCard('Hide Feed', 'Clean Homepage recommendations.', 'ytHideFeed')}
                        ${createCard('Hide Comments', 'Remove discussion sections.', 'ytHideComments')}
                        ${createCard('Focus Mode', 'No Sidebar, No Feed.', 'ytFocusMode')}
                    </div>
                `;
            } else {
                html = `
                    <h2>Global Settings</h2>
                    <p class="sub">Affects all supported platforms.</p>
                    <div class="grid">
                        ${createCard('Grayscale Mode', 'Reduce dopamine by removing all colors.', 'globalMono')}
                    </div>
                `;
            }

            content.innerHTML = html;
            content.querySelectorAll('input').forEach(input => {
                input.onchange = (e) => {
                    const key = e.target.dataset.key;
                    PREFS[key] = e.target.checked;
                    StorageManager.save(PREFS);
                };
            });
        }
    };

    const Monitor = new SessionMonitor();
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "open_dashboard") {
            Dashboard.render();
        }
    });

    window.addEventListener('bio:settings-update', (e) => {
        PREFS = e.detail;
        if (ENV.IG) Monitor.toggle(PREFS.igTimeMonitor);
    });

    StorageManager.load(() => {
        if (ENV.IG) {
            InstagramHandler.init();
            Monitor.init();
        } else if (ENV.YT) {
            YouTubeHandler.init();
            Monitor.init();
        } else if (ENV.SEARCH) {
            Dashboard.init();
        }
    });

})();