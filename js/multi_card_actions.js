// ===== 多人对战 - 卡牌使用与结算逻辑 =====
// 挂载到 MultiGame 原型上

Object.assign(MultiGame, {
    // ===== AI出牌执行 =====
    async executeCardPlay(sourceIdx, card, targetIdx, playAs) {
        const source = this.players[sourceIdx];
        source.hand = source.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);

        // 集智（黄月英）：使用非转化的普通锦囊牌时摸一张牌
        if (!playAs && card.type === 'trick' && hasSkill(source.hero, '集智')) {
            const drawnCard = this.drawCard();
            source.hand.push(drawnCard);
            this.log(`${source.hero.name}发动【集智】，摸了1张牌`, sourceIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(sourceIdx, 'skill');
        }

        const effectiveDefKey = playAs ? playAs.as : card.defKey;
        const effectiveCard = playAs ? { ...card, defKey: playAs.as, name: CARD_DEFS[playAs.as].name } : card;

        if (playAs) {
            this.log(`${source.hero.name}发动【${playAs.skill}】，将【${card.name}】当【${CARD_DEFS[playAs.as].name}】使用`, sourceIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(sourceIdx, 'skill');
        } else {
            this.log(`${source.hero.name}使用【${card.name}】`, sourceIdx === 0 ? 'player' : 'ai');
        }

        switch (effectiveDefKey) {
            case 'sha':
                this.hasSlashedThisTurn = true;
                this.sayHeroLine(sourceIdx, 'attack');
                await this.resolveSha(sourceIdx, targetIdx, effectiveCard);
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
                    this.log(`${source.hero.name}装备了【${card.name}】`, sourceIdx === 0 ? 'player' : 'ai');
                    this.sayHeroLine(sourceIdx, 'skill');
                    this.render();
                }
                break;
        }

        // 连营（陆逊）：失去最后的手牌时摸一张牌
        this.checkLianying(sourceIdx);
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

    // 制衡（孙权）：弃置任意张牌，然后摸等量的牌
    async executeZhiheng(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedZhihengThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        if (player.isAI) {
            const discardCount = Math.min(player.hand.length, Math.max(1, player.hand.length - player.hp));
            const toDiscard = MultiAI.chooseDiscard(this, playerIdx, discardCount);
            toDiscard.forEach(c => {
                player.hand = player.hand.filter(h => h.id !== c.id);
                this.discardPile.push(c);
            });
            this.log(`${player.hero.name}发动【制衡】，弃了${discardCount}张牌`, 'ai');
            for (let i = 0; i < discardCount; i++) player.hand.push(this.drawCard());
            this.log(`${player.hero.name}摸了${discardCount}张牌`, 'ai');
            this.render();
        } else {
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
        if (player.isAI) {
            const discardCard = player.hand[0];
            player.hand = player.hand.filter(c => c.id !== discardCard.id);
            this.discardPile.push(discardCard);
            this.log(`${player.hero.name}发动【离间】，弃置一张牌`, 'ai');
            const targetIdx = this.players.findIndex((p, i) => i !== playerIdx && !p.dead);
            if (targetIdx >= 0) await this.resolveJuedou(playerIdx, targetIdx, null);
        } else {
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
            const card = MultiAI.chooseFanjianCard(this, playerIdx);
            if (!card) return;
            player.hand = player.hand.filter(c => c.id !== card.id);
            // AI选择目标（第一个存活的人类玩家或随机对手）
            const targetIdx = this.players.findIndex((p, i) => i !== playerIdx && !p.dead);
            if (targetIdx < 0) return;
            this.log(`${player.hero.name}发动【反间】，将【${card.name}】交给${this.players[targetIdx].hero.name}`, playerIdx === 0 ? 'player' : 'ai');
            this.render();
            await this.delay(800);
            if (targetIdx === 0) {
                // 询问玩家选择
                const choice = await this.askPlayerFanjianChoice(card);
                if (choice === 'use') {
                    this.log(`你选择使用【${card.name}】`, 'player');
                    await this.resolveFanjianCard(0, playerIdx, card);
                } else {
                    this.log(`你选择受到1点伤害`, 'player');
                    await this.dealDamage(0, playerIdx, null);
                }
            } else {
                // AI目标自动决策
                const aiChoice = MultiAI.decideFanjianResponse(this, targetIdx, card);
                if (aiChoice === 'use') {
                    this.log(`${this.players[targetIdx].hero.name}选择使用【${card.name}】`, 'ai');
                    await this.resolveFanjianCard(targetIdx, playerIdx, card);
                } else {
                    this.log(`${this.players[targetIdx].hero.name}选择受到1点伤害`, 'ai');
                    await this.dealDamage(targetIdx, playerIdx, null);
                }
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
        if (card.defKey === 'sha') {
            this.log(`${target.hero.name}对${this.players[sourceIdx].hero.name}使用【杀】`, targetIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(targetIdx, 'attack');
            this.render();
            await this.resolveSha(targetIdx, sourceIdx, { ...card, defKey: 'sha', name: '杀' });
        } else if (card.defKey === 'tao') {
            if (target.hp < target.maxHp) {
                this.heal(targetIdx, 1);
                this.log(`${target.hero.name}使用【桃】回复1点体力`, targetIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(targetIdx, 'heal');
            } else {
                this.log(`${target.hero.name}体力已满，【桃】无效`, 'system');
            }
            this.render();
        } else if (card.type === 'trick') {
            this.log(`${target.hero.name}无法使用【${card.name}】，受到1点伤害`, 'system');
            this.discardPile.push(card);
            await this.dealDamage(targetIdx, sourceIdx, null);
        } else {
            this.log(`${target.hero.name}无法使用【${card.name}】，受到1点伤害`, 'system');
            this.discardPile.push(card);
            await this.dealDamage(targetIdx, sourceIdx, null);
        }
    },

    // ===== 检查杀是否不可闪避 =====
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

    // ===== 杀的结算 =====
    async resolveSha(sourceIdx, targetIdx, card) {
        const source = this.players[sourceIdx];
        let target = this.players[targetIdx];

        if (target.dead) return;

        // 空城检查
        if (hasSkill(target.hero, '空城') && target.hand.length === 0) {
            this.log(`${target.hero.name}空城，不能成为杀的目标`, 'system');
            this.render();
            return;
        }

        // 流离（大乔）：成为杀目标时弃一张牌转移
        if (hasSkill(target.hero, '流离') && target.hand.length > 0) {
            const otherTargets = this.players.filter((p, i) => i !== targetIdx && i !== sourceIdx && !p.dead);
            if (otherTargets.length > 0) {
                let useLiuli = false;
                if (target.isAI) {
                    // AI流离：手牌充足且残血时概率发动
                    if (target.hp <= 2 && target.hand.length > 2 && Math.random() < 0.5) {
                        useLiuli = true;
                    }
                } else {
                    // 玩家流离：询问
                    useLiuli = await this.askLiuli(targetIdx);
                }
                if (useLiuli) {
                    // 弃一张牌
                    let discardCard;
                    if (target.isAI) {
                        discardCard = MultiAI.chooseDiscard(this, targetIdx, 1)[0];
                    } else {
                        discardCard = await this.askLiuliCard();
                    }
                    if (discardCard) {
                        target.hand = target.hand.filter(c => c.id !== discardCard.id);
                        this.discardPile.push(discardCard);
                        // 选择新目标
                        let newTarget;
                        if (target.isAI) {
                            // AI选择血量最低的其他角色
                            newTarget = otherTargets.reduce((best, p) => {
                                if (!best) return p;
                                return p.hp < best.hp ? p : best;
                            }, null);
                        } else {
                            const newTargetIdx = await this.askPlayerSelectTarget('选择流离转移目标', targetIdx);
                            if (newTargetIdx === -1) {
                                // 取消，继续原流程
                            } else {
                                newTarget = this.players[newTargetIdx];
                            }
                        }
                        if (newTarget) {
                            const newTargetIdx = this.players.indexOf(newTarget);
                            this.log(`${target.hero.name}发动【流离】，将【杀】转移给${newTarget.hero.name}`, targetIdx === 0 ? 'player' : 'ai');
                            this.sayHeroLine(targetIdx, 'skill');
                            this.render();
                            await this.delay(500);
                            targetIdx = newTargetIdx;
                            target = this.players[targetIdx];
                        }
                    }
                }
            }
        }

        let needShan = 1;
        if (hasSkill(source.hero, '无双')) needShan = 2;

        // 突袭（张辽）：无视防具
        if (!hasSkill(source.hero, '突袭')) {
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
        } else {
            this.log(`${source.hero.name}发动【突袭】，无视防具`, sourceIdx === 0 ? 'player' : 'ai');
        }

        // 检查不可闪避（铁骑、烈弓）
        const unblockable = await this.checkShaUnblockable(sourceIdx, targetIdx, card);

        // 裸衣（许褚）：不能使用闪
        if (hasSkill(target.hero, '裸衣')) {
            this.log(`${target.hero.name}【裸衣】生效，不能使用【闪】`, 'system');
            this.render();
            await this.delay(600);
            this.log(`${target.hero.name}没有出闪`, targetIdx === 0 ? 'player' : 'ai');
            await this.dealDamage(targetIdx, sourceIdx, card);
            if (!this.responseResolver && !this.gameOver && this.currentPlayer === 0) this.processing = false;
            this.render();
            return;
        }

        if (unblockable) {
            this.log(`此杀不可闪避！`, 'system');
            this.render();
            await this.delay(600);
            this.log(`${target.hero.name}没有出闪`, targetIdx === 0 ? 'player' : 'ai');
            await this.dealDamage(targetIdx, sourceIdx, card);
            if (!this.responseResolver && !this.gameOver && this.currentPlayer === 0) this.processing = false;
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
                const skillText = response.card.defKey === 'shan' ? '（龙胆）' : '';
                this.log(`${target.hero.name}出【杀】${skillText}抵挡`, targetIdx === 0 ? 'player' : 'ai');
                if (response.card.defKey === 'shan') this.sayHeroLine(targetIdx, 'skill');
                else this.sayHeroLine(targetIdx, 'dodge');
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
        // 天妒/鬼才处理
        const finalJudgeCard = await this.processJudgeCard(playerIdx, judgeCard);
        if (finalJudgeCard.suit === SUIT.HEART) {
            this.log(`判定为红桃，乐不思蜀失效！`, 'system');
            return false;
        } else {
            this.log(`判定非红桃，乐不思蜀生效，跳过出牌阶段！`, 'system');
            return true;
        }
    },

    // ===== 洛神技能（甄姬）- 回合开始阶段进行判定 =====
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

        // 天香（小乔）：受到伤害时可以弃置一张红桃手牌将伤害转移
        if (hasSkill(target.hero, '天香') && sourceIdx >= 0) {
            const heartCard = target.hand.find(c => c.suit === SUIT.HEART);
            if (heartCard) {
                let useTianxiang = false;
                if (target.isAI) {
                    if (target.hp <= 2) useTianxiang = true;
                } else {
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

        // 麒麟弓
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

        // 狂骨（魏延）：对距离1以内的目标造成伤害后回复1点
        if (sourceIdx >= 0 && hasSkill(this.players[sourceIdx].hero, '狂骨')) {
            const source = this.players[sourceIdx];
            if (source.hp < source.maxHp && !source.dead) {
                this.heal(sourceIdx, 1);
                this.log(`${source.hero.name}发动【狂骨】，回复1点体力`, sourceIdx === 0 ? 'player' : 'ai');
                this.sayHeroLine(sourceIdx, 'heal');
                this.render();
            }
        }

        // 遗计（郭嘉）：受到伤害后摸两张牌
        if (hasSkill(target.hero, '遗计')) {
            const drawnCards = [];
            for (let i = 0; i < 2; i++) drawnCards.push(this.drawCard());
            this.log(`${target.hero.name}发动【遗计】，摸了2张牌`, targetIdx === 0 ? 'player' : 'ai');
            this.sayHeroLine(targetIdx, 'skill');
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
            // 简化：选择手牌最少且未满的角色
            let bestIdx = targetIdx;
            let bestDiff = -1;
            for (let i = 0; i < this.players.length; i++) {
                const p = this.players[i];
                if (p.dead) continue;
                const diff = p.maxHp - p.hand.length;
                if (diff > bestDiff && diff > 0) {
                    bestDiff = diff;
                    bestIdx = i;
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

    // ===== 红颜（小乔）：黑桃牌视为红桃 =====
    isCardRedFor(card, hero) {
        if (hasSkill(hero, '红颜') && card.suit === SUIT.SPADE) return true;
        return card.isRed;
    },

    // ===== 天妒/鬼才：判定牌处理 =====
    async processJudgeCard(playerIdx, judgeCard) {
        const player = this.players[playerIdx];
        // 鬼才（司马懿）：在判定牌生效前，可以打出一张手牌代替
        for (let i = 0; i < this.players.length; i++) {
            if (i === playerIdx) continue;
            const guicaiPlayer = this.players[i];
            if (guicaiPlayer.dead) continue;
            if (hasSkill(guicaiPlayer.hero, '鬼才') && guicaiPlayer.hand.length > 0) {
                if (guicaiPlayer.isAI) {
                    if (Math.random() < 0.3) {
                        const replaceCard = guicaiPlayer.hand[0];
                        guicaiPlayer.hand = guicaiPlayer.hand.filter(c => c.id !== replaceCard.id);
                        this.discardPile.push(judgeCard);
                        this.log(`${guicaiPlayer.hero.name}发动【鬼才】，用【${replaceCard.name}】替换判定牌`, i === 0 ? 'player' : 'ai');
                        this.sayHeroLine(i, 'skill');
                        this.render();
                        await this.delay(800);
                        return replaceCard;
                    }
                } else {
                    const useGuicai = await this.askGuicai(judgeCard, playerIdx);
                    if (useGuicai) {
                        this.players[0].hand = this.players[0].hand.filter(c => c.id !== useGuicai.id);
                        this.discardPile.push(judgeCard);
                        this.log(`你发动【鬼才】，用【${useGuicai.name}】替换判定牌`, 'player');
                        this.sayHeroLine(0, 'skill');
                        this.render();
                        await this.delay(800);
                        return useGuicai;
                    }
                }
            }
        }
        // 天妒（郭嘉）：判定牌生效后获得此牌
        if (hasSkill(player.hero, '天妒')) {
            const idx = this.discardPile.findIndex(c => c.id === judgeCard.id);
            if (idx >= 0) this.discardPile.splice(idx, 1);
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
        const aliveCount = this.getAlivePlayers().length;
        const viewCount = Math.min(5, this.deck.length, aliveCount);
        if (viewCount === 0) return;
        const topCards = [];
        for (let i = 0; i < viewCount; i++) topCards.push(this.deck.pop());
        if (player.isAI) {
            const priority = (c) => {
                if (c.defKey === 'sha' || c.defKey === 'shan' || c.defKey === 'tao') return 0;
                if (c.type === 'trick') return 1;
                return 2;
            };
            topCards.sort((a, b) => priority(a) - priority(b));
            for (let i = topCards.length - 1; i >= 0; i--) this.deck.push(topCards[i]);
            this.log(`${player.hero.name}发动【观星】，查看了${viewCount}张牌`, 'ai');
            this.render();
            await this.delay(800);
        } else {
            this.log(`你发动【观星】，查看牌堆顶${viewCount}张牌`, 'player');
            this.guanxingCards = topCards;
            this.guanxingSelected = [];
            this.guanxingMode = true;
            this.render();
            await new Promise(resolve => { this.guanxingResolver = resolve; });
            this.guanxingMode = false;
        }
    },

    confirmGuanxing(topIndices) {
        const top = [];
        const bottom = [];
        this.guanxingCards.forEach((card, i) => {
            if (topIndices.includes(i)) top.push(card);
            else bottom.push(card);
        });
        for (let i = bottom.length - 1; i >= 0; i--) this.deck.push(bottom[i]);
        for (let i = top.length - 1; i >= 0; i--) this.deck.push(top[i]);
        this.log(`观星完成，${top.length}张置于牌堆顶，${bottom.length}张置于牌堆底`, 'player');
        this.guanxingMode = false;
        if (this.guanxingResolver) { const r = this.guanxingResolver; this.guanxingResolver = null; r(); }
    },

    // ===== 青囊（华佗）=====
    async executeQingnang(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedQingnangThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        if (player.isAI) {
            // AI青囊：选择一名残血友方治疗
            const targets = this.players.filter(p => !p.dead && p.hp < p.maxHp);
            if (targets.length > 0 && player.hand.length > 1) {
                const discardCard = MultiAI.chooseDiscard(this, playerIdx, 1)[0];
                if (discardCard) {
                    player.hand = player.hand.filter(c => c.id !== discardCard.id);
                    this.discardPile.push(discardCard);
                    // 治疗自己或最残血的友方
                    let target = player;
                    for (const p of targets) {
                        if (p.hp < target.hp) target = p;
                    }
                    const targetIdx = this.players.indexOf(target);
                    this.heal(targetIdx, 1);
                    this.log(`${player.hero.name}发动【青囊】，弃【${discardCard.name}】，${target.hero.name}回复1点体力`, 'ai');
                    this.render();
                }
            }
        } else {
            this.log(`请选择一张手牌弃置（青囊）`, 'system');
            this.qingnangMode = true;
            this.render();
            await new Promise(resolve => { this.qingnangResolver = resolve; });
            this.qingnangMode = false;
        }
    },

    confirmQingnang(card, targetIdx) {
        const player = this.players[0];
        player.hand = player.hand.filter(c => c.id !== card.id);
        this.discardPile.push(card);
        if (targetIdx >= 0 && this.players[targetIdx].hp < this.players[targetIdx].maxHp) {
            this.heal(targetIdx, 1);
            this.log(`你发动【青囊】，弃【${card.name}】，${this.players[targetIdx].hero.name}回复1点体力`, 'player');
        } else {
            this.log(`你发动【青囊】，弃【${card.name}】`, 'player');
        }
        this.qingnangMode = false;
        if (this.qingnangResolver) { const r = this.qingnangResolver; this.qingnangResolver = null; r(); }
        this.render();
    },

    // ===== 结姻（孙尚香）=====
    async executeJieyin(playerIdx) {
        const player = this.players[playerIdx];
        this.hasUsedJieyinThisTurn = true;
        this.sayHeroLine(playerIdx, 'skill');
        if (player.isAI) {
            if (player.hp < player.maxHp && player.hand.length >= 3) {
                const toDiscard = MultiAI.chooseDiscard(this, playerIdx, 2);
                if (toDiscard.length >= 2) {
                    toDiscard.forEach(c => { player.hand = player.hand.filter(h => h.id !== c.id); this.discardPile.push(c); });
                    this.heal(playerIdx, 1);
                    // 治疗最残血的友方
                    const allies = this.players.filter(p => !p.dead && p !== player && p.hp < p.maxHp);
                    if (allies.length > 0) {
                        let ally = allies[0];
                        for (const a of allies) if (a.hp < ally.hp) ally = a;
                        this.heal(this.players.indexOf(ally), 1);
                    }
                    this.log(`${player.hero.name}发动【结姻】，双方各回复1点体力`, 'ai');
                    this.render();
                }
            }
        } else {
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

    confirmJieyin(targetIdx) {
        if (this.jieyinCards.length < 2) { this.log(`请选择两张牌`, 'system'); return; }
        const player = this.players[0];
        this.jieyinCards.forEach(c => { player.hand = player.hand.filter(h => h.id !== c.id); this.discardPile.push(c); });
        if (player.hp < player.maxHp) this.heal(0, 1);
        if (targetIdx >= 0 && this.players[targetIdx].hp < this.players[targetIdx].maxHp) this.heal(targetIdx, 1);
        this.log(`你发动【结姻】，双方各回复1点体力`, 'player');
        this.jieyinCards = [];
        this.jieyinMode = false;
        if (this.jieyinResolver) { const r = this.jieyinResolver; this.jieyinResolver = null; r(); }
        this.render();
    },

    // ===== 流离（大乔）询问 =====
    askLiuli(targetIdx) {
        return new Promise((resolve) => {
            this.responseMode = 'liuli';
            this.responseResolver = resolve;
            document.getElementById('response-prompt').textContent = '是否发动【流离】转移此杀？';
            const container = document.getElementById('response-cards');
            container.innerHTML = '';
            const btn1 = document.createElement('button');
            btn1.className = 'action-btn green';
            btn1.textContent = '发动流离';
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

    askLiuliCard() {
        return new Promise((resolve) => {
            this.responseMode = 'liuli_card';
            this.responseResolver = resolve;
            document.getElementById('response-prompt').textContent = '请选择一张手牌弃置（流离）';
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
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = '取消';
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
