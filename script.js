/* 
   Pushan Paul - Professional Portfolio Redesign
   Core JavaScript Engine (Canvas particles, translation dictionary, morphing cursor, DOM filtering)
*/

// --- Safe Storage Wrapper (Prevents SecurityError when loaded via file:/// protocol) ---
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("localStorage is disabled or unavailable:", e);
            return null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("localStorage is disabled or unavailable:", e);
        }
    }
};

// --- Global Language State ---
let currentLang = safeStorage.getItem('portfolio-lang') || 'en';
if (currentLang !== 'en' && currentLang !== 'ja') {
    currentLang = 'en';
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Interactive Canvas Background ---
    initCanvasParticles();



    // --- Translation Engine ---
    initTranslation();

    // --- Project DOM Filter ---
    initProjectFilters();

    // --- Copy Email Clipboard Hub ---
    initEmailCopier();

    // --- Mobile Navigation Overlay ---
    initMobileNav();

    // --- Scroll-Linked Reveal Animations ---
    initScrollReveal();
});

/* ==========================================================================
   1. Interactive Canvas Particles
   ========================================================================== */
function initCanvasParticles() {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particlesArray = [];
    let mouse = {
        x: null,
        y: null,
        radius: 120 // Connect particles to mouse within this radius
    };

    // Responsive sizing
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Adjust particle density based on device
        initParticles();
    }

    window.addEventListener('resize', resizeCanvas);
    
    // Mouse interaction tracking
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Particle Blueprints
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        // Render particle
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Update positions and boundary collision
        update() {
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Move particle
            this.x += this.directionX;
            this.y += this.directionY;

            // Mouse interaction push/pull effect (subtle magnetic repel)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    // Push particles away slightly
                    let force = (mouse.radius - distance) / mouse.radius;
                    let forceX = (dx / distance) * force * 1.2;
                    let forceY = (dy / distance) * force * 1.2;
                    this.x -= forceX;
                    this.y -= forceY;
                }
            }

            this.draw();
        }
    }

    // Populate particles
    function initParticles() {
        particlesArray = [];
        // Fewer particles on mobile for high scroll frame-rates
        const isMobile = window.innerWidth < 768;
        const numberOfParticles = isMobile ? 35 : 90;
        
        const colors = [
            'rgba(0, 242, 254, 0.25)', // Cyan
            'rgba(157, 78, 221, 0.20)', // Purple
            'rgba(0, 112, 243, 0.15)'   // Blue
        ];

        for (let i = 0; i < numberOfParticles; i++) {
            let size = Math.random() * 2.5 + 1; // 1px to 3.5px
            let x = Math.random() * (canvas.width - size * 2) + size;
            let y = Math.random() * (canvas.height - size * 2) + size;
            let directionX = (Math.random() * 0.4) - 0.2; // slow drift
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = colors[Math.floor(Math.random() * colors.length)];

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Draw connecting webs
    function connect() {
        let opacityValue = 1;
        const maxDist = window.innerWidth < 768 ? 65 : 95;

        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDist) {
                    opacityValue = 1 - (distance / maxDist);
                    ctx.strokeStyle = `rgba(0, 242, 254, ${opacityValue * 0.08})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }

            // Draw line to mouse
            if (mouse.x !== null && mouse.y !== null) {
                let dx = particlesArray[a].x - mouse.x;
                let dy = particlesArray[a].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    opacityValue = 1 - (distance / mouse.radius);
                    ctx.strokeStyle = `rgba(0, 242, 254, ${opacityValue * 0.12})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    }

    // Game loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
        requestAnimationFrame(animate);
    }

    resizeCanvas();
    animate();
}



/* ==========================================================================
   3. Translation Engine & Dictionary
   ========================================================================== */
