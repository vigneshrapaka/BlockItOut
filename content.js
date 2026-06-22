(function () {
    'use strict';

    const ENV = {
        IG: window.location.hostname.includes('instagram.com'),
        YT: window.location.hostname.includes('youtube.com'),
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
        globalCustomSites: "reddit.com, twitter.com, x.com, tiktok.com, facebook.com"
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
                background: 'rgba(244, 244, 240, 0.95)',
                backgroundImage: 'radial-gradient(#d1d1d1 1px, transparent 0)',
                backgroundSize: '10px 10px',
                zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexDirection: 'column', color: '#000000', fontFamily: "'Inter', system-ui, sans-serif"
            });

            overlay.innerHTML = `
                <div style="background: #ffffff; padding: 40px; border: 2px solid #000; box-shadow: 8px 8px 0px #000; border-radius: 4px; display: flex; flex-direction: column; align-items: center;">
                    <h1 style="font-size: 32px; margin-bottom: 16px; color: #000000 !important; margin-top: 0; font-weight: 800;">Why are you here?</h1>
                    <p style="font-size: 16px; color: #555555 !important; margin-bottom: 32px; max-width: 400px; text-align: center; line-height: 1.5; margin-top: 0; font-weight: 600;">
                        State your intent. You must type at least 10 words explaining your purpose to access this site.
                    </p>
                    <div style="position: relative; width: 400px; margin-bottom: 24px;">
                        <textarea id="bio-intent-input" placeholder="I am here to..." style="
                            width: 100%; height: 120px; background: #ffffff; border: 2px solid #000; box-shadow: inset 2px 2px 0px rgba(0,0,0,0.1);
                            border-radius: 4px; padding: 16px; padding-bottom: 36px; color: #000000 !important; font-size: 16px; resize: none; outline: none; box-sizing: border-box; font-family: inherit; font-weight: 600;
                        "></textarea>
                        <div id="bio-intent-counter" style="position: absolute; bottom: 12px; right: 16px; color: #555555; font-size: 13px; font-weight: 800;">0 / 10</div>
                    </div>
                    <div style="display: flex; gap: 16px; width: 400px;">
                        <button id="bio-intent-cancel" style="
                            flex: 1; padding: 16px; background: #ffffff; color: #000000 !important; border: 2px solid #000000; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: 800; box-shadow: 4px 4px 0px #000; transition: transform 0.1s, box-shadow 0.1s;
                        " onmouseover="this.style.transform='translate(-2px,-2px)';this.style.boxShadow='6px 6px 0px #000000'" onmouseout="this.style.transform='translate(0,0)';this.style.boxShadow='4px 4px 0px #000000'" onmousedown="this.style.transform='translate(4px,4px)';this.style.boxShadow='0px 0px 0px #000000'" onmouseup="this.style.transform='translate(-2px,-2px)';this.style.boxShadow='6px 6px 0px #000000'">Leave</button>
                        <button id="bio-intent-submit" disabled style="
                            flex: 1; padding: 16px; background: #000000; color: #ffffff !important; border: 2px solid #000000; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: 800; opacity: 0.5; transition: opacity 0.2s, transform 0.1s, box-shadow 0.1s; box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                        ">Enter</button>
                    </div>
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
                    counter.style.color = '#000000';
                    submit.disabled = false;
                    submit.style.opacity = '1';
                    submit.onmouseover = () => { submit.style.transform='translate(-2px,-2px)'; submit.style.boxShadow='6px 6px 0px rgba(0,0,0,1)'; };
                    submit.onmouseout = () => { submit.style.transform='translate(0,0)'; submit.style.boxShadow='4px 4px 0px rgba(0,0,0,1)'; };
                    submit.onmousedown = () => { submit.style.transform='translate(4px,4px)'; submit.style.boxShadow='0px 0px 0px rgba(0,0,0,1)'; };
                    submit.onmouseup = () => { submit.style.transform='translate(-2px,-2px)'; submit.style.boxShadow='6px 6px 0px rgba(0,0,0,1)'; };
                } else {
                    if (words.length >= 10 && uniqueWords.size < 5) {
                        counter.innerText = 'Stop typing gibberish.';
                    }
                    counter.style.color = '#555555';
                    submit.disabled = true;
                    submit.style.opacity = '0.5';
                    submit.onmouseover = null;
                    submit.onmouseout = null;
                    submit.onmousedown = null;
                    submit.onmouseup = null;
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
                background: 'rgba(244, 244, 240, 0.98)',
                backgroundImage: 'radial-gradient(#d1d1d1 1px, transparent 0)',
                backgroundSize: '10px 10px',
                zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexDirection: 'column', color: '#000000', fontFamily: "'Inter', system-ui, sans-serif"
            });

            const lines = [
                "Breathe in deeply...",
                "Breathe out. The algorithm wants your attention.",
                "Breathe in...",
                "Breathe out. Break the autopilot loop.",
                "Breathe in...",
                "Breathe out. Are you here with purpose?",
                "Breathe in...",
                "Breathe out. Your time is finite."
            ];

            overlay.innerHTML = `
                <!-- The Breathing Circle (Background) -->
                <div id="bio-breathe-circle" style="
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    border-radius: 50%; border-style: solid; border-color: #000; background: #ffffff; box-sizing: border-box;
                    animation: bio-breathe 10s ease-in-out infinite; z-index: 1;
                "></div>
                
                <!-- The Content (Foreground) -->
                <div style="position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px;">
                    
                    <h2 id="bio-breathe-text" style="
                        font-size: 26px; font-weight: 800; color: #000000 !important; margin: 0; letter-spacing: -0.02em; text-align: center; line-height: 1.4; opacity: 0; transition: opacity 0.8s ease-in-out; max-width: 260px;
                    ">${lines[0]}</h2>
                    
                    <button id="bio-leave-btn" style="
                        background: #ffffff; border: 2px solid #000; color: #000; padding: 12px 32px; font-size: 14px; font-weight: 800; border-radius: 6px; cursor: pointer;
                        box-shadow: 4px 4px 0px #000; transition: transform 0.1s, box-shadow 0.1s; display: inline-flex; justify-content: center; align-items: center; letter-spacing: 0.5px; text-transform: uppercase;
                    " onmouseover="this.style.transform='translate(-2px,-2px)';this.style.boxShadow='6px 6px 0px #000'" onmouseout="this.style.transform='translate(0,0)';this.style.boxShadow='4px 4px 0px #000'" onmousedown="this.style.transform='translate(4px,4px)';this.style.boxShadow='0px 0px 0px #000'" onmouseup="this.style.transform='translate(-2px,-2px)';this.style.boxShadow='6px 6px 0px #000'">Leave Site</button>
                    
                </div>
                
                <style>
                    @keyframes bio-breathe {
                        0% { width: 360px; height: 360px; box-shadow: 0px 0px 0px #000; border-width: 4px; }
                        50% { width: 540px; height: 540px; box-shadow: 24px 24px 0px #000; border-width: 12px; }
                        100% { width: 360px; height: 360px; box-shadow: 0px 0px 0px #000; border-width: 4px; }
                    }
                </style>
            `;

            document.documentElement.appendChild(overlay);

            const textEl = overlay.querySelector('#bio-breathe-text');
            const leaveBtn = overlay.querySelector('#bio-leave-btn');
            
            leaveBtn.onclick = () => { history.back(); window.close(); };
            
            setTimeout(() => { textEl.style.opacity = '1'; }, 100);

            let cycle = 1;
            const interval = setInterval(() => {
                textEl.style.opacity = '0';
                setTimeout(() => {
                    textEl.innerText = lines[cycle % lines.length];
                    textEl.style.opacity = '1';
                    cycle++;
                }, 800);
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
                border-radius: 4px !important;
                background: #ffffff !important; 
                border: 2px solid #000000 !important;
                color: #000000 !important;
                font-family: 'Inter', system-ui, sans-serif !important;
                font-size: 13px !important;
                font-weight: 800 !important;
                cursor: pointer !important;
                z-index: 2147483647 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                box-shadow: 4px 4px 0px #000000 !important;
                min-width: 80px !important;
                transition: transform 0.1s !important;
            `;
            
            this.pill.onmouseover = () => { this.pill.style.transform = 'translate(-2px, -2px)'; this.pill.style.boxShadow = '6px 6px 0px #000000'; };
            this.pill.onmouseout = () => { this.pill.style.transform = 'translate(0, 0)'; this.pill.style.boxShadow = '4px 4px 0px #000000'; };
            this.pill.onmousedown = () => { this.pill.style.transform = 'translate(4px, 4px)'; this.pill.style.boxShadow = '0px 0px 0px #000000'; };
            this.pill.onmouseup = () => { this.pill.style.transform = 'translate(-2px, -2px)'; this.pill.style.boxShadow = '6px 6px 0px #000000'; };
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
                background: 'rgba(244, 244, 240, 0.95)',
                backgroundImage: 'radial-gradient(#d1d1d1 1px, transparent 0)',
                backgroundSize: '10px 10px',
                zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexDirection: 'column'
            });
            
            const card = document.createElement('div');
            Object.assign(card.style, {
                background: '#ffffff', padding: '60px 40px', borderRadius: '4px',
                border: '2px solid #000000', width: '480px', textAlign: 'center',
                boxShadow: '8px 8px 0px #000000', color: '#000000', fontFamily: "'Inter', system-ui, sans-serif"
            });

            card.innerHTML = `
                <div style="font-size:64px; margin-bottom:24px; line-height:1; animation: float 3s ease-in-out infinite;">💀</div>
                <h3 style="margin:0 0 12px 0; color:#000000; font-size:13px; text-transform:uppercase; letter-spacing:3px; font-weight:800;">Time Wasted</h3>
                <div style="font-size:60px; font-weight:800; color:#000000; margin:0 0 32px 0; line-height:1; font-variant-numeric: tabular-nums;">${this.formatTime(seconds)}</div>
                <div style="background:#ffffff; border-radius:4px; padding:24px; margin-bottom:32px; border:2px solid #000000; box-shadow: 4px 4px 0px #000000;">
                    ${this.getAIInsight(seconds).replace(/#E5E5EA|#F5F5F7/g, '#000000').replace(/#A1A1A6/g, '#555555')}
                </div>
                <button id="bio-go-work" style="
                    background: #ffffff; color: #000000; border: 2px solid #000000; width:100%;
                    padding: 20px 0; border-radius: 4px; font-size: 18px; font-weight: 800; cursor: pointer;
                    box-shadow: 4px 4px 0px #000000; transition: transform 0.1s, box-shadow 0.1s;
                " onmouseover="this.style.transform='translate(-2px,-2px)';this.style.boxShadow='6px 6px 0px #000000'" onmouseout="this.style.transform='translate(0,0)';this.style.boxShadow='4px 4px 0px #000000'" onmousedown="this.style.transform='translate(4px,4px)';this.style.boxShadow='0px 0px 0px #000000'" onmouseup="this.style.transform='translate(-2px,-2px)';this.style.boxShadow='6px 6px 0px #000000'">CLOSE TAB</button>
                <div id="bio-insight-close" style="
                    margin-top: 24px; color: #555555; font-size: 13px; font-weight: 700; cursor: pointer;
                    transition: 0.1s; text-decoration: underline; opacity: 1;
                " onmouseover="this.style.color='#000'" onmouseout="this.style.color='#555'">I give up, back to doomscrolling</div>
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

    const Monitor = new SessionMonitor();
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "trigger_reality_check") {
            Monitor.showRealityCheck();
        }
    });

    window.addEventListener('bio:settings-update', (e) => {
        PREFS = e.detail;
        if (ENV.IG) Monitor.toggle(PREFS.igTimeMonitor);
    });
    
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.bio_pro_settings) {
            PREFS = { ...DEFAULTS, ...changes.bio_pro_settings.newValue };
            window.dispatchEvent(new CustomEvent('bio:settings-update', { detail: PREFS }));
        }
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
        }
    });

})();