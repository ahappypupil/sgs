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
    lastVoiceTime: 0,
    
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
                <div class="hero-portrait" style="background:${factionColor};border-color:${factionColor}">
                    ${hero.emoji}
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
                <div class="profile-avatar" style="background:${factionColor}">${hero.emoji}</div>
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
                equipment: { weapon: null, armor: null, mount: null },
                isAI: false,
                name: '你',
                lebusishu: false
            },
            {
                hero: aiHero,
                hp: aiHero.maxHp,
                maxHp: aiHero.maxHp,
                hand: [],
                equipment: { weapon: null, armor: null, mount: null },
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
        this.processing = false;
        this.log(`你的回合开始`, 'player');
        this.sayHeroLine(0, 'turnStart');
        
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
        this.log(`${this.players[1].hero.name}回合开始`, 'ai');
        this.sayHeroLine(1, 'turnStart');
        
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
            if (action.action === 'play_wusheng') {
                await this.executeWuSheng(1, action.card, 0);
                await this.delay(800);
                continue;
            }
            if (action.action === 'play') {
                await this.executeAICardPlay(action.card, action.target);
                await this.delay(800);
                continue;
            }
            break;
        }
    },

    async executeAICardPlay(card, targetIdx) {
        const ai = this.players[1];
        // 从手牌移除
        ai.hand = ai.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        
        switch (card.defKey) {
            case 'sha':
            this.hasSlashedThisTurn = true;
            this.sayHeroLine(1, 'attack');
            await this.resolveSha(1, 0, card);
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
                await this.resolveJuedou(1, 0, card);
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
            results.push({ as: card.defKey, skill: null });
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
        
        return results;
    },

    playerPlayCard(card, playAs) {
        const player = this.players[0];
        const targetIdx = 1; // 1v1中目标固定为对方
        
        // 从手牌移除
        player.hand = player.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        
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
    },

    // ===== 杀的结算 =====
    canSlashUnlimited(player) {
        return hasSkill(player.hero, '咆哮') || 
               (player.equipment.weapon && player.equipment.weapon.defKey === 'zhugecrossbow');
    },

    // 玩家对AI出杀
    async resolveShaFromPlayer(sourceIdx, targetIdx, card) {
        const target = this.players[targetIdx];
        
        // 空城检查
        if (hasSkill(target.hero, '空城') && target.hand.length === 0) {
            this.log(`${target.hero.name}空城，不能成为杀的目标`, 'system');
            this.render();
            return;
        }
        
        // 无双：需要2张闪
        const source = this.players[sourceIdx];
        let needShan = 1;
        if (hasSkill(source.hero, '无双')) needShan = 2;
        
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
                this.log(`${current.hero.name}出【杀】`, 'ai');
                this.sayHeroLine(currentIdx, 'dodge');
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
                this.log(`你出【杀】`, 'player');
                this.sayHeroLine(0, 'dodge');
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
            this.log(`${target.hero.name}出【杀】抵挡`, 'ai');
            this.sayHeroLine(1, 'dodge');
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
            this.log(`你出【杀】抵挡`, 'player');
            this.sayHeroLine(0, 'dodge');
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
            ['weapon', 'armor', 'mount'].forEach(slot => {
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
                cardBack.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;font-size:13px;">手牌 ${idx + 1}</div>`;
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
        
        if (judgeCard.suit === SUIT.HEART) {
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
                     card.equipType === EQUIP_TYPE.ARMOR ? 'armor' : 'mount';
        
        // 如果已有装备，弃置旧装备
        if (player.equipment[slot]) {
            this.discardPile.push(player.equipment[slot]);
            this.log(`${player.hero.name}替换了${this.getEquipName(slot)}`, playerIdx === 0 ? 'player' : 'ai');
        }
        player.equipment[slot] = card;
    },

    getEquipName(slot) {
        return { weapon: '武器', armor: '防具', mount: '坐骑' }[slot];
    },

    // ===== 伤害结算 =====
    async dealDamage(targetIdx, sourceIdx, card) {
        const target = this.players[targetIdx];
        target.hp -= 1;
        
        this.log(`${target.hero.name}受到1点伤害（${target.hp}/${target.maxHp}）`, 'damage');
        this.sayHeroLine(targetIdx, 'damage');
        this.flashDamage(targetIdx);
        
        // 麒麟弓：造成伤害后弃置对方坐骑
        if (sourceIdx >= 0) {
            const source = this.players[sourceIdx];
            if (source.equipment.weapon && source.equipment.weapon.defKey === 'qilingong' && target.equipment.mount) {
                const mount = target.equipment.mount;
                target.equipment.mount = null;
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
            
            const promptText = needCount > 1 
                ? `对方使用了【杀】（无双），你需要出${needCount}张【闪】` 
                : `对方使用了【杀】，是否出【闪】？`;
            
            document.getElementById('response-prompt').textContent = promptText;
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            [...shans, ...shas].forEach(card => {
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
            return false;
        }
        if (this.responseMode === 'duel' || this.responseMode === 'nanman') {
            return card.defKey === 'sha';
        }
        if (this.responseMode === 'wanjian') {
            if (card.defKey === 'shan') return true;
            if (hasSkill(player.hero, '龙胆') && card.defKey === 'sha') return true;
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
            
            document.getElementById('response-prompt').textContent = '决斗！是否出【杀】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            shas.forEach(card => {
                const cardEl = this.createCardElement(card, true);
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
            
            document.getElementById('response-prompt').textContent = '南蛮入侵！是否出【杀】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            shas.forEach(card => {
                const cardEl = this.createCardElement(card, true);
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
            
            document.getElementById('response-prompt').textContent = '万箭齐发！是否出【闪】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            [...shans, ...shas].forEach(card => {
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
        
        // 头像
        const avatar = document.getElementById(`${prefix}-avatar`);
        const factionColor = FACTION_COLOR[player.hero.faction];
        avatar.style.background = factionColor;
        avatar.style.borderColor = '#ffd700';
        avatar.textContent = player.hero.emoji;
        
        // 头像悬停展示武将技能详情
        avatar.onmouseenter = (e) => this.showHeroTooltip(player.hero, e);
        avatar.onmouseleave = () => this.hideTooltip();
        avatar.onmousemove = (e) => this.moveTooltip(e);
        
        // 名字
        document.getElementById(`${prefix}-name`).textContent = player.hero.name;
        document.getElementById(`${prefix}-faction`).textContent = `${player.hero.faction}势力`;
        
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
        ['weapon', 'armor', 'mount'].forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'equip-slot';
            const equip = player.equipment[slot];
            if (equip) {
                slotDiv.classList.add('equipped');
                slotDiv.textContent = equip.short;
                slotDiv.title = equip.name + '：' + equip.desc;
            } else {
                slotDiv.textContent = { weapon: '武器', armor: '防具', mount: '坐骑' }[slot];
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
        
        player.hand.forEach(card => {
            const playable = this.getCardPlayableAs(0, card);
            const isPlayable = playable.length > 0 && this.currentPlayer === 0 && !this.responseResolver && !this.discardMode && !this.processing;
            const isDiscardable = this.discardMode;
            
            const cardEl = this.createCardElement(card, isPlayable || isDiscardable);
            
            if (isPlayable && !isDiscardable) {
                cardEl.classList.add('playable');
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
        
        // 语音开关按钮（始终显示）
        const ttsBtn = document.createElement('button');
        ttsBtn.className = 'action-btn tts-btn' + (this.ttsEnabled ? ' active' : '');
        ttsBtn.textContent = this.ttsEnabled ? '🔊 语音开' : '🔇 语音关';
        ttsBtn.addEventListener('click', () => {
            this.ttsEnabled = !this.ttsEnabled;
            if (!this.ttsEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            this.render();
            if (this.ttsEnabled) {
                this.speak('语音已开启');
            }
        });
        actionBar.appendChild(ttsBtn);
        
        // 背景音乐开关按钮
        const bgmBtn = document.createElement('button');
        bgmBtn.className = 'action-btn bgm-btn' + (this.bgmEnabled ? ' active' : '');
        bgmBtn.textContent = this.bgmEnabled ? '🎵 音乐开' : '🎵 音乐关';
        bgmBtn.addEventListener('click', () => {
            this.toggleBGM();
        });
        actionBar.appendChild(bgmBtn);
        
        if (this.currentPlayer === 0 && !this.gameOver && !this.responseResolver && !this.discardMode && !this.processing) {
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
            indicator.className = 'ai-thinking';
            indicator.textContent = `${this.players[1].hero.name}思考中`;
            actionBar.appendChild(indicator);
        }
        
        if (this.discardMode) {
            const info = document.createElement('span');
            info.style.color = '#ffd700';
            info.textContent = `请弃置${this.needDiscardCount - this.discardedCount}张牌`;
            actionBar.appendChild(info);
        }
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
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + (type || '');
        entry.textContent = msg;
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

    // ===== 语音朗读 =====
    speak(text) {
        if (!this.ttsEnabled) return;
        if (!window.speechSynthesis) return;
        
        // 清理文本：去掉特殊符号，让朗读更自然
        let cleanText = text.replace(/【/g, '').replace(/】/g, '').replace(/（/g, ',').replace(/）/g, '').replace(/`/g, '');
        
        // 取消之前的朗读，避免堆积
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 尝试使用中文语音
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang.startsWith('zh'));
        if (zhVoice) utterance.voice = zhVoice;
        
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
        
        // 用TTS朗读台词（优先于普通日志朗读）
        if (this.ttsEnabled && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(line);
            utterance.lang = 'zh-CN';
            utterance.rate = 1.0;
            utterance.pitch = playerIdx === 0 ? 1.1 : 0.9;
            utterance.volume = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const zhVoice = voices.find(v => v.lang.startsWith('zh'));
            if (zhVoice) utterance.voice = zhVoice;
            window.speechSynthesis.speak(utterance);
        }
        
        // 标记刚朗读了台词，让后续log不重复朗读（短时间内）
        this._heroLineSpoken = true;
        setTimeout(() => { this._heroLineSpoken = false; }, 200);
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
        this.bgmAudio.volume = 0.4;
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