const dictionary = {
    en: {
        "nav-about": "About",
        "nav-skills": "Skills",
        "nav-experience": "Journey",
        "nav-projects": "Projects",
        "nav-contact": "Contact",
        
        "hero-subtitle": "Engineered for Excellence",
        "hero-title": "Pushan Paul",
        "hero-desc": "A dedicated Software Engineer in Tokyo crafting enterprise-scale Angular & Spring Boot architectures. Bridging structural stability with cutting-edge user interfaces.",
        "hero-cta-contact": "Get in Touch",
        "hero-cta-projects": "Explore Work",
        "hero-location": "Tokyo, Japan",
        
        "about-title": "About <span>Me</span>",
        "about-hello": "Hello, I'm <span>Pushan Paul</span>",
        "about-bio-1": "I am a dedicated software engineer with a deep passion for solving complex, high-stakes architectural problems. My core specialization lies in building fluid frontend interfaces using Angular, combined with constructing highly stable, secured backend pipelines using Java Spring Boot.",
        "about-bio-2": "Based in Tokyo, I thrive in collaborative environments that demand high technical standards and rapid learning cycles. Whether building cross-platform architectures, writing robust systems, or lecturing future engineers, I commit fully to technical clean-code principles and dynamic user experiences.",
        "cv-btn": "CV",
        "stat-exp-num": "1+",
        "stat-exp-lbl": "Years Exp in Japan",
        "stat-proj-num": "10+",
        "stat-proj-lbl": "Projects Completed",
        "stat-clients-num": "100%",
        "stat-clients-lbl": "Client Satisfaction",
        
        "skills-title": "Skills & <span>Expertise</span>",
        "skills-core": "Core Architecture Stack",
        "skills-secondary": "Technical Versatility & Languages",
        
        "journey-title": "My <span>Journey</span>",
        "journey-exp-1-time": "Apr 2025 - Present",
        "journey-exp-1-role": "Software Engineer",
        "journey-exp-1-comp": "MASS Holdings Ltd.",
        "journey-exp-1-desc": "Designing enterprise-grade web applications utilizing Angular frontend and robust Java microservices in Tokyo, focusing on code stability, clean APIs, and optimized client delivery.",
        
        "journey-exp-2-time": "Dec 2024 - Mar 2025",
        "journey-exp-2-role": "Lecturer in CSE",
        "journey-exp-2-comp": "East Delta University",
        "journey-exp-2-desc": "Instructed undergraduate classes in core Computer Science & Engineering, mentoring students in algorithms, data structures, and object-oriented architectures.",
        
        "journey-exp-3-time": "Jun 2024 - Dec 2024",
        "journey-exp-3-role": "Trainee",
        "journey-exp-3-comp": "B-JET Program",
        "journey-exp-3-desc": "Intensive preparation program focused on professional Japanese business culture, language competence, and collaborative development frameworks.",
        
        "journey-exp-4-time": "Graduated 2024",
        "journey-exp-4-role": "BSc. in Computer Science & Engineering",
        "journey-exp-4-comp": "Khulna University of Engineering & Technology (KUET)",
        "journey-exp-4-desc": "Completed a comprehensive curriculum centered on systems programming, algorithmic foundations, database design, and software engineering methodologies.",
        
        "journey-exp-5-time": "Completed 2018",
        "journey-exp-5-role": "H.S.C. Science",
        "journey-exp-5-comp": "Notre Dame College",
        "journey-exp-5-desc": "Elite scientific high school program specializing in advanced mathematics, physics, and software fundamentals.",
        
        "projects-title": "Featured <span>Projects</span>",
        "filter-all": "All Solutions",
        "filter-games": "Games & AI",
        "filter-mobile": "Mobile SDK",
        "filter-systems": "Systems / Web",
        
        "proj-quest-title": "City Quest 3D Game",
        "proj-quest-desc": "A fully immersive, responsive 3D quest navigation environment built natively with OpenGL 3.3 and C++ framework.",
        "proj-quest-tag-1": "OpenGL 3.3",
        "proj-quest-tag-2": "C++",
        "proj-quest-tag-3": "Game Engine",
        
        "proj-ai-title": "Adversarial Game Engine",
        "proj-ai-desc": "An intelligent game engine leveraging highly optimized Min-Max and Alpha-Beta Pruning algorithms for strategic decision trees.",
        "proj-ai-tag-1": "AI Engine",
        "proj-ai-tag-2": "Algorithms",
        "proj-ai-tag-3": "Data Trees",
        
        "proj-cardiac-title": "Android Cardiac Recorder",
        "proj-cardiac-desc": "A life-monitoring mobile medical utility designed to record, chart, and alert patients on cardiac activity variations.",
        "proj-cardiac-tag-1": "Android SDK",
        "proj-cardiac-tag-2": "Java Mobile",
        "proj-cardiac-tag-3": "Health Tech",
        
        "proj-arduino-title": "RFID Secure Door Lock",
        "proj-arduino-desc": "A hardware-integrated safety lock featuring automated keypad inputs and RFID card scanners programmed via Arduino.",
        "proj-arduino-tag-1": "Arduino C",
        "proj-arduino-tag-2": "IoT Security",
        "proj-arduino-tag-3": "Hardware",
        
        "proj-db-title": "University Database System",
        "proj-db-desc": "An optimized relational database model organizing academic records, course structures, and secure query access.",
        "proj-db-tag-1": "MySQL",
        "proj-db-tag-2": "Relational DB",
        "proj-db-tag-3": "SQL API",
        
        "proj-super-title": "ASP.NET Supermarket Hub",
        "proj-super-desc": "An enterprise inventory controller and point-of-sale database system tailored for supermarket networks.",
        "proj-super-tag-1": "ASP.NET",
        "proj-super-tag-2": "C# Core",
        "proj-super-tag-3": "Enterprise ERP",
        
        "proj-vehicle-title": "Android Vehicle Tracker",
        "proj-vehicle-desc": "A coordinate-mapping location tracker built for fleet operations, recording routes in real-time.",
        "proj-vehicle-tag-1": "Android SDK",
        "proj-vehicle-tag-2": "Google Maps API",
        "proj-vehicle-tag-3": "GPS Tracking",
        
        "proj-source-code": "Source Code",
        
        "contact-title": "Let's Build <span>Together</span>",
        "contact-subtitle": "Partner For Success",
        "contact-card-title": "Have a project or opportunity?",
        "contact-desc": "I am open to corporate contracts, consultant collaborations, and international development challenges. Let's engineer your solution.",
        "copy-email": "Copy Email",
        "email-copied": "Email copied to clipboard!",
        
        "footer-desc": "Bilingual Software Engineer based in Tokyo, Japan. Delivering exceptional, high-availability architecture.",
        "footer-meta": "Designed with"
    },
    ja: {
        "nav-about": "自己紹介",
        "nav-skills": "スキル",
        "nav-experience": "経歴",
        "nav-projects": "プロジェクト",
        "nav-contact": "連絡先",
        
        "hero-subtitle": "卓越性をエンジニアリングする",
        "hero-title": "パルプション",
        "hero-desc": "東京を拠点とし、企業規模のAngularおよびSpring Boot設計を手がける専任のソフトウェアエンジニア。構造的安定性と最先端のUIを融合します。",
        "hero-cta-contact": "お問い合わせ",
        "hero-cta-projects": "実績を見る",
        "hero-location": "東京、日本",
        
        "about-title": "自己<span>紹介</span>",
        "about-hello": "こんにちは、<span>パルプション</span>です",
        "about-bio-1": "私は、複雑で重要度の高いシステムの設計課題を解決することに深い情熱を持つ、献身的なソフトウェアエンジニアです。Angularによる滑らかでモダンなフロントエンド構築と、Java Spring Bootを駆使した非常に強固でセキュアなバックエンドパイプライン開発を専門としています。",
        "about-bio-2": "現在東京を拠点として活動しており、高い技術水準と迅速な学習サイクルを必要とするコラボレーティブな環境で能力を発揮します。クロスプラットフォーム設計の構築から、堅牢なシステム開発、あるいは将来のエンジニアの育成に至るまで、常にクリーンコードの原則とダイナミックなユーザー体験の提供を保証します。",
        "cv-btn": "履歴書",
        "stat-exp-num": "1年以上",
        "stat-exp-lbl": "日本での開発実績",
        "stat-proj-num": "10以上",
        "stat-proj-lbl": "プロジェクト完了数",
        "stat-clients-num": "100%",
        "stat-clients-lbl": "顧客満足度",
        
        "skills-title": "技術的な<span>スキル</span>",
        "skills-core": "主要なアーキテクチャスタック",
        "skills-secondary": "多様な技術スキル・開発言語",
        
        "journey-title": "私の<span>歩み</span>",
        "journey-exp-1-time": "2025年4月 - 現在",
        "journey-exp-1-role": "ソフトウェアエンジニア",
        "journey-exp-1-comp": "株式会社MASSホールディングス",
        "journey-exp-1-desc": "東京にて、Angularフロントエンドと堅牢なJavaマイクロサービスを利用したエンタープライズWebアプリケーションを設計。コードの安定性、クリーンなAPI、最適化された顧客納品を追求。",
        
        "journey-exp-2-time": "2024年12月 - 2025年3月",
        "journey-exp-2-role": "CSE講師",
        "journey-exp-2-comp": "イーストデルタ大学",
        "journey-exp-2-desc": "学部生に向けて主要なコンピューターサイエンス＆工学の授業を担当し、アルゴリズム、データ構造、オブジェクト指向アーキテクチャの教育・指導を実施。",
        
        "journey-exp-3-time": "2024年6月 - 2024年12月",
        "journey-exp-3-role": "研修生",
        "journey-exp-3-comp": "B-JETプログラム",
        "journey-exp-3-desc": "日本のビジネス文化、高度な日本語能力、および共同開発フレームワークに特化した集中トレーニングを受講。",
        
        "journey-exp-4-time": "2024年 卒業",
        "journey-exp-4-role": "コンピュータサイエンス・工学学士号",
        "journey-exp-4-comp": "クルナ工科大学 (KUET)",
        "journey-exp-4-desc": "システムプログラミング、アルゴリズムの基礎、データベース設計、ソフトウェア工学手法を中心とした総合的なカリキュラムを修了。",
        
        "journey-exp-5-time": "2018年 修了",
        "journey-exp-5-role": "高等中等教育 (理系専攻)",
        "journey-exp-5-comp": "ノートルダム・カレッジ",
        "journey-exp-5-desc": "高等数学、物理学、およびソフトウェア基礎を専門とするエリート科学高校プログラム。",
        
        "projects-title": "注目の<span>プロジェクト</span>",
        "filter-all": "すべての開発",
        "filter-games": "ゲーム・AI",
        "filter-mobile": "モバイルSDK",
        "filter-systems": "システム・Web",
        
        "proj-quest-title": "シティクエスト3Dゲーム",
        "proj-quest-desc": "OpenGL 3.3およびC++ネイティブフレームワークで構築された、完全に没入型で高感度な3D探索型ナビゲーションゲーム。",
        "proj-quest-tag-1": "OpenGL 3.3",
        "proj-quest-tag-2": "C++",
        "proj-quest-tag-3": "ゲームエンジン",
        
        "proj-ai-title": "対戦型AIゲームエンジン",
        "proj-ai-desc": "戦略的な意思決定ツリーのために高度に最適化されたミニマックス法とアルファベータ法を用いたAIゲームエンジン。",
        "proj-ai-tag-1": "AIエンジン",
        "proj-ai-tag-2": "アルゴリズム",
        "proj-ai-tag-3": "データ木構造",
        
        "proj-cardiac-title": "Android心臓モニター",
        "proj-cardiac-desc": "心活動の変動を記録、グラフ化し、異常値を患者に通知するために開発されたモバイル医療ユーティリティツール。",
        "proj-cardiac-tag-1": "Android SDK",
        "proj-cardiac-tag-2": "Javaモバイル",
        "proj-cardiac-tag-3": "ヘルスケア技術",
        
        "proj-arduino-title": "RFIDセキュア電子ロック",
        "proj-arduino-desc": "Arduinoを介してプログラムされた、自動キーパッド入力とRFIDカードスキャナーを組み込んだIoTハードウェア防犯ロックシステム。",
        "proj-arduino-tag-1": "Arduino C",
        "proj-arduino-tag-2": "IoTセキュリティ",
        "proj-arduino-tag-3": "ハードウェア",
        
        "proj-db-title": "大学情報データベースシステム",
        "proj-db-desc": "学籍データ、講義カリキュラム、および安全な検索クエリ処理を効率的に一括管理する最適化されたリレーショナルDB設計。",
        "proj-db-tag-1": "MySQL",
        "proj-db-tag-2": "リレーショナルDB",
        "proj-db-tag-3": "SQL API",
        
        "proj-super-title": "ASP.NET店舗棚卸管理システム",
        "proj-super-desc": "大規模スーパーマーケットネットワーク向けにカスタマイズされた、エンタープライズ在庫管理およびPOS決済DBシステム。",
        "proj-super-tag-1": "ASP.NET",
        "proj-super-tag-2": "C# Core",
        "proj-super-tag-3": "統合ERP",
        
        "proj-vehicle-title": "Android車両追跡追跡アプリ",
        "proj-vehicle-desc": "運行管理に特化し、複数の移動ルートをリアルタイムで測位して記録するGPS座標マッピングトラッカー。",
        "proj-vehicle-tag-1": "Android SDK",
        "proj-vehicle-tag-2": "Google Maps API",
        "proj-vehicle-tag-3": "GPS追跡",
        
        "proj-source-code": "ソースコード",
        
        "contact-title": "一緒に<span>創りましょう</span>",
        "contact-subtitle": "ビジネスの成功を牽引",
        "contact-card-title": "プロジェクトや協力機会をお探しですか？",
        "contact-desc": "企業間契約、設計コンサルティング、および国際的な共同開発のお問い合わせを歓迎します。今すぐ最適なソリューションを作りましょう。",
        "copy-email": "アドレスをコピー",
        "email-copied": "メールアドレスをコピーしました！",
        
        "footer-desc": "東京を拠点とする日英バイリンガルのソフトウェアエンジニア。高可用性で卓越したアーキテクチャを提供。",
        "footer-meta": "制作協力"
    }
};

