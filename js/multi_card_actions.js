// ===== 多人对战 - 卡牌使用与结算逻辑 =====
// 挂载到 MultiGame 原型上

Object.assign(MultiGame, {
    // ===== AI出牌执行 =====
    async executeCardPlay(sourceIdx, card, targetIdx) {
        const source = this.players[sourceIdx];
        source.hand = source.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);

        switch (card.defKey) {
            case 'sha':
                this.hasSlashedThisTurn = true;
                this.sayHeroLine(sourceIdx, 'attack');
                await this.resolveSha(sourceIdx, targetIdx, card);
                break;
            case 'tao':
                this.heal(sourceIdx, 1);
                this.log(`${source.hero.name}使用【桃】回复1点体力`, sourceIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(sourceIdx, 'heal');
                this.render();
                break;
            case 'wushengshengyou':
                for (let i = 0; i < 2; i++) source.hand.push(this.drawCard());
                this.log(`${source.hero.name}使用【无中生有】摸了2张牌`, sourceIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(sourceIdx, 'skill');
                this.render();
                break;
            case 'guohechaiqiao':
                await this.resolveGuohe(sourceIdx, targetIdx);
                break;
            case 'shunshouqiannyang':
                await this.resolveShunshou(sourceIdx, targetIdx);
                break;
            case 'juedou':
                await this.resolveJuedou(sourceIdx, targetIdx, card);
                break;
            case 'nanmanruqin':
                await this.resolveNanman(sourceIdx);
                break;
            case 'wanjianqifa':
                await this.resolveWanjian(sourceIdx);
                break;
            case 'lebusishu':
                this.resolveLebusishu(sourceIdx, targetIdx);
                break;
            case 'huogong':
                await this.resolveHuogong(sourceIdx, targetIdx);
                break;
            case 'taoyuanjieyi':
                this.resolveTaoyuan(sourceIdx);
                break;
            case 'wugufengdeng':
                this.resolveWugu(sourceIdx);
                break;
            default:
                if (card.type === 'equipment') {
                    this.equipCard(sourceIdx, card);
                    this.log(`${source.hero.name}装备了【${card.name}】`, sourceIdx === 0 ? 'player' : 'ai');
                    this.sayHeroLine(sourceIdx, 'skill');
                    this.render();
                }
                break;
        }
    },

    // 玩家使用卡牌的效果执行（非杀/非武圣）
    async executeCardEffect(sourceIdx, targetIdx, card, playAs, effectiveCard) {
        const source = this.players[sourceIdx];
        switch (playAs) {
            case 'sha':
                this.hasSlashedThisTurn = true;
                this.sayHeroLine(sourceIdx, 'attack');
                this.render();
                await this.resolveSha(sourceIdx, targetIdx, effectiveCard);
                break;
            case 'tao':
                this.heal(sourceIdx, 1);
                this.log(`你回复1点体力`, 'player');
                this.sayHeroLine(sourceIdx, 'heal');
                this.render();
                break;
            case 'wushengshengyou':
                for (let i = 0; i < 2; i++) source.hand.push(this.drawCard());
                this.log(`你摸了2张牌`, 'player');
                this.sayHeroLine(sourceIdx, 'skill');
                this.render();
                break;
            case 'guohechaiqiao':
                await this.resolveGuohe(sourceIdx, targetIdx);
                break;
            case 'shunshouqiannyang':
                await this.resolveShunshou(sourceIdx, targetIdx);
                break;
            case 'juedou':
                await this.resolveJuedou(sourceIdx, targetIdx, effectiveCard);
                break;
            case 'nanmanruqin':
                await this.resolveNanman(sourceIdx);
                break;
            case 'wanjianqifa':
                await this.resolveWanjian(sourceIdx);
                break;
            case 'lebusishu':
                this.resolveLebusishu(sourceIdx, targetIdx);
                break;
            case 'huogong':
                await this.resolveHuogong(sourceIdx, targetIdx);
                break;
            case 'taoyuanjieyi':
                this.resolveTaoyuan(sourceIdx);
                break;
            case 'wugufengdeng':
                this.resolveWugu(sourceIdx);
                break;
            default:
                if (card.type === 'equipment') {
                    this.equipCard(sourceIdx, card);
                    this.log(`你装备了【${card.name}】`, 'player');
                    this.sayHeroLine(sourceIdx, 'skill');
                    this.render();
                }
                break;
        }
    },

    // ===== 武圣出杀 =====
    async executeWuSheng(sourceIdx, card, targetIdx) {
        const source = this.players[sourceIdx];
        source.hand = source.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        this.hasSlashedThisTurn = true;
        this.log(`${source.hero.name}发动【武圣】，将【${card.name}】当【杀】使用`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        this.render();
        await this.resolveSha(sourceIdx, targetIdx, { ...card, defKey: 'sha', name: '杀' });
    },

    // ===== 苦肉 =====
    async executeKurou(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedKurouThisTurn = true;
        player.hp -= 1;
        this.log(`${player.hero.name}发动【苦肉】，流失1点体力`, playerIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(playerIdx, 'skill');
        for (let i = 0; i < 2; i++) player.hand.push(this.drawCard());
        this.log(`${player.hero.name}摸了2张牌`, playerIdx === 0 ? 'player' : 'ai');
        this.render();
        if (player.hp <= 0) await this.checkDying(playerIdx, -1, null);
    },

    // ===== 杀的结算 =====
    async resolveSha(sourceIdx, targetIdx, card) {
        const source = this.players[sourceIdx];
        const target = this.players[targetIdx];

        if (target.dead) return;

        // 空城检查
        if (hasSkill(target.hero, '空城') && target.hand.length === 0) {
            this.log(`${target.hero.name}空城，不能成为杀的目标`, 'system');
            this.render();
            return;
        }

        let needShan = 1;
        if (hasSkill(source.hero, '无双')) needShan = 2;

        // 八卦阵
        if (target.equipment.armor && target.equipment.armor.defKey === 'baguazhen') {
            const judgeCard = this.drawCard();
            this.discardPile.push(judgeCard);
            this.log(`${target.hero.name}八卦阵判定：${judgeCard.suit}${judgeCard.number}`, 'system');
            if (judgeCard.isRed) { this.log(`判定红色，八卦阵生效！`, 'system'); this.render(); return; }
            else this.log(`判定黑色，八卦阵失效`, 'system');
        }

        // 仁王盾
        if (target.equipment.armor && target.equipment.armor.defKey === 'renwangdun' && !card.isRed) {
            this.log(`${target.hero.name}装备【仁王盾】，黑色杀无效`, 'system');
            this.render();
            return;
        }

        this.render();

        // 询问闪
        let response;
        if (target.isAI) {
            await this.delay(1000);
            response = MultiAI.decideDodge(this, targetIdx, needShan);
        } else {
            response = await this.askPlayerDodge(needShan, source.hero.name);
        }

        if (response.dodge) {
            response.cards.forEach(c => { target.hand = target.hand.filter(h => h.id !== c.id); this.discardPile.push(c); });
            const skillText = response.cards.some(c => c.defKey === 'sha') ? '（龙胆）' : '';
            this.log(`${target.hero.name}使用${needShan > 1 ? needShan + '张' : ''}【闪】${skillText}抵消了攻击`, targetIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(targetIdx, 'dodge');
            // 青龙偃月刀
            if (source.equipment.weapon && source.equipment.weapon.defKey === 'qinglongyanyuedao') {
                this.log(`${source.hero.name}发动【青龙偃月刀】效果`, sourceIdx === 0 ? 'player' : 'ai');
                await this.dealDamage(targetIdx, sourceIdx, null);
            }
            this.render();
        } else {
            this.log(`${target.hero.name}没有出闪`, targetIdx === 0 ? 'player' : 'ai');
            await this.dealDamage(targetIdx, sourceIdx, card);
            if (!this.responseResolver && !this.gameOver && this.currentPlayer === 0) this.processing = false;
            this.render();
        }
    },

    // ===== 决斗结算 =====
    async resolveJuedou(sourceIdx, targetIdx, card) {
        const source = this.players[sourceIdx];
        const target = this.players[targetIdx];
        this.log(`${source.hero.name}使用【决斗】，目标：${target.hero.name}`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'attack');
        this.render();
        await this.juedouStep(targetIdx, sourceIdx, card, true);
        if (!this.responseResolver && !this.gameOver && this.currentPlayer === 0) this.processing = false;
        this.render();
    },

    async juedouStep(currentIdx, otherIdx, damageCard, isInitialTarget) {
        const current = this.players[currentIdx];
        if (current.dead) return;
        if (isInitialTarget && hasSkill(current.hero, '空城') && current.hand.length === 0) {
            this.log(`${current.hero.name}空城，不能成为决斗目标`, 'system');
            this.render();
            return;
        }
        this.render();

        let response;
        if (current.isAI) {
            await this.delay(1000);
            response = MultiAI.decideDuelResponse(this, currentIdx);
        } else {
            response = await this.askPlayerDuel();
        }

        if (response.play) {
            current.hand = current.hand.filter(c => c.id !== response.card.id);
            this.discardPile.push(response.card);
            const isLongdan = response.card.defKey === 'shan' && hasSkill(current.hero, '龙胆');
            this.log(`${current.hero.name}出【杀】${isLongdan ? '（龙胆）' : ''}`, currentIdx === 0 ? 'player' : 'ai');
            this.render();
            await this.delay(600);
            await this.juedouStep(otherIdx, currentIdx, damageCard, false);
        } else {
            this.log(`${current.hero.name}不出杀，受到1点伤害`, currentIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(currentIdx, 'damage');
            await this.dealDamage(currentIdx, otherIdx, damageCard);
        }
    },

    // ===== 南蛮入侵 =====
    async resolveNanman(sourceIdx) {
        const source = this.players[sourceIdx];
        this.log(`${source.hero.name}使用【南蛮入侵】`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'attack');
        this.render();

        // 对所有存活的其他角色结算
        const targets = this.players.filter((p, i) => i !== sourceIdx && !p.dead);
        for (const target of targets) {
            if (this.gameOver) break;
            if (target.dead) continue;
            const targetIdx = this.players.indexOf(target);
            let response;
            if (target.isAI) {
                await this.delay(800);
                response = MultiAI.decideNanmanDodge(this, targetIdx);
            } else {
                response = await this.askPlayerNanman();
            }
            if (response.play) {
                target.hand = target.hand.filter(c => c.id !== response.card.id);
                this.discardPile.push(response.card);
                this.log(`${target.hero.name}出【杀】抵挡`, targetIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(targetIdx, 'dodge');
                this.render();
            } else {
                this.log(`${target.hero.name}没有出杀，受到1点伤害`, targetIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(targetIdx, 'damage');
                await this.dealDamage(targetIdx, sourceIdx, null);
            }
        }
        if (!this.responseResolver && !this.gameOver && this.currentPlayer === 0) this.processing = false;
        this.render();
    },

    // ===== 万箭齐发 =====
    async resolveWanjian(sourceIdx) {
        const source = this.players[sourceIdx];
        this.log(`${source.hero.name}使用【万箭齐发】`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'attack');
        this.render();

        const targets = this.players.filter((p, i) => i !== sourceIdx && !p.dead);
        for (const target of targets) {
            if (this.gameOver) break;
            if (target.dead) continue;
            const targetIdx = this.players.indexOf(target);
            let response;
            if (target.isAI) {
                await this.delay(800);
                response = MultiAI.decideWanjianDodge(this, targetIdx);
            } else {
                response = await this.askPlayerWanjian();
            }
            if (response.play) {
                target.hand = target.hand.filter(c => c.id !== response.card.id);
                this.discardPile.push(response.card);
                const skillText = response.card.defKey === 'sha' ? '（龙胆）' : '';
                this.log(`${target.hero.name}出【闪】${skillText}抵挡`, targetIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(targetIdx, 'dodge');
                this.render();
            } else {
                this.log(`${target.hero.name}没有出闪，受到1点伤害`, targetIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(targetIdx, 'damage');
                await this.dealDamage(targetIdx, sourceIdx, null);
            }
        }
        if (!this.responseResolver && !this.gameOver && this.currentPlayer === 0) this.processing = false;
        this.render();
    },

    // ===== 过河拆桥 =====
    async resolveGuohe(sourceIdx, targetIdx) {
        const source = this.players[sourceIdx];
        const target = this.players[targetIdx];
        this.log(`${source.hero.name}使用【过河拆桥】，目标：${target.hero.name}`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        this.render();

        let selection;
        if (source.isAI) {
            selection = MultiAI.chooseSabotageCard(target);
        } else {
            selection = await this.askPlayerSelectTargetCard('guohe', targetIdx);
        }

        if (!selection) { this.log(`没有牌可以弃置`, 'system'); return; }

        if (selection.type === 'hand') {
            const card = target.hand[selection.index];
            target.hand.splice(selection.index, 1);
            this.discardPile.push(card);
            this.log(`${source.hero.name}弃置了${target.hero.name}的【${card.name}】`, sourceIdx === 0 ? 'player' : 'ai');
        } else {
            const equip = target.equipment[selection.slot];
            target.equipment[selection.slot] = null;
            this.discardPile.push(equip);
            this.log(`${source.hero.name}弃置了${target.hero.name}的【${equip.name}】`, sourceIdx === 0 ? 'player' : 'ai');
        }
        this.render();
    },

    // ===== 顺手牵羊 =====
    async resolveShunshou(sourceIdx, targetIdx) {
        const source = this.players[sourceIdx];
        const target = this.players[targetIdx];
        this.log(`${source.hero.name}使用【顺手牵羊】，目标：${target.hero.name}`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        this.render();

        let selection;
        if (source.isAI) {
            selection = MultiAI.chooseSabotageCard(target);
        } else {
            selection = await this.askPlayerSelectTargetCard('shunshou', targetIdx);
        }

        if (!selection) { this.log(`没有牌可以获得`, 'system'); return; }

        if (selection.type === 'hand') {
            const card = target.hand[selection.index];
            target.hand.splice(selection.index, 1);
            source.hand.push(card);
            this.log(`${source.hero.name}获得了${target.hero.name}的【${card.name}】`, sourceIdx === 0 ? 'player' : 'ai');
        } else {
            const equip = target.equipment[selection.slot];
            target.equipment[selection.slot] = null;
            source.hand.push(equip);
            this.log(`${source.hero.name}获得了${target.hero.name}的【${equip.name}】`, sourceIdx === 0 ? 'player' : 'ai');
        }
        this.render();
    },

    // ===== 乐不思蜀 =====
    resolveLebusishu(sourceIdx, targetIdx) {
        const source = this.players[sourceIdx];
        const target = this.players[targetIdx];
        this.log(`${source.hero.name}使用【乐不思蜀】，目标：${target.hero.name}`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        target.lebusishu = true;
        this.render();
    },

    async processLebusishu(playerIdx) {
        const player = this.players[playerIdx];
        if (!player.lebusishu) return false;
        player.lebusishu = false;
        this.log(`${player.hero.name}进行【乐不思蜀】判定...`, 'system');
        this.render();
        await this.delay(1200);
        const judgeCard = this.drawCard();
        this.discardPile.push(judgeCard);
        this.log(`判定结果：${judgeCard.suit}${judgeCard.number}（${judgeCard.isRed ? '红色' : '黑色'}）`, 'system');
        this.render();
        await this.delay(800);
        if (judgeCard.suit === SUIT.HEART) {
            this.log(`判定为红桃，乐不思蜀失效！`, 'system');
            return false;
        } else {
            this.log(`判定非红桃，乐不思蜀生效，跳过出牌阶段！`, 'system');
            return true;
        }
    },

    // ===== 火攻 =====
    async resolveHuogong(sourceIdx, targetIdx) {
        const source = this.players[sourceIdx];
        const target = this.players[targetIdx];
        this.log(`${source.hero.name}使用【火攻】，目标：${target.hero.name}`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        if (source.hand.length === 0) { this.log(`没有手牌，火攻无效`, 'system'); return; }
        this.log(`${source.hero.name}展示一张手牌发动火攻`, sourceIdx === 0 ? 'player' : 'ai');
        this.render();
        await this.delay(800);
        this.log(`${target.hero.name}受到1点火焰伤害`, targetIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(targetIdx, 'damage');
        await this.dealDamage(targetIdx, sourceIdx, null);
    },

    // ===== 桃园结义 =====
    resolveTaoyuan(sourceIdx) {
        const source = this.players[sourceIdx];
        this.log(`${source.hero.name}使用【桃园结义】，所有角色回复1点体力`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        for (let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            if (!p.dead && p.hp < p.maxHp) {
                this.heal(i, 1);
                this.log(`${p.hero.name}回复1点体力`, i === 0 ? 'player' : 'ai');
            }
        }
        this.render();
    },

    // ===== 五谷丰登 =====
    resolveWugu(sourceIdx) {
        const source = this.players[sourceIdx];
        this.log(`${source.hero.name}使用【五谷丰登】，所有角色摸一张牌`, sourceIdx === 0 ? 'player' : 'ai');
        this.sayHeroLine(sourceIdx, 'skill');
        for (let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            if (!p.dead) {
                p.hand.push(this.drawCard());
                this.log(`${p.hero.name}摸了一张牌`, i === 0 ? 'player' : 'ai');
            }
        }
        this.render();
    },

    // ===== 伤害结算 =====
    async dealDamage(targetIdx, sourceIdx, card) {
        const target = this.players[targetIdx];
        if (target.dead) return;
        target.hp -= 1;
        this.log(`${target.hero.name}受到1点伤害（${target.hp}/${target.maxHp}）`, 'damage');
        this.sayHeroLine(targetIdx, 'damage');
        this.flashDamage(targetIdx);

        // 麒麟弓
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
            await this.triggerAfterDamage(targetIdx, sourceIdx, card);
        }
    },

    async triggerAfterDamage(targetIdx, sourceIdx, card) {
        const target = this.players[targetIdx];

        // 奸雄
        if (hasSkill(target.hero, '奸雄') && card) {
            const idx = this.discardPile.findIndex(c => c.id === card.id);
            if (idx >= 0) {
                this.discardPile.splice(idx, 1);
                target.hand.push(card);
                this.log(`${target.hero.name}发动【奸雄】，获得【${card.name}】`, targetIdx === 0 ? 'player' : 'ai');
                this.render();
            }
        }

        // 反馈
        if (hasSkill(target.hero, '反馈') && sourceIdx >= 0) {
            const source = this.players[sourceIdx];
            if (source.hand.length > 0) {
                const ri = Math.floor(Math.random() * source.hand.length);
                const stolen = source.hand.splice(ri, 1)[0];
                target.hand.push(stolen);
                this.log(`${target.hero.name}发动【反馈】，获得${source.hero.name}的一张牌`, targetIdx === 0 ? 'player' : 'ai');
                this.render();
            } else if (source.equipment.weapon) {
                const stolen = source.equipment.weapon; source.equipment.weapon = null;
                target.hand.push(stolen);
                this.log(`${target.hero.name}发动【反馈】，获得${source.hero.name}的【${stolen.name}】`, targetIdx === 0 ? 'player' : 'ai');
                this.render();
            }
        }

        // 刚烈
        if (hasSkill(target.hero, '刚烈') && sourceIdx >= 0) {
            await this.triggerGanglie(targetIdx, sourceIdx);
        }
    },

    async triggerGanglie(targetIdx, sourceIdx) {
        const target = this.players[targetIdx];
        const source = this.players[sourceIdx];
        this.log(`${target.hero.name}发动【刚烈】`, 'system');

        let choice;
        if (source.isAI) {
            const c = MultiAI.decideGanglie(this, sourceIdx);
            choice = c.choice;
        } else {
            choice = await this.askPlayerGanglie();
        }

        if (choice === 'discard' && source.hand.length > 0) {
            if (source.isAI) {
                const idx = Math.floor(Math.random() * source.hand.length);
                const card = source.hand.splice(idx, 1)[0];
                this.discardPile.push(card);
                this.log(`${source.hero.name}弃置了一张牌`, sourceIdx === 0 ? 'player' : 'ai');
                this.render();
            } else {
                this.log(`请选择一张手牌弃置`, 'system');
                this.ganglieDiscard = true;
                this.render();
                await new Promise(resolve => { this.ganglieDiscardResolver = resolve; });
            }
        } else {
            source.hp -= 1;
            this.log(`${source.hero.name}受到1点伤害`, 'damage');
            this.flashDamage(sourceIdx);
            if (source.hp <= 0) { await this.checkDying(sourceIdx, targetIdx, null); return; }
            this.render();
        }
    },

    // ===== 濒死检查 =====
    async checkDying(playerIdx, sourceIdx, card) {
        const player = this.players[playerIdx];
        this.log(`${player.hero.name}濒死！`, 'system');
        this.sayHeroLine(playerIdx, 'dying');

        // 先询问所有存活玩家是否出桃救人（简化：只询问濒死者自己和人类玩家）
        let saved = false;
        if (player.isAI) {
            const peach = MultiAI.decidePeachOnDying(this, playerIdx);
            if (peach.use) {
                player.hand = player.hand.filter(c => c.id !== peach.card.id);
                this.discardPile.push(peach.card);
                player.hp = 1;
                this.log(`${player.hero.name}使用【桃】${peach.asSkill ? '（仁德）' : ''}自救，体力回复至1`, 'ai');
                this.sayHeroLine(playerIdx, 'heal');
                saved = true;
            }
        } else {
            const response = await this.askPlayerPeach();
            if (response.use) {
                player.hand = player.hand.filter(c => c.id !== response.card.id);
                this.discardPile.push(response.card);
                player.hp = 1;
                this.log(`你使用【桃】${response.asSkill ? '（仁德）' : ''}自救，体力回复至1`, 'player');
                this.sayHeroLine(playerIdx, 'heal');
                saved = true;
            }
        }

        if (saved) {
            this.render();
            await this.triggerAfterDamage(playerIdx, sourceIdx, card);
        } else {
            player.dead = true;
            this.log(`${player.hero.name}阵亡！`, 'system');
            this.render();

            // 检查游戏是否结束
            const alive = this.getAlivePlayers();
            if (alive.length <= 1) {
                this.gameOver = true;
                this.showGameOver(alive.length === 1 && alive[0] === this.players[0]);
            }
        }
    }
});
