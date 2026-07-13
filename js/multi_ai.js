// ===== 多人对战 AI 逻辑 =====

const MultiAI = {
    /**
     * AI出牌决策
     * @param {object} game - 游戏实例
     * @param {number} playerIdx - AI玩家索引
     * @returns {object|null} 行动对象
     */
    decideTurnAction(game, playerIdx) {
        const ai = game.players[playerIdx];
        const aliveOpponents = game.getAliveOpponents(playerIdx);

        if (aliveOpponents.length === 0) return { action: 'end' };

        // 优先级1: 濒死时用桃
        if (ai.hp <= 0) return null;
        if (ai.hp <= 1 && ai.hp < ai.maxHp) {
            const tao = this.findCard(ai.hand, 'tao');
            if (tao) return { action: 'play', card: tao, target: playerIdx };
        }
        // 低血量回血
        if (ai.hp <= 2 && ai.hp < ai.maxHp) {
            const tao = this.findCard(ai.hand, 'tao');
            if (tao && Math.random() < 0.6) return { action: 'play', card: tao, target: playerIdx };
        }

        // 优先级2: 苦肉技能（黄盖）
        if (hasSkill(ai.hero, '苦肉') && ai.hp > 1 && ai.hand.length < 5) {
            if (Math.random() < 0.35) {
                return { action: 'skill_kurou' };
            }
        }

        // 优先级3: 装备
        const equip = this.findEquipCard(ai.hand);
        if (equip && !this.hasEquipType(ai, equip.equipType)) {
            return { action: 'play', card: equip, target: playerIdx };
        }

        // 优先级4: 无中生有
        const wusheng = this.findCard(ai.hand, 'wushengshengyou');
        if (wusheng) {
            return { action: 'play', card: wusheng, target: playerIdx };
        }

        // 优先级5: 选择目标
        const target = this.chooseTarget(game, playerIdx, aliveOpponents);
        if (!target) return { action: 'end' };

        // 优先级6: 顺手牵羊/过河拆桥
        const shunshou = this.findCard(ai.hand, 'shunshouqiannyang');
        if (shunshou) {
            const targetWithCards = aliveOpponents.find(o => o.hand.length > 0 || this.hasAnyEquip(o));
            if (targetWithCards) {
                return { action: 'play', card: shunshou, target: targetWithCards.idx };
            }
        }
        const guohe = this.findCard(ai.hand, 'guohechaiqiao');
        if (guohe) {
            const targetWithCards = aliveOpponents.find(o => o.hand.length > 0 || this.hasAnyEquip(o));
            if (targetWithCards) {
                return { action: 'play', card: guohe, target: targetWithCards.idx };
            }
        }

        // 优先级7: 乐不思蜀（控制血量最高或手牌最多的对手）
        const lebusishu = this.findCard(ai.hand, 'lebusishu');
        if (lebusishu) {
            const controlTarget = aliveOpponents.reduce((best, o) => {
                if (!best) return o;
                if (o.hand.length > best.hand.length) return o;
                return best;
            }, null);
            if (controlTarget && !controlTarget.lebusishu) {
                return { action: 'play', card: lebusishu, target: controlTarget.idx };
            }
        }

        // 优先级8: 火攻
        const huogong = this.findCard(ai.hand, 'huogong');
        if (huogong && ai.hand.length > 1) {
            return { action: 'play', card: huogong, target: target.idx };
        }

        // 优先级9: 桃园结义（自己残血时使用）
        if (ai.hp < ai.maxHp) {
            const taoyuan = this.findCard(ai.hand, 'taoyuanjieyi');
            if (taoyuan && Math.random() < 0.5) {
                return { action: 'play', card: taoyuan, target: playerIdx };
            }
        }

        // 优先级10: 五谷丰登
        const wugu = this.findCard(ai.hand, 'wugufengdeng');
        if (wugu && ai.hand.length <= 3) {
            return { action: 'play', card: wugu, target: playerIdx };
        }

        // 优先级11: 南蛮入侵/万箭齐发（手牌多时使用）
        const nanman = this.findCard(ai.hand, 'nanmanruqin');
        if (nanman && ai.hand.length > 2) {
            return { action: 'play', card: nanman, target: playerIdx };
        }
        const wanjian = this.findCard(ai.hand, 'wanjianqifa');
        if (wanjian && ai.hand.length > 2) {
            return { action: 'play', card: wanjian, target: playerIdx };
        }

        // 优先级12: 决斗
        const juedou = this.findCard(ai.hand, 'juedou');
        if (juedou) {
            const shaCount = ai.hand.filter(c => c.defKey === 'sha').length;
            if (shaCount >= 2) {
                // 检查目标是否有空城
                if (!(hasSkill(target.hero, '空城') && target.hand.length === 0)) {
                    return { action: 'play', card: juedou, target: target.idx };
                }
            }
        }

        // 优先级13: 出杀
        if (!game.hasSlashedThisTurn || this.canSlashUnlimited(ai)) {
            const sha = this.findCard(ai.hand, 'sha');
            if (sha) {
                if (!(hasSkill(target.hero, '空城') && target.hand.length === 0)) {
                    return { action: 'play', card: sha, target: target.idx };
                }
            }
            // 关羽武圣：红色牌当杀
            if (hasSkill(ai.hero, '武圣')) {
                const redCard = ai.hand.find(c => c.isRed && c.defKey !== 'sha' && c.defKey !== 'tao' && c.defKey !== 'shan');
                if (redCard && !(hasSkill(target.hero, '空城') && target.hand.length === 0)) {
                    return { action: 'play_wusheng', card: redCard, target: target.idx };
                }
            }
        }

        return { action: 'end' };
    },

    /**
     * 选择攻击目标 - 优先攻击血量低的对手
     */
    chooseTarget(game, playerIdx, aliveOpponents) {
        if (aliveOpponents.length === 0) return null;
        if (aliveOpponents.length === 1) return aliveOpponents[0];

        // 排序：优先攻击血量最低的，其次是手牌少的
        const sorted = [...aliveOpponents].sort((a, b) => {
            // 优先攻击人类玩家（概率性）
            if (!a.isAI && b.isAI && Math.random() < 0.3) return -1;
            if (a.isAI && !b.isAI && Math.random() < 0.3) return 1;
            // 血量低的优先
            if (a.hp !== b.hp) return a.hp - b.hp;
            // 手牌少的优先
            return a.hand.length - b.hand.length;
        });

        // 有一定随机性
        if (Math.random() < 0.3 && aliveOpponents.length > 1) {
            return aliveOpponents[Math.floor(Math.random() * Math.min(3, aliveOpponents.length))];
        }

        return sorted[0];
    },

    /**
     * AI决定是否出闪
     */
    decideDodge(game, targetIdx, needCount) {
        const ai = game.players[targetIdx];

        const availableShans = ai.hand.filter(c => c.defKey === 'shan');
        const availableShas = hasSkill(ai.hero, '龙胆') ? ai.hand.filter(c => c.defKey === 'sha') : [];
        const totalAvailable = [...availableShans, ...availableShas];

        if (totalAvailable.length < needCount) {
            if (ai.hp <= 1 && availableShans.length > 0) {
                return { dodge: true, cards: [availableShans[0]] };
            }
            return { dodge: false, cards: [] };
        }

        const hpAfterDamage = ai.hp - 1;

        // 受到伤害会死，一定闪
        if (hpAfterDamage <= 0) {
            return { dodge: true, cards: this.pickDodgeCards(availableShans, availableShas, needCount) };
        }

        // HP低时倾向闪
        if (ai.hp <= 2) {
            return { dodge: true, cards: this.pickDodgeCards(availableShans, availableShas, needCount) };
        }

        // HP较高时有一定概率闪
        const dodgeProb = 0.5 + (1 - ai.hp / ai.maxHp) * 0.3;
        if (Math.random() < dodgeProb) {
            return { dodge: true, cards: this.pickDodgeCards(availableShans, availableShas, needCount) };
        }

        return { dodge: false, cards: [] };
    },

    /**
     * AI决定是否出杀（响应南蛮入侵）
     */
    decideNanmanDodge(game, targetIdx) {
        const ai = game.players[targetIdx];
        const shas = ai.hand.filter(c => c.defKey === 'sha');

        if (shas.length === 0) return { dodge: false, card: null };
        if (ai.hp <= 2) return { dodge: true, card: shas[0] };
        if (ai.hand.length > 4) return { dodge: true, card: shas[0] };
        if (Math.random() < 0.5) return { dodge: true, card: shas[0] };

        return { dodge: false, card: null };
    },

    /**
     * AI决定是否出闪（响应万箭齐发）
     */
    decideWanjianDodge(game, targetIdx) {
        const ai = game.players[targetIdx];
        const shans = ai.hand.filter(c => c.defKey === 'shan');
        const shas = hasSkill(ai.hero, '龙胆') ? ai.hand.filter(c => c.defKey === 'sha') : [];
        const total = [...shans, ...shas];

        if (total.length === 0) return { dodge: false, card: null };
        if (ai.hp <= 2) return { dodge: true, card: shans[0] || shas[0] };
        if (ai.hand.length > 4) return { dodge: true, card: shans[0] || shas[0] };
        if (Math.random() < 0.5) return { dodge: true, card: shans[0] || shas[0] };

        return { dodge: false, card: null };
    },

    /**
     * AI决斗响应
     */
    decideDuelResponse(game, targetIdx) {
        const ai = game.players[targetIdx];
        const shas = ai.hand.filter(c => c.defKey === 'sha');
        const longdanShans = hasSkill(ai.hero, '龙胆') ? ai.hand.filter(c => c.defKey === 'shan') : [];
        const allShas = [...shas, ...longdanShans];

        if (allShas.length === 0) return { play: false, card: null };
        if (ai.hp <= 2) return { play: true, card: allShas[0] };
        if (allShas.length >= 2) return { play: true, card: allShas[0] };
        if (Math.random() < 0.4) return { play: true, card: allShas[0] };

        return { play: false, card: null };
    },

    /**
     * AI濒死时是否用桃
     */
    decidePeachOnDying(game, targetIdx) {
        const ai = game.players[targetIdx];
        const tao = this.findCard(ai.hand, 'tao');
        if (tao) return { use: true, card: tao };

        // 刘备仁德
        if (hasSkill(ai.hero, '仁德') && ai.hand.length > 0) {
            const uselessCard = ai.hand.find(c => c.defKey === 'guohechaiqiao')
                || ai.hand.find(c => c.defKey === 'shunshouqiannyang')
                || ai.hand.find(c => c.defKey === 'nanmanruqin')
                || ai.hand.find(c => c.defKey === 'wanjianqifa')
                || ai.hand.find(c => c.defKey === 'juedou')
                || ai.hand[0];
            return { use: true, card: uselessCard, asSkill: true };
        }

        return { use: false, card: null };
    },

    /**
     * AI选择过河拆桥的目标
     */
    chooseSabotageTarget(game, sourceIdx) {
        const target = game.players[sourceIdx === 0 ? 1 : 0]; // This won't work for multi
        // For multi: pick the target that was already selected
        return null; // handled in game logic
    },

    /**
     * AI选择要弃置/偷取的牌
     */
    chooseSabotageCard(targetPlayer) {
        // 优先拆装备
        if (targetPlayer.equipment.weapon) return { type: 'equip', slot: 'weapon' };
        if (targetPlayer.equipment.armor) return { type: 'equip', slot: 'armor' };
        if (targetPlayer.equipment.mountMinus) return { type: 'equip', slot: 'mountMinus' };
        if (targetPlayer.equipment.mountPlus) return { type: 'equip', slot: 'mountPlus' };
        if (targetPlayer.hand.length > 0) return { type: 'hand', index: Math.floor(Math.random() * targetPlayer.hand.length) };
        return null;
    },

    /**
     * AI选择弃牌
     */
    chooseDiscard(game, playerIdx, count) {
        const ai = game.players[playerIdx];
        const sorted = [...ai.hand].sort((a, b) => {
            const priority = {
                'shan': 0, 'tao': 1, 'sha': 2, 'juedou': 3,
                'nanmanruqin': 4, 'wanjianqifa': 5, 'wushengshengyou': 6,
                'shunshouqiannyang': 7, 'guohechaiqiao': 8,
                'huogong': 9, 'lebusishu': 10, 'taoyuanjieyi': 11, 'wugufengdeng': 12,
                'wuxiekeji': 13,
                'zhugecrossbow': 14, 'qinglongyanyuedao': 15, 'zhangbashemao': 16,
                'fangtianhuaji': 17, 'cixiongshuanggujian': 18, 'qilingong': 19,
                'baguazhen': 20, 'renwangdun': 21,
                'chitu': 22, 'dilu': 23, 'zhaohuangfeidian': 24, 'jueying': 25
            };
            return (priority[a.defKey] || 99) - (priority[b.defKey] || 99);
        });
        return sorted.slice(0, count);
    },

    /**
     * AI刚烈触发
     */
    decideGanglie(game, playerIdx) {
        const ai = game.players[playerIdx];
        if (ai.hand.length >= 3) {
            return { choice: 'discard' };
        }
        return { choice: 'damage' };
    },

    // ===== 辅助方法 =====

    findCard(hand, defKey) {
        return hand.find(c => c.defKey === defKey);
    },

    findEquipCard(hand) {
        return hand.find(c => c.type === 'equipment');
    },

    hasEquipType(player, equipType) {
        if (!player.equipment) return false;
        if (equipType === 'weapon') return !!player.equipment.weapon;
        if (equipType === 'armor') return !!player.equipment.armor;
        if (equipType === 'mountPlus') return !!player.equipment.mountPlus;
        if (equipType === 'mountMinus') return !!player.equipment.mountMinus;
        return false;
    },

    hasAnyEquip(player) {
        return player.equipment.weapon || player.equipment.armor || player.equipment.mountPlus || player.equipment.mountMinus;
    },

    canSlashUnlimited(player) {
        return hasSkill(player.hero, '咆哮') || (player.equipment.weapon && player.equipment.weapon.defKey === 'zhugecrossbow');
    },

    pickDodgeCards(shans, shas, count) {
        const cards = [];
        for (let i = 0; i < shans.length && cards.length < count; i++) {
            cards.push(shans[i]);
        }
        for (let i = 0; i < shas.length && cards.length < count; i++) {
            cards.push(shas[i]);
        }
        return cards;
    }
};