function initTranslation() {
    const toggle = document.getElementById('language-toggle');
    const labelEn = document.getElementById('label-en');
    const labelJa = document.getElementById('label-ja');

    if (!toggle) return;

    // Apply language update
    function applyLanguage(lang) {
        currentLang = lang;
        safeStorage.setItem('portfolio-lang', lang);
        document.documentElement.setAttribute('lang', lang);

        // Update active switch classes
        if (lang === 'ja') {
            toggle.checked = true;
            labelJa?.classList.add('active');
            labelEn?.classList.remove('active');
        } else {
            toggle.checked = false;
            labelEn?.classList.add('active');
            labelJa?.classList.remove('active');
        }

        // Loop over components with translation IDs
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dictionary[lang][key]) {
                el.innerHTML = dictionary[lang][key];
            }
        });

        // Dynamic CV button update based on active language
        const cvBtn = document.getElementById('dynamic-cv-btn');
        if (cvBtn) {
            if (lang === 'ja') {
                cvBtn.setAttribute('href', 'cv-ja.html');
            } else {
                cvBtn.setAttribute('href', 'cv-en.html');
            }
        }

        // Trigger typing effect again when language changes (Hero only)
        restartTypingEffect(lang);
    }

    // Toggle click event
    toggle.addEventListener('change', (e) => {
        applyLanguage(e.target.checked ? 'ja' : 'en');
    });

    // Run initial apply
    applyLanguage(currentLang);
}

