// ===== 三国杀 1v1 游戏引擎 =====

const Game = {
    // ===== 游戏状态 =====
    selectedHeroId: null,
    selectedFaction: FACTION.SHU,
    players: [],
    deck: [],
    discardPile: [],
    currentPlayer: 0, // 0=玩家, 1=AI
    phase: 'select',
    gameOver: false,
    hasSlashedThisTurn: false,
    hasUsedKurouThisTurn: false,
    hasUsedZhihengThisTurn: false,
    hasUsedLijianThisTurn: false,
    hasUsedFanjianThisTurn: false,
    hasUsedQingnangThisTurn: false,
    hasUsedJieyinThisTurn: false,
    hasUsedGuanxingThisTurn: false,
    fanjianMode: false,
    fanjianResolver: null,
    fanjianTargetIdx: -1,
    qingnangMode: false,
    qingnangResolver: null,
    jieyinMode: false,
    jieyinCards: [],
    jieyinResolver: null,
    guanxingMode: false,
    guanxingResolver: null,
    liuliMode: false,
    liuliResolver: null,
    responseResolver: null,
    responseMode: null, // 'dodge', 'duel', 'nanman', 'wanjian', 'peach', 'rende'
    responseSelectedCards: [],
    responseNeedCount: 1,
    aiRunning: false,
    ganglieDiscard: false,
    ganglieDiscardResolver: null,
    processing: false,
    ttsEnabled: true,
    bgmEnabled: true,
    bgmAudio: null,
    bgmVolume: 0.4,
    ttsVolume: 0.8,
    currentBgIndex: -1,  // -1 表示默认背景
    bgList: [],
    lastVoiceTime: 0,
    _speechQueue: [],
    _speaking: false,
    
    // ===== 初始化 =====
    init() {
        this.renderHeroList();
        this.setupEventListeners();
        
        // 预加载语音列表（部分浏览器需要异步加载）
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    },

    setupEventListeners() {
        document.getElementById('confirm-hero').addEventListener('click', () => {
            if (this.selectedHeroId) this.startGame();
        });
        document.getElementById('response-cancel').addEventListener('click', () => {
            this.cancelResponse();
        });
        document.getElementById('skill-cancel').addEventListener('click', () => {
            this.cancelSkill();
        });
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
        
        // 音频控制事件监听
        this.setupAudioControls();
    },
    
    setupAudioControls() {
        const bgmToggle = document.getElementById('bgm-toggle');
        const ttsToggle = document.getElementById('tts-toggle');
        const bgmVolume = document.getElementById('bgm-volume');
        const ttsVolume = document.getElementById('tts-volume');
        
        if (bgmToggle) {
            bgmToggle.addEventListener('click', () => {
                this.toggleBGM();
                this.updateAudioControlUI();
            });
        }
        
        if (ttsToggle) {
            ttsToggle.addEventListener('click', () => {
                this.ttsEnabled = !this.ttsEnabled;
                if (!this.ttsEnabled && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
                this.updateAudioControlUI();
            });
        }
        
        if (bgmVolume) {
            bgmVolume.addEventListener('input', (e) => {
                this.bgmVolume = parseInt(e.target.value) / 100;
                if (this.bgmAudio) {
                    this.bgmAudio.volume = this.bgmVolume;
                }
            });
        }
        
        if (ttsVolume) {
            ttsVolume.addEventListener('input', (e) => {
                this.ttsVolume = parseInt(e.target.value) / 100;
            });
        }
        
        this.updateAudioControlUI();
        
        // 背景选择事件
        const bgToggle = document.getElementById('bg-toggle');
        const bgPanelClose = document.getElementById('bg-panel-close');
        
        if (bgToggle) {
            bgToggle.addEventListener('click', () => {
                this.toggleBgPanel();
            });
        }
        
        if (bgPanelClose) {
            bgPanelClose.addEventListener('click', () => {
                this.toggleBgPanel();
            });
        }
        
        // 日志样式设置
        this.logBgColor = 'black'; // 默认黑色背景
        this.logOpacity = 30; // 默认透明度30%
        this.initLogStylePanel();
        
        // 初始化背景列表
        this.initBackgroundList();
    },
    
    initLogStylePanel() {
        const logStyleToggle = document.getElementById('log-style-toggle');
        const logStylePanel = document.getElementById('log-style-panel');
        const logStyleClose = document.getElementById('log-style-close');
        const logOpacitySlider = document.getElementById('log-opacity-slider');
        const logOpacityValue = document.getElementById('log-opacity-value');
        
        // 打开/关闭面板
        if (logStyleToggle) {
            logStyleToggle.addEventListener('click', () => {
                logStylePanel.classList.toggle('hidden');
            });
        }
        
        if (logStyleClose) {
            logStyleClose.addEventListener('click', () => {
                logStylePanel.classList.add('hidden');
            });
        }
        
        // 颜色预设选择
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
                e.target.classList.add('selected');
                this.logBgColor = e.target.dataset.color;
                this.updateLogStyle();
            });
        });
        
        // 默认选中黑色
        const defaultColor = document.querySelector('.color-preset[data-color="black"]');
        if (defaultColor) defaultColor.classList.add('selected');
        
        // 透明度滑块
        if (logOpacitySlider) {
            logOpacitySlider.addEventListener('input', (e) => {
                this.logOpacity = parseInt(e.target.value);
                if (logOpacityValue) {
                    logOpacityValue.textContent = this.logOpacity + '%';
                }
                this.updateLogStyle();
            });
        }
        
        // 初始化时应用默认样式
        this.updateLogStyle();
    },
    
    updateLogStyle() {
        const battleLog = document.getElementById('battle-log');
        if (!battleLog) return;
        
        // 确保日志样式立即生效（无需先选择背景图）
        battleLog.classList.add('with-bg');
        
        // 颜色映射
        const colorMap = {
            'black': '0, 0, 0',
            'darkblue': '26, 26, 46',
            'darkgreen': '26, 46, 26',
            'darkred': '46, 26, 26',
            'darkpurple': '46, 26, 46'
        };
        
        const rgb = colorMap[this.logBgColor] || '0, 0, 0';
        const opacity = this.logOpacity / 100;
        
        // 设置CSS变量
        battleLog.style.setProperty('--log-bg-color', rgb);
        battleLog.style.setProperty('--log-opacity', opacity);
    },
    
    updateAudioControlUI() {
        const bgmToggle = document.getElementById('bgm-toggle');
        const ttsToggle = document.getElementById('tts-toggle');
        
        if (bgmToggle) {
            bgmToggle.textContent = this.bgmEnabled ? '🎵' : '🎵';
            bgmToggle.classList.toggle('active', this.bgmEnabled);
            bgmToggle.style.opacity = this.bgmEnabled ? '1' : '0.5';
        }
        
        if (ttsToggle) {
            ttsToggle.textContent = this.ttsEnabled ? '🔊' : '🔇';
            ttsToggle.classList.toggle('active', this.ttsEnabled);
            ttsToggle.style.opacity = this.ttsEnabled ? '1' : '0.5';
        }
    },
    
    // ===== 背景选择 =====
    initBackgroundList() {
        // 背景图片列表 (bg0.png ~ bg17.png)
        this.bgList = [];
        for (let i = 0; i <= 17; i++) {
            this.bgList.push(`img/background/bg${i}.png`);
        }
        
        // 动态视频背景列表 (dtbg folder)
        this.videoBgList = [
            { name: '动态1', path: 'img/dtbg/dtbg1.mp4' },
            { name: '动态2', path: 'img/dtbg/dtbg2.mp4' },
            { name: '动态3', path: 'img/dtbg/dbtbg3.mp4' }
        ];
        
        // 渲染背景网格
        const grid = document.getElementById('bg-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // 添加"默认背景"选项
        const defaultItem = this.createBgItem(-1, '默认');
        grid.appendChild(defaultItem);
        
        // 添加所有背景图
        this.bgList.forEach((bg, index) => {
            const item = this.createBgItem(index, `背景${index + 1}`, bg);
            grid.appendChild(item);
        });
        
        // 添加视频背景
        this.videoBgList.forEach((video, index) => {
            const item = this.createVideoBgItem(index, video.name, video.path);
            grid.appendChild(item);
        });
    },
    
    createBgItem(index, label, imgUrl = null) {
        const item = document.createElement('div');
        item.className = 'bg-item' + (this.currentBgIndex === index ? ' selected' : '');
        item.dataset.bgIndex = index;
        
        if (imgUrl) {
            item.style.backgroundImage = `url('${imgUrl}')`;
            item.style.backgroundSize = 'cover';
            item.style.backgroundPosition = 'center';
        } else {
            item.style.background = 'linear-gradient(135deg, #1a3a1a 0%, #0d1f0d 50%, #1a3a1a 100%)';
            item.innerHTML = '<span class="bg-item-label">默认</span>';
        }
        
        item.addEventListener('click', () => {
            this.selectBackground(index);
        });
        
        return item;
    },
    
    createVideoBgItem(index, name, videoPath) {
        const item = document.createElement('div');
        const videoIndex = 1000 + index; // 视频背景索引从1000开始，避免与图片冲突
        item.className = 'bg-item' + (this.currentBgIndex === videoIndex ? ' selected' : '');
        item.dataset.bgIndex = videoIndex;
        item.dataset.isVideo = 'true';
        item.dataset.videoPath = videoPath;
        
        // 视频预览（第一帧）
        item.style.background = '#1a1a2e';
        item.innerHTML = `
            <span class="bg-item-label" style="color: #88ccff;">🎬 ${name}</span>
            <div style="position: absolute; bottom: 4px; right: 4px; font-size: 10px; color: #888;">MP4</div>
        `;
        
        item.addEventListener('click', () => {
            this.selectVideoBackground(index, videoPath);
        });
        
        return item;
    },
    
    selectBackground(index) {
        this.currentBgIndex = index;
        const gameScreen = document.getElementById('game-screen');
        const battleLog = document.getElementById('battle-log');
        
        // 移除视频背景（如果有）
        this.removeVideoBackground();
        
        if (index === -1) {
            // 默认背景
            gameScreen.style.backgroundImage = '';
            gameScreen.style.background = 'linear-gradient(180deg, #1a3a1a 0%, #0d1f0d 50%, #1a3a1a 100%)';
            // 无背景时，隐藏留言区背景框
            if (battleLog) {
                battleLog.classList.remove('with-bg');
            }
        } else {
            // 选择背景图
            gameScreen.style.backgroundImage = `url('${this.bgList[index]}')`;
            gameScreen.style.backgroundSize = 'cover';
            gameScreen.style.backgroundPosition = 'center';
            gameScreen.style.backgroundRepeat = 'no-repeat';
            // 有背景时，显示留言区背景框，并应用当前样式设置
            if (battleLog) {
                battleLog.classList.add('with-bg');
                this.updateLogStyle();
            }
        }
        
        // 更新选中状态
        document.querySelectorAll('.bg-item').forEach(item => {
            item.classList.toggle('selected', parseInt(item.dataset.bgIndex) === index);
        });
        
        // 关闭面板
        this.toggleBgPanel();
    },
    
    selectVideoBackground(videoIndex, videoPath) {
        const videoBgIndex = 1000 + videoIndex;
        this.currentBgIndex = videoBgIndex;
        const gameScreen = document.getElementById('game-screen');
        const battleLog = document.getElementById('battle-log');
        
        // 清除普通背景设置
        gameScreen.style.backgroundImage = '';
        gameScreen.style.background = 'transparent';
        
        // 移除旧的视频背景
        this.removeVideoBackground();
        
        // 创建视频元素
        const video = document.createElement('video');
        video.id = 'bg-video';
        video.src = videoPath;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        // iOS Safari 需要这些属性
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-player-fullscreen', 'false');
        video.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: -1;
            pointer-events: none;
        `;
        
        document.body.insertBefore(video, document.body.firstChild);
        
        // iOS 需要手动播放
        const playVideo = () => {
            video.play().catch(e => {
                console.log('视频自动播放被阻止，等待用户交互');
            });
        };
        playVideo();
        
        // 监听视频加载完成
        video.addEventListener('loadedmetadata', () => {
            video.play().catch(() => {});
        });
        
        // 有背景时，显示留言区背景框，并应用当前样式设置
        if (battleLog) {
            battleLog.classList.add('with-bg');
            this.updateLogStyle();
        }
        
        // 更新选中状态
        document.querySelectorAll('.bg-item').forEach(item => {
            item.classList.toggle('selected', parseInt(item.dataset.bgIndex) === videoBgIndex);
        });
        
        // 关闭面板
        this.toggleBgPanel();
    },
    
    removeVideoBackground() {
        const oldVideo = document.getElementById('bg-video');
        if (oldVideo) {
            oldVideo.remove();
        }
    },
    
    toggleBgPanel() {
        const panel = document.getElementById('bg-panel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    },

    // ===== 武将选择 =====
    renderHeroList() {
        // 渲染势力Tab
        const tabsContainer = document.getElementById('faction-tabs');
        tabsContainer.innerHTML = '';
        const factions = [FACTION.SHU, FACTION.WEI, FACTION.WU, FACTION.QUN];
        factions.forEach(f => {
            const tab = document.createElement('div');
            tab.className = 'faction-tab' + (this.selectedFaction === f ? ' active' : '');
            tab.textContent = f;
            tab.style.borderColor = this.selectedFaction === f ? FACTION_COLOR[f] : '';
            tab.style.color = this.selectedFaction === f ? FACTION_COLOR[f] : '';
            tab.addEventListener('click', () => {
                this.selectedFaction = f;
                this.renderHeroList();
            });
            tabsContainer.appendChild(tab);
        });

        // 渲染当前势力的武将
        const container = document.getElementById('hero-list');
        container.innerHTML = '';
        const heroes = HEROES.filter(h => h.faction === this.selectedFaction);
        heroes.forEach(hero => {
            const card = document.createElement('div');
            card.className = 'hero-card';
            card.dataset.heroId = hero.id;
            if (this.selectedHeroId === hero.id) card.classList.add('selected');

            const factionColor = FACTION_COLOR[hero.faction];
            const roleClass = hero.role === ROLE.LORD ? 'lord' : 'minister';
            const roleIcon = hero.role === ROLE.LORD ? '👑' : '⚔';
            card.innerHTML = `
                <div class="hero-portrait" style="border-color:${factionColor}">
                    <img src="${hero.avatar}" alt="${hero.name}" class="hero-portrait-img" />
                    <span class="role-badge ${roleClass}" title="${hero.role}">${roleIcon}</span>
                </div>
                <div class="hero-card-name">${hero.name}</div>
                <div class="hero-card-title">${hero.title}</div>
                <div class="hero-card-faction">
                    <span class="role-tag ${roleClass}">${hero.role}</span>
                    ${'❤'.repeat(hero.maxHp)}
                </div>
            `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            this.selectedHeroId = hero.id;
            document.getElementById('confirm-hero').disabled = false;
        });
        // 双击直接开战
        card.addEventListener('dblclick', () => {
            this.selectedHeroId = hero.id;
            document.getElementById('confirm-hero').disabled = false;
            this.startGame();
        });
            // 浮动简介
            card.addEventListener('mouseenter', (e) => this.showHeroProfile(hero, e));
            card.addEventListener('mouseleave', () => this.hideHeroProfile());
            card.addEventListener('mousemove', (e) => this.moveHeroProfile(e));
            container.appendChild(card);
        });
    },

    // ===== 浮动人物简介 =====
    showHeroProfile(hero, e) {
        const profile = document.getElementById('hero-profile');
        const factionColor = FACTION_COLOR[hero.faction];
        const roleClass = hero.role === ROLE.LORD ? 'lord' : 'minister';
        const skillsHtml = hero.skills.map(s => `
            <div class="profile-skill">
                <span class="profile-skill-name">${s.name}</span>
                <span class="profile-skill-type">${s.type === 'active' ? '主动' : s.type === 'passive' ? '被动' : '触发'}</span>
                <p class="profile-skill-desc">${s.desc}</p>
            </div>
        `).join('');

        profile.innerHTML = `
            <div class="profile-header" style="background:linear-gradient(135deg,${factionColor},rgba(0,0,0,0.8))">
                <div class="profile-avatar" style="background:${factionColor}"><img src="${hero.avatar}" alt="${hero.name}" class="profile-avatar-img" /></div>
                <div class="profile-titles">
                    <div class="profile-name">${hero.name}</div>
                    <div class="profile-subtitle">${hero.title}</div>
                    <div class="profile-tags">
                        <span class="role-tag ${roleClass}">${hero.role}</span>
                        <span class="profile-faction" style="color:${factionColor}">${hero.faction}势力</span>
                        <span class="profile-hp">${'❤'.repeat(hero.maxHp)} ${hero.maxHp}血</span>
                    </div>
                </div>
            </div>
            <div class="profile-body">
                <p class="profile-bio">${hero.bio}</p>
                <div class="profile-skills">${skillsHtml}</div>
            </div>
        `;
        profile.classList.remove('hidden');
        this.moveHeroProfile(e);
    },

    moveHeroProfile(e) {
        const profile = document.getElementById('hero-profile');
        if (profile.classList.contains('hidden')) return;
        
        const pw = profile.offsetWidth;
        const ph = profile.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        let x = e.clientX + 20;
        let y = e.clientY + 10;
        
        if (x + pw > vw) x = e.clientX - pw - 20;
        if (y + ph > vh) y = vh - ph - 10;
        
        profile.style.left = x + 'px';
        profile.style.top = y + 'px';
    },

    hideHeroProfile() {
        document.getElementById('hero-profile').classList.add('hidden');
    },

    // ===== 开始游戏 =====
    startGame() {
        // 玩家武将
        const playerHero = getHeroById(this.selectedHeroId);
        // AI随机选武将
        const aiHeroChoices = HEROES.filter(h => h.id !== this.selectedHeroId);
        const aiHero = aiHeroChoices[Math.floor(Math.random() * aiHeroChoices.length)];

        this.players = [
            {
                hero: playerHero,
                hp: playerHero.maxHp,
                maxHp: playerHero.maxHp,
                hand: [],
                equipment: { weapon: null, armor: null, mountPlus: null, mountMinus: null },
                isAI: false,
                name: '你',
                lebusishu: false
            },
            {
                hero: aiHero,
                hp: aiHero.maxHp,
                maxHp: aiHero.maxHp,
                hand: [],
                equipment: { weapon: null, armor: null, mountPlus: null, mountMinus: null },
                isAI: true,
                name: aiHero.name,
                lebusishu: false
            }
        ];

        // 创建牌堆
        this.deck = shuffleDeck(createDeck());
        this.discardPile = [];
        
        // 发牌
        for (let i = 0; i < 4; i++) {
            this.players[0].hand.push(this.drawCard());
            this.players[1].hand.push(this.drawCard());
        }

        // 切换界面
        document.getElementById('select-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');

        this.gameOver = false;
        this.currentPlayer = 0;
        this.phase = 'play';
        this.hasSlashedThisTurn = false;
        this.hasUsedKurouThisTurn = false;
        this.hasUsedFanjianThisTurn = false;
        this.hasUsedQingnangThisTurn = false;
        this.hasUsedJieyinThisTurn = false;
        this.hasUsedGuanxingThisTurn = false;
        this.processing = true; // 防止在回合开始前误操作

        this.log(`游戏开始！你的武将是 ${playerHero.name}，对方武将是 ${aiHero.name}`, 'system');
        this.render();
        
        // 启动背景音乐
        this.playBGM();
        
        // 玩家先手 - 直接进入出牌阶段（首回合不摸牌，因为已经发了4张）
        // 标准规则：第一回合也摸牌
        setTimeout(() => this.startPlayerTurn(), 500);
    },

    // ===== 回合管理 =====
    async startPlayerTurn() {
        if (this.gameOver) return;
        this.currentPlayer = 0;
        this.hasSlashedThisTurn = false;
        this.hasUsedKurouThisTurn = false;
        this.hasUsedZhihengThisTurn = false;
        this.hasUsedLijianThisTurn = false;
        this.hasUsedFanjianThisTurn = false;
        this.hasUsedQingnangThisTurn = false;
        this.hasUsedJieyinThisTurn = false;
        this.hasUsedGuanxingThisTurn = false;
        this.processing = false;
        this.log(`你的回合开始`, 'player');
        this.sayHeroLine(0, 'turnStart');
        this.render();
        
        // 洛神技能（甄姬）- 回合开始阶段
        await this.processLuoshen(0);
        
        // 摸牌阶段
        let drawCount = 2;
        if (hasSkill(this.players[0].hero, '英姿')) drawCount = 3;
        const drawnCards = [];
        for (let i = 0; i < drawCount; i++) {
            drawnCards.push(this.drawCard());
        }
        this.players[0].hand.push(...drawnCards);
        this.log(`你摸了${drawCount}张牌`, 'player');
        this.render();
        
        // 乐不思蜀判定
        const skipPlay = await this.processLebusishu(0);
        if (skipPlay) {
            this.log(`你跳过出牌阶段`, 'system');
            this.render();
            this.endPlayerTurn();
        }
    },

    endPlayerTurn() {
        if (this.gameOver) return;
        if (this.processing) return;
        this.processing = true;
        // 弃牌阶段
        const player = this.players[0];
        const maxHand = player.hp;
        
        // 克己技能检查
        if (hasSkill(player.hero, '克己') && !this.hasSlashedThisTurn) {
            this.log(`克己生效，跳过弃牌阶段`, 'player');
        } else if (player.hand.length > maxHand) {
            this.log(`你需要弃${player.hand.length - maxHand}张牌`, 'system');
            this.startDiscardPhase(0, player.hand.length - maxHand);
            return; // 弃牌完成后会继续
        }
        
        this.afterDiscard(0);
    },

    startDiscardPhase(playerIdx, count) {
        const player = this.players[playerIdx];
        if (player.isAI) {
            // AI弃牌
            const toDiscard = AI.chooseDiscard(this, count);
            toDiscard.forEach(c => {
                player.hand = player.hand.filter(h => h.id !== c.id);
                this.discardPile.push(c);
            });
            this.log(`${player.hero.name}弃了${count}张牌`, 'ai');
            this.render();
            this.afterDiscard(playerIdx);
        } else {
            // 玩家弃牌
            this.log(`请选择${count}张牌弃置`, 'system');
            this.discardedCount = 0;
            this.needDiscardCount = count;
            this.discardMode = true;
            this.render();
        }
    },

    afterDiscard(playerIdx) {
        this.discardMode = false;
        // 闭月（貂蝉）：结束阶段摸一张牌
        if (hasSkill(this.players[playerIdx].hero, '闭月')) {
            const card = this.drawCard();
            this.players[playerIdx].hand.push(card);
            this.log(`${this.players[playerIdx].hero.name}发动【闭月】，摸了1张牌`, playerIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(playerIdx, 'skill');
            this.render();
        }
        if (playerIdx === 0) {
            this.log(`你的回合结束`, 'player');
            this.render();
            // AI回合
            setTimeout(() => this.startAITurn(), 800);
        } else {
            this.log(`${this.players[1].hero.name}回合结束`, 'ai');
            this.render();
            // 玩家回合
            setTimeout(() => this.startPlayerTurn(), 800);
        }
    },

    // ===== AI回合 =====
    async startAITurn() {
        if (this.gameOver) return;
        this.currentPlayer = 1;
        this.hasSlashedThisTurn = false;
        this.hasUsedKurouThisTurn = false;
        this.hasUsedZhihengThisTurn = false;
        this.hasUsedLijianThisTurn = false;
        this.hasUsedFanjianThisTurn = false;
        this.hasUsedQingnangThisTurn = false;
        this.hasUsedJieyinThisTurn = false;
        this.hasUsedGuanxingThisTurn = false;
        this.log(`${this.players[1].hero.name}回合开始`, 'ai');
        this.sayHeroLine(1, 'turnStart');
        
        // 观星技能（诸葛亮）- 回合开始阶段
        await this.processGuanxing(1);
        
        // 洛神技能（甄姬）- 回合开始阶段
        await this.processLuoshen(1);
        
        // 摸牌阶段
        let drawCount = 2;
        if (hasSkill(this.players[1].hero, '英姿')) drawCount = 3;
        const drawnCards = [];
        for (let i = 0; i < drawCount; i++) {
            drawnCards.push(this.drawCard());
        }
        this.players[1].hand.push(...drawnCards);
        this.log(`${this.players[1].hero.name}摸了${drawCount}张牌`, 'ai');
        this.render();
        this.aiRunning = true;
        
        // 乐不思蜀判定
        const skipPlay = await this.processLebusishu(1);
        if (skipPlay) {
            this.log(`${this.players[1].hero.name}跳过出牌阶段`, 'system');
            this.render();
            this.aiRunning = false;
            // 直接进入弃牌阶段
            const ai = this.players[1];
            const maxHand = ai.hp;
            if (ai.hand.length > maxHand) {
                const discardCount = ai.hand.length - maxHand;
                const toDiscard = AI.chooseDiscard(this, discardCount);
                toDiscard.forEach(c => {
                    ai.hand = ai.hand.filter(h => h.id !== c.id);
                    this.discardPile.push(c);
                });
                this.log(`${this.players[1].hero.name}弃了${discardCount}张牌`, 'ai');
            }
            this.render();
            await this.delay(500);
            this.log(`${this.players[1].hero.name}回合结束`, 'ai');
            setTimeout(() => this.startPlayerTurn(), 500);
            return;
        }
        
        await this.delay(800);
        
        // 出牌阶段
        await this.aiPlayPhase();
        
        if (this.gameOver) return;
        
        // 弃牌阶段
        const ai = this.players[1];
        const maxHand = ai.hp;
        if (hasSkill(ai.hero, '克己') && !this.hasSlashedThisTurn) {
            this.log(`${this.players[1].hero.name}克己生效，跳过弃牌`, 'ai');
        } else if (ai.hand.length > maxHand) {
            const discardCount = ai.hand.length - maxHand;
            const toDiscard = AI.chooseDiscard(this, discardCount);
            toDiscard.forEach(c => {
                ai.hand = ai.hand.filter(h => h.id !== c.id);
                this.discardPile.push(c);
            });
            this.log(`${this.players[1].hero.name}弃了${discardCount}张牌`, 'ai');
        }
        
        this.aiRunning = false;
        this.render();
        await this.delay(500);
        
        this.log(`${this.players[1].hero.name}回合结束`, 'ai');
        setTimeout(() => this.startPlayerTurn(), 500);
    },

    async aiPlayPhase() {
        let safetyCount = 0;
        while (!this.gameOver && safetyCount < 20) {
            safetyCount++;
            const action = AI.decideTurnAction(this);
            
            if (action.action === 'end') break;
            if (action.action === 'skill_kurou') {
                await this.executeKurou(1);
                await this.delay(800);
                continue;
            }
            if (action.action === 'skill_zhiheng') {
                await this.executeZhiheng(1);
                await this.delay(800);
                continue;
            }
            if (action.action === 'skill_lijian') {
                await this.executeLijian(1);
                await this.delay(800);
                continue;
            }
            if (action.action === 'skill_fanjian') {
                await this.executeFanjian(1);
                await this.delay(800);
                continue;
            }
            if (action.action === 'skill_qingnang') {
                await this.executeQingnang(1);
                await this.delay(800);
                continue;
            }
            if (action.action === 'skill_jieyin') {
                await this.executeJieyin(1);
                await this.delay(800);
                continue;
            }
            if (action.action === 'play_wusheng') {
                await this.executeWuSheng(1, action.card, 0);
                await this.delay(800);
                continue;
            }
            if (action.action === 'play') {
                await this.executeAICardPlay(action.card, action.target, action.playAs);
                await this.delay(800);
                continue;
            }
            break;
        }
    },

    async executeAICardPlay(card, targetIdx, playAs) {
        const ai = this.players[1];
        // 从手牌移除
        ai.hand = ai.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        
        // 集智（黄月英）：使用非转化的普通锦囊牌时摸一张牌
        if (!playAs && card.type === 'trick' && hasSkill(ai.hero, '集智')) {
            const drawnCard = this.drawCard();
            ai.hand.push(drawnCard);
            this.log(`${ai.hero.name}发动【集智】，摸了1张牌`, 'ai');
            this.sayHeroLine(1, 'skill');
        }
        
        const effectiveDefKey = playAs ? playAs.as : card.defKey;
        const effectiveCard = playAs ? { ...card, defKey: playAs.as, name: CARD_DEFS[playAs.as].name } : card;
        
        if (playAs) {
            this.log(`${ai.hero.name}发动【${playAs.skill}】，将【${card.name}】当【${CARD_DEFS[playAs.as].name}】使用`, 'ai');
            this.sayHeroLine(1, 'skill');
        } else {
            this.log(`${ai.hero.name}使用【${card.name}】`, 'ai');
        }
        
        switch (effectiveDefKey) {
            case 'sha':
            this.hasSlashedThisTurn = true;
            this.sayHeroLine(1, 'attack');
            await this.resolveSha(1, 0, effectiveCard);
                break;
            case 'tao':
                this.heal(1, 1);
                this.log(`${ai.hero.name}使用【桃】回复1点体力`, 'ai');
                this.sayHeroLine(1, 'heal');
                this.render();
                break;
            case 'wushengshengyou':
                const cards1 = [];
                for (let i = 0; i < 2; i++) cards1.push(this.drawCard());
                ai.hand.push(...cards1);
                this.log(`${ai.hero.name}使用【无中生有】摸了2张牌`, 'ai');
                this.sayHeroLine(1, 'skill');
                this.render();
                break;
            case 'guohechaiqiao':
                await this.resolveGuohe(1, 0);
                break;
            case 'shunshouqiannyang':
                await this.resolveShunshou(1, 0);
                break;
            case 'juedou':
                await this.resolveJuedou(1, 0, effectiveCard);
                break;
            case 'nanmanruqin':
                await this.resolveNanman(1, 0);
                break;
            case 'wanjianqifa':
                await this.resolveWanjian(1, 0);
                break;
            case 'lebusishu':
                this.resolveLebusishu(1, 0);
                break;
            case 'huogong':
                await this.resolveHuogong(1, 0);
                break;
            case 'taoyuanjieyi':
                this.resolveTaoyuan(1);
                break;
            case 'wugufengdeng':
                this.resolveWugu(1);
                break;
            default:
                if (card.type === 'equipment') {
                    this.equipCard(1, card);
                    this.log(`${ai.hero.name}装备了【${card.name}】`, 'ai');
                    this.sayHeroLine(1, 'skill');
                    this.render();
                }
                break;
        }
        
        // 连营（陆逊）：失去最后的手牌时摸一张牌
        this.checkLianying(1);
    },

    async executeKurou(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedKurouThisTurn = true;
        player.hp -= 1;
        this.log(`${player.hero.name}发动【苦肉】，流失1点体力`, playerIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(playerIdx, 'skill');
        const cards = [];
        for (let i = 0; i < 2; i++) cards.push(this.drawCard());
        player.hand.push(...cards);
        this.log(`${player.hero.name}摸了2张牌`, playerIdx === 0 ? 'player' : 'ai');
        this.render();
        
        // 检查死亡
        if (player.hp <= 0) {
            await this.checkDying(playerIdx, -1, null);
        }
    },

    // 制衡（孙权）：弃置任意张牌，然后摸等量的牌
    async executeZhiheng(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedZhihengThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        // 简化：AI随机弃牌，玩家进入弃牌选择模式
        if (player.isAI) {
            const discardCount = Math.min(player.hand.length, Math.max(1, player.hand.length - player.hp));
            const toDiscard = AI.chooseDiscard(this, discardCount);
            toDiscard.forEach(c => {
                player.hand = player.hand.filter(h => h.id !== c.id);
                this.discardPile.push(c);
            });
            this.log(`${player.hero.name}发动【制衡】，弃了${discardCount}张牌`, 'ai');
            const drawnCards = [];
            for (let i = 0; i < discardCount; i++) drawnCards.push(this.drawCard());
            player.hand.push(...drawnCards);
            this.log(`${player.hero.name}摸了${discardCount}张牌`, 'ai');
            this.render();
        } else {
            // 玩家进入制衡弃牌模式
            this.log(`请选择要弃置的牌（制衡）`, 'system');
            this.zhihengMode = true;
            this.zhihengCards = [];
            this.render();
            await new Promise(resolve => { this.zhihengResolver = resolve; });
            this.zhihengMode = false;
        }
    },

    // 离间（貂蝉）：弃一张牌，令两名男性角色进行决斗
    async executeLijian(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedLijianThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        // 简化：1v1中弃一张牌后与对方决斗
        if (player.isAI) {
            const discardCard = player.hand[0];
            player.hand = player.hand.filter(c => c.id !== discardCard.id);
            this.discardPile.push(discardCard);
            this.log(`${player.hero.name}发动【离间】，弃置一张牌`, 'ai');
            await this.resolveJuedou(playerIdx, playerIdx === 0 ? 1 : 0, null);
        } else {
            // 玩家弃一张牌
            this.log(`请选择一张手牌弃置（离间）`, 'system');
            this.lijianMode = true;
            this.render();
            await new Promise(resolve => { this.lijianResolver = resolve; });
            this.lijianMode = false;
        }
    },

    // 反间（周瑜）：将一张手牌交给对手，对手选择使用或受伤害
    async executeFanjian(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedFanjianThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        if (player.isAI) {
            // AI选择一张较弱的牌
            const card = AI.chooseFanjianCard(this);
            if (!card) return;
            player.hand = player.hand.filter(c => c.id !== card.id);
            this.log(`${player.hero.name}发动【反间】，将【${card.name}】交给你`, 'ai');
            this.render();
            await this.delay(800);
            // 询问玩家选择
            const choice = await this.askPlayerFanjianChoice(card);
            if (choice === 'use') {
                this.log(`你选择使用【${card.name}】`, 'player');
                await this.resolveFanjianCard(0, 1, card);
            } else {
                this.log(`你选择受到1点伤害`, 'player');
                await this.dealDamage(0, 1, null);
            }
        } else {
            // 玩家进入反间选牌模式
            this.log(`请选择一张手牌发动【反间】`, 'system');
            this.fanjianMode = true;
            this.render();
            await new Promise(resolve => { this.fanjianResolver = resolve; });
            this.fanjianMode = false;
        }
    },

    // 反间牌使用结算
    async resolveFanjianCard(targetIdx, sourceIdx, card) {
        const target = this.players[targetIdx];
        // 如果是杀，对来源使用
        if (card.defKey === 'sha') {
            this.log(`${target.hero.name}对${this.players[sourceIdx].hero.name}使用【杀】`, targetIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(targetIdx, 'attack');
            this.render();
            if (targetIdx === 0) {
                await this.resolveShaFromPlayer(0, sourceIdx, { ...card, defKey: 'sha', name: '杀' });
            } else {
                await this.resolveSha(sourceIdx, targetIdx, { ...card, defKey: 'sha', name: '杀' });
            }
        } else if (card.defKey === 'tao') {
            // 桃回血
            if (target.hp < target.maxHp) {
                this.heal(targetIdx, 1);
                this.log(`${target.hero.name}使用【桃】回复1点体力`, targetIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(targetIdx, 'heal');
            } else {
                this.log(`${target.hero.name}体力已满，【桃】无效`, 'system');
            }
            this.render();
        } else if (card.type === 'trick') {
            // 锦囊牌直接生效（简化：直接弃置，效果不执行）
            this.log(`${target.hero.name}无法使用【${card.name}】，受到1点伤害`, 'system');
            this.discardPile.push(card);
            await this.dealDamage(targetIdx, sourceIdx, null);
        } else {
            // 装备牌或其他：无法使用，受到伤害
            this.log(`${target.hero.name}无法使用【${card.name}】，受到1点伤害`, 'system');
            this.discardPile.push(card);
            await this.dealDamage(targetIdx, sourceIdx, null);
        }
    },

    // ===== 红颜（小乔）：黑桃牌视为红桃 =====
    isCardRedFor(card, hero) {
        if (hasSkill(hero, '红颜') && card.suit === SUIT.SPADE) return true;
        return card.isRed;
    },

    // ===== 天妒/鬼才：判定牌处理 =====
    async processJudgeCard(playerIdx, judgeCard) {
        const player = this.players[playerIdx];
        // 鬼才（司马懿）：在判定牌生效前，可以打出一张手牌代替
        const guicaiPlayerIdx = playerIdx === 0 ? 1 : 0;
        const guicaiPlayer = this.players[guicaiPlayerIdx];
        if (hasSkill(guicaiPlayer.hero, '鬼才') && guicaiPlayer.hand.length > 0) {
            if (guicaiPlayer.isAI) {
                // AI鬼才：简单策略，30%概率替换
                if (Math.random() < 0.3) {
                    const replaceCard = guicaiPlayer.hand[0];
                    guicaiPlayer.hand = guicaiPlayer.hand.filter(c => c.id !== replaceCard.id);
                    this.discardPile.push(judgeCard);
                    this.log(`${guicaiPlayer.hero.name}发动【鬼才】，用【${replaceCard.name}】替换判定牌`, guicaiPlayerIdx === 0 ? 'player' : 'ai');
                    this.sayHeroLine(guicaiPlayerIdx, 'skill');
                    this.render();
                    await this.delay(800);
                    return replaceCard;
                }
            } else {
                // 玩家鬼才：询问是否替换
                const useGuicai = await this.askGuicai(judgeCard, playerIdx);
                if (useGuicai) {
                    const replaceCard = useGuicai;
                    this.players[0].hand = this.players[0].hand.filter(c => c.id !== replaceCard.id);
                    this.discardPile.push(judgeCard);
                    this.log(`你发动【鬼才】，用【${replaceCard.name}】替换判定牌`, 'player');
                    this.sayHeroLine(0, 'skill');
                    this.render();
                    await this.delay(800);
                    return replaceCard;
                }
            }
        }
        // 天妒（郭嘉）：判定牌生效后获得此牌
        if (hasSkill(player.hero, '天妒')) {
            // 从弃牌堆取回
            const idx = this.discardPile.findIndex(c => c.id === judgeCard.id);
            if (idx >= 0) {
                this.discardPile.splice(idx, 1);
            }
            player.hand.push(judgeCard);
            this.log(`${player.hero.name}发动【天妒】，获得判定牌【${judgeCard.name}】`, playerIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(playerIdx, 'skill');
            this.render();
            await this.delay(600);
        }
        return judgeCard;
    },

    // 询问玩家是否发动鬼才
    askGuicai(judgeCard, judgePlayerIdx) {
        return new Promise((resolve) => {
            this.responseMode = 'guicai';
            this.responseResolver = resolve;
            const promptText = `判定牌：${judgeCard.suit}${judgeCard.number}（${judgeCard.name}）。是否发动【鬼才】替换？`;
            document.getElementById('response-prompt').textContent = promptText;
            const container = document.getElementById('response-cards');
            container.innerHTML = '';

            // 显示玩家手牌
            const player = this.players[0];
            player.hand.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.classList.add('playable');
                cardEl.addEventListener('click', () => {
                    const r = this.responseResolver;
                    this.responseResolver = null;
                    this.responseMode = null;
                    document.getElementById('response-panel').classList.add('hidden');
                    r(card);
                });
                container.appendChild(cardEl);
            });

            // 不替换按钮
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = '不替换';
            btn.addEventListener('click', () => {
                const r = this.responseResolver;
                this.responseResolver = null;
                this.responseMode = null;
                document.getElementById('response-panel').classList.add('hidden');
                r(null);
            });
            container.appendChild(btn);

            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 观星（诸葛亮）=====
    async processGuanxing(playerIdx) {
        const player = this.players[playerIdx];
        if (!hasSkill(player.hero, '观星')) return;
        this.hasUsedGuanxingThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        const viewCount = Math.min(5, this.deck.length);
        if (viewCount === 0) return;
        const topCards = [];
        for (let i = 0; i < viewCount; i++) {
            topCards.push(this.deck.pop());
        }
        if (player.isAI) {
            // AI观星：简单策略，杀闪桃放上面，其他放下面
            const priority = (c) => {
                if (c.defKey === 'sha' || c.defKey === 'shan' || c.defKey === 'tao') return 0;
                if (c.type === 'trick') return 1;
                return 2;
            };
            topCards.sort((a, b) => priority(a) - priority(b));
            // 放回牌堆
            for (let i = topCards.length - 1; i >= 0; i--) {
                this.deck.push(topCards[i]);
            }
            this.log(`${player.hero.name}发动【观星】，查看了${viewCount}张牌`, 'ai');
            this.render();
            await this.delay(800);
        } else {
            // 玩家观星：显示牌并选择排列
            this.log(`你发动【观星】，查看牌堆顶${viewCount}张牌`, 'player');
            this.guanxingCards = topCards;
            this.guanxingSelected = [];
            this.guanxingMode = true;
            this.render();
            await new Promise(resolve => { this.guanxingResolver = resolve; });
            this.guanxingMode = false;
        }
    },

    // 玩家确认观星排列
    confirmGuanxing(topIndices) {
        const top = [];
        const bottom = [];
        this.guanxingCards.forEach((card, i) => {
            if (topIndices.includes(i)) top.push(card);
            else bottom.push(card);
        });
        // 先放底部（反向push），再放顶部（反向push）
        for (let i = bottom.length - 1; i >= 0; i--) {
            this.deck.push(bottom[i]);
        }
        for (let i = top.length - 1; i >= 0; i--) {
            this.deck.push(top[i]);
        }
        this.log(`观星完成，${top.length}张置于牌堆顶，${bottom.length}张置于牌堆底`, 'player');
        this.guanxingMode = false;
        if (this.guanxingResolver) {
            const r = this.guanxingResolver;
            this.guanxingResolver = null;
            r();
        }
    },

    // ===== 青囊（华佗）=====
    async executeQingnang(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedQingnangThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        if (player.isAI) {
            // AI青囊：弃一张低价值牌，治疗自己
            if (player.hp < player.maxHp) {
                const discardCard = AI.chooseDiscard(this, 1)[0];
                if (discardCard) {
                    player.hand = player.hand.filter(c => c.id !== discardCard.id);
                    this.discardPile.push(discardCard);
                    this.heal(playerIdx, 1);
                    this.log(`${player.hero.name}发动【青囊】，弃【${discardCard.name}】回复1点体力`, 'ai');
                    this.render();
                }
            }
        } else {
            // 玩家青囊：选一张牌弃置，治疗自己
            this.log(`请选择一张手牌弃置（青囊）`, 'system');
            this.qingnangMode = true;
            this.render();
            await new Promise(resolve => { this.qingnangResolver = resolve; });
            this.qingnangMode = false;
        }
    },

    // 玩家确认青囊弃牌
    confirmQingnang(card) {
        const player = this.players[0];
        player.hand = player.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        // 1v1中治疗自己
        const targetIdx = 0;
        if (this.players[targetIdx].hp < this.players[targetIdx].maxHp) {
            this.heal(targetIdx, 1);
            this.log(`你发动【青囊】，弃【${card.name}】，回复1点体力`, 'player');
        } else {
            this.log(`你已满血，青囊无效`, 'system');
        }
        this.qingnangMode = false;
        if (this.qingnangResolver) {
            const r = this.qingnangResolver;
            this.qingnangResolver = null;
            r();
        }
        this.render();
    },

    // ===== 结姻（孙尚香）=====
    async executeJieyin(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedJieyinThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        if (player.isAI) {
            // AI结姻：手牌充足且残血时使用
            if (player.hp < player.maxHp && player.hand.length >= 3) {
                const toDiscard = AI.chooseDiscard(this, 2);
                if (toDiscard.length >= 2) {
                    toDiscard.forEach(c => {
                        player.hand = player.hand.filter(h => h.id !== c.id);
                        this.discardPile.push(c);
                    });
                    this.heal(playerIdx, 1);
                    this.heal(playerIdx === 0 ? 1 : 0, 1);
                    this.log(`${player.hero.name}发动【结姻】，双方各回复1点体力`, 'ai');
                    this.render();
                }
            }
        } else {
            // 玩家结姻：选两张手牌弃置
            if (player.hand.length < 2) {
                this.log(`手牌不足，无法发动【结姻】`, 'system');
                this.hasUsedJieyinThisTurn = false;
                return;
            }
            this.log(`请选择两张手牌弃置（结姻）`, 'system');
            this.jieyinMode = true;
            this.jieyinCards = [];
            this.render();
            await new Promise(resolve => { this.jieyinResolver = resolve; });
            this.jieyinMode = false;
        }
    },

    // 玩家确认结姻选牌
    confirmJieyin() {
        if (this.jieyinCards.length < 2) {
            this.log(`请选择两张牌`, 'system');
            return;
        }
        const player = this.players[0];
        this.jieyinCards.forEach(c => {
            player.hand = player.hand.filter(h => h.id !== c.id);
            this.discardPile.push(c);
        });
        // 双方各回复1点
        if (player.hp < player.maxHp) {
            this.heal(0, 1);
        }
        if (this.players[1].hp < this.players[1].maxHp) {
            this.heal(1, 1);
        }
        this.log(`你发动【结姻】，双方各回复1点体力`, 'player');
        this.jieyinCards = [];
        this.jieyinMode = false;
        if (this.jieyinResolver) {
            const r = this.jieyinResolver;
            this.jieyinResolver = null;
            r();
        }
        this.render();
    },

    // 询问玩家是否使用反间给的牌
    askPlayerFanjianChoice(card) {
        return new Promise((resolve) => {
            this.responseMode = 'fanjian';
            this.responseResolver = resolve;

            const canUse = card.defKey === 'sha' || (card.defKey === 'tao') || card.type === 'trick' || card.type === 'equipment';
            const promptText = canUse
                ? `周瑜发动【反间】，给你【${card.name}】。选择：使用此牌 或 受到1点伤害`
                : `周瑜发动【反间】，给你【${card.name}】。你无法使用此牌，将受到1点伤害`;
            document.getElementById('response-prompt').textContent = promptText;
            const container = document.getElementById('response-cards');
            container.innerHTML = '';

            // 展示牌
            const cardEl = this.createCardElement(card, false);
            cardEl.style.cursor = 'default';
            container.appendChild(cardEl);

            if (canUse) {
                const btn1 = document.createElement('button');
                btn1.className = 'action-btn green';
                btn1.textContent = '使用此牌';
                btn1.addEventListener('click', () => {
                    const r = this.responseResolver;
                    this.responseResolver = null;
                    this.responseMode = null;
                    document.getElementById('response-panel').classList.add('hidden');
                    r('use');
                });
                container.appendChild(btn1);

                const btn2 = document.createElement('button');
                btn2.className = 'action-btn';
                btn2.textContent = '受到1点伤害';
                btn2.addEventListener('click', () => {
                    const r = this.responseResolver;
                    this.responseResolver = null;
                    this.responseMode = null;
                    document.getElementById('response-panel').classList.add('hidden');
                    r('damage');
                });
                container.appendChild(btn2);
            } else {
                const btn = document.createElement('button');
                btn.className = 'action-btn';
                btn.textContent = '受到1点伤害';
                btn.addEventListener('click', () => {
                    const r = this.responseResolver;
                    this.responseResolver = null;
                    this.responseMode = null;
                    document.getElementById('response-panel').classList.add('hidden');
                    r('damage');
                });
                container.appendChild(btn);
            }

            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    async executeWuSheng(sourceIdx, card, targetIdx) {
        // 关羽武圣：红色牌当杀
        const source = this.players[sourceIdx];
        source.hand = source.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        this.hasSlashedThisTurn = true;
                this.log(`${source.hero.name}发动【武圣】，将【${card.name}】当【杀】使用`, sourceIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(sourceIdx, 'skill');
        this.render();
        
        if (sourceIdx === 0) {
            await this.resolveShaFromPlayer(0, 1, { ...card, defKey: 'sha', name: '杀' });
        } else {
            await this.resolveSha(1, 0, { ...card, defKey: 'sha', name: '杀' });
        }
    },

    // ===== 玩家出牌 =====
    onPlayerCardClick(card) {
        if (this.gameOver) return;
        if (this.responseResolver) {
            // 响应模式
            this.handleResponseCardClick(card);
            return;
        }
        if (this.ganglieDiscard) {
            // 刚烈弃牌
            const player = this.players[0];
            player.hand = player.hand.filter(c => c.id !== card.id);
            this.discardPile.push(card);
            this.log(`你弃置了【${card.name}】`, 'player');
            this.ganglieDiscard = false;
            this.render();
            if (this.ganglieDiscardResolver) {
                const resolver = this.ganglieDiscardResolver;
                this.ganglieDiscardResolver = null;
                resolver();
            }
            return;
        }
        if (this.discardMode) {
            this.handleDiscardClick(card);
            return;
        }
        // 制衡模式：选择要弃置的牌
        if (this.zhihengMode) {
            const player = this.players[0];
            const idx = this.zhihengCards.findIndex(c => c.id === card.id);
            if (idx >= 0) {
                this.zhihengCards.splice(idx, 1);
            } else {
                this.zhihengCards.push(card);
            }
            this.render();
            return;
        }
        // 离间模式：弃一张牌
        if (this.lijianMode) {
            const player = this.players[0];
            player.hand = player.hand.filter(c => c.id !== card.id);
            this.discardPile.push(card);
            this.log(`你弃置了【${card.name}】发动【离间】`, 'player');
            this.render();
            if (this.lijianResolver) {
                const r = this.lijianResolver;
                this.lijianResolver = null;
                this.resolveJuedouPlayer(0, 1, null);
                r();
            }
            return;
        }
        // 反间模式：选择一张牌给对手
        if (this.fanjianMode) {
            const player = this.players[0];
            player.hand = player.hand.filter(c => c.id !== card.id);
            this.log(`你发动【反间】，将【${card.name}】交给${this.players[1].hero.name}`, 'player');
            this.render();
            if (this.fanjianResolver) {
                const r = this.fanjianResolver;
                this.fanjianResolver = null;
                // AI决定是否使用
                const aiChoice = AI.decideFanjianResponse(this, card);
                if (aiChoice === 'use') {
                    this.log(`${this.players[1].hero.name}选择使用【${card.name}】`, 'ai');
                    this.resolveFanjianCard(1, 0, card).then(() => r());
                } else {
                    this.log(`${this.players[1].hero.name}选择受到1点伤害`, 'ai');
                    this.dealDamage(1, 0, null).then(() => r());
                }
            }
            return;
        }
        // 青囊模式：选一张牌弃置
        if (this.qingnangMode) {
            this.confirmQingnang(card);
            return;
        }
        // 结姻模式：选两张牌弃置
        if (this.jieyinMode) {
            const idx = this.jieyinCards.findIndex(c => c.id === card.id);
            if (idx >= 0) {
                this.jieyinCards.splice(idx, 1);
            } else {
                this.jieyinCards.push(card);
            }
            this.render();
            return;
        }
        if (this.processing) return;
        if (this.currentPlayer !== 0) return;
        
        // 检查可否使用
        const playable = this.getCardPlayableAs(0, card);
        if (playable.length === 0) {
            this.log('这张牌现在不能使用', 'system');
            return;
        }
        
        // 如果有多种用法，取第一种（简化处理）
        const playAs = playable[0];
        this.playerPlayCard(card, playAs);
    },

    getCardPlayableAs(playerIdx, card) {
        const player = this.players[playerIdx];
        const results = [];
        
        // 直接使用
        if (card.defKey === 'sha') {
            const canSlash = !this.hasSlashedThisTurn || this.canSlashUnlimited(player);
            if (canSlash) results.push({ as: 'sha', skill: null });
        }
        if (card.defKey === 'tao') {
            if (player.hp < player.maxHp) results.push({ as: 'tao', skill: null });
        }
        if (card.type === 'trick' && card.defKey !== 'wuxiekeji') {
            // 锦囊牌基本都能用（无懈可击除外，它是响应牌）
            // 谦逊（陆逊）：不能成为乐不思蜀目标
            if (card.defKey === 'lebusishu' && hasSkill(this.players[1].hero, '谦逊')) {
                // 对方有谦逊，乐不思蜀不可用
            } else if (card.isRed === false && hasSkill(this.players[1].hero, '帷幕')) {
                // 帷幕（贾诏）：不能成为黑色锦囊牌目标
            } else {
                results.push({ as: card.defKey, skill: null });
            }
        }
        if (card.type === 'equipment') {
            results.push({ as: card.defKey, skill: null });
        }
        
        // 武圣：红色牌当杀
        if (hasSkill(player.hero, '武圣') && card.isRed && card.defKey !== 'sha') {
            const canSlash = !this.hasSlashedThisTurn || this.canSlashUnlimited(player);
            if (canSlash) results.push({ as: 'sha', skill: '武圣' });
        }
        
        // 龙胆：闪当杀
        if (hasSkill(player.hero, '龙胆') && card.defKey === 'shan') {
            const canSlash = !this.hasSlashedThisTurn || this.canSlashUnlimited(player);
            if (canSlash) results.push({ as: 'sha', skill: '龙胆' });
        }
        
        // 仁德：任意手牌当桃
        if (hasSkill(player.hero, '仁德') && card.defKey !== 'tao') {
            if (player.hp < player.maxHp) results.push({ as: 'tao', skill: '仁德' });
        }

        // 奇袭（甘宁）：黑色手牌当过河拆桥
        if (hasSkill(player.hero, '奇袭') && !card.isRed && card.defKey !== 'guohechaiqiao') {
            results.push({ as: 'guohechaiqiao', skill: '奇袭' });
        }

        // 国色（大乔）：方块牌当乐不思蜀
        if (hasSkill(player.hero, '国色') && card.suit === SUIT.DIAMOND && card.defKey !== 'lebusishu') {
            results.push({ as: 'lebusishu', skill: '国色' });
        }

        // 双雄（颜良文丑）：黑色手牌当决斗
        if (hasSkill(player.hero, '双雄') && !card.isRed && card.defKey !== 'juedou') {
            results.push({ as: 'juedou', skill: '双雄' });
        }
        
        return results;
    },

    playerPlayCard(card, playAs) {
        const player = this.players[0];
        const targetIdx = 1; // 1v1中目标固定为对方
        
        // 从手牌移除
        player.hand = player.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        
        // 集智（黄月英）：使用非转化的普通锦囊牌时摸一张牌
        if (!playAs.skill && card.type === 'trick' && hasSkill(player.hero, '集智')) {
            const drawnCard = this.drawCard();
            player.hand.push(drawnCard);
            this.log(`你发动【集智】，摸了1张牌`, 'player');
            this.sayHeroLine(0, 'skill');
        }
        
        if (playAs.skill) {
            this.log(`你发动【${playAs.skill}】，将【${card.name}】当【${CARD_DEFS[playAs.as].name}】使用`, 'player');
        } else {
            this.log(`你使用【${card.name}】`, 'player');
        }
        
        const effectiveCard = playAs.skill ? { ...card, defKey: playAs.as, name: CARD_DEFS[playAs.as].name } : card;
        
        switch (playAs.as) {
            case 'sha':
                this.hasSlashedThisTurn = true;
                this.sayHeroLine(0, 'attack');
                this.resolveShaFromPlayer(0, 1, effectiveCard);
                break;
            case 'tao':
                this.heal(0, 1);
                this.log(`你回复1点体力`, 'player');
                this.sayHeroLine(0, 'heal');
                this.render();
                break;
            case 'wushengshengyou':
                const cards1 = [];
                for (let i = 0; i < 2; i++) cards1.push(this.drawCard());
                player.hand.push(...cards1);
                this.log(`你摸了2张牌`, 'player');
                this.sayHeroLine(0, 'skill');
                this.render();
                break;
            case 'guohechaiqiao':
                this.resolveGuohePlayer(0, 1);
                break;
            case 'shunshouqiannyang':
                this.resolveShunshouPlayer(0, 1);
                break;
            case 'juedou':
                this.resolveJuedouPlayer(0, 1, effectiveCard);
                break;
            case 'nanmanruqin':
                this.resolveNanmanPlayer(0, 1);
                break;
            case 'wanjianqifa':
                this.resolveWanjianPlayer(0, 1);
                break;
            case 'lebusishu':
                this.resolveLebusishuPlayer(0, 1);
                break;
            case 'huogong':
                this.resolveHuogongPlayer(0, 1);
                break;
            case 'taoyuanjieyi':
                this.resolveTaoyuan(0);
                break;
            case 'wugufengdeng':
                this.resolveWugu(0);
                break;
            default:
                if (card.type === 'equipment') {
                    this.equipCard(0, card);
                    this.log(`你装备了【${card.name}】`, 'player');
                    this.sayHeroLine(0, 'skill');
                    this.render();
                }
                break;
        }
        
        // 连营（陆逊）：失去最后的手牌时摸一张牌
        this.checkLianying(0);
    },

    // ===== 杀的结算 =====
    canSlashUnlimited(player) {
        return hasSkill(player.hero, '咆哮') || 
               (player.equipment.weapon && player.equipment.weapon.defKey === 'zhugecrossbow');
    },

    // 检查杀是否不可闪避
    async checkShaUnblockable(sourceIdx, targetIdx, card) {
        const source = this.players[sourceIdx];
        const target = this.players[targetIdx];

        // 铁骑（马超）：判定，红色则不可闪避
        if (hasSkill(source.hero, '铁骑')) {
            this.log(`${source.hero.name}发动【铁骑】`, sourceIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(sourceIdx, 'skill');
            this.render();
            await this.delay(800);
            const judgeCard = this.drawCard();
            this.discardPile.push(judgeCard);
            this.log(`判定结果：${judgeCard.suit}${judgeCard.number}（${judgeCard.isRed ? '红色' : '黑色'}）`, 'system');
            this.render();
            await this.delay(600);
            // 天妒/鬼才处理
            const finalJudgeCard = await this.processJudgeCard(sourceIdx, judgeCard);
            if (finalJudgeCard.isRed) {
                this.log(`判定为红色，【铁骑】生效，此杀不可闪避！`, 'system');
                this.render();
                await this.delay(400);
                return true;
            } else {
                this.log(`判定为黑色，【铁骑】失效`, 'system');
                this.render();
                await this.delay(400);
            }
        }

        // 烈弓（黄忠）：目标手牌数>=体力值则不可闪避
        if (hasSkill(source.hero, '烈弓') && target.hand.length >= target.hp) {
            this.log(`${source.hero.name}发动【烈弓】，目标手牌数≥体力值，此杀不可闪避！`, 'system');
            this.sayHeroLine(sourceIdx, 'skill');
            this.render();
            await this.delay(600);
            return true;
        }

        return false;
    },

    // 玩家对AI出杀
    async resolveShaFromPlayer(sourceIdx, targetIdx, card) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        
        // 空城检查
        if (hasSkill(target.hero, '空城') && target.hand.length === 0) {
            this.log(`${target.hero.name}空城，不能成为杀的目标`, 'system');
            this.render();
            return;
        }
        
        // 无双：需要2张闪
        let needShan = 1;
        if (hasSkill(source.hero, '无双')) needShan = 2;

        // 突袭（张辽）：无视防具
        if (!hasSkill(source.hero, '突袭')) {
            // 八卦阵判定
            if (target.equipment.armor && target.equipment.armor.defKey === 'baguazhen') {
                const judgeCard = this.drawCard();
                this.discardPile.push(judgeCard);
                this.log(`${target.hero.name}八卦阵判定：${judgeCard.suit}${judgeCard.number}`, 'system');
                if (judgeCard.isRed) {
                    this.log(`判定为红色，八卦阵生效！`, 'system');
                    this.render();
                    return;
                } else {
                    this.log(`判定为黑色，八卦阵失效`, 'system');
                }
            }
            
            // 仁王盾：黑色杀无效
            if (target.equipment.armor && target.equipment.armor.defKey === 'renwangdun' && !card.isRed) {
                this.log(`${target.hero.name}装备【仁王盾】，黑色杀无效`, 'system');
                this.render();
                return;
            }
        } else {
            this.log(`${source.hero.name}发动【突袭】，无视防具`, 'player');
        }

        // 检查不可闪避（铁骑、烈弓）
        const unblockable = await this.checkShaUnblockable(sourceIdx, targetIdx, card);
        
        if (unblockable) {
            this.log(`${target.hero.name}无法闪避`, 'system');
            await this.dealDamage(targetIdx, sourceIdx, card);
            if (!this.responseResolver && !this.gameOver) this.processing = false;
            this.render();
            return;
        }
        
        // AI决定是否闪
        this.processing = true;
        this.render();
        await this.delay(1000);
        const response = AI.decideDodge(this, needShan);
        if (response.dodge) {
            response.cards.forEach(c => {
                target.hand = target.hand.filter(h => h.id !== c.id);
                this.discardPile.push(c);
            });
            const skillText = response.cards.some(c => c.defKey === 'sha') ? '（龙胆）' : '';
            this.log(`${target.hero.name}使用${needShan > 1 ? needShan + '张' : ''}【闪】${skillText}抵消了攻击`, 'ai');
            this.sayHeroLine(1, 'dodge');
            
            // 青龙偃月刀：杀被闪抵消后造成1点伤害
            if (source.equipment.weapon && source.equipment.weapon.defKey === 'qinglongyanyuedao') {
                this.log(`${source.hero.name}发动【青龙偃月刀】效果`, 'player');
                await this.dealDamage(targetIdx, sourceIdx, null);
            }
            
            this.processing = false;
            this.render();
        } else {
            this.log(`${target.hero.name}没有出闪`, 'ai');
            await this.dealDamage(targetIdx, sourceIdx, card);
            if (!this.responseResolver && !this.gameOver) {
                this.processing = false;
            }
            this.render();
        }
    },

    // AI对玩家出杀
    async resolveSha(sourceIdx, targetIdx, card) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        
        // 空城检查
        if (hasSkill(target.hero, '空城') && target.hand.length === 0) {
            this.log(`${target.hero.name}空城，不能成为杀的目标`, 'system');
            this.render();
            return;
        }
        
        let needShan = 1;
        if (hasSkill(source.hero, '无双')) needShan = 2;

        // 突袭（张辽）：无视防具
        if (!hasSkill(source.hero, '突袭')) {
            // 八卦阵判定
            if (target.equipment.armor && target.equipment.armor.defKey === 'baguazhen') {
                const judgeCard = this.drawCard();
                this.discardPile.push(judgeCard);
                this.log(`${target.hero.name}八卦阵判定：${judgeCard.suit}${judgeCard.number}`, 'system');
                if (judgeCard.isRed) {
                    this.log(`判定为红色，八卦阵生效！`, 'system');
                    this.render();
                    return;
                } else {
                    this.log(`判定为黑色，八卦阵失效`, 'system');
                }
            }
            
            // 仁王盾：黑色杀无效
            if (target.equipment.armor && target.equipment.armor.defKey === 'renwangdun' && !card.isRed) {
                this.log(`你装备【仁王盾】，黑色杀无效`, 'system');
                this.render();
                return;
            }
        } else {
            this.log(`${source.hero.name}发动【突袭】，无视防具`, 'ai');
        }

        // 检查不可闪避（铁骑、烈弓）
        const unblockable = await this.checkShaUnblockable(sourceIdx, targetIdx, card);

        // 裸衣（许褚）：不能使用闪
        if (hasSkill(target.hero, '裸衣')) {
            this.log(`${target.hero.name}【裸衣】生效，不能使用【闪】`, 'system');
            this.render();
            await this.delay(600);
            this.log(`${target.hero.name}没有出闪`, 'player');
            await this.dealDamage(targetIdx, sourceIdx, card);
            this.render();
            return;
        }

        if (unblockable) {
            this.log(`此杀不可闪避！`, 'system');
            this.render();
            await this.delay(600);
            this.log(`你没有出闪`, 'player');
            await this.dealDamage(targetIdx, sourceIdx, card);
            this.render();
            return;
        }
        
        this.render();
        
        // 询问玩家是否出闪
        const response = await this.askPlayerDodge(needShan);
        
        if (response.dodge) {
            response.cards.forEach(c => {
                target.hand = target.hand.filter(h => h.id !== c.id);
                this.discardPile.push(c);
            });
            this.log(`你使用${needShan > 1 ? needShan + '张' : ''}【闪】抵消了攻击`, 'player');
            this.sayHeroLine(0, 'dodge');
            
            // 青龙偃月刀：杀被闪抵消后造成1点伤害
            if (source.equipment.weapon && source.equipment.weapon.defKey === 'qinglongyanyuedao') {
                this.log(`${source.hero.name}发动【青龙偃月刀】效果`, 'ai');
                await this.dealDamage(targetIdx, sourceIdx, null);
            }
            
            this.render();
        } else {
            this.log(`你没有出闪`, 'player');
            await this.dealDamage(targetIdx, sourceIdx, card);
        }
    },

    // ===== 决斗结算 =====
    async resolveJuedouPlayer(sourceIdx, targetIdx, card) {
        this.log(`你使用【决斗】，目标：${this.players[targetIdx].hero.name}`, 'player');
        this.sayHeroLine(0, 'attack');
        this.processing = true;
        this.render();
        // 目标先出杀 - 使用async版本
        await this.juedouStepAsync(targetIdx, sourceIdx, card, true);
        if (!this.responseResolver && !this.gameOver) {
            this.processing = false;
        }
        this.render();
    },

    async resolveJuedou(sourceIdx, targetIdx, card) {
        this.log(`${this.players[sourceIdx].hero.name}使用【决斗】，目标：${this.players[targetIdx].hero.name}`, 'ai');
        this.sayHeroLine(1, 'attack');
        this.render();
        // 目标（玩家）先出杀
        await this.juedouStepAsync(targetIdx, sourceIdx, card, true);
    },

    async juedouStepAsync(currentIdx, otherIdx, damageCard, isInitialTarget) {
        const current = this.players[currentIdx];
        const other = this.players[otherIdx];
        
        if (isInitialTarget && hasSkill(current.hero, '空城') && current.hand.length === 0) {
            this.log(`${current.hero.name}空城，不能成为决斗目标`, 'system');
            this.render();
            return;
        }
        
        this.render();
        
        if (current.isAI) {
            await this.delay(1000);
            const response = AI.decideDuelResponse(this);
            if (response.play) {
                current.hand = current.hand.filter(c => c.id !== response.card.id);
                this.discardPile.push(response.card);
                // 判断是否使用了龙胆（闪当杀）
                const isLongdan = response.card.defKey === 'shan' && hasSkill(current.hero, '龙胆');
                const skillText = isLongdan ? '（龙胆）' : '';
                this.log(`${current.hero.name}出【杀】${skillText}`, 'ai');
                if (isLongdan) this.sayHeroLine(currentIdx, 'skill');
                else this.sayHeroLine(currentIdx, 'dodge');
                this.render();
                await this.delay(800);
                await this.juedouStepAsync(otherIdx, currentIdx, damageCard, false);
            } else {
                this.log(`${current.hero.name}不出杀，受到1点伤害`, 'ai');
                this.sayHeroLine(currentIdx, 'damage');
                await this.dealDamage(currentIdx, otherIdx, damageCard);
            }
        } else {
            const response = await this.askPlayerDuel();
            if (response.play) {
                this.players[0].hand = this.players[0].hand.filter(c => c.id !== response.card.id);
                this.discardPile.push(response.card);
                // 判断是否使用了龙胆（闪当杀）
                const isLongdan = response.card.defKey === 'shan' && hasSkill(this.players[0].hero, '龙胆');
                const skillText = isLongdan ? '（龙胆）' : '';
                this.log(`你出【杀】${skillText}`, 'player');
                if (isLongdan) this.sayHeroLine(0, 'skill');
                else this.sayHeroLine(0, 'dodge');
                this.render();
                await this.delay(800);
                await this.juedouStepAsync(otherIdx, currentIdx, damageCard, false);
            } else {
                this.log(`你不出杀，受到1点伤害`, 'player');
                this.sayHeroLine(0, 'damage');
                await this.dealDamage(currentIdx, otherIdx, damageCard);
            }
        }
    },

    // ===== 南蛮入侵结算 =====
    async resolveNanmanPlayer(sourceIdx, targetIdx) {
        this.log(`你使用【南蛮入侵】`, 'player');
        this.sayHeroLine(0, 'attack');
        this.processing = true;
        this.render();
        await this.delay(1000);
        const target = this.players[targetIdx];
        const response = AI.decideNanmanDodge(this);
        if (response.dodge) {
            target.hand = target.hand.filter(c => c.id !== response.card.id);
            this.discardPile.push(response.card);
            const skillText = response.card.defKey === 'shan' ? '（龙胆）' : '';
            this.log(`${target.hero.name}出【杀】${skillText}抵挡`, 'ai');
            if (response.card.defKey === 'shan') this.sayHeroLine(1, 'skill');
            else this.sayHeroLine(1, 'dodge');
            this.processing = false;
            this.render();
        } else {
            this.log(`${target.hero.name}没有出杀，受到1点伤害`, 'ai');
            this.sayHeroLine(1, 'damage');
            await this.dealDamage(targetIdx, sourceIdx, null);
            if (!this.responseResolver && !this.gameOver) {
                this.processing = false;
            }
            this.render();
        }
    },

    async resolveNanman(sourceIdx, targetIdx) {
        this.log(`${this.players[sourceIdx].hero.name}使用【南蛮入侵】`, 'ai');
        this.sayHeroLine(1, 'attack');
        this.render();
        const response = await this.askPlayerNanman();
        const target = this.players[targetIdx];
        if (response.play) {
            target.hand = target.hand.filter(c => c.id !== response.card.id);
            this.discardPile.push(response.card);
            const skillText = response.card.defKey === 'shan' ? '（龙胆）' : '';
            this.log(`你出【杀】${skillText}抵挡`, 'player');
            if (response.card.defKey === 'shan') this.sayHeroLine(0, 'skill');
            else this.sayHeroLine(0, 'dodge');
            this.render();
        } else {
            this.log(`你没有出杀，受到1点伤害`, 'player');
            this.sayHeroLine(0, 'damage');
            await this.dealDamage(targetIdx, sourceIdx, null);
        }
    },

    // ===== 万箭齐发结算 =====
    async resolveWanjianPlayer(sourceIdx, targetIdx) {
        this.log(`你使用【万箭齐发】`, 'player');
        this.sayHeroLine(0, 'attack');
        this.processing = true;
        this.render();
        await this.delay(1000);
        const target = this.players[targetIdx];
        const response = AI.decideWanjianDodge(this);
        if (response.dodge) {
            target.hand = target.hand.filter(c => c.id !== response.card.id);
            this.discardPile.push(response.card);
            const skillText = response.card.defKey === 'sha' ? '（龙胆）' : '';
            this.log(`${target.hero.name}出【闪】${skillText}抵挡`, 'ai');
            this.sayHeroLine(1, 'dodge');
            this.processing = false;
            this.render();
        } else {
            this.log(`${target.hero.name}没有出闪，受到1点伤害`, 'ai');
            this.sayHeroLine(1, 'damage');
            await this.dealDamage(targetIdx, sourceIdx, null);
            if (!this.responseResolver && !this.gameOver) {
                this.processing = false;
            }
            this.render();
        }
    },

    async resolveWanjian(sourceIdx, targetIdx) {
        this.log(`${this.players[sourceIdx].hero.name}使用【万箭齐发】`, 'ai');
        this.sayHeroLine(1, 'attack');
        this.render();
        const response = await this.askPlayerWanjian();
        const target = this.players[targetIdx];
        if (response.play) {
            target.hand = target.hand.filter(c => c.id !== response.card.id);
            this.discardPile.push(response.card);
            const skillText = response.card.defKey === 'sha' ? '（龙胆）' : '';
            this.log(`你出【闪】${skillText}抵挡`, 'player');
            this.sayHeroLine(0, 'dodge');
            this.render();
        } else {
            this.log(`你没有出闪，受到1点伤害`, 'player');
            this.sayHeroLine(0, 'damage');
            await this.dealDamage(targetIdx, sourceIdx, null);
        }
    },

    // ===== 过河拆桥结算 =====
    async resolveGuohePlayer(sourceIdx, targetIdx) {
        const target = this.players[targetIdx];
        this.log(`你使用【过河拆桥】`, 'player');
        this.sayHeroLine(0, 'skill');
        this.processing = true;
        this.render();
        
        const selection = await this.askPlayerSelectTargetCard('guohe', targetIdx);
        
        if (!selection) {
            this.log(`对方没有牌可以弃置`, 'system');
            this.processing = false;
            this.render();
            return;
        }
        
        if (selection.type === 'hand') {
            const card = target.hand[selection.index];
            target.hand.splice(selection.index, 1);
            this.discardPile.push(card);
            this.log(`你弃置了${target.hero.name}的【${card.name}】`, 'player');
        } else {
            const equip = target.equipment[selection.slot];
            target.equipment[selection.slot] = null;
            this.discardPile.push(equip);
            this.log(`你弃置了${target.hero.name}的【${equip.name}】`, 'player');
        }
        this.processing = false;
        this.render();
    },

    async resolveGuohe(sourceIdx, targetIdx) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        this.log(`${source.hero.name}使用【过河拆桥】`, 'ai');
        this.sayHeroLine(1, 'skill');
        
        const targetChoice = AI.chooseSabotageTarget(this);
        if (!targetChoice) {
            this.log(`你没有牌可以弃置`, 'system');
            this.render();
            return;
        }
        
        if (targetChoice.type === 'hand') {
            const card = target.hand[targetChoice.index];
            target.hand.splice(targetChoice.index, 1);
            this.discardPile.push(card);
            this.log(`${source.hero.name}弃置了你的【${card.name}】`, 'ai');
        } else {
            const equip = target.equipment[targetChoice.slot];
            target.equipment[targetChoice.slot] = null;
            this.discardPile.push(equip);
            this.log(`${source.hero.name}弃置了你的【${equip.name}】`, 'ai');
        }
        this.render();
    },

    // ===== 顺手牵羊结算 =====
    async resolveShunshouPlayer(sourceIdx, targetIdx) {
        const target = this.players[targetIdx];
        this.log(`你使用【顺手牵羊】`, 'player');
        this.sayHeroLine(0, 'skill');
        this.processing = true;
        this.render();
        
        const selection = await this.askPlayerSelectTargetCard('shunshou', targetIdx);
        
        if (!selection) {
            this.log(`对方没有牌可以获得`, 'system');
            this.processing = false;
            this.render();
            return;
        }
        
        if (selection.type === 'hand') {
            const card = target.hand[selection.index];
            target.hand.splice(selection.index, 1);
            this.players[0].hand.push(card);
            this.log(`你获得了${target.hero.name}的【${card.name}】`, 'player');
        } else {
            const equip = target.equipment[selection.slot];
            target.equipment[selection.slot] = null;
            this.players[0].hand.push(equip);
            this.log(`你获得了${target.hero.name}的【${equip.name}】`, 'player');
        }
        this.processing = false;
        this.render();
    },

    async resolveShunshou(sourceIdx, targetIdx) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        this.log(`${source.hero.name}使用【顺手牵羊】`, 'ai');
        this.sayHeroLine(1, 'skill');
        
        const targetChoice = AI.chooseStealTarget(this);
        if (!targetChoice) {
            this.log(`你没有牌可以获得`, 'system');
            this.render();
            return;
        }
        
        if (targetChoice.type === 'hand') {
            const card = target.hand[targetChoice.index];
            target.hand.splice(targetChoice.index, 1);
            this.players[1].hand.push(card);
            this.log(`${source.hero.name}获得了你的【${card.name}】`, 'ai');
        } else {
            const equip = target.equipment[targetChoice.slot];
            target.equipment[targetChoice.slot] = null;
            this.players[1].hand.push(equip);
            this.log(`${source.hero.name}获得了你的【${equip.name}】`, 'ai');
        }
        this.render();
    },

    // 玩家选择目标卡牌（过河拆桥/顺手牵羊）
    askPlayerSelectTargetCard(mode, targetIdx) {
        return new Promise((resolve) => {
            const target = this.players[targetIdx];
            this.responseMode = mode;
            this.responseResolver = resolve;
            this.responseSelectedCards = [];
            
            const promptText = mode === 'guohe' 
                ? `选择要弃置的牌（${target.hero.name}）` 
                : `选择要获得的牌（${target.hero.name}）`;
            document.getElementById('response-prompt').textContent = promptText;
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            let hasCards = false;
            
            // 显示装备牌（正面朝上，可选）
        ['weapon', 'armor', 'mountPlus', 'mountMinus'].forEach(slot => {
            if (target.equipment[slot]) {
                hasCards = true;
                const cardEl = this.createCardElement(target.equipment[slot], true);
                    cardEl.classList.add('playable');
                    cardEl.addEventListener('click', () => {
                        const resolver = this.responseResolver;
                        this.responseResolver = null;
                        this.responseMode = null;
                        document.getElementById('response-panel').classList.add('hidden');
                        resolver({ type: 'equip', slot });
                    });
                    container.appendChild(cardEl);
                }
            });
            
            // 显示手牌（背面朝下，可点击选择）
            target.hand.forEach((card, idx) => {
                hasCards = true;
                const cardBack = document.createElement('div');
                cardBack.className = 'card card-back';
                cardBack.style.cursor = 'pointer';
                cardBack.innerHTML = `<div style="position:absolute;bottom:8px;right:8px;color:#888;font-size:12px;">手牌${idx + 1}</div>`;
                cardBack.addEventListener('mouseenter', () => cardBack.style.opacity = '0.7');
                cardBack.addEventListener('mouseleave', () => cardBack.style.opacity = '1');
                cardBack.addEventListener('click', () => {
                    const resolver = this.responseResolver;
                    this.responseResolver = null;
                    this.responseMode = null;
                    document.getElementById('response-panel').classList.add('hidden');
                    resolver({ type: 'hand', index: idx });
                });
                container.appendChild(cardBack);
            });
            
            if (!hasCards) {
                this.responseMode = null;
                this.responseResolver = null;
                resolve(null);
                return;
            }
            
            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 乐不思蜀结算 =====
    resolveLebusishuPlayer(sourceIdx, targetIdx) {
        const target = this.players[targetIdx];
        this.log(`你使用【乐不思蜀】，目标：${target.hero.name}`, 'player');
        this.sayHeroLine(0, 'skill');
        target.lebusishu = true;
        this.log(`${target.hero.name}进入乐不思蜀状态`, 'system');
        this.render();
    },

    resolveLebusishu(sourceIdx, targetIdx) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        this.log(`${source.hero.name}使用【乐不思蜀】，目标：${target.hero.name}`, 'ai');
        this.sayHeroLine(1, 'skill');
        target.lebusishu = true;
        this.log(`${target.hero.name}进入乐不思蜀状态`, 'system');
        this.render();
    },

    // 乐不思蜀判定（在回合开始时调用）
    async processLebusishu(playerIdx) {
        const player = this.players[playerIdx];
        if (!player.lebusishu) return false; // 没有被乐不思蜀
        
        player.lebusishu = false;
        this.log(`${player.hero.name}进行【乐不思蜀】判定...`, 'system');
        this.sayHeroLine(playerIdx, 'skill');
        this.render();
        await this.delay(1200);
        
        const judgeCard = this.drawCard();
        this.discardPile.push(judgeCard);
        this.log(`判定结果：${judgeCard.suit}${judgeCard.number}（${judgeCard.isRed ? '红色' : '黑色'}）`, 'system');
        this.render();
        await this.delay(1000);
        
        // 天妒/鬼才处理
        const finalJudgeCard = await this.processJudgeCard(playerIdx, judgeCard);
        
        if (finalJudgeCard.suit === SUIT.HEART) {
            this.log(`判定为红桃，乐不思蜀失效！`, 'system');
            this.render();
            await this.delay(800);
            return false; // 不跳过出牌阶段
        } else {
            this.log(`判定非红桃，乐不思蜀生效，跳过出牌阶段！`, 'system');
            this.render();
            await this.delay(800);
            return true; // 跳过出牌阶段
        }
    },

    // 洛神技能（甄姬）- 回合开始阶段进行判定
    async processLuoshen(playerIdx) {
        const player = this.players[playerIdx];
        if (!hasSkill(player.hero, '洛神')) return;

        this.log(`${player.hero.name}发动【洛神】`, playerIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(playerIdx, 'skill');
        this.render();
        await this.delay(800);

        let continueLuoshen = true;
        while (continueLuoshen) {
            const judgeCard = this.drawCard();
            if (!judgeCard) break; // 牌堆为空

            this.log(`判定结果：${judgeCard.suit}${judgeCard.number}（${judgeCard.isRed ? '红色' : '黑色'}）`, 'system');
            this.render();
            await this.delay(800);

            if (!judgeCard.isRed) {
                // 黑色：获得此牌，可以继续
                player.hand.push(judgeCard);
                this.log(`${player.hero.name}获得【${judgeCard.name}】（${judgeCard.suit}${judgeCard.number}）`, playerIdx === 0 ? 'player' : 'ai');
                this.render();
                await this.delay(600);

                // 玩家选择是否继续
                if (playerIdx === 0 && !player.isAI) {
                    continueLuoshen = await this.askLuoshenContinue();
                } else {
                    // AI总是继续
                    continueLuoshen = true;
                }
            } else {
                // 红色：弃置此牌，洛神结束
                this.discardPile.push(judgeCard);
                this.log(`判定为红色，【${judgeCard.name}】进入弃牌堆，洛神结束`, 'system');
                this.render();
                await this.delay(600);
                continueLuoshen = false;
            }
        }
    },

    // 询问玩家是否继续洛神
    askLuoshenContinue() {
        return new Promise((resolve) => {
            this.responseMode = 'luoshen';
            this.responseResolver = resolve;

            document.getElementById('response-prompt').textContent = '是否继续发动【洛神】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';

            const btn1 = document.createElement('button');
            btn1.className = 'action-btn green';
            btn1.textContent = '继续洛神';
            btn1.addEventListener('click', () => {
                const r = this.responseResolver;
                this.responseResolver = null;
                this.responseMode = null;
                document.getElementById('response-panel').classList.add('hidden');
                r(true);
            });
            container.appendChild(btn1);

            const btn2 = document.createElement('button');
            btn2.className = 'action-btn';
            btn2.textContent = '停止洛神';
            btn2.addEventListener('click', () => {
                const r = this.responseResolver;
                this.responseResolver = null;
                this.responseMode = null;
                document.getElementById('response-panel').classList.add('hidden');
                r(false);
            });
            container.appendChild(btn2);

            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 火攻结算 =====
    async resolveHuogongPlayer(sourceIdx, targetIdx) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        this.log(`你使用【火攻】，目标：${target.hero.name}`, 'player');
        this.sayHeroLine(0, 'skill');
        
        if (source.hand.length === 0) {
            this.log(`你没有手牌，火攻无效`, 'system');
            this.render();
            return;
        }
        
        // 简化：直接造成1点伤害
        this.log(`你展示一张手牌发动火攻`, 'player');
        this.render();
        await this.delay(1000);
        this.log(`${target.hero.name}受到1点火焰伤害`, 'damage');
        this.sayHeroLine(targetIdx, 'damage');
        await this.dealDamage(targetIdx, sourceIdx, null);
        this.render();
    },

    async resolveHuogong(sourceIdx, targetIdx) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        this.log(`${source.hero.name}使用【火攻】，目标：${target.hero.name}`, 'ai');
        this.sayHeroLine(1, 'skill');
        
        if (source.hand.length === 0) {
            this.log(`${source.hero.name}没有手牌，火攻无效`, 'system');
            this.render();
            return;
        }
        
        this.log(`${source.hero.name}展示一张手牌发动火攻`, 'ai');
        this.render();
        await this.delay(1000);
        this.log(`你受到1点火焰伤害`, 'damage');
        this.sayHeroLine(0, 'damage');
        await this.dealDamage(targetIdx, sourceIdx, null);
        this.render();
    },

    // ===== 桃园结义结算 =====
    resolveTaoyuan(sourceIdx) {
        this.log(`使用【桃园结义】，所有角色回复1点体力`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        for (let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            if (p.hp < p.maxHp) {
                this.heal(i, 1);
                this.log(`${p.hero.name}回复1点体力`, i === 0 ? 'player' : 'ai');
                this.sayHeroLine(i, 'heal');
            }
        }
        this.render();
    },

    // ===== 五谷丰登结算 =====
    resolveWugu(sourceIdx) {
        this.log(`使用【五谷丰登】，所有角色摸一张牌`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        for (let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            const card = this.drawCard();
            p.hand.push(card);
            this.log(`${p.hero.name}摸了一张牌`, i === 0 ? 'player' : 'ai');
        }
        this.render();
    },

    // ===== 装备 =====
    equipCard(playerIdx, card) {
        const player = this.players[playerIdx];
        const slot = card.equipType === EQUIP_TYPE.WEAPON ? 'weapon' :
                     card.equipType === EQUIP_TYPE.ARMOR ? 'armor' :
                     card.equipType === EQUIP_TYPE.MOUNT_PLUS ? 'mountPlus' : 'mountMinus';
        
        // 如果已有装备，弃置旧装备
        if (player.equipment[slot]) {
            this.discardPile.push(player.equipment[slot]);
            this.log(`${player.hero.name}替换了${this.getEquipName(slot)}`, playerIdx === 0 ? 'player' : 'ai');
            // 枭姬（孙尚香）：失去装备后摸两张牌
            if (hasSkill(player.hero, '枭姬')) {
                const c1 = this.drawCard();
                const c2 = this.drawCard();
                player.hand.push(c1, c2);
                this.log(`${player.hero.name}发动【枭姬】，摸了2张牌`, playerIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(playerIdx, 'skill');
            }
        }
        player.equipment[slot] = card;
    },

    // 连营（陆逊）：失去最后的手牌时摸一张牌
    checkLianying(playerIdx) {
        const player = this.players[playerIdx];
        if (hasSkill(player.hero, '连营') && player.hand.length === 0) {
            const card = this.drawCard();
            player.hand.push(card);
            this.log(`${player.hero.name}发动【连营】，摸了1张牌`, playerIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(playerIdx, 'skill');
            this.render();
        }
    },

    getEquipName(slot) {
        return { weapon: '武器', armor: '防具', mountPlus: '防御马', mountMinus: '攻击马' }[slot];
    },

    // ===== 伤害结算 =====
    async dealDamage(targetIdx, sourceIdx, card) {
        const target = this.players[targetIdx];

        // 天香（小乔）：受到伤害时可以弃置一张红桃手牌将伤害转移给来源
        if (hasSkill(target.hero, '天香') && sourceIdx >= 0) {
            const heartCard = target.hand.find(c => c.suit === SUIT.HEART);
            if (heartCard) {
                let useTianxiang = false;
                if (target.isAI) {
                    // AI在血量低或致命伤害时自动使用
                    if (target.hp <= 2) useTianxiang = true;
                } else {
                    // 询问玩家
                    this.responseMode = 'tianxiang';
                    this.responseResolver = null;
                    this.render();
                    const choice = await this.askPlayerTianxiang();
                    useTianxiang = choice;
                }
                if (useTianxiang) {
                    target.hand = target.hand.filter(c => c.id !== heartCard.id);
                    this.discardPile.push(heartCard);
                    this.log(`${target.hero.name}发动【天香】，弃置【${heartCard.name}】，将伤害转移给${this.players[sourceIdx].hero.name}`, targetIdx === 0 ? 'player' : 'ai');
                    this.sayHeroLine(targetIdx, 'skill');
                    this.render();
                    await this.delay(500);
                    await this.dealDamage(sourceIdx, -1, null);
                    return;
                }
            }
        }

        let damageAmount = 1;
        
        // 裸衣（许褚）：杀伤害+1
        if (sourceIdx >= 0) {
            const source = this.players[sourceIdx];
            if (hasSkill(source.hero, '裸衣') && card && card.defKey === 'sha') {
                damageAmount = 2;
                this.log(`${source.hero.name}【裸衣】生效，伤害+1`, sourceIdx === 0 ? 'player' : 'ai');
            }
        }
        
        target.hp -= damageAmount;
        
        this.log(`${target.hero.name}受到${damageAmount}点伤害（${target.hp}/${target.maxHp}）`, 'damage');
        this.sayHeroLine(targetIdx, 'damage');
        this.flashDamage(targetIdx);
        
        // 麒麟弓：造成伤害后弃置对方坐骑
        if (sourceIdx >= 0) {
            const source = this.players[sourceIdx];
            if (source.equipment.weapon && source.equipment.weapon.defKey === 'qilingong' && (target.equipment.mountPlus || target.equipment.mountMinus)) {
                const mountSlot = target.equipment.mountMinus ? 'mountMinus' : 'mountPlus';
                const mount = target.equipment[mountSlot];
                target.equipment[mountSlot] = null;
                this.discardPile.push(mount);
                this.log(`${source.hero.name}发动【麒麟弓】，弃置了${target.hero.name}的【${mount.name}】`, sourceIdx === 0 ? 'player' : 'ai');
            }
        }
        
        this.render();
        
        if (target.hp <= 0) {
            await this.checkDying(targetIdx, sourceIdx, card);
        } else {
            // 触发伤害后技能
            await this.triggerAfterDamage(targetIdx, sourceIdx, card);
        }
    },

    async triggerAfterDamage(targetIdx, sourceIdx, card) {
        const target = this.players[targetIdx];
        
        // 奸雄（曹操）：获得造成伤害的牌
        if (hasSkill(target.hero, '奸雄') && card) {
            // 从弃牌堆取回
            const idx = this.discardPile.findIndex(c => c.id === card.id);
            if (idx >= 0) {
                this.discardPile.splice(idx, 1);
                target.hand.push(card);
                this.log(`${target.hero.name}发动【奸雄】，获得【${card.name}】`, targetIdx === 0 ? 'player' : 'ai');
                this.render();
            }
        }
        
        // 反馈（司马懿）：获得来源一张牌
        if (hasSkill(target.hero, '反馈') && sourceIdx >= 0) {
            const source = this.players[sourceIdx];
            if (source.hand.length > 0) {
                const randomIdx = Math.floor(Math.random() * source.hand.length);
                const stolen = source.hand.splice(randomIdx, 1)[0];
                target.hand.push(stolen);
                this.log(`${target.hero.name}发动【反馈】，获得${source.hero.name}的一张牌`, targetIdx === 0 ? 'player' : 'ai');
                this.render();
            } else if (source.equipment.weapon) {
                const stolen = source.equipment.weapon;
                source.equipment.weapon = null;
                target.hand.push(stolen);
                this.log(`${target.hero.name}发动【反馈】，获得${source.hero.name}的【${stolen.name}】`, targetIdx === 0 ? 'player' : 'ai');
                this.render();
            } else if (source.equipment.armor) {
                const stolen = source.equipment.armor;
                source.equipment.armor = null;
                target.hand.push(stolen);
                this.log(`${target.hero.name}发动【反馈】，获得${source.hero.name}的【${stolen.name}】`, targetIdx === 0 ? 'player' : 'ai');
                this.render();
            }
        }
        
        // 刚烈（夏侯惇）：来源弃牌或掉血
        if (hasSkill(target.hero, '刚烈') && sourceIdx >= 0) {
            await this.triggerGanglie(targetIdx, sourceIdx);
        }

        // 狂骨（魏延）：对距离1以内的目标造成伤害后回复1点
        if (sourceIdx >= 0 && hasSkill(this.players[sourceIdx].hero, '狂骨')) {
            const source = this.players[sourceIdx];
            if (source.hp < source.maxHp) {
                this.heal(sourceIdx, 1);
                this.log(`${source.hero.name}发动【狂骨】，回复1点体力`, sourceIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(sourceIdx, 'heal');
                this.render();
            }
        }

        // 遗计（郭嘉）：受到伤害后摸两张牌，可分配给其他角色
        if (hasSkill(target.hero, '遗计')) {
            const drawnCards = [];
            for (let i = 0; i < 2; i++) drawnCards.push(this.drawCard());
            this.log(`${target.hero.name}发动【遗计】，摸了2张牌`, targetIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(targetIdx, 'skill');
            // 简化：1v1中郭嘉自己留着牌
            target.hand.push(...drawnCards);
            this.render();
        }

        // 驱虎（荀彧）：受到伤害后令来源受到1点伤害
        if (hasSkill(target.hero, '驱虎') && sourceIdx >= 0) {
            this.log(`${target.hero.name}发动【驱虎】`, targetIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(targetIdx, 'skill');
            this.render();
            await this.dealDamage(sourceIdx, targetIdx, null);
        }

        // 节命（荀彧）：受到伤害后令一名角色摸至体力上限
        if (hasSkill(target.hero, '节命')) {
            this.log(`${target.hero.name}发动【节命】`, targetIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(targetIdx, 'skill');
            // 1v1简化：选择手牌最少的角色
            const targets = [0, 1];
            let bestIdx = targetIdx;
            let bestDiff = -1;
            for (const idx of targets) {
                const p = this.players[idx];
                const diff = p.maxHp - p.hand.length;
                if (diff > bestDiff && diff > 0) {
                    bestDiff = diff;
                    bestIdx = idx;
                }
            }
            if (bestDiff > 0) {
                const p = this.players[bestIdx];
                const drawCount = p.maxHp - p.hand.length;
                for (let i = 0; i < drawCount; i++) p.hand.push(this.drawCard());
                this.log(`${p.hero.name}摸至体力上限（+${drawCount}张）`, bestIdx === 0 ? 'player' : 'ai');
            }
            this.render();
        }
    },

    async triggerGanglie(targetIdx, sourceIdx) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        
        this.log(`${target.hero.name}发动【刚烈】`, 'system');
        
        if (source.isAI) {
            // AI选择
            const choice = AI.decideGanglie(this);
            if (choice.choice === 'discard' && source.hand.length > 0) {
                const idx = Math.floor(Math.random() * source.hand.length);
                const card = source.hand.splice(idx, 1)[0];
                this.discardPile.push(card);
                this.log(`${source.hero.name}弃置了一张牌`, 'ai');
            } else {
                source.hp -= 1;
                this.log(`${source.hero.name}受到1点伤害`, 'damage');
                if (source.hp <= 0) {
                    await this.checkDying(sourceIdx, targetIdx, null);
                    return;
                }
            }
            this.render();
        } else {
            // 询问玩家
            const choice = await this.askPlayerGanglie();
            if (choice === 'discard' && source.hand.length > 0) {
                // 等待玩家选择一张手牌弃置
                this.log(`请选择一张手牌弃置`, 'system');
                this.ganglieDiscard = true;
                this.render();
                await new Promise(resolve => { this.ganglieDiscardResolver = resolve; });
            } else {
                source.hp -= 1;
                this.log(`你受到1点伤害`, 'damage');
                this.flashDamage(0);
                if (source.hp <= 0) {
                    await this.checkDying(sourceIdx, targetIdx, null);
                }
                this.render();
            }
        }
    },

    // ===== 濒死检查 =====
    async checkDying(playerIdx, sourceIdx, card) {
        const player = this.players[playerIdx];
        this.log(`${player.hero.name}濒死！`, 'system');
        this.sayHeroLine(playerIdx, 'dying');

        // 完杀（贾诩）：回合内濒死角色只能自救
        const wanshaActive = this.players[this.currentPlayer] && hasSkill(this.players[this.currentPlayer].hero, '完杀');
        if (wanshaActive && playerIdx !== this.currentPlayer) {
            this.log(`${this.players[this.currentPlayer].hero.name}【完杀】生效，其他角色不能提供【桃】`, 'system');
        }
        
        if (player.isAI) {
            // AI自救
            const peach = AI.decidePeachOnDying(this);
            if (peach.use) {
                player.hand = player.hand.filter(c => c.id !== peach.card.id);
                this.discardPile.push(peach.card);
                player.hp = 1;
                const skillText = peach.asSkill ? '（仁德）' : '';
                this.log(`${player.hero.name}使用【桃】${skillText}自救，体力回复至1`, 'ai');
                this.sayHeroLine(playerIdx, 'heal');
                this.render();
                // 救回后触发伤害后技能
                await this.triggerAfterDamage(playerIdx, sourceIdx, card);
            } else {
                this.log(`${player.hero.name}阵亡`, 'system');
                this.gameOver = true;
                this.showGameOver(playerIdx === 1);
            }
        } else {
            // 询问玩家是否用桃
            const response = await this.askPlayerPeach();
            if (response.use) {
                player.hand = player.hand.filter(c => c.id !== response.card.id);
                this.discardPile.push(response.card);
                player.hp = 1;
                const skillText = response.asSkill ? '（仁德）' : '';
                this.log(`你使用【桃】${skillText}自救，体力回复至1`, 'player');
                this.sayHeroLine(playerIdx, 'heal');
                this.render();
                // 救回后触发伤害后技能
                await this.triggerAfterDamage(playerIdx, sourceIdx, card);
            } else {
                this.log(`你阵亡了`, 'system');
                this.gameOver = true;
                this.showGameOver(false);
            }
        }
    },

    // ===== 治疗 =====
    heal(playerIdx, amount) {
        const player = this.players[playerIdx];
        player.hp = Math.min(player.maxHp, player.hp + amount);
    },

    // ===== 牌堆操作 =====
    drawCard() {
        if (this.deck.length === 0) {
            // 重新洗牌
            this.deck = shuffleDeck(this.discardPile);
            this.discardPile = [];
            this.log('牌堆已重新洗牌', 'system');
        }
        return this.deck.pop();
    },

    // ===== 玩家响应系统 =====
    
    // 询问玩家出闪
    askPlayerDodge(needCount) {
        return new Promise((resolve) => {
            this.responseMode = 'dodge';
            this.responseNeedCount = needCount;
            this.responseSelectedCards = [];
            this.responseResolver = resolve;
            document.getElementById('response-cancel').style.display = '';
            
            const player = this.players[0];
            const shans = player.hand.filter(c => c.defKey === 'shan');
            const shas = hasSkill(player.hero, '龙胆') ? player.hand.filter(c => c.defKey === 'sha') : [];
            // 倾国（甄姬）：黑色手牌当闪
            const qingguoCards = hasSkill(player.hero, '倾国') ? player.hand.filter(c => !c.isRed && c.defKey !== 'shan') : [];
            
            const promptText = needCount > 1 
                ? `对方使用了【杀】（无双），你需要出${needCount}张【闪】` 
                : `对方使用了【杀】，是否出【闪】？`;
            
            document.getElementById('response-prompt').textContent = promptText;
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            [...shans, ...shas, ...qingguoCards].forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });
            
            document.getElementById('response-cancel').textContent = needCount > 1 ? `不出（受${needCount}点伤害）` : '不闪（受1点伤害）';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    isValidResponseCard(card) {
        const player = this.players[0];
        if (this.responseMode === 'dodge') {
            if (card.defKey === 'shan') return true;
            if (hasSkill(player.hero, '龙胆') && card.defKey === 'sha') return true;
            // 倾国（甄姬）：黑色手牌当闪
            if (hasSkill(player.hero, '倾国') && !card.isRed) return true;
            return false;
        }
        if (this.responseMode === 'duel') {
            return card.defKey === 'sha';
        }
        if (this.responseMode === 'nanman') {
            if (card.defKey === 'sha') return true;
            if (hasSkill(player.hero, '龙胆') && card.defKey === 'shan') return true;
            return false;
        }
        if (this.responseMode === 'wanjian') {
            if (card.defKey === 'shan') return true;
            if (hasSkill(player.hero, '龙胆') && card.defKey === 'sha') return true;
            // 倾国（甄姬）：黑色手牌当闪
            if (hasSkill(player.hero, '倾国') && !card.isRed) return true;
            return false;
        }
        if (this.responseMode === 'peach') {
            if (card.defKey === 'tao') return true;
            return false; // 仁德的卡由专用处理器处理
        }
        return false;
    },

    handleResponseCardClick(card) {
        if (!this.responseResolver) return;
        if (!this.isValidResponseCard(card)) return;
        
        if (this.responseMode === 'dodge') {
            // 选择/取消选择闪
            const idx = this.responseSelectedCards.findIndex(c => c.id === card.id);
            if (idx >= 0) {
                this.responseSelectedCards.splice(idx, 1);
            } else {
                this.responseSelectedCards.push(card);
            }
            
            // 更新选中状态
            document.querySelectorAll('#response-cards .card').forEach(el => {
                el.classList.remove('selected');
            });
            this.responseSelectedCards.forEach(c => {
                const el = [...document.querySelectorAll('#response-cards .card')].find(e => e.dataset.cardId === c.id);
                if (el) el.classList.add('selected');
            });
            
            // 如果选够了，自动确认
            if (this.responseSelectedCards.length === this.responseNeedCount) {
                setTimeout(() => this.confirmDodgeResponse(), 300);
            }
        } else if (this.responseMode === 'duel') {
            this.responseSelectedCards = [card];
            this.confirmDuelResponse();
        } else if (this.responseMode === 'nanman') {
            this.responseSelectedCards = [card];
            this.confirmNanmanResponse();
        } else if (this.responseMode === 'wanjian') {
            this.responseSelectedCards = [card];
            this.confirmWanjianResponse();
        } else if (this.responseMode === 'peach') {
            this.responseSelectedCards = [card];
            this.confirmPeachResponse();
        } else if (this.responseMode === 'ganglie') {
            // ganglie只是选择弃牌还是掉血，不在这里处理
        }
    },

    confirmDodgeResponse() {
        const resolver = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        
        if (this.responseSelectedCards.length === this.responseNeedCount) {
            resolver({ dodge: true, cards: [...this.responseSelectedCards] });
        } else {
            resolver({ dodge: false, cards: [] });
        }
        this.responseSelectedCards = [];
    },

    cancelResponse() {
        if (!this.responseResolver) return;
        
        if (this.responseMode === 'dodge') {
            this.confirmDodgeResponse();
        } else if (this.responseMode === 'duel') {
            this.confirmDuelResponse();
        } else if (this.responseMode === 'nanman') {
            this.confirmNanmanResponse();
        } else if (this.responseMode === 'wanjian') {
            this.confirmWanjianResponse();
        } else if (this.responseMode === 'peach') {
            this.confirmPeachResponse();
        } else if (this.responseMode === 'ganglie') {
            const resolver = this.responseResolver;
            this.responseResolver = null;
            this.responseMode = null;
            document.getElementById('response-panel').classList.add('hidden');
            resolver('damage');
        } else if (this.responseMode === 'luoshen') {
            const resolver = this.responseResolver;
            this.responseResolver = null;
            this.responseMode = null;
            document.getElementById('response-panel').classList.add('hidden');
            resolver(false);
        } else if (this.responseMode === 'fanjian') {
            const resolver = this.responseResolver;
            this.responseResolver = null;
            this.responseMode = null;
            document.getElementById('response-panel').classList.add('hidden');
            resolver('damage');
        } else if (this.responseMode === 'tianxiang') {
            const resolver = this.responseResolver;
            this.responseResolver = null;
            this.responseMode = null;
            document.getElementById('response-panel').classList.add('hidden');
            resolver(false);
        }
    },

    // 询问玩家决斗出杀
    askPlayerDuel() {
        return new Promise((resolve) => {
            this.responseMode = 'duel';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;
            document.getElementById('response-cancel').style.display = '';
            
            const player = this.players[0];
            const shas = player.hand.filter(c => c.defKey === 'sha');
            // 龙胆：闪当杀
            const longdanShans = hasSkill(player.hero, '龙胆') ? player.hand.filter(c => c.defKey === 'shan') : [];
            
            document.getElementById('response-prompt').textContent = '决斗！是否出【杀】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            // 显示普通杀
            shas.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });
            
            // 显示龙胆闪（标记为可当杀使用）
            longdanShans.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                // 添加龙胆标记
                const badge = document.createElement('div');
                badge.textContent = '龙胆';
                badge.style.cssText = 'position: absolute; top: 2px; right: 2px; background: #4a90d9; color: white; font-size: 10px; padding: 1px 4px; border-radius: 3px;';
                cardEl.style.position = 'relative';
                cardEl.appendChild(badge);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });
            
            document.getElementById('response-cancel').textContent = '不出杀（受1点伤害）';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    confirmDuelResponse() {
        const resolver = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        
        if (this.responseSelectedCards.length > 0) {
            resolver({ play: true, card: this.responseSelectedCards[0] });
        } else {
            resolver({ play: false, card: null });
        }
        this.responseSelectedCards = [];
    },

    // 询问玩家南蛮出杀
    askPlayerNanman() {
        return new Promise((resolve) => {
            this.responseMode = 'nanman';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;
            document.getElementById('response-cancel').style.display = '';
            
            const player = this.players[0];
            const shas = player.hand.filter(c => c.defKey === 'sha');
            // 龙胆：闪当杀
            const longdanShans = hasSkill(player.hero, '龙胆') ? player.hand.filter(c => c.defKey === 'shan') : [];
            
            document.getElementById('response-prompt').textContent = '南蛮入侵！是否出【杀】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            // 显示普通杀
            shas.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });
            
            // 显示龙胆闪（标记为可当杀使用）
            longdanShans.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                const badge = document.createElement('div');
                badge.textContent = '龙胆';
                badge.style.cssText = 'position: absolute; top: 2px; right: 2px; background: #4a90d9; color: white; font-size: 10px; padding: 1px 4px; border-radius: 3px;';
                cardEl.style.position = 'relative';
                cardEl.appendChild(badge);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });
            
            document.getElementById('response-cancel').textContent = '不出杀（受1点伤害）';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    confirmNanmanResponse() {
        const resolver = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        
        if (this.responseSelectedCards.length > 0) {
            resolver({ play: true, card: this.responseSelectedCards[0] });
        } else {
            resolver({ play: false, card: null });
        }
        this.responseSelectedCards = [];
    },

    // 询问玩家万箭出闪
    askPlayerWanjian() {
        return new Promise((resolve) => {
            this.responseMode = 'wanjian';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;
            document.getElementById('response-cancel').style.display = '';
            
            const player = this.players[0];
            const shans = player.hand.filter(c => c.defKey === 'shan');
            const shas = hasSkill(player.hero, '龙胆') ? player.hand.filter(c => c.defKey === 'sha') : [];
            // 倾国（甄姬）：黑色手牌当闪
            const qingguoCards = hasSkill(player.hero, '倾国') ? player.hand.filter(c => !c.isRed && c.defKey !== 'shan') : [];
            
            document.getElementById('response-prompt').textContent = '万箭齐发！是否出【闪】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            [...shans, ...shas, ...qingguoCards].forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });
            
            document.getElementById('response-cancel').textContent = '不出闪（受1点伤害）';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    confirmWanjianResponse() {
        const resolver = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        
        if (this.responseSelectedCards.length > 0) {
            resolver({ play: true, card: this.responseSelectedCards[0] });
        } else {
            resolver({ play: false, card: null });
        }
        this.responseSelectedCards = [];
    },

    // 询问玩家桃自救
    askPlayerPeach() {
        return new Promise((resolve) => {
            this.responseMode = 'peach';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;
            document.getElementById('response-cancel').style.display = '';
        
        const player = this.players[0];
        const taos = player.hand.filter(c => c.defKey === 'tao');
        
        document.getElementById('response-prompt').textContent = '你濒死了！是否使用【桃】自救？';
        const container = document.getElementById('response-cards');
        container.innerHTML = '';
        
        taos.forEach(card => {
            const cardEl = this.createCardElement(card, true);
            cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
            container.appendChild(cardEl);
        });
        
        // 仁德：任意手牌当桃
        if (hasSkill(player.hero, '仁德') && player.hand.length > 0) {
            const otherCards = player.hand.filter(c => c.defKey !== 'tao');
            otherCards.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.style.borderColor = '#88ccff';
                cardEl.title = '仁德：当桃使用';
                cardEl.addEventListener('click', () => {
                    this.responseSelectedCards = [card];
                    this.confirmPeachResponseWithSkill();
                });
                container.appendChild(cardEl);
            });
        }
        
        // 急救（华佗）：红色牌当桃
        if (hasSkill(player.hero, '急救')) {
            const redCards = player.hand.filter(c => c.isRed && c.defKey !== 'tao');
            redCards.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.style.borderColor = '#ff8866';
                cardEl.title = '急救：当桃使用';
                cardEl.addEventListener('click', () => {
                    this.responseSelectedCards = [card];
                    this.confirmPeachResponseWithSkill();
                });
                container.appendChild(cardEl);
            });
        }
        
            document.getElementById('response-cancel').textContent = '不救（阵亡）';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    confirmPeachResponse() {
        const resolver = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        
        if (this.responseSelectedCards.length > 0) {
            resolver({ use: true, card: this.responseSelectedCards[0], asSkill: false });
        } else {
            resolver({ use: false, card: null });
        }
        this.responseSelectedCards = [];
    },

    confirmPeachResponseWithSkill() {
        const resolver = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        
        if (this.responseSelectedCards.length > 0) {
            resolver({ use: true, card: this.responseSelectedCards[0], asSkill: true });
        } else {
            resolver({ use: false, card: null });
        }
        this.responseSelectedCards = [];
    },

    // 询问玩家刚烈选择
    askPlayerGanglie() {
        return new Promise((resolve) => {
            this.responseMode = 'ganglie';
            this.responseResolver = resolve;
            
            const player = this.players[0];
            document.getElementById('response-prompt').textContent = `夏侯惇发动【刚烈】！弃一张手牌或受到1点伤害？`;
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            if (player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '弃一张手牌';
                btn.style.marginRight = '10px';
                btn.addEventListener('click', () => {
                    const resolver = this.responseResolver;
                    this.responseResolver = null;
                    this.responseMode = null;
                    document.getElementById('response-panel').classList.add('hidden');
                    resolver('discard');
                });
                container.appendChild(btn);
            }
            
            const btn2 = document.createElement('button');
            btn2.className = 'action-btn';
            btn2.textContent = '受到1点伤害';
            btn2.addEventListener('click', () => {
                const resolver = this.responseResolver;
                this.responseResolver = null;
                this.responseMode = null;
                document.getElementById('response-panel').classList.add('hidden');
                resolver('damage');
            });
            container.appendChild(btn2);
            
            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    cancelSkill() {
        document.getElementById('skill-panel').classList.add('hidden');
        if (this.skillResolver) {
            this.skillResolver(null);
            this.skillResolver = null;
        }
    },

    // ===== 弃牌 =====
    handleDiscardClick(card) {
        const player = this.players[0];
        player.hand = player.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        this.discardedCount++;
        this.log(`你弃置了【${card.name}】`, 'player');
        
        if (this.discardedCount >= this.needDiscardCount) {
            this.afterDiscard(0);
        } else {
            this.render();
        }
    },

    // ===== 渲染 =====
    render() {
        if (this.phase === 'select') return;
        
        // 渲染玩家信息
        this.renderPlayer(0);
        this.renderPlayer(1);
        
        // 渲染手牌
        this.renderPlayerHand();
        this.renderAIHand();
        
        // 渲染操作栏
        this.renderActionBar();
    },

    renderPlayer(idx) {
        const player = this.players[idx];
        const prefix = idx === 0 ? 'player' : 'ai';
        
        // 头像区域 - 显示武将牌样式（带背景图）
        const avatar = document.getElementById(`${prefix}-avatar`);
        const factionColor = FACTION_COLOR[player.hero.faction];
        avatar.style.borderColor = factionColor;
        avatar.style.backgroundImage = `url('${player.hero.avatar}')`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.innerHTML = `
            <div class="hero-card-mini">
                <div class="hero-card-faction-badge" style="background:${factionColor}">${player.hero.faction}</div>
            </div>
        `;
        
        // 头像悬停展示武将技能详情
        avatar.onmouseenter = (e) => this.showHeroTooltip(player.hero, e);
        avatar.onmouseleave = () => this.hideTooltip();
        avatar.onmousemove = (e) => this.moveTooltip(e);
        
        // 名字
        document.getElementById(`${prefix}-name`).textContent = player.hero.name;
        document.getElementById(`${prefix}-faction`).textContent = `${player.hero.faction}势力 · ${player.hero.title}`;
        
        // 血量
        const hpBar = document.getElementById(`${prefix}-hp`);
        hpBar.innerHTML = '';
        for (let i = 0; i < player.maxHp; i++) {
            const point = document.createElement('div');
            point.className = 'hp-point' + (i >= player.hp ? ' lost' : '');
            hpBar.appendChild(point);
        }
        
        // 技能
        const skillsDiv = document.getElementById(`${prefix}-skills`);
        skillsDiv.innerHTML = player.hero.skills.map(s => 
            `<span class="skill-tag" title="${s.desc}">${s.name}</span>`
        ).join('');
        
        // 装备
        const equipDiv = document.getElementById(`${prefix}-equip`);
        equipDiv.innerHTML = '';
        ['weapon', 'armor', 'mountPlus', 'mountMinus'].forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'equip-slot';
            const equip = player.equipment[slot];
            if (equip) {
                slotDiv.classList.add('equipped');
                slotDiv.textContent = equip.short;
                slotDiv.title = equip.name + '：' + equip.desc;
            } else {
                slotDiv.textContent = { weapon: '武器', armor: '防具', mountPlus: '+马', mountMinus: '-马' }[slot];
            }
            equipDiv.appendChild(slotDiv);
        });
        
        // 乐不思蜀状态
        const statusDiv = document.getElementById(`${prefix}-skills`);
        if (player.lebusishu) {
            const leTag = document.createElement('span');
            leTag.className = 'skill-tag';
            leTag.style.cssText = 'background:#8B4513;color:#FFD700;border-color:#8B4513;';
            leTag.textContent = '乐不思蜀';
            leTag.title = '回合开始时进行判定，非红桃则跳过出牌阶段';
            statusDiv.appendChild(leTag);
        }
        
        // 卡牌数量（AI）
        if (idx === 1) {
            document.getElementById('ai-card-count').textContent = player.hand.length;
        }
    },

    renderPlayerHand() {
        const container = document.getElementById('player-hand');
        container.innerHTML = '';
        const player = this.players[0];
        
        // 手牌较多时启用紧凑模式（手机端）
        const isMobile = window.innerWidth <= 768;
        if (isMobile && player.hand.length > 7) {
            container.classList.add('compact');
        } else {
            container.classList.remove('compact');
        }
        
        player.hand.forEach(card => {
            const playable = this.getCardPlayableAs(0, card);
            const isPlayable = playable.length > 0 && this.currentPlayer === 0 && !this.responseResolver && !this.discardMode && !this.processing && !this.zhihengMode && !this.lijianMode && !this.fanjianMode && !this.qingnangMode && !this.jieyinMode && !this.guanxingMode;
            const isDiscardable = this.discardMode;
            // 在制衡/离间/反间/青囊/结姻模式下，所有手牌可点击
            const isSkillSelectable = this.zhihengMode || this.lijianMode || this.fanjianMode || this.qingnangMode || this.jieyinMode;
            
            const cardEl = this.createCardElement(card, isPlayable || isDiscardable || isSkillSelectable);
            
            if (isPlayable && !isDiscardable && !isSkillSelectable) {
                cardEl.classList.add('playable');
            } else if (isSkillSelectable) {
                cardEl.classList.add('playable');
                // 结姻模式下已选中的牌高亮
                if (this.jieyinMode && this.jieyinCards.some(c => c.id === card.id)) {
                    cardEl.style.borderColor = '#ffd700';
                    cardEl.style.boxShadow = '0 0 8px rgba(255,215,0,0.5)';
                }
                // 制衡模式下已选中的牌高亮
                if (this.zhihengMode && this.zhihengCards.some(c => c.id === card.id)) {
                    cardEl.style.borderColor = '#ffd700';
                    cardEl.style.boxShadow = '0 0 8px rgba(255,215,0,0.5)';
                }
            } else if (!isPlayable && !isDiscardable && this.currentPlayer === 0 && !this.responseResolver && !this.processing) {
                cardEl.classList.add('unplayable');
            }
            
            cardEl.addEventListener('click', () => this.onPlayerCardClick(card));
            cardEl.addEventListener('mouseenter', (e) => this.showTooltip(card, e));
            cardEl.addEventListener('mouseleave', () => this.hideTooltip());
            cardEl.addEventListener('mousemove', (e) => this.moveTooltip(e));
            
            container.appendChild(cardEl);
        });
    },

    renderAIHand() {
        const container = document.getElementById('ai-hand');
        container.innerHTML = '';
        const ai = this.players[1];
        
        for (let i = 0; i < ai.hand.length; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            container.appendChild(cardBack);
        }
    },

    renderActionBar() {
        const actionBar = document.getElementById('action-bar');
        actionBar.innerHTML = '';
        
        // 音乐和语音控制已移到右上角音频控制面板
        
        if (this.currentPlayer === 0 && !this.gameOver && !this.responseResolver && !this.discardMode && !this.processing && !this.zhihengMode && !this.lijianMode && !this.fanjianMode && !this.qingnangMode && !this.jieyinMode && !this.guanxingMode) {
            // 技能按钮
            const player = this.players[0];
            
            // 苦肉
            if (hasSkill(player.hero, '苦肉') && !this.hasUsedKurouThisTurn && player.hp > 1) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '苦肉';
                btn.addEventListener('click', () => {
                    this.executeKurou(0);
                });
                actionBar.appendChild(btn);
            }
            
            // 制衡（孙权）
            if (hasSkill(player.hero, '制衡') && !this.hasUsedZhihengThisTurn && player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '制衡';
                btn.addEventListener('click', () => {
                    this.executeZhiheng(0);
                });
                actionBar.appendChild(btn);
            }

            // 离间（貂蝉）
            if (hasSkill(player.hero, '离间') && !this.hasUsedLijianThisTurn && player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '离间';
                btn.addEventListener('click', () => {
                    this.executeLijian(0);
                });
                actionBar.appendChild(btn);
            }

            // 反间（周瑜）
            if (hasSkill(player.hero, '反间') && !this.hasUsedFanjianThisTurn && player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '反间';
                btn.addEventListener('click', () => {
                    this.executeFanjian(0);
                });
                actionBar.appendChild(btn);
            }

            // 青囊（华佗）
            if (hasSkill(player.hero, '青囊') && !this.hasUsedQingnangThisTurn && player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '青囊';
                btn.addEventListener('click', () => {
                    this.executeQingnang(0);
                });
                actionBar.appendChild(btn);
            }

            // 结姻（孙尚香）
            if (hasSkill(player.hero, '结姻') && !this.hasUsedJieyinThisTurn && player.hand.length >= 2) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '结姻';
                btn.addEventListener('click', () => {
                    this.executeJieyin(0);
                });
                actionBar.appendChild(btn);
            }
            
            // 结束回合
            const endBtn = document.createElement('button');
            endBtn.className = 'action-btn';
            endBtn.id = 'btn-end-turn';
            endBtn.textContent = '结束回合';
            endBtn.addEventListener('click', () => {
                if (this.currentPlayer === 0 && !this.gameOver && !this.responseResolver) {
                    this.endPlayerTurn();
                }
            });
            actionBar.appendChild(endBtn);
        } else if (this.currentPlayer === 1 && !this.gameOver) {
            const indicator = document.createElement('span');
            indicator.className = 'action-info-box ai-thinking';
            indicator.textContent = `${this.players[1].hero.name}思考中`;
            actionBar.appendChild(indicator);
        }
        
        if (this.discardMode) {
            const info = document.createElement('span');
            info.className = 'action-info-box';
            info.textContent = `请弃置${this.needDiscardCount - this.discardedCount}张牌`;
            actionBar.appendChild(info);
        }

        if (this.zhihengMode) {
            const info = document.createElement('span');
            info.className = 'action-info-box';
            info.textContent = `制衡：已选${this.zhihengCards.length}张`;
            actionBar.appendChild(info);
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'action-btn green';
            confirmBtn.textContent = '确认制衡';
            confirmBtn.addEventListener('click', () => {
                const player = this.players[0];
                if (this.zhihengCards.length === 0) {
                    this.log('请至少选择一张牌', 'system');
                    return;
                }
                this.zhihengCards.forEach(c => {
                    player.hand = player.hand.filter(h => h.id !== c.id);
                    this.discardPile.push(c);
                });
                this.log(`你发动【制衡】，弃了${this.zhihengCards.length}张牌`, 'player');
                const drawnCards = [];
                for (let i = 0; i < this.zhihengCards.length; i++) drawnCards.push(this.drawCard());
                player.hand.push(...drawnCards);
                this.log(`你摸了${this.zhihengCards.length}张牌`, 'player');
                this.zhihengCards = [];
                this.render();
                if (this.zhihengResolver) {
                    const r = this.zhihengResolver;
                    this.zhihengResolver = null;
                    r();
                }
            });
            actionBar.appendChild(confirmBtn);
        }

        if (this.lijianMode) {
            const info = document.createElement('span');
            info.className = 'action-info-box';
            info.textContent = `离间：请选择一张手牌弃置`;
            actionBar.appendChild(info);
        }

        if (this.fanjianMode) {
            const info = document.createElement('span');
            info.className = 'action-info-box';
            info.textContent = `反间：请选择一张手牌给对手`;
            actionBar.appendChild(info);
        }

        if (this.qingnangMode) {
            const info = document.createElement('span');
            info.className = 'action-info-box';
            info.textContent = `青囊：请选择一张手牌弃置`;
            actionBar.appendChild(info);
        }

        if (this.jieyinMode) {
            const info = document.createElement('span');
            info.className = 'action-info-box';
            info.textContent = `结姻：已选${this.jieyinCards.length}/2张`;
            actionBar.appendChild(info);
            if (this.jieyinCards.length >= 2) {
                const confirmBtn = document.createElement('button');
                confirmBtn.className = 'action-btn green';
                confirmBtn.textContent = '确认结姻';
                confirmBtn.addEventListener('click', () => {
                    this.confirmJieyin();
                });
                actionBar.appendChild(confirmBtn);
            }
        }

        if (this.guanxingMode) {
            const info = document.createElement('span');
            info.className = 'action-info-box';
            info.textContent = `观星：点击选择置于牌堆顶的牌（已选${this.guanxingSelected ? this.guanxingSelected.length : 0}张）`;
            actionBar.appendChild(info);
            // 显示观星卡牌
            if (this.guanxingCards) {
                this.guanxingCards.forEach((card, i) => {
                    const cardEl = this.createCardElement(card, true);
                    const isSelected = this.guanxingSelected && this.guanxingSelected.includes(i);
                    if (isSelected) {
                        cardEl.style.borderColor = '#ffd700';
                        cardEl.style.boxShadow = '0 0 8px rgba(255,215,0,0.5)';
                    }
                    cardEl.addEventListener('click', () => {
                        if (!this.guanxingSelected) this.guanxingSelected = [];
                        const idx = this.guanxingSelected.indexOf(i);
                        if (idx >= 0) {
                            this.guanxingSelected.splice(idx, 1);
                        } else {
                            this.guanxingSelected.push(i);
                        }
                        this.render();
                    });
                    actionBar.appendChild(cardEl);
                });
            }
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'action-btn green';
            confirmBtn.textContent = '确认观星';
            confirmBtn.addEventListener('click', () => {
                this.confirmGuanxing(this.guanxingSelected || []);
            });
            actionBar.appendChild(confirmBtn);
        }
    },

    // 询问玩家是否使用天香
    askPlayerTianxiang() {
        return new Promise((resolve) => {
            this.responseMode = 'tianxiang';
            this.responseResolver = resolve;

            document.getElementById('response-prompt').textContent = '是否发动【天香】转移伤害？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';

            const btn1 = document.createElement('button');
            btn1.className = 'action-btn green';
            btn1.textContent = '发动天香';
            btn1.addEventListener('click', () => {
                const r = this.responseResolver;
                this.responseResolver = null;
                this.responseMode = null;
                document.getElementById('response-panel').classList.add('hidden');
                r(true);
            });
            container.appendChild(btn1);

            const btn2 = document.createElement('button');
            btn2.className = 'action-btn';
            btn2.textContent = '不发动';
            btn2.addEventListener('click', () => {
                const r = this.responseResolver;
                this.responseResolver = null;
                this.responseMode = null;
                document.getElementById('response-panel').classList.add('hidden');
                r(false);
            });
            container.appendChild(btn2);

            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    createCardElement(card, clickable) {
        const el = document.createElement('div');
        el.className = 'card';
        el.dataset.cardId = card.id;
        
        const suitClass = card.isRed ? 'red' : 'black';
        const typeLabel = card.type === 'basic' ? '基本' : card.type === 'trick' ? '锦囊' : '装备';
        
        el.innerHTML = `
            <div class="card-suit-number">
                <span class="card-suit ${suitClass}">${card.suit}</span>
                <span class="card-suit ${suitClass}">${this.numberToString(card.number)}</span>
            </div>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${typeLabel}</div>
        `;
        
        return el;
    },

    numberToString(num) {
        if (num === 1) return 'A';
        if (num === 11) return 'J';
        if (num === 12) return 'Q';
        if (num === 13) return 'K';
        return num.toString();
    },

    // ===== 日志 =====
    log(msg, type) {
        const content = document.getElementById('log-content');
        if (!content) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + (type || '');

        // 回合开始/结束用分割线样式
        if (msg.includes('回合开始') || msg.includes('回合结束')) {
            entry.classList.add('log-turn');
        }

        entry.innerHTML = this.formatLogMsg(msg, type);
        content.insertBefore(entry, content.firstChild);

        // 限制日志数量
        while (content.children.length > 30) {
            content.removeChild(content.lastChild);
        }

        // 语音朗读（如果刚朗读了武将台词则跳过，避免互相取消）
        if (!this._heroLineSpoken) {
            this.speak(msg);
        }
    },

    // 富文本格式化日志消息
    formatLogMsg(msg, type) {
        // 先转义 HTML 特殊字符
        let html = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 将【卡牌名/技能名】包裹为高亮徽章
        html = html.replace(/【([^】]+)】/g, '<span class="log-card">【$1】</span>');

        // 根据内容添加动作图标
        let icon = '';
        if (type === 'system') {
            icon = '<span class="log-icon icon-sys">◆</span>';
        } else if (msg.includes('回合开始')) {
            icon = '<span class="log-icon icon-turn">⟫</span>';
        } else if (msg.includes('回合结束')) {
            icon = '<span class="log-icon icon-turn">⟪</span>';
        } else if (msg.includes('濒死') || msg.includes('阵亡')) {
            icon = '<span class="log-icon icon-death">☠</span>';
        } else if (msg.includes('伤害') || msg.includes('流失') || msg.includes('受到')) {
            icon = '<span class="log-icon icon-dmg">✸</span>';
        } else if (msg.includes('回复') || msg.includes('治疗') || msg.includes('自救')) {
            icon = '<span class="log-icon icon-heal">✚</span>';
        } else if (msg.includes('发动【')) {
            icon = '<span class="log-icon icon-skill">✦</span>';
        } else if (msg.includes('装备')) {
            icon = '<span class="log-icon icon-equip">⚙</span>';
        } else if (msg.includes('杀') && !msg.includes('没有') || msg.includes('决斗') || msg.includes('南蛮') || msg.includes('万箭') || msg.includes('火攻')) {
            icon = '<span class="log-icon icon-atk">⚔</span>';
        } else if (msg.includes('闪') && !msg.includes('没有') && !msg.includes('不出')) {
            icon = '<span class="log-icon icon-def">🛡</span>';
        } else if (msg.includes('摸了') || msg.includes('摸')) {
            icon = '<span class="log-icon icon-draw">✧</span>';
        } else if (msg.includes('弃')) {
            icon = '<span class="log-icon icon-discard">✕</span>';
        } else if (msg.includes('使用【') || msg.includes('出【')) {
            icon = '<span class="log-icon icon-play">▸</span>';
        }

        return icon + ' ' + html;
    },

    // ===== 语音朗读 =====
    speak(text) {
        if (!this.ttsEnabled) return;
        if (!window.speechSynthesis) return;
        
        // 清理文本：去掉特殊符号，让朗读更自然
        let cleanText = text.replace(/【/g, '').replace(/】/g, '').replace(/（/g, ',').replace(/）/g, '').replace(/`/g, '');
        
        this._enqueueSpeech(cleanText, { rate: 1.1, pitch: 1.0, priority: 0 });
    },
    
    // 语音队列管理
    _enqueueSpeech(text, opts) {
        // priority: 0=普通日志, 1=武将台词
        // 队列上限：普通消息最多排2条，台词不受限
        if (opts.priority === 0) {
            // 如果队列中已有2条低优先级消息，丢弃最早的
            let lowCount = this._speechQueue.filter(i => i.priority === 0).length;
            if (lowCount >= 2) {
                let idx = this._speechQueue.findIndex(i => i.priority === 0);
                if (idx >= 0) this._speechQueue.splice(idx, 1);
            }
        } else {
            // 台词入队时，清掉队列中未读的普通日志
            this._speechQueue = this._speechQueue.filter(i => i.priority !== 0);
        }
        this._speechQueue.push({ text, ...opts });
        if (!this._speaking) this._processSpeechQueue();
    },
    
    _processSpeechQueue() {
        if (this._speechQueue.length === 0) {
            this._speaking = false;
            return;
        }
        this._speaking = true;
        const item = this._speechQueue.shift();
        
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.lang = 'zh-CN';
        utterance.rate = item.rate || 1.0;
        utterance.pitch = item.pitch || 1.0;
        utterance.volume = this.ttsVolume;
        
        // 尝试使用中文语音
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang.startsWith('zh'));
        if (zhVoice) utterance.voice = zhVoice;
        
        utterance.onend = () => { this._processSpeechQueue(); };
        utterance.onerror = () => { this._processSpeechQueue(); };
        
        window.speechSynthesis.speak(utterance);
    },

    // ===== 武将台词 =====
    sayHeroLine(playerIdx, eventType) {
        const player = this.players[playerIdx];
        if (!player) return;
        const line = getHeroLine(player.hero, eventType);
        if (!line) return;
        
        // 显示台词气泡
        this.showSpeechBubble(playerIdx, line);
        
        // 用TTS朗读台词（优先于普通日志朗读，入队不打断当前朗读）
        if (this.ttsEnabled && window.speechSynthesis) {
            const voiceConfig = this.getHeroVoiceConfig(player.hero, playerIdx);
            this._enqueueSpeech(line, { rate: voiceConfig.rate, pitch: voiceConfig.pitch, priority: 1 });
        }
        
        // 标记刚朗读了台词，让后续log不重复朗读
        this._heroLineSpoken = true;
        setTimeout(() => { this._heroLineSpoken = false; }, 200);
    },
    
    // 获取武将语音配置
    getHeroVoiceConfig(hero, playerIdx) {
        // 女性武将列表（根据名字判断）
        const femaleHeroes = ['黄月英', '孙尚香', '甄姬', '小乔', '貂蝉', '大乔', '蔡文姬', '祝融', '步练师', '张春华', '王异', '吴国太'];
        const isFemale = femaleHeroes.includes(hero.name);
        
        // 根据武将ID分配不同的音色参数
        const voiceMap = {
            // 男性武将 - 不同音色
            'liubei': { pitch: 1.0, rate: 1.0, type: 'male' },      // 刘备 - 沉稳
            'guanyu': { pitch: 0.85, rate: 0.95, type: 'male' },    // 关羽 - 低沉威严
            'zhangfei': { pitch: 0.8, rate: 1.05, type: 'male' },   // 张飞 - 粗犷洪亮
            'zhaoyun': { pitch: 1.0, rate: 1.0, type: 'male' },     // 赵云 - 清亮
            'zhugeliang': { pitch: 1.05, rate: 0.95, type: 'male' },// 诸葛亮 - 睿智从容
            'machao': { pitch: 0.9, rate: 1.0, type: 'male' },      // 马超 - 英气
            'huangzhong': { pitch: 0.85, rate: 0.9, type: 'male' }, // 黄忠 - 老成
            'caocao': { pitch: 0.9, rate: 1.0, type: 'male' },      // 曹操 - 霸气
            'simayi': { pitch: 0.95, rate: 0.95, type: 'male' },    // 司马懿 - 阴柔
            'zhouyu': { pitch: 1.0, rate: 1.0, type: 'male' },      // 周瑜 - 儒雅
            'sunquan': { pitch: 1.0, rate: 1.0, type: 'male' },     // 孙权 - 稳重
            'lvbu': { pitch: 0.8, rate: 1.0, type: 'male' },        // 吕布 - 威猛
            
            // 女性武将 - 不同音色
            'huangyueying': { pitch: 1.15, rate: 1.0, type: 'female' }, // 黄月英 - 知性
            'sunshangxiang': { pitch: 1.2, rate: 1.05, type: 'female' },// 孙尚香 - 活泼英气
            'zhenji': { pitch: 1.1, rate: 0.95, type: 'female' },    // 甄姬 - 柔美
            'xiaoqiao': { pitch: 1.25, rate: 1.0, type: 'female' },  // 小乔 - 甜美
        };
        
        // 获取配置，如果没有则按性别默认
        let config = voiceMap[hero.id];
        if (!config) {
            if (isFemale) {
                // 女性默认音色，根据名字哈希值微调
                const hash = hero.name.charCodeAt(0) % 3;
                config = {
                    '0': { pitch: 1.15, rate: 1.0, type: 'female' },  // 知性
                    '1': { pitch: 1.2, rate: 1.0, type: 'female' },   // 明亮
                    '2': { pitch: 1.1, rate: 0.95, type: 'female' }   // 温柔
                }[hash];
            } else {
                // 男性默认音色，根据名字哈希值微调
                const hash = hero.name.charCodeAt(0) % 4;
                config = {
                    '0': { pitch: 1.0, rate: 1.0, type: 'male' },     // 标准
                    '1': { pitch: 0.9, rate: 0.95, type: 'male' },    // 低沉
                    '2': { pitch: 1.05, rate: 1.0, type: 'male' },    // 清亮
                    '3': { pitch: 0.95, rate: 1.05, type: 'male' }    // 稳重
                }[hash];
            }
        }
        
        return config;
    },
    
    // 选择最佳语音
    selectBestVoice(voices, voiceConfig) {
        if (!voices || voices.length === 0) return null;
        
        // 优先选择中文语音
        const zhVoices = voices.filter(v => v.lang && v.lang.startsWith('zh'));
        if (zhVoices.length === 0) return voices[0];
        
        // 根据性别偏好选择（如果系统支持）
        if (voiceConfig.type === 'female') {
            // 尝试找听起来更女性化的声音（通常名字包含 female/woman 或音调较高）
            const femaleVoice = zhVoices.find(v => 
                v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('woman') ||
                v.name.includes('女')
            );
            if (femaleVoice) return femaleVoice;
        } else {
            // 尝试找听起来更男性化的声音
            const maleVoice = zhVoices.find(v => 
                v.name.toLowerCase().includes('male') ||
                v.name.toLowerCase().includes('man') ||
                v.name.includes('男')
            );
            if (maleVoice) return maleVoice;
        }
        
        // 返回第一个中文语音
        return zhVoices[0];
    },

    // 显示台词气泡
    showSpeechBubble(playerIdx, text) {
        const areaId = playerIdx === 0 ? 'player-area' : 'ai-area';
        const area = document.getElementById(areaId);
        if (!area) return;
        
        // 移除已有气泡
        area.querySelectorAll('.speech-bubble').forEach(b => b.remove());
        
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.textContent = text;
        area.style.position = 'relative';
        area.appendChild(bubble);
        
        // 触发动画
        requestAnimationFrame(() => bubble.classList.add('show'));
        
        // 2.5秒后移除
        setTimeout(() => {
            bubble.classList.remove('show');
            setTimeout(() => bubble.remove(), 300);
        }, 2500);
    },

    // ===== 背景音乐 =====
    initBGM() {
        if (this.bgmAudio) return;
        this.bgmAudio = new Audio('music/sgs.mp3');
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = this.bgmVolume;
    },

    playBGM() {
        if (!this.bgmEnabled) return;
        if (!this.bgmAudio) this.initBGM();
        if (!this.bgmAudio) return;
        
        // 如果已经在播放，不重复启动
        if (!this.bgmAudio.paused) return;
        
        const playPromise = this.bgmAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // 浏览器可能阻止自动播放，需要用户交互后才能播放
                this.bgmEnabled = false;
                this.render();
            });
        }
    },

    stopBGM() {
        if (this.bgmAudio && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
        }
    },

    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) {
            this.playBGM();
        } else {
            this.stopBGM();
        }
        this.render();
    },

    // ===== 提示 =====
    showHeroTooltip(hero, e) {
        const tooltip = document.getElementById('card-tooltip');
        const factionColor = FACTION_COLOR[hero.faction];
        const skillsHtml = hero.skills.map(s => `
            <div class="hero-tooltip-skill">
                <span class="hero-tooltip-skill-name" style="color:${factionColor}">${s.name}</span>
                <span class="hero-tooltip-skill-type">[${this.getSkillTypeName(s.type)}]</span>
                <div class="hero-tooltip-skill-desc">${s.desc}</div>
            </div>
        `).join('');
        tooltip.innerHTML = `
            <div class="hero-tooltip-header" style="border-color:${factionColor}">
                <span class="hero-tooltip-name" style="color:${factionColor}">${hero.name}</span>
                <span class="hero-tooltip-faction">${hero.faction}势力 · ${hero.maxHp}血</span>
            </div>
            <div class="hero-tooltip-skills">${skillsHtml}</div>
        `;
        tooltip.classList.remove('hidden');
        this.moveTooltip(e);
    },

    getSkillTypeName(type) {
        const names = { active: '主动', passive: '被动', triggered: '触发' };
        return names[type] || type;
    },

    showTooltip(card, e) {
        const tooltip = document.getElementById('card-tooltip');
        tooltip.innerHTML = `
            <div class="tooltip-name">${card.name}</div>
            <div class="tooltip-desc">${card.desc}</div>
        `;
        tooltip.classList.remove('hidden');
        this.moveTooltip(e);
    },

    moveTooltip(e) {
        const tooltip = document.getElementById('card-tooltip');
        let x = e.clientX + 15;
        let y = e.clientY + 15;
        const rect = tooltip.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 15;
        if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 15;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    },

    hideTooltip() {
        document.getElementById('card-tooltip').classList.add('hidden');
    },

    // ===== 动画 =====
    flashDamage(playerIdx) {
        const areaId = playerIdx === 0 ? 'player-area' : 'ai-area';
        const area = document.getElementById(areaId);
        area.classList.add('flash-damage');
        setTimeout(() => area.classList.remove('flash-damage'), 500);
    },

    // ===== 游戏结束 =====
    showGameOver(playerWon) {
        const screen = document.getElementById('gameover-screen');
        const title = document.getElementById('gameover-title');
        const message = document.getElementById('gameover-message');
        
        if (playerWon) {
            title.textContent = '胜 利';
            title.className = 'win';
            message.textContent = `${this.players[1].hero.name}已被击败！`;
            this.sayHeroLine(0, 'victory');
            this.sayHeroLine(1, 'defeat');
        } else {
            title.textContent = '败 北';
            title.className = 'lose';
            message.textContent = `${this.players[0].hero.name}阵亡...`;
            this.sayHeroLine(1, 'victory');
            this.sayHeroLine(0, 'defeat');
        }
        
        screen.classList.remove('hidden');
    },

    restart() {
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('select-screen').classList.add('active');
        
        this.selectedHeroId = null;
        this.players = [];
        this.deck = [];
        this.discardPile = [];
        this.gameOver = false;
        this.currentPlayer = 0;
        this.phase = 'select';
        this.responseResolver = null;
        this.responseMode = null;
        this.discardMode = false;
        this.ganglieDiscard = false;
        this.ganglieDiscardResolver = null;
        this.fanjianMode = false;
        this.fanjianResolver = null;
        this.zhihengMode = false;
        this.zhihengCards = [];
        this.zhihengResolver = null;
        this.lijianMode = false;
        this.lijianResolver = null;
        this.qingnangMode = false;
        this.qingnangResolver = null;
        this.jieyinMode = false;
        this.jieyinCards = [];
        this.jieyinResolver = null;
        this.guanxingMode = false;
        this.guanxingResolver = null;
        this.liuliMode = false;
        this.liuliResolver = null;
        this.hasSlashedThisTurn = false;
        this.hasUsedKurouThisTurn = false;
        this.hasUsedZhihengThisTurn = false;
        this.hasUsedLijianThisTurn = false;
        this.hasUsedFanjianThisTurn = false;
        this.hasUsedQingnangThisTurn = false;
        this.hasUsedJieyinThisTurn = false;
        this.hasUsedGuanxingThisTurn = false;
        this.processing = false;
        this.aiRunning = false;
        this.stopBGM();
        
        document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('confirm-hero').disabled = true;
        document.getElementById('response-cancel').style.display = '';
        document.getElementById('log-content').innerHTML = '';
    },

    // ===== 工具 =====
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// 启动游戏
window.addEventListener('DOMContentLoaded', () => Game.init());
