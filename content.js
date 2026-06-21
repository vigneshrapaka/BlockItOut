(function () {
    'use strict';

    const ENV = {
        IG: window.location.hostname.includes('instagram.com'),
        YT: window.location.hostname.includes('youtube.com'),
        SEARCH: /(google|bing|duckduckgo|yahoo)/.test(window.location.hostname),
        BLOCKED: false
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
        globalMono: false,
        globalIntentWall: false,
        globalBreatheWall: false,
        globalCustomSites: "instagram.com, youtube.com, x.com, twitter.com, reddit.com, tiktok.com, facebook.com"
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

    class IntentWall {
        static init() {
            if (sessionStorage.getItem('bio_intent_passed')) return;

            document.documentElement.style.overflow = 'hidden';
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(30px)',
                zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexDirection: 'column', color: '#F5F5F7', fontFamily: 'sans-serif'
            });

            overlay.innerHTML = `
                <h1 style="font-size: 32px; margin-bottom: 16px; color: #F5F5F7 !important; margin-top: 0;">Why are you here?</h1>
                <p style="font-size: 16px; color: #A1A1A6 !important; margin-bottom: 32px; max-width: 400px; text-align: center; line-height: 1.5; margin-top: 0;">
                    State your intent. You must type at least 10 words explaining your purpose to access this site.
                </p>
                <div style="position: relative; width: 400px; margin-bottom: 24px;">
                    <textarea id="bio-intent-input" placeholder="I am here to..." style="
                        width: 100%; height: 120px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 12px; padding: 16px; padding-bottom: 36px; color: white !important; font-size: 16px; resize: none; outline: none; box-sizing: border-box; font-family: inherit;
                    "></textarea>
                    <div id="bio-intent-counter" style="position: absolute; bottom: 12px; right: 16px; color: #FF5E5B; font-size: 13px; font-weight: bold;">0 / 10</div>
                </div>
                <div style="display: flex; gap: 16px; width: 400px;">
                    <button id="bio-intent-cancel" style="
                        flex: 1; padding: 16px; background: rgba(255,255,255,0.05); color: white !important; border: none; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: bold;
                    ">Leave</button>
                    <button id="bio-intent-submit" disabled style="
                        flex: 1; padding: 16px; background: #FF5E5B; color: white !important; border: none; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: bold; opacity: 0.5; transition: opacity 0.2s;
                    ">Enter</button>
                </div>
            `;

            document.documentElement.appendChild(overlay);

            const input = overlay.querySelector('#bio-intent-input');
            const submit = overlay.querySelector('#bio-intent-submit');
            const counter = overlay.querySelector('#bio-intent-counter');

            input.addEventListener('input', () => {
                const words = input.value.trim().split(/\s+/).filter(w => w.length > 0);
                const uniqueWords = new Set(words.map(w => w.toLowerCase()));
                
                counter.innerText = `${words.length} / 10`;
                
                if (words.length >= 10 && uniqueWords.size >= 5) {
                    counter.style.color = '#34C759';
                    submit.disabled = false;
                    submit.style.opacity = '1';
                } else {
                    if (words.length >= 10 && uniqueWords.size < 5) {
                        counter.innerText = 'Stop typing gibberish.';
                    }
                    counter.style.color = '#FF5E5B';
                    submit.disabled = true;
                    submit.style.opacity = '0.5';
                }
            });

            overlay.querySelector('#bio-intent-cancel').onclick = () => { history.back(); };
            submit.onclick = () => {
                sessionStorage.setItem('bio_intent_passed', 'true');
                overlay.remove();
                document.documentElement.style.overflow = '';
            };
        }
    }

    class BreatheWall {
        static init() {
            if (sessionStorage.getItem('bio_breathe_passed')) return;

            document.documentElement.style.overflow = 'hidden';
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                background: 'rgba(5, 5, 5, 0.98)', backdropFilter: 'blur(30px)',
                zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexDirection: 'column', color: '#F5F5F7', fontFamily: 'sans-serif'
            });

            const lines = [
                "The algorithm just placed a bet on your attention. You're about to let it win.",
                "You opened this on autopilot. Take a breath and break the loop.",
                "Your brain is craving cheap dopamine. Don't give in so easily.",
                "Stop. Ask yourself: am I here with purpose, or just escaping reality?",
                "Every hour wasted begins with a single, mindless click.",
                "The slot machine is spinning. Walk away before you lose the next hour.",
                "You have a finite number of heartbeats. Do you really want to spend them here?",
                "In 30 seconds, the feed will have you. Close it now while you still have free will."
            ];

            overlay.innerHTML = `
                <div style="position: relative; width: 600px; height: 300px; display: flex; justify-content: center; align-items: center;">
                    <div id="bio-breathe-circle" style="
                        position: absolute; width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(circle, rgba(255,94,91,0.8) 0%, rgba(255,94,91,0) 70%);
                        animation: bio-breathe 30s ease-in-out forwards;
                    "></div>
                    <h2 id="bio-breathe-text" style="
                        position: relative; z-index: 10; font-size: 28px; font-weight: 700; color: #ffffff !important; margin: 0; text-shadow: 0 4px 20px rgba(0,0,0,0.8); letter-spacing: 1px; text-align: center; line-height: 1.4; opacity: 0; transition: opacity 1s ease-in-out;
                    ">Wait...</h2>
                </div>
                <style>
                    @keyframes bio-breathe {
                        0% { transform: scale(0.5); opacity: 0.5; }
                        50% { transform: scale(3.5); opacity: 1; }
                        100% { transform: scale(0.5); opacity: 0.5; }
                    }
                </style>
            `;

            document.documentElement.appendChild(overlay);

            const textEl = overlay.querySelector('#bio-breathe-text');
            
            setTimeout(() => { textEl.style.opacity = '1'; }, 500);

            let cycle = 0;
            const interval = setInterval(() => {
                textEl.style.opacity = '0';
                setTimeout(() => {
                    textEl.innerText = lines[cycle % lines.length];
                    textEl.style.opacity = '1';
                    cycle++;
                }, 1000);
            }, 5000);

            setTimeout(() => {
                clearInterval(interval);
                sessionStorage.setItem('bio_breathe_passed', 'true');
                overlay.remove();
                document.documentElement.style.overflow = '';
            }, 30000);
        }
    }

    class SessionMonitor {
        constructor() {
            this.timer = null;
            this.pill = null;
            this.startTime = 0;
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
            if ((PREFS.igTimeMonitor && ENV.IG) || (ENV.BLOCKED && !ENV.IG && !ENV.YT)) {
                this.start();
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
            (document.body || document.documentElement).appendChild(this.pill);
        }

        getAIInsight(seconds) {
            const minutes = Math.round(seconds / 60);
            const hours = (minutes / 60).toFixed(1);
            
            if (minutes < 1) {
                const shortInsights = [
                    "The algorithm just placed a bet on your attention. You're about to let it win.",
                    "You opened this on autopilot. Take a breath, break the loop, and close the tab.",
                    "Your brain is craving cheap dopamine. Don't give in so easily.",
                    "Stop. Ask yourself: am I here with purpose, or just escaping reality?",
                    "Every hour wasted begins with a single, mindless click. Turn back now.",
                    "The slot machine is spinning. Walk away before you lose the next hour.",
                    "You have a finite number of heartbeats. Do you really want to spend them here?",
                    "In 10 seconds, the feed will have you. Close it now while you still have free will."
                ];
                const text = shortInsights[Math.floor(Math.random() * shortInsights.length)];
                return `<div style="font-size: 16px; color: #E5E5EA; line-height: 1.6; text-align: center;">${text}</div>`;
            }

            const timeStr = minutes < 60 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : `${hours} hour${hours !== "1.0" ? 's' : ''}`;
            
            const reflectivePrompts = [
                `You just traded ${timeStr} of your one, finite life for pixels on a screen. Was the trade worth it?`,
                `The algorithm is designed to steal your life, ${timeStr} at a time. And it's working.`,
                `What uncomfortable truth are you running from? You've been hiding here for ${timeStr}.`,
                `You will never, ever get this past ${timeStr} back. It is gone forever.`,
                `In ten years, will you be proud that you spent ${timeStr} today doing exactly this?`,
                `While you were scrolling for ${timeStr}, the real world kept moving without you.`,
                `You are literally paying for this app with the limited time of your existence. That's ${timeStr} spent so far.`,
                `Imagine the person you dream of becoming. They wouldn't have just wasted ${timeStr} here.`,
                `Your attention is the most valuable currency on earth. You just gave away ${timeStr} of it for free.`,
                `Did you find what you were looking for, or did you just numb yourself for ${timeStr}?`,
                `Every minute here is a minute you steal from your own future. That's ${timeStr} stolen today.`,
                `This ${timeStr} could have been the start of something beautiful. Instead, it was nothing.`,
                `You are watching other people live their lives while ${timeStr} of yours slips away.`,
                `You didn't intend to stay this long. The system won. It took ${timeStr} from you.`,
                `Take a deep breath. Acknowledge the ${timeStr} that just passed. Now, make a better choice.`
            ];

            const actions = {
                tiny: [
                    "closed your eyes, taken three deep breaths, and actually felt your own existence",
                    "stepped outside, looked up at the sky, and remembered how vast the world is",
                    "written down one single thing you love about your life",
                    "stretched your spine and released the physical tension you're holding",
                    "drank a glass of water and nourished your body",
                    "sat in absolute, uninterrupted silence to let your mind settle",
                    "sent a text to someone you care about, just to tell them they matter",
                    "done nothing at all, which is far better than numbing your brain",
                    "cleared off your desk to create a space of clarity",
                    "reminded yourself of the most important goal you have right now"
                ],
                short: [
                    "read a chapter of a book that challenges how you see the world",
                    "written a brutally honest journal entry about what you're feeling right now",
                    "done a 10-minute meditation to regain control over your own thoughts",
                    "taken a brisk walk, without your phone, just observing your neighborhood",
                    "brewed a cup of tea and drank it without any distractions",
                    "sketched or written down a completely terrible, messy, but original idea",
                    "cleaned up your physical space to give your mind room to breathe",
                    "done a quick, intense burst of exercise to shock your nervous system awake",
                    "planned out your day so you don't end up back here",
                    "learned something entirely new that makes you a slightly more interesting person"
                ],
                medium: [
                    "completed a workout that left you sweating, exhausted, and incredibly proud",
                    "called a close friend and had a conversation with real depth and laughter",
                    "cooked a meal from scratch using real ingredients, feeding yourself properly",
                    "gone for a long walk in nature, entirely disconnected from the digital matrix",
                    "made undeniable, focused progress on that project you keep 'putting off'",
                    "read 50 pages of a book, expanding your mind instead of shrinking your attention span",
                    "learned the fundamentals of a new skill that could change your career trajectory",
                    "deep-cleaned your living space, creating an environment that respects you",
                    "listened to a brilliant podcast or lecture that shifted your perspective",
                    "taken a restorative nap, genuinely resting instead of faux-resting on a feed"
                ],
                long: [
                    "entered a state of deep flow and built a piece of the future you dream about",
                    "watched a beautifully crafted film or documentary that moved you to tears",
                    "gone to the gym and pushed your physical limits further than before",
                    "met up with a friend in the real world, creating a memory that will actually last",
                    "completely redesigned your living space to reflect the person you are becoming",
                    "spent quality, undivided, deeply present time with your family",
                    "mapped out a brutally honest, actionable plan for the next five years of your life",
                    "created a piece of art, code, or writing that did not exist before you made it",
                    "taken a long hike, feeling the sun on your face and the dirt under your feet",
                    "cooked an elaborate, beautiful dinner for yourself and someone you love"
                ]
            };

            let category = "tiny";
            if (minutes >= 5 && minutes < 20) category = "short";
            else if (minutes >= 20 && minutes < 60) category = "medium";
            else if (minutes >= 60) category = "long";

            const acts = actions[category];
            const act = acts[Math.floor(Math.random() * acts.length)];
            const reflection = reflectivePrompts[Math.floor(Math.random() * reflectivePrompts.length)];

            const formats = [
                `<div style="font-size: 16px; color: #F5F5F7; line-height: 1.6; text-align: center;">${reflection}</div>
                 <div style="margin-top: 20px; font-size: 15px; color: #A1A1A6; text-align: center; line-height: 1.5;">Instead of this, in ${timeStr} you could have <b>${act}</b>.</div>`,
                 
                `<div style="font-size: 15px; color: #A1A1A6; line-height: 1.6; text-align: center;">In the exact same amount of time (${timeStr}), you could have <b>${act}</b>.</div>
                 <div style="margin-top: 20px; font-size: 16px; color: #F5F5F7; text-align: center; line-height: 1.5;">${reflection}</div>`,
                 
                `<div style="font-size: 16px; color: #F5F5F7; line-height: 1.6; text-align: center;">${reflection}</div>
                 <div style="margin-top: 20px; font-size: 15px; color: #A1A1A6; text-align: center; line-height: 1.5;">Let's be real. You could have <b>${act}</b> instead of mindlessly scrolling.</div>`,
                 
                `<div style="font-size: 15px; color: #A1A1A6; line-height: 1.6; text-align: center;">Fact: You had enough time to have <b>${act}</b>.</div>
                 <div style="margin-top: 20px; font-size: 16px; color: #F5F5F7; text-align: center; line-height: 1.5;">${reflection}</div>`
            ];

            return formats[Math.floor(Math.random() * formats.length)];
        }

        showRealityCheck() {
            const seconds = this.getStoredSeconds();

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
                border: '1px solid rgba(255, 255, 255, 0.08)', width: '480px', textAlign: 'center',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)', color: '#F5F5F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            });

            card.innerHTML = `
                <div style="font-size:64px; margin-bottom:24px; line-height:1; animation: float 3s ease-in-out infinite;">💀</div>
                <h3 style="margin:0 0 12px 0; color:#FF5E5B; font-size:13px; text-transform:uppercase; letter-spacing:3px; font-weight:700; opacity:0.9;">Time Wasted</h3>
                <div style="font-size:60px; font-weight:800; color:#fff; margin:0 0 32px 0; line-height:1; text-shadow: 0 0 30px rgba(255,94,91,0.2); font-variant-numeric: tabular-nums;">${this.formatTime(seconds)}</div>
                <div style="background:rgba(255,255,255,0.03); border-radius:16px; padding:24px; margin-bottom:32px; border:1px solid rgba(255,255,255,0.05);">
                    ${this.getAIInsight(seconds)}
                </div>
                <button id="bio-go-work" style="
                    background: linear-gradient(135deg, #FF5E5B, #FF3B30); color: #fff; border: none; width:100%;
                    padding: 20px 0; border-radius: 16px; font-size: 18px; font-weight: 700; cursor: pointer;
                    box-shadow: 0 8px 30px rgba(255, 69, 58, 0.3); transition: all 0.2s ease; letter-spacing: -0.01em;
                ">CLOSE TAB</button>
                <div id="bio-insight-close" style="
                    margin-top: 24px; color: #666; font-size: 13px; font-weight: 500; cursor: pointer;
                    transition: 0.2s; text-decoration: none; opacity: 0.7;
                ">I give up, back to doomscrolling</div>
                <style>@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }</style>
            `;
            
            overlay.appendChild(card);
            (document.body || document.documentElement).appendChild(overlay);
            document.getElementById('bio-go-work').onclick = () => {
                chrome.runtime.sendMessage({ action: "close_tab" });
            };
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
                #bio-dashboard-overlay .switch { position: relative; width: 44px; min-width: 44px; height: 26px; cursor: pointer; display: inline-block; margin: 0; flex-shrink: 0; }
                #bio-dashboard-overlay .switch input { opacity: 0; width: 0; height: 0; margin: 0; padding: 0; }
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
                #bio-dashboard-overlay .bug-btn {
                    margin-bottom: 12px; padding: 12px 16px;
                    text-align: center; background: rgba(255,255,255,0.05); color: #86868B;
                    border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500;
                    line-height: 1.5; transition: 0.2s; display: block; border: 1px solid rgba(255,255,255,0.1);
                }
                #bio-dashboard-overlay .bug-btn:hover { background: rgba(255,255,255,0.1); color: #F5F5F7; border-color: rgba(255,255,255,0.2); }
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
                    <a href="https://forms.gle/at1r3GyYpg2B1PEd6" target="_blank" class="bug-btn">Report Bugs 🐛</a>
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
                        ${createCard('Intent Wall', 'Force yourself to type your intention before visiting.', 'globalIntentWall')}
                        ${createCard('Breathe Wall', 'Force a 30s breathing exercise before entry.', 'globalBreatheWall')}
                    </div>
                    <div class="card" style="margin-top: 16px;">
                        <div class="lbl">Sites to Restrict</div>
                        <div class="desc" style="margin-bottom: 12px;">Type the websites you want to block here. You can separate them with commas or put each one on a new line.<br><br><b>Example:</b> reddit.com, twitter.com, tiktok.com</div>
                        <textarea data-key="globalCustomSites" style="width: 100%; height: 80px; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); font-family: monospace; resize: vertical;">${PREFS.globalCustomSites}</textarea>
                    </div>
                `;
            }

            content.innerHTML = html;
            content.querySelectorAll('input, textarea').forEach(input => {
                input.onchange = (e) => {
                    const key = e.target.dataset.key;
                    if (e.target.type === 'checkbox') {
                        PREFS[key] = e.target.checked;
                    } else if (e.target.type === 'number') {
                        PREFS[key] = parseInt(e.target.value) || 0;
                    } else {
                        PREFS[key] = e.target.value;
                    }
                    StorageManager.save(PREFS);
                };
            });
        }
    };

    const Monitor = new SessionMonitor();
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "open_dashboard") {
            Dashboard.render();
        } else if (request.action === "trigger_reality_check") {
            Monitor.showRealityCheck();
        }
    });

    window.addEventListener('bio:settings-update', (e) => {
        PREFS = e.detail;
        if (ENV.IG) Monitor.toggle(PREFS.igTimeMonitor);
    });

    StorageManager.load(() => {
        const sites = PREFS.globalCustomSites.split(/[\n,]+/).map(s => s.trim().toLowerCase()).filter(s => s);
        ENV.BLOCKED = sites.some(site => window.location.hostname.includes(site)) || ENV.IG || ENV.YT;

        if (PREFS.globalIntentWall && ENV.BLOCKED) IntentWall.init();
        if (PREFS.globalBreatheWall && ENV.BLOCKED) BreatheWall.init();

        if (ENV.BLOCKED && !ENV.IG && !ENV.YT) {
            Monitor.init();
            Monitor.toggle(true);
        }

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