// Hero typing animation config
let typingTimeout = null;
const phrases = {
    en: [
        "Software Engineer at Mass Holdings",
        "Angular Frontend Specialist",
        "Java Spring Boot Backend Expert"
    ],
    ja: [
        "MASSホールディングス開発エンジニア",
        "Angular フロントエンド設計のプロ",
        "Java Spring Boot バックエンド開発"
    ]
};

function restartTypingEffect(lang) {
    if (typingTimeout) clearTimeout(typingTimeout);
    
    const typedTextEl = document.querySelector('.typed-text');
    if (!typedTextEl) return;

    typedTextEl.textContent = '';
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentPhrases = phrases[lang];
        const currentPhrase = currentPhrases[phraseIndex];

        if (isDeleting) {
            typedTextEl.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typedTextEl.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
        }

        let typingSpeed = isDeleting ? 30 : 60;

        if (!isDeleting && charIndex === currentPhrase.length) {
            // Wait at the end of the phrase
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % currentPhrases.length;
            // Short delay before typing next phrase
            typingSpeed = 500;
        }

        typingTimeout = setTimeout(type, typingSpeed);
    }

    type();
}

/* ==========================================================================
   4. DOM Project Filters
   ========================================================================== */
function initProjectFilters() {
    const filters = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card-wrapper');

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            filters.forEach(f => f.classList.remove('active'));
            // Add active to current
            btn.classList.add('active');

            const category = btn.getAttribute('data-filter');

            cards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                
                if (category === 'all' || cardCat === category) {
                    card.classList.remove('hide');
                } else {
                    card.classList.add('hide');
                }
            });
        });
    });
}

