// ===== 多人对战 - 渲染逻辑 =====
// 挂载到 MultiGame 原型上

Object.assign(MultiGame, {
    // ===== 主渲染入口 =====
    render() {
        if (this.phase === 'select') return;

        // 渲染对手区域
        this.renderOpponents();
        // 渲染玩家区域
        this.renderPlayer();
        // 渲染玩家手牌
        this.renderPlayerHand();
        // 渲染操作栏
        this.renderActionBar();
    },

    // ===== 渲染对手区域 =====
    renderOpponents() {
        const container = document.getElementById('opponents-area');
        container.innerHTML = '';

        for (let i = 1; i < this.players.length; i++) {
            const p = this.players[i];
            const card = document.createElement('div');
            card.className = 'opponent-card';
            card.dataset.idx = i;
            if (p.dead) card.classList.add('dead');
            if (this.currentPlayer === i && !p.dead) card.classList.add('current-turn');

            const factionColor = FACTION_COLOR[p.hero.faction];
            let hpHtml = '';
            for (let h = 0; h < p.maxHp; h++) {
                hpHtml += `<div class="opponent-hp-point${h >= p.hp ? ' lost' : ''}"></div>`;
            }

            let equipHtml = '';
            ['weapon', 'armor', 'mount'].forEach(slot => {
                const labels = { weapon: '武器', armor: '防具', mount: '坐骑' };
                if (p.equipment[slot]) {
                    equipHtml += `<span class="opponent-equip-slot equipped" title="${p.equipment[slot].name}">${p.equipment[slot].short}</span>`;
                } else {
                    equipHtml += `<span class="opponent-equip-slot">${labels[slot]}</span>`;
                }
            });

            let statusHtml = '';
            if (p.lebusishu) statusHtml += '<span class="opponent-status-tag">乐</span>';

            let handPreview = '';
            const showCount = Math.min(p.hand.length, 8);
            for (let h = 0; h < showCount; h++) {
                handPreview += '<div class="card-back"></div>';
            }

            card.innerHTML = `
                ${this.currentPlayer === i && !p.dead ? '<div class="turn-indicator">▶</div>' : ''}
                <div class="opponent-info-bar">
                    <div class="opponent-avatar" style="border-color:${factionColor};background-image:url('${p.hero.avatar}')">
                        <div class="faction-badge" style="background:${factionColor}">${p.hero.faction}</div>
                    </div>
                    <div class="opponent-details">
                        <div class="opponent-name">${p.hero.name}</div>
                        <div class="opponent-title">${p.hero.title}</div>
                        <div class="opponent-hp-bar">${hpHtml}</div>
                        <div class="opponent-card-count">🂠 ${p.hand.length}张</div>
                        <div class="opponent-equip">${equipHtml}</div>
                        ${statusHtml ? `<div class="opponent-status">${statusHtml}</div>` : ''}
                    </div>
                </div>
                <div class="opponent-hand-preview">${handPreview}</div>
            `;

            // 悬停显示技能
            const avatar = card.querySelector('.opponent-avatar');
            avatar.addEventListener('mouseenter', (e) => this.showHeroTooltip(p.hero, e));
            avatar.addEventListener('mouseleave', () => this.hideTooltip());
            avatar.addEventListener('mousemove', (e) => this.moveTooltip(e));

            container.appendChild(card);
        }
    },

    // ===== 渲染玩家区域 =====
    renderPlayer() {
        const player = this.players[0];
        if (!player) return;

        const avatar = document.getElementById('player-avatar');
        const factionColor = FACTION_COLOR[player.hero.faction];
        avatar.style.borderColor = factionColor;
        avatar.style.backgroundImage = `url('${player.hero.avatar}')`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.innerHTML = `<div class="hero-card-mini"><div class="hero-card-faction-badge" style="background:${factionColor}">${player.hero.faction}</div></div>`;

        avatar.onmouseenter = (e) => this.showHeroTooltip(player.hero, e);
        avatar.onmouseleave = () => this.hideTooltip();
        avatar.onmousemove = (e) => this.moveTooltip(e);

        document.getElementById('player-name').textContent = player.hero.name;
        document.getElementById('player-faction').textContent = `${player.hero.faction}势力 · ${player.hero.title}`;

        // 血量
        const hpBar = document.getElementById('player-hp');
        hpBar.innerHTML = '';
        for (let i = 0; i < player.maxHp; i++) {
            const point = document.createElement('div');
            point.className = 'hp-point' + (i >= player.hp ? ' lost' : '');
            hpBar.appendChild(point);
        }

        // 技能
        const skillsDiv = document.getElementById('player-skills');
        skillsDiv.innerHTML = player.hero.skills.map(s =>
            `<span class="skill-tag" title="${s.desc}">${s.name}</span>`
        ).join('');
        if (player.lebusishu) {
            const leTag = document.createElement('span');
            leTag.className = 'skill-tag';
            leTag.style.cssText = 'background:#8B4513;color:#FFD700;border-color:#8B4513;';
            leTag.textContent = '乐不思蜀';
            skillsDiv.appendChild(leTag);
        }

        // 装备
        const equipDiv = document.getElementById('player-equip');
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
    },

    // ===== 渲染玩家手牌 =====
    renderPlayerHand() {
        const container = document.getElementById('player-hand');
        container.innerHTML = '';
        const player = this.players[0];
        if (!player) return;

        // 手牌较多时启用紧凑模式（手机端）
        const isMobile = window.innerWidth <= 768;
        if (isMobile && player.hand.length > 7) {
            container.classList.add('compact');
        } else {
            container.classList.remove('compact');
        }

        player.hand.forEach(card => {
            const playable = this.getCardPlayableAs(0, card);
            const isPlayable = playable.length > 0 && this.currentPlayer === 0 && !this.responseResolver && !this.discardMode && !this.processing && !this.targetResolver;
            const isDiscardable = this.discardMode;

            const cardEl = this.createCardElement(card, isPlayable || isDiscardable);
            if (isPlayable && !isDiscardable) cardEl.classList.add('playable');
            else if (!isPlayable && !isDiscardable && this.currentPlayer === 0 && !this.responseResolver && !this.processing && !this.targetResolver) cardEl.classList.add('unplayable');

            cardEl.addEventListener('click', () => this.onPlayerCardClick(card));
            cardEl.addEventListener('mouseenter', (e) => this.showTooltip(card, e));
            cardEl.addEventListener('mouseleave', () => this.hideTooltip());
            cardEl.addEventListener('mousemove', (e) => this.moveTooltip(e));
            container.appendChild(cardEl);
        });
    },

    // ===== 渲染操作栏 =====
    renderActionBar() {
        const actionBar = document.getElementById('action-bar');
        actionBar.innerHTML = '';

        if (this.currentPlayer === 0 && !this.gameOver && !this.responseResolver && !this.discardMode && !this.processing && !this.targetResolver && !this.zhihengMode && !this.lijianMode && !this.fanjianMode) {
            const player = this.players[0];

            // 苦肉
            if (hasSkill(player.hero, '苦肉') && !this.hasUsedKurouThisTurn && player.hp > 1) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '苦肉';
                btn.addEventListener('click', () => this.executeKurou(0));
                actionBar.appendChild(btn);
            }

            // 制衡（孙权）
            if (hasSkill(player.hero, '制衡') && !this.hasUsedZhihengThisTurn && player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '制衡';
                btn.addEventListener('click', () => this.executeZhiheng(0));
                actionBar.appendChild(btn);
            }

            // 离间（貂蝉）
            if (hasSkill(player.hero, '离间') && !this.hasUsedLijianThisTurn && player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '离间';
                btn.addEventListener('click', () => this.executeLijian(0));
                actionBar.appendChild(btn);
            }

            // 反间（周瑜）
            if (hasSkill(player.hero, '反间') && !this.hasUsedFanjianThisTurn && player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'action-btn green';
                btn.textContent = '反间';
                btn.addEventListener('click', () => this.executeFanjian(0));
                actionBar.appendChild(btn);
            }

            // 结束回合
            const endBtn = document.createElement('button');
            endBtn.className = 'action-btn';
            endBtn.textContent = '结束回合';
            endBtn.addEventListener('click', () => {
                if (this.currentPlayer === 0 && !this.gameOver && !this.responseResolver) {
                    this.endTurn(0);
                }
            });
            actionBar.appendChild(endBtn);
        } else if (this.currentPlayer !== 0 && !this.gameOver && this.players[this.currentPlayer] && !this.zhihengMode && !this.lijianMode) {
            const indicator = document.createElement('span');
            indicator.className = 'action-info-box ai-thinking';
            indicator.textContent = `${this.players[this.currentPlayer].hero.name}思考中`;
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
                if (this.zhihengCards.length === 0) { this.log('请至少选择一张牌', 'system'); return; }
                this.zhihengCards.forEach(c => {
                    player.hand = player.hand.filter(h => h.id !== c.id);
                    this.discardPile.push(c);
                });
                this.log(`你发动【制衡】，弃了${this.zhihengCards.length}张牌`, 'player');
                const count = this.zhihengCards.length;
                this.zhihengCards = [];
                for (let i = 0; i < count; i++) player.hand.push(this.drawCard());
                this.log(`你摸了${count}张牌`, 'player');
                this.render();
                if (this.zhihengResolver) { const r = this.zhihengResolver; this.zhihengResolver = null; r(); }
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
    }
});
