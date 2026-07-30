// ===== 多人对战 - 玩家响应系统 =====
// 挂载到 MultiGame 原型上

Object.assign(MultiGame, {
    // ===== 目标选择 =====
    askPlayerSelectTarget(prompt, sourceIdx, card, excludeIdxs, maleOnly) {
        return new Promise((resolve) => {
            this.targetResolver = resolve;
            this.processing = true;
            this.render();

            let aliveOpponents = this.players.filter((p, i) => i !== sourceIdx && !p.dead);
            // 排除指定索引
            if (excludeIdxs) {
                aliveOpponents = aliveOpponents.filter(p => !excludeIdxs.includes(this.players.indexOf(p)));
            }
            // 只显示男性角色（用于离间）
            if (maleOnly) {
                aliveOpponents = aliveOpponents.filter(p => p.hero.gender !== 'female');
            }
            // 谦逊（陆逊）：不能成为乐不思蜀目标
            if (card && card.defKey === 'lebusishu') {
                aliveOpponents = aliveOpponents.filter(p => !hasSkill(p.hero, '谦逊'));
            }
            // 帷幕（贾诩）：不能成为黑色锦囊牌目标
            if (card && card.type === 'trick' && !card.isRed) {
                aliveOpponents = aliveOpponents.filter(p => !hasSkill(p.hero, '帷幕'));
            }
            if (aliveOpponents.length === 0) {
                this.processing = false;
                resolve(-1);
                return;
            }

            document.getElementById('target-prompt').textContent = prompt;
            const container = document.getElementById('target-cards');
            container.innerHTML = '';

            aliveOpponents.forEach(target => {
                const targetIdx = this.players.indexOf(target);
                const btn = document.createElement('button');
                btn.className = 'target-player-btn';
                const factionColor = FACTION_COLOR[target.hero.faction];
                btn.innerHTML = `
                    <div class="target-avatar" style="border-color:${factionColor};background-image:url('${target.hero.avatar}')"></div>
                    <div class="target-info">
                        <div class="target-name">${target.hero.name}</div>
                        <div class="target-hp">${target.hp}/${target.maxHp}血 · ${target.hand.length}张手牌</div>
                    </div>
                `;
                btn.addEventListener('click', () => {
                    const r = this.targetResolver;
                    this.targetResolver = null;
                    this.processing = false;
                    document.getElementById('target-panel').classList.add('hidden');
                    r(targetIdx);
                });
                container.appendChild(btn);
            });

            document.getElementById('target-panel').classList.remove('hidden');
            this.render();
        });
    },

    cancelTargetSelect() {
        if (!this.targetResolver) return;
        const r = this.targetResolver;
        this.targetResolver = null;
        this.processing = false;
        document.getElementById('target-panel').classList.add('hidden');
        r(-1);
    },

    // ===== 询问玩家出闪 =====
    askPlayerDodge(needCount, attackerName) {
        return new Promise((resolve) => {
            this.responseMode = 'dodge';
            this.responseNeedCount = needCount;
            this.responseSelectedCards = [];
            this.responseResolver = resolve;

            const player = this.players[0];
            const shans = player.hand.filter(c => c.defKey === 'shan');
            const shas = hasSkill(player.hero, '龙胆') ? player.hand.filter(c => c.defKey === 'sha') : [];
            // 倾国（甄姬）：黑色手牌当闪
            const qingguoCards = hasSkill(player.hero, '倾国') ? player.hand.filter(c => !c.isRed && c.defKey !== 'shan') : [];

            const promptText = needCount > 1
                ? `${attackerName}使用了【杀】（无双），你需要出${needCount}张【闪】`
                : `${attackerName}使用了【杀】，是否出【闪】？`;
            document.getElementById('response-prompt').textContent = promptText;
            const container = document.getElementById('response-cards');
            container.innerHTML = '';

            [...shans, ...shas, ...qingguoCards].forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });

            const cancelBtn = document.getElementById('response-cancel');
            cancelBtn.textContent = needCount > 1 ? `不出（受${needCount}点伤害）` : '不闪（受1点伤害）';
            cancelBtn.style.display = '';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 询问玩家决斗出杀 =====
    askPlayerDuel() {
        return new Promise((resolve) => {
            this.responseMode = 'duel';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;

            const player = this.players[0];
            const shas = player.hand.filter(c => c.defKey === 'sha');
            const longdanShans = hasSkill(player.hero, '龙胆') ? player.hand.filter(c => c.defKey === 'shan') : [];

            document.getElementById('response-prompt').textContent = '决斗！是否出【杀】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';

            [...shas, ...longdanShans].forEach(card => {
                const cardEl = this.createCardElement(card, true);
                if (card.defKey === 'shan') {
                    const badge = document.createElement('div');
                    badge.textContent = '龙胆';
                    badge.style.cssText = 'position:absolute;top:2px;right:2px;background:#4a90d9;color:white;font-size:10px;padding:1px 4px;border-radius:3px;';
                    cardEl.style.position = 'relative';
                    cardEl.appendChild(badge);
                }
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });

            // 丈八蛇矛：没有真实杀但有2张手牌时
            if (shas.length === 0 && longdanShans.length === 0 &&
                player.equipment.weapon && player.equipment.weapon.defKey === 'zhangbashemao' && player.hand.length >= 2) {
                const zhangbaOptions = player.hand.filter(c => c.defKey !== 'wuxiekeji');
                if (zhangbaOptions.length >= 2) {
                    const zbBtn = document.createElement('button');
                    zbBtn.textContent = '发动【丈八蛇矛】';
                    zbBtn.style.cssText = 'background:linear-gradient(135deg,#8B0000,#DC143C);color:#FFD700;font-size:14px;font-weight:bold;padding:10px 18px;border:2px solid #FFD700;border-radius:8px;cursor:pointer;margin:8px auto;display:block;';
                    zbBtn.addEventListener('click', () => {
                        this.handleZhangbaResponse(resolve, zhangbaOptions.slice(0, 2));
                    });
                    container.appendChild(zbBtn);
                }
            }

            document.getElementById('response-cancel').textContent = '不出杀（受1点伤害）';
            document.getElementById('response-cancel').style.display = '';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 询问玩家南蛮出杀 =====
    askPlayerNanman() {
        return new Promise((resolve) => {
            this.responseMode = 'nanman';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;

            const player = this.players[0];
            const shas = player.hand.filter(c => c.defKey === 'sha');
            const longdanShans = hasSkill(player.hero, '龙胆') ? player.hand.filter(c => c.defKey === 'shan') : [];
            // 无懈可击
            const wuxieCards = player.hand.filter(c => c.defKey === 'wuxiekeji');

            document.getElementById('response-prompt').textContent = '南蛮入侵！是否出【杀】或使用【无懈可击】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';

            shas.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });

            longdanShans.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                if (card.defKey === 'shan') {
                    const badge = document.createElement('div');
                    badge.textContent = '龙胆';
                    badge.style.cssText = 'position:absolute;top:2px;right:2px;background:#4a90d9;color:white;font-size:10px;padding:1px 4px;border-radius:3px;';
                    cardEl.style.position = 'relative';
                    cardEl.appendChild(badge);
                }
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });

            // 显示无懈可击
            wuxieCards.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });

            // 丈八蛇矛：没有真实杀但有2张手牌时
            if (shas.length === 0 && longdanShans.length === 0 &&
                player.equipment.weapon && player.equipment.weapon.defKey === 'zhangbashemao' && player.hand.length >= 2) {
                const zhangbaOptions = player.hand.filter(c => c.defKey !== 'wuxiekeji');
                if (zhangbaOptions.length >= 2) {
                    const zbBtn = document.createElement('button');
                    zbBtn.textContent = '发动【丈八蛇矛】';
                    zbBtn.style.cssText = 'background:linear-gradient(135deg,#8B0000,#DC143C);color:#FFD700;font-size:14px;font-weight:bold;padding:10px 18px;border:2px solid #FFD700;border-radius:8px;cursor:pointer;margin:8px auto;display:block;';
                    zbBtn.addEventListener('click', () => {
                        this.handleZhangbaResponse(resolve, zhangbaOptions.slice(0, 2));
                    });
                    container.appendChild(zbBtn);
                }
            }

            document.getElementById('response-cancel').textContent = '不出杀（受1点伤害）';
            document.getElementById('response-cancel').style.display = '';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 询问玩家万箭出闪 =====
    askPlayerWanjian() {
        return new Promise((resolve) => {
            this.responseMode = 'wanjian';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;

            const player = this.players[0];
            const shans = player.hand.filter(c => c.defKey === 'shan');
            const shas = hasSkill(player.hero, '龙胆') ? player.hand.filter(c => c.defKey === 'sha') : [];
            // 倾国（甄姬）：黑色手牌当闪
            const qingguoCards = hasSkill(player.hero, '倾国') ? player.hand.filter(c => !c.isRed && c.defKey !== 'shan') : [];
            // 无懈可击
            const wuxieCards = player.hand.filter(c => c.defKey === 'wuxiekeji');

            document.getElementById('response-prompt').textContent = '万箭齐发！是否出【闪】或使用【无懈可击】？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';

            [...shans, ...shas, ...qingguoCards].forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });

            // 显示无懈可击
            wuxieCards.forEach(card => {
                const cardEl = this.createCardElement(card, true);
                cardEl.addEventListener('click', () => this.handleResponseCardClick(card));
                container.appendChild(cardEl);
            });

            document.getElementById('response-cancel').textContent = '不出闪（受1点伤害）';
            document.getElementById('response-cancel').style.display = '';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // 丈八蛇矛响应：自动选2张牌当杀
    handleZhangbaResponse(resolve, cards) {
        const player = this.players[0];
        player.hand = player.hand.filter(c => !cards.find(zc => zc.id === c.id));
        cards.forEach(c => this.discardPile.push(c));
        this.log('你发动【丈八蛇矛】，将两张牌当【杀】', 'player');
        this.sayHeroLine(0, 'skill');
        this.responseResolver = null;
        this.responseMode = null;
        this.responseSelectedCards = [];
        document.getElementById('response-panel').classList.add('hidden');
        resolve({ play: true, card: null, zhangba: true });
    },

    // ===== 询问玩家桃自救 =====
    askPlayerPeach() {
        return new Promise((resolve) => {
            this.responseMode = 'peach';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;

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

            // 仁德
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
            document.getElementById('response-cancel').style.display = '';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 询问玩家选择目标手牌（过河拆桥/顺手牵羊）=====
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
            ['weapon', 'armor', 'mountPlus', 'mountMinus'].forEach(slot => {
                if (target.equipment[slot]) {
                    hasCards = true;
                    const cardEl = this.createCardElement(target.equipment[slot], true);
                    cardEl.classList.add('playable');
                    cardEl.addEventListener('click', () => {
                        const r = this.responseResolver;
                        this.responseResolver = null;
                        this.responseMode = null;
                        document.getElementById('response-panel').classList.add('hidden');
                        r({ type: 'equip', slot });
                    });
                    container.appendChild(cardEl);
                }
            });

            target.hand.forEach((card, idx) => {
                hasCards = true;
                const cardBack = document.createElement('div');
                cardBack.className = 'card card-back';
                cardBack.style.cursor = 'pointer';
                cardBack.innerHTML = `<div style="position:absolute;bottom:8px;right:8px;color:#888;font-size:12px;">手牌${idx + 1}</div>`;
                cardBack.addEventListener('mouseenter', () => cardBack.style.opacity = '0.7');
                cardBack.addEventListener('mouseleave', () => cardBack.style.opacity = '1');
                cardBack.addEventListener('click', () => {
                    const r = this.responseResolver;
                    this.responseResolver = null;
                    this.responseMode = null;
                    document.getElementById('response-panel').classList.add('hidden');
                    r({ type: 'hand', index: idx });
                });
                container.appendChild(cardBack);
            });

            if (!hasCards) { this.responseMode = null; this.responseResolver = null; resolve(null); return; }

            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 询问刚烈选择 =====
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
                btn.addEventListener('click', () => {
                    const r = this.responseResolver;
                    this.responseResolver = null;
                    this.responseMode = null;
                    document.getElementById('response-panel').classList.add('hidden');
                    r('discard');
                });
                container.appendChild(btn);
            }

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

            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 询问玩家是否使用天香 =====
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

    // ===== 询问玩家是否使用反间给的牌 =====
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

    // ===== 响应卡牌点击处理 =====
    isValidResponseCard(card) {
        const player = this.players[0];
        if (this.responseMode === 'dodge') {
            if (card.defKey === 'shan') return true;
            if (hasSkill(player.hero, '龙胆') && card.defKey === 'sha') return true;
            // 倾国（甄姬）：黑色手牌当闪
            if (hasSkill(player.hero, '倾国') && !card.isRed) return true;
            return false;
        }
        if (this.responseMode === 'duel') return card.defKey === 'sha';
        if (this.responseMode === 'nanman') {
            if (card.defKey === 'sha') return true;
            if (hasSkill(player.hero, '龙胆') && card.defKey === 'shan') return true;
            if (card.defKey === 'wuxiekeji') return true;
            return false;
        }
        if (this.responseMode === 'wanjian') {
            if (card.defKey === 'shan') return true;
            if (hasSkill(player.hero, '龙胆') && card.defKey === 'sha') return true;
            // 倾国（甄姬）：黑色手牌当闪
            if (hasSkill(player.hero, '倾国') && !card.isRed) return true;
            if (card.defKey === 'wuxiekeji') return true;
            return false;
        }
        if (this.responseMode === 'peach') return card.defKey === 'tao';
        return false;
    },

    handleResponseCardClick(card) {
        if (!this.responseResolver) return;
        if (!this.isValidResponseCard(card)) return;

        if (this.responseMode === 'dodge') {
            const idx = this.responseSelectedCards.findIndex(c => c.id === card.id);
            if (idx >= 0) this.responseSelectedCards.splice(idx, 1);
            else this.responseSelectedCards.push(card);

            document.querySelectorAll('#response-cards .card').forEach(el => el.classList.remove('selected'));
            this.responseSelectedCards.forEach(c => {
                const el = [...document.querySelectorAll('#response-cards .card')].find(e => e.dataset.cardId === c.id);
                if (el) el.classList.add('selected');
            });

            if (this.responseSelectedCards.length === this.responseNeedCount) {
                setTimeout(() => this.confirmDodgeResponse(), 300);
            }
        } else if (this.responseMode === 'duel') {
            this.responseSelectedCards = [card];
            this.confirmSimpleResponse();
        } else if (this.responseMode === 'nanman') {
            this.responseSelectedCards = [card];
            this.confirmSimpleResponse();
        } else if (this.responseMode === 'wanjian') {
            this.responseSelectedCards = [card];
            this.confirmSimpleResponse();
        } else if (this.responseMode === 'peach') {
            this.responseSelectedCards = [card];
            this.confirmPeachResponse();
        }
    },

    confirmDodgeResponse() {
        const r = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        if (this.responseSelectedCards.length === this.responseNeedCount) {
            r({ dodge: true, cards: [...this.responseSelectedCards] });
        } else {
            r({ dodge: false, cards: [] });
        }
        this.responseSelectedCards = [];
    },

    confirmSimpleResponse() {
        const r = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        if (this.responseSelectedCards.length > 0) {
            r({ play: true, card: this.responseSelectedCards[0] });
        } else {
            r({ play: false, card: null });
        }
        this.responseSelectedCards = [];
    },

    confirmPeachResponse() {
        const r = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        if (this.responseSelectedCards.length > 0) {
            r({ use: true, card: this.responseSelectedCards[0], asSkill: false });
        } else {
            r({ use: false, card: null });
        }
        this.responseSelectedCards = [];
    },

    confirmPeachResponseWithSkill() {
        const r = this.responseResolver;
        this.responseResolver = null;
        this.responseMode = null;
        document.getElementById('response-panel').classList.add('hidden');
        if (this.responseSelectedCards.length > 0) {
            r({ use: true, card: this.responseSelectedCards[0], asSkill: true });
        } else {
            r({ use: false, card: null });
        }
        this.responseSelectedCards = [];
    },

    cancelResponse() {
        if (!this.responseResolver) return;
        if (this.responseMode === 'dodge') { this.confirmDodgeResponse(); return; }
        if (this.responseMode === 'duel' || this.responseMode === 'nanman' || this.responseMode === 'wanjian') {
            this.responseSelectedCards = [];
            this.confirmSimpleResponse();
            return;
        }
        if (this.responseMode === 'peach') { this.confirmPeachResponse(); return; }
        if (this.responseMode === 'ganglie') {
            const r = this.responseResolver;
            this.responseResolver = null;
            this.responseMode = null;
            document.getElementById('response-panel').classList.add('hidden');
            r('damage');
        }
        if (this.responseMode === 'luoshen') {
            const r = this.responseResolver;
            this.responseResolver = null;
            this.responseMode = null;
            document.getElementById('response-panel').classList.add('hidden');
            r(false);
        }
        if (this.responseMode === 'tianxiang') {
            const r = this.responseResolver;
            this.responseResolver = null;
            this.responseMode = null;
            document.getElementById('response-panel').classList.add('hidden');
            r(false);
        }
        if (this.responseMode === 'fanjian') {
            const r = this.responseResolver;
            this.responseResolver = null;
            this.responseMode = null;
            document.getElementById('response-panel').classList.add('hidden');
            r('damage');
        }
    },

    // ===== 创建卡牌元素 =====
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

    // ===== 雌雄双股剑决策询问 =====
    askCixiong(targetIdx) {
        return new Promise((resolve) => {
            const target = this.players[targetIdx];
            this.responseMode = 'cixiong';
            this.responseResolver = resolve;
            
            document.getElementById('response-prompt').textContent = `【雌雄双股剑】对${target.hero.name}发动：`;
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            const discardBtn = document.createElement('button');
            discardBtn.textContent = '令其弃一张手牌';
            discardBtn.className = 'card playable';
            discardBtn.style.cssText = 'padding:8px 16px;margin:6px;font-size:14px;cursor:pointer;border-radius:6px;background:#e74c3c;color:white;border:none;';
            discardBtn.addEventListener('click', () => {
                const r = this.responseResolver;
                this.responseResolver = null;
                this.responseMode = null;
                document.getElementById('response-panel').classList.add('hidden');
                r('discard');
            });
            container.appendChild(discardBtn);
            
            const drawBtn = document.createElement('button');
            drawBtn.textContent = '摸一张牌';
            drawBtn.className = 'card playable';
            drawBtn.style.cssText = 'padding:8px 16px;margin:6px;font-size:14px;cursor:pointer;border-radius:6px;background:#3498db;color:white;border:none;';
            drawBtn.addEventListener('click', () => {
                const r = this.responseResolver;
                this.responseResolver = null;
                this.responseMode = null;
                document.getElementById('response-panel').classList.add('hidden');
                r('draw');
            });
            container.appendChild(drawBtn);
            
            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 询问玩家弃牌 =====
    askPlayerDiscardCard(promptText) {
        return new Promise((resolve) => {
            this.responseMode = 'discard_card';
            this.responseSelectedCards = [];
            this.responseResolver = resolve;
            
            document.getElementById('response-prompt').textContent = promptText || '请弃置一张手牌';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
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
            
            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    },

    // ===== 询问玩家五谷丰登选牌 =====
    askPlayerWugu(revealedCards) {
        return new Promise((resolve) => {
            this.responseMode = 'wugu';
            this.responseResolver = resolve;
            
            document.getElementById('response-prompt').textContent = '五谷丰登：请选择一张牌';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            
            revealedCards.forEach(card => {
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
            
            document.getElementById('response-cancel').style.display = 'none';
            document.getElementById('response-panel').classList.remove('hidden');
            this.render();
        });
    }
});