/* ==========================================================================
   5. Email Copier Hub (Toast notifications)
   ========================================================================== */
function initEmailCopier() {
    const copyBtn = document.getElementById('copy-email-btn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', () => {
        const email = 'pushanweb@gmail.com';
        
        navigator.clipboard.writeText(email).then(() => {
            // Create toast if it doesn't exist
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }

            const message = dictionary[currentLang]["email-copied"] || "Email copied to clipboard!";
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = `<i class="ri-checkbox-circle-line"></i><span>${message}</span>`;
            container.appendChild(toast);

            // Trigger reflow/animation
            setTimeout(() => toast.classList.add('show'), 10);

            // Remove toast after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 2600);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
}

/* ==========================================================================
   6. Mobile Navigation overlay
   ========================================================================== */
function initMobileNav() {
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    if (!menuBtn || !navLinks) return;

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('open');
        navLinks.classList.toggle('open');
    });

    // Close when link clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('open');
            navLinks.classList.remove('open');
        });
    });
}

/* ==========================================================================
   7. Scroll-Linked Reveal Animations
   ========================================================================== */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const header = document.querySelector('header');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section');

    function checkReveals() {
        const triggerBottom = window.innerHeight * 0.85;

        // Reveal elements on scroll
        reveals.forEach(el => {
            const elTop = el.getBoundingClientRect().top;
            if (elTop < triggerBottom) {
                el.classList.add('active');
            }
        });

        // Sticky Header scroll styling
        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }

        // Active link in navigation switcher
        let currentSectionId = '';
        sections.forEach(sec => {
            const secTop = sec.offsetTop - 150;
            const secHeight = sec.offsetHeight;
            if (window.scrollY >= secTop && window.scrollY < secTop + secHeight) {
                currentSectionId = sec.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', checkReveals);
    // Initial run
    checkReveals();
}
