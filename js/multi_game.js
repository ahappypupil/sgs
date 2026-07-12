// ===== 三国杀多人对战 - 主游戏引擎 =====

const MultiGame = {
    // ===== 游戏状态 =====
    selectedHeroId: null,
    selectedFaction: FACTION.SHU,
    playerCount: 4,
    players: [],
    deck: [],
    discardPile: [],
    currentPlayer: 0,
    phase: 'select',
    gameOver: false,
    hasSlashedThisTurn: false,
    hasUsedKurouThisTurn: false,
    responseResolver: null,
    responseMode: null,
    responseSelectedCards: [],
    responseNeedCount: 1,
    targetResolver: null,
    targetNeedAlive: true,
    ganglieDiscard: false,
    ganglieDiscardResolver: null,
    processing: false,
    ttsEnabled: true,
    bgmEnabled: true,
    bgmAudio: null,
    bgmVolume: 0.4,
    ttsVolume: 0.8,
    _speechQueue: [],
    _speaking: false,

    // ===== 初始化 =====
    init() {
        this.renderHeroList();
        this.setupEventListeners();
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }
    },

    setupEventListeners() {
        document.getElementById('confirm-hero').addEventListener('click', () => {
            if (this.selectedHeroId) this.startGame();
        });
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        document.getElementById('response-cancel').addEventListener('click', () => this.cancelResponse());
        document.getElementById('target-cancel').addEventListener('click', () => this.cancelTargetSelect());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('back-home-btn').addEventListener('click', () => { window.location.href = 'index.html'; });

        document.querySelectorAll('.player-count-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.player-count-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.playerCount = parseInt(card.dataset.count);
            });
        });

        this.setupAudioControls();
        this.setupSettingsPanel();
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
    },

    setupSettingsPanel() {
        const toggle = document.getElementById('settings-toggle');
        const panel = document.getElementById('settings-panel');
        const close = document.getElementById('settings-close');
        if (toggle) toggle.addEventListener('click', () => { panel.classList.toggle('hidden'); });
        if (close) close.addEventListener('click', () => { panel.classList.add('hidden'); });
    },

    setupAudioControls() {
        const bgmToggle = document.getElementById('bgm-toggle');
        const ttsToggle = document.getElementById('tts-toggle');
        const bgmVolume = document.getElementById('bgm-volume');
        const ttsVolume = document.getElementById('tts-volume');
        if (bgmToggle) bgmToggle.addEventListener('click', () => { this.toggleBGM(); this.updateAudioControlUI(); });
        if (ttsToggle) ttsToggle.addEventListener('click', () => {
            this.ttsEnabled = !this.ttsEnabled;
            if (!this.ttsEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
            this.updateAudioControlUI();
        });
        if (bgmVolume) bgmVolume.addEventListener('input', (e) => {
            this.bgmVolume = parseInt(e.target.value) / 100;
            if (this.bgmAudio) this.bgmAudio.volume = this.bgmVolume;
        });
        if (ttsVolume) ttsVolume.addEventListener('input', (e) => { this.ttsVolume = parseInt(e.target.value) / 100; });
        this.updateAudioControlUI();
    },

    updateAudioControlUI() {
        const bgmToggle = document.getElementById('bgm-toggle');
        const ttsToggle = document.getElementById('tts-toggle');
        if (bgmToggle) { bgmToggle.style.opacity = this.bgmEnabled ? '1' : '0.5'; }
        if (ttsToggle) { ttsToggle.textContent = this.ttsEnabled ? '🔊' : '🔇'; ttsToggle.style.opacity = this.ttsEnabled ? '1' : '0.5'; }
    },

    // ===== 武将选择 =====
    renderHeroList() {
        const tabsContainer = document.getElementById('faction-tabs');
        tabsContainer.innerHTML = '';
        const factions = [FACTION.SHU, FACTION.WEI, FACTION.WU, FACTION.QUN];
        factions.forEach(f => {
            const tab = document.createElement('div');
            tab.className = 'faction-tab' + (this.selectedFaction === f ? ' active' : '');
            tab.textContent = f;
            tab.style.borderColor = this.selectedFaction === f ? FACTION_COLOR[f] : '';
            tab.style.color = this.selectedFaction === f ? FACTION_COLOR[f] : '';
            tab.addEventListener('click', () => { this.selectedFaction = f; this.renderHeroList(); });
            tabsContainer.appendChild(tab);
        });

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
            card.addEventListener('dblclick', () => {
                this.selectedHeroId = hero.id;
                document.getElementById('confirm-hero').disabled = false;
                this.startGame();
            });
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
            </div>`).join('');
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
            </div>`;
        profile.classList.remove('hidden');
        this.moveHeroProfile(e);
    },

    moveHeroProfile(e) {
        const profile = document.getElementById('hero-profile');
        if (profile.classList.contains('hidden')) return;
        const pw = profile.offsetWidth, ph = profile.offsetHeight;
        const vw = window.innerWidth, vh = window.innerHeight;
        let x = e.clientX + 20, y = e.clientY + 10;
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
        const playerHero = getHeroById(this.selectedHeroId);
        // AI随机选武将（不重复）
        const availableHeroes = HEROES.filter(h => h.id !== this.selectedHeroId);
        const shuffled = [...availableHeroes].sort(() => Math.random() - 0.5);

        this.players = [];
        // 玩家
        this.players.push({
            hero: playerHero, hp: playerHero.maxHp, maxHp: playerHero.maxHp,
            hand: [], equipment: { weapon: null, armor: null, mount: null },
            isAI: false, name: '你', lebusishu: false, dead: false, idx: 0
        });
        // AI玩家
        for (let i = 1; i < this.playerCount; i++) {
            const aiHero = shuffled[i - 1];
            this.players.push({
                hero: aiHero, hp: aiHero.maxHp, maxHp: aiHero.maxHp,
                hand: [], equipment: { weapon: null, armor: null, mount: null },
                isAI: true, name: aiHero.name, lebusishu: false, dead: false, idx: i
            });
        }

        // 创建牌堆
        this.deck = shuffleDeck(createDeck());
        this.discardPile = [];

        // 发牌
        for (let i = 0; i < 4; i++) {
            for (let p = 0; p < this.players.length; p++) {
                this.players[p].hand.push(this.drawCard());
            }
        }

        // 切换界面
        document.getElementById('mode-select-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');

        this.gameOver = false;
        this.currentPlayer = 0;
        this.phase = 'play';
        this.processing = true;

        let heroNames = this.players.map(p => p.hero.name).join('、');
        this.log(`游戏开始！${this.playerCount}人混战：${heroNames}`, 'system');
        this.render();
        this.playBGM();

        setTimeout(() => this.startTurn(0), 500);
    },

    // ===== 回合管理 =====
    async startTurn(playerIdx) {
        if (this.gameOver) return;
        const player = this.players[playerIdx];
        if (player.dead) { this.nextTurn(); return; }

        this.currentPlayer = playerIdx;
        this.hasSlashedThisTurn = false;
        this.hasUsedKurouThisTurn = false;
        this.processing = false;
        this.log(`${player.hero.name}的回合开始`, playerIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(playerIdx, 'turnStart');
        this.render();

        // 摸牌阶段
        let drawCount = 2;
        if (hasSkill(player.hero, '英姿')) drawCount = 3;
        const drawnCards = [];
        for (let i = 0; i < drawCount; i++) drawnCards.push(this.drawCard());
        player.hand.push(...drawnCards);
        this.log(`${player.hero.name}摸了${drawCount}张牌`, playerIdx === 0 ? 'player' : 'ai');
        this.render();

        // 乐不思蜀判定
        const skipPlay = await this.processLebusishu(playerIdx);
        if (skipPlay) {
            this.log(`${player.hero.name}跳过出牌阶段`, 'system');
            this.render();
            await this.delay(500);
            await this.endTurn(playerIdx);
            return;
        }

        if (player.isAI) {
            await this.delay(600);
            await this.aiPlayPhase(playerIdx);
            if (this.gameOver) return;
            await this.endTurn(playerIdx);
        }
        // 人类玩家等待手动操作
    },

    async aiPlayPhase(playerIdx) {
        let safetyCount = 0;
        while (!this.gameOver && safetyCount < 20) {
            safetyCount++;
            const action = MultiAI.decideTurnAction(this, playerIdx);
            if (!action || action.action === 'end') break;
            if (action.action === 'skill_kurou') {
                await this.executeKurou(playerIdx);
                await this.delay(800);
                continue;
            }
            if (action.action === 'play_wusheng') {
                await this.executeWuSheng(playerIdx, action.card, action.target);
                await this.delay(800);
                continue;
            }
            if (action.action === 'play') {
                await this.executeCardPlay(playerIdx, action.card, action.target);
                await this.delay(800);
                continue;
            }
            break;
        }
    },

    async endTurn(playerIdx) {
        if (this.gameOver) return;
        const player = this.players[playerIdx];
        this.processing = true;

        // 弃牌阶段
        const maxHand = player.hp;
        if (hasSkill(player.hero, '克己') && !this.hasSlashedThisTurn) {
            this.log(`${player.hero.name}克己生效，跳过弃牌`, playerIdx === 0 ? 'player' : 'ai');
        } else if (player.hand.length > maxHand) {
            const discardCount = player.hand.length - maxHand;
            if (player.isAI) {
                const toDiscard = MultiAI.chooseDiscard(this, playerIdx, discardCount);
                toDiscard.forEach(c => { player.hand = player.hand.filter(h => h.id !== c.id); this.discardPile.push(c); });
                this.log(`${player.hero.name}弃了${discardCount}张牌`, 'ai');
            } else {
                // 玩家弃牌
                this.log(`你需要弃${discardCount}张牌`, 'system');
                this.discardedCount = 0;
                this.needDiscardCount = discardCount;
                this.discardMode = true;
                this.render();
                await new Promise(resolve => { this.discardResolver = resolve; });
                this.discardMode = false;
            }
        }

        this.log(`${player.hero.name}回合结束`, playerIdx === 0 ? 'player' : 'ai');
        this.render();
        await this.delay(500);
        this.nextTurn();
    },

    handleDiscardClick(card) {
        const player = this.players[0];
        player.hand = player.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        this.discardedCount++;
        this.log(`你弃置了【${card.name}】`, 'player');
        if (this.discardedCount >= this.needDiscardCount) {
            if (this.discardResolver) {
                const r = this.discardResolver; this.discardResolver = null; r();
            }
        } else {
            this.render();
        }
    },

    nextTurn() {
        if (this.gameOver) return;
        let next = this.currentPlayer + 1;
        // 跳过死亡玩家
        let safety = 0;
        while (this.players[next % this.players.length].dead && safety < this.players.length * 2) {
            next++;
            safety++;
        }
        next = next % this.players.length;
        this.processing = false;
        setTimeout(() => this.startTurn(next), 600);
    },

    // ===== 获取存活对手 =====
    getAliveOpponents(playerIdx) {
        return this.players.filter((p, i) => i !== playerIdx && !p.dead).map((p, i) => { p.idx = this.players.indexOf(p); return p; });
    },

    getAlivePlayers() {
        return this.players.filter(p => !p.dead);
    },

    // ===== 玩家出牌入口 =====
    onPlayerCardClick(card) {
        if (this.gameOver) return;
        if (this.responseResolver) { this.handleResponseCardClick(card); return; }
        if (this.ganglieDiscard) {
            const player = this.players[0];
            player.hand = player.hand.filter(c => c.id !== card.id);
            this.discardPile.push(card);
            this.log(`你弃置了【${card.name}】`, 'player');
            this.ganglieDiscard = false;
            this.render();
            if (this.ganglieDiscardResolver) { const r = this.ganglieDiscardResolver; this.ganglieDiscardResolver = null; r(); }
            return;
        }
        if (this.discardMode) { this.handleDiscardClick(card); return; }
        if (this.processing) return;
        if (this.currentPlayer !== 0) return;

        const playable = this.getCardPlayableAs(0, card);
        if (playable.length === 0) { this.log('这张牌现在不能使用', 'system'); return; }
        this.playerPlayCard(card, playable[0]);
    },

    getCardPlayableAs(playerIdx, card) {
        const player = this.players[playerIdx];
        const results = [];
        if (card.defKey === 'sha') {
            const canSlash = !this.hasSlashedThisTurn || this.canSlashUnlimited(player);
            if (canSlash) results.push({ as: 'sha', skill: null });
        }
        if (card.defKey === 'tao') {
            if (player.hp < player.maxHp) results.push({ as: 'tao', skill: null });
        }
        if (card.type === 'trick' && card.defKey !== 'wuxiekeji') results.push({ as: card.defKey, skill: null });
        if (card.type === 'equipment') results.push({ as: card.defKey, skill: null });
        if (hasSkill(player.hero, '武圣') && card.isRed && card.defKey !== 'sha') {
            const canSlash = !this.hasSlashedThisTurn || this.canSlashUnlimited(player);
            if (canSlash) results.push({ as: 'sha', skill: '武圣' });
        }
        if (hasSkill(player.hero, '龙胆') && card.defKey === 'shan') {
            const canSlash = !this.hasSlashedThisTurn || this.canSlashUnlimited(player);
            if (canSlash) results.push({ as: 'sha', skill: '龙胆' });
        }
        if (hasSkill(player.hero, '仁德') && card.defKey !== 'tao') {
            if (player.hp < player.maxHp) results.push({ as: 'tao', skill: '仁德' });
        }
        return results;
    },

    canSlashUnlimited(player) {
        return hasSkill(player.hero, '咆哮') || (player.equipment.weapon && player.equipment.weapon.defKey === 'zhugecrossbow');
    },

    async playerPlayCard(card, playAs) {
        const player = this.players[0];
        const effectiveCard = playAs.skill ? { ...card, defKey: playAs.as, name: CARD_DEFS[playAs.as].name } : card;

        // 需要选目标的牌
        const needsTarget = ['sha', 'guohechaiqiao', 'shunshouqiannyang', 'juedou', 'lebusishu', 'huogong'].includes(playAs.as);
        let targetIdx = -1;

        if (playAs.as === 'sha') {
            // 先选目标
            targetIdx = await this.askPlayerSelectTarget('选择杀的目标', 0);
            if (targetIdx === -1) return;
            // 选好目标后再从手牌移除
            player.hand = player.hand.filter(c => c.id !== card.id);
            this.discardPile.push(card);
            this.hasSlashedThisTurn = true;
            if (playAs.skill) {
                this.log(`你发动【${playAs.skill}】，将【${card.name}】当【杀】使用`, 'player');
                this.sayHeroLine(0, 'skill');
            } else {
                this.log(`你使用【杀】`, 'player');
                this.sayHeroLine(0, 'attack');
            }
            this.render();
            await this.resolveSha(0, targetIdx, effectiveCard);
            return;
        }

        if (needsTarget) {
            targetIdx = await this.askPlayerSelectTarget(`选择【${card.name}】的目标`, 0);
            if (targetIdx === -1) return;
        }

        // 从手牌移除
        player.hand = player.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);

        if (playAs.skill) {
            this.log(`你发动【${playAs.skill}】，将【${card.name}】当【${CARD_DEFS[playAs.as].name}】使用`, 'player');
        } else {
            this.log(`你使用【${card.name}】`, 'player');
        }

        await this.executeCardEffect(0, targetIdx, card, playAs.as, effectiveCard);
    },

    // ===== 工具方法 =====
    drawCard() {
        if (this.deck.length === 0) {
            this.deck = shuffleDeck(this.discardPile);
            this.discardPile = [];
            this.log('牌堆已重新洗牌', 'system');
        }
        return this.deck.pop();
    },

    heal(playerIdx, amount) {
        const player = this.players[playerIdx];
        player.hp = Math.min(player.maxHp, player.hp + amount);
    },

    equipCard(playerIdx, card) {
        const player = this.players[playerIdx];
        const slot = card.equipType === EQUIP_TYPE.WEAPON ? 'weapon' : card.equipType === EQUIP_TYPE.ARMOR ? 'armor' : 'mount';
        if (player.equipment[slot]) {
            this.discardPile.push(player.equipment[slot]);
        }
        player.equipment[slot] = card;
    },

    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },

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
        entry.textContent = msg;
        content.insertBefore(entry, content.firstChild);
        while (content.children.length > 40) content.removeChild(content.lastChild);
        if (!this._heroLineSpoken) this.speak(msg);
    },

    // ===== 语音 =====
    speak(text) {
        if (!this.ttsEnabled || !window.speechSynthesis) return;
        let cleanText = text.replace(/【/g, '').replace(/】/g, '').replace(/（/g, ',').replace(/）/g, '').replace(/`/g, '');
        this._enqueueSpeech(cleanText, { rate: 1.1, pitch: 1.0, priority: 0 });
    },

    // 语音队列管理
    _enqueueSpeech(text, opts) {
        if (opts.priority === 0) {
            let lowCount = this._speechQueue.filter(i => i.priority === 0).length;
            if (lowCount >= 2) {
                let idx = this._speechQueue.findIndex(i => i.priority === 0);
                if (idx >= 0) this._speechQueue.splice(idx, 1);
            }
        } else {
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
        const u = new SpeechSynthesisUtterance(item.text);
        u.lang = 'zh-CN'; u.rate = item.rate || 1.0; u.pitch = item.pitch || 1.0; u.volume = this.ttsVolume;
        const voices = window.speechSynthesis.getVoices();
        const zh = voices.find(v => v.lang.startsWith('zh'));
        if (zh) u.voice = zh;
        u.onend = () => { this._processSpeechQueue(); };
        u.onerror = () => { this._processSpeechQueue(); };
        window.speechSynthesis.speak(u);
    },

    sayHeroLine(playerIdx, eventType) {
        const player = this.players[playerIdx];
        if (!player) return;
        const line = getHeroLine(player.hero, eventType);
        if (!line) return;
        this.showSpeechBubble(playerIdx, line);
        if (this.ttsEnabled && window.speechSynthesis) {
            const femaleHeroes = ['黄月英', '孙尚香', '甄姬', '小乔', '貂蝉', '大乔'];
            const isFemale = femaleHeroes.includes(player.hero.name);
            this._enqueueSpeech(line, { rate: 1.0, pitch: isFemale ? 1.2 : 0.95, priority: 1 });
        }
        this._heroLineSpoken = true;
        setTimeout(() => { this._heroLineSpoken = false; }, 200);
    },

    showSpeechBubble(playerIdx, text) {
        let area;
        if (playerIdx === 0) {
            area = document.getElementById('player-area');
        } else {
            area = document.querySelector(`.opponent-card[data-idx="${playerIdx}"]`);
        }
        if (!area) return;
        area.querySelectorAll('.speech-bubble').forEach(b => b.remove());
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.textContent = text;
        bubble.style.cssText = 'position:absolute;top:-40px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#ffd700;padding:6px 14px;border-radius:10px;font-size:13px;white-space:nowrap;z-index:100;border:1px solid rgba(255,215,0,0.3);';
        area.style.position = 'relative';
        area.appendChild(bubble);
        requestAnimationFrame(() => bubble.classList.add('show'));
        setTimeout(() => { bubble.classList.remove('show'); setTimeout(() => bubble.remove(), 300); }, 2500);
    },

    // ===== 背景音乐 =====
    playBGM() {
        if (!this.bgmEnabled) return;
        if (!this.bgmAudio) { this.bgmAudio = new Audio('music/sgs.mp3'); this.bgmAudio.loop = true; this.bgmAudio.volume = this.bgmVolume; }
        if (!this.bgmAudio.paused) return;
        this.bgmAudio.play().catch(() => { this.bgmEnabled = false; });
    },

    stopBGM() { if (this.bgmAudio && !this.bgmAudio.paused) this.bgmAudio.pause(); },

    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) this.playBGM(); else this.stopBGM();
    },

    // ===== 游戏结束 =====
    showGameOver(playerWon) {
        const screen = document.getElementById('gameover-screen');
        const title = document.getElementById('gameover-title');
        const message = document.getElementById('gameover-message');
        const stats = document.getElementById('gameover-stats');

        if (playerWon) {
            title.textContent = '胜 利';
            title.className = 'win';
            message.textContent = '你是最后的赢家！';
        } else {
            const winner = this.getAlivePlayers()[0];
            title.textContent = '败 北';
            title.className = 'lose';
            message.textContent = winner ? `${winner.hero.name}获得了最终胜利` : '游戏结束';
        }

        let statsHtml = '';
        this.players.forEach(p => {
            const status = p.dead ? '阵亡' : '存活';
            const cls = !p.dead ? 'stat-winner' : '';
            statsHtml += `<div class="${cls}">${p.hero.name}（${p.isAI ? 'AI' : '玩家'}）- ${status}</div>`;
        });
        stats.innerHTML = statsHtml;
        screen.classList.remove('hidden');
    },

    restart() {
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('mode-select-screen').classList.add('active');
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
        this.processing = false;
        this.stopBGM();
        document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('confirm-hero').disabled = true;
        document.getElementById('log-content').innerHTML = '';
    },

    // ===== 提示 =====
    showTooltip(card, e) {
        const tooltip = document.getElementById('card-tooltip');
        tooltip.innerHTML = `<div class="tooltip-name">${card.name}</div><div class="tooltip-desc">${card.desc}</div>`;
        tooltip.classList.remove('hidden');
        this.moveTooltip(e);
    },

    showHeroTooltip(hero, e) {
        const tooltip = document.getElementById('card-tooltip');
        const factionColor = FACTION_COLOR[hero.faction];
        const skillsHtml = hero.skills.map(s => `
            <div class="hero-tooltip-skill">
                <span class="hero-tooltip-skill-name" style="color:${factionColor}">${s.name}</span>
                <span class="hero-tooltip-skill-type">[${s.type === 'active' ? '主动' : s.type === 'passive' ? '被动' : '触发'}]</span>
                <div class="hero-tooltip-skill-desc">${s.desc}</div>
            </div>`).join('');
        tooltip.innerHTML = `
            <div class="hero-tooltip-header" style="border-color:${factionColor}">
                <span class="hero-tooltip-name" style="color:${factionColor}">${hero.name}</span>
                <span class="hero-tooltip-faction">${hero.faction}势力 · ${hero.maxHp}血</span>
            </div>
            <div class="hero-tooltip-skills">${skillsHtml}</div>`;
        tooltip.classList.remove('hidden');
        this.moveTooltip(e);
    },

    moveTooltip(e) {
        const tooltip = document.getElementById('card-tooltip');
        let x = e.clientX + 15, y = e.clientY + 15;
        const rect = tooltip.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 15;
        if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 15;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    },

    hideTooltip() { document.getElementById('card-tooltip').classList.add('hidden'); },

    flashDamage(playerIdx) {
        let area;
        if (playerIdx === 0) area = document.getElementById('player-area');
        else area = document.querySelector(`.opponent-card[data-idx="${playerIdx}"]`);
        if (area) { area.classList.add('flash-damage'); setTimeout(() => area.classList.remove('flash-damage'), 500); }
    }
};

// 启动
window.addEventListener('DOMContentLoaded', () => MultiGame.init());
