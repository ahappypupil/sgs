// ===== AI 逻辑 =====

const AI = {
    /**
     * AI出牌决策 - 返回要执行的行动
     * @returns {object|null} 行动对象 {action: 'play', card, target} 或 {action: 'end'} 或 {action: 'skill', ...}
     */
    decideTurnAction(game) {
        const ai = game.players[1];
        const player = game.players[0];
        
        // 优先级1: 濒死时用桃
        if (ai.hp <= 0) return null; // 由濒死逻辑处理
        if (ai.hp <= 1 && ai.hp < ai.maxHp) {
            const tao = this.findCard(ai.hand, 'tao');
            if (tao) return { action: 'play', card: tao, target: 1 };
        }
        // 低血量回血
        if (ai.hp <= 2 && ai.hp < ai.maxHp) {
            const tao = this.findCard(ai.hand, 'tao');
            if (tao && Math.random() < 0.6) return { action: 'play', card: tao, target: 1 };
        }

        // 优先级2: 苦肉技能（黄盖）
        if (hasSkill(ai.hero, '苦肉') && ai.hp > 1 && ai.hand.length < 5) {
            if (Math.random() < 0.4) {
                return { action: 'skill_kurou' };
            }
        }

        // 优先级2.5: 制衡技能（孙权）
        if (hasSkill(ai.hero, '制衡') && !game.hasUsedZhihengThisTurn && ai.hand.length > 0) {
            // 手牌多且没有杀时制衡
            const hasSha = ai.hand.some(c => c.defKey === 'sha');
            const hasShan = ai.hand.some(c => c.defKey === 'shan');
            if ((!hasSha || !hasShan) && Math.random() < 0.5) {
                return { action: 'skill_zhiheng' };
            }
        }

        // 优先级2.6: 离间技能（貂蝉）
        if (hasSkill(ai.hero, '离间') && !game.hasUsedLijianThisTurn && ai.hand.length > 1) {
            const shaCount = ai.hand.filter(c => c.defKey === 'sha').length;
            if (shaCount >= 1 && Math.random() < 0.4) {
                return { action: 'skill_lijian' };
            }
        }

        // 优先级2.7: 反间技能（周瑜）
        if (hasSkill(ai.hero, '反间') && !game.hasUsedFanjianThisTurn && ai.hand.length > 1) {
            if (Math.random() < 0.4) {
                return { action: 'skill_fanjian' };
            }
        }

        // 优先级2.8: 青囊技能（华佗）- 残血时使用
        if (hasSkill(ai.hero, '青囊') && !game.hasUsedQingnangThisTurn && ai.hp < ai.maxHp && ai.hand.length > 1) {
            if (Math.random() < 0.5) {
                return { action: 'skill_qingnang' };
            }
        }

        // 优先级2.9: 结姻技能（孙尚香）- 残血且手牌充足时使用
        if (hasSkill(ai.hero, '结姻') && !game.hasUsedJieyinThisTurn && ai.hp < ai.maxHp && ai.hand.length >= 3) {
            if (Math.random() < 0.5) {
                return { action: 'skill_jieyin' };
            }
        }

        // 优先级3: 装备
        const equip = this.findEquipCard(ai.hand);
        if (equip && !this.hasEquipType(ai, equip.equipType)) {
            return { action: 'play', card: equip, target: 1 };
        }

        // 优先级4: 无中生有
        const wusheng = this.findCard(ai.hand, 'wushengshengyou');
        if (wusheng) {
            return { action: 'play', card: wusheng, target: 1 };
        }

        // 优先级5: 顺手牵羊/过河拆桥（针对玩家）
        if (player.hand.length > 0 || this.hasAnyEquip(player)) {
            const shunshou = this.findCard(ai.hand, 'shunshouqiannyang');
            if (shunshou && !(hasSkill(player.hero, '帷幕') && !shunshou.isRed)) {
                return { action: 'play', card: shunshou, target: 0 };
            }
            const guohe = this.findCard(ai.hand, 'guohechaiqiao');
            if (guohe && !(hasSkill(player.hero, '帷幕') && !guohe.isRed)) {
                return { action: 'play', card: guohe, target: 0 };
            }
            // 奇袭（甘宁）：黑色牌当过河拆桥
            if (hasSkill(ai.hero, '奇袭')) {
                const blackCard = ai.hand.find(c => !c.isRed && c.defKey !== 'guohechaiqiao' && c.defKey !== 'sha' && c.defKey !== 'shan');
                if (blackCard) {
                    return { action: 'play', card: blackCard, target: 0, playAs: { as: 'guohechaiqiao', skill: '奇袭' } };
                }
            }
        }

        // 优先级5.5: 乐不思蜀（控制对方）
        const lebusishu = this.findCard(ai.hand, 'lebusishu');
        if (lebusishu && !hasSkill(player.hero, '谦逊')) {
            return { action: 'play', card: lebusishu, target: 0 };
        }
        // 国色（大乔）：方块牌当乐不思蜀
        if (hasSkill(ai.hero, '国色') && !hasSkill(player.hero, '谦逊')) {
            const diamondCard = ai.hand.find(c => c.suit === '♦' && c.defKey !== 'lebusishu' && c.defKey !== 'sha' && c.defKey !== 'shan');
            if (diamondCard) {
                return { action: 'play', card: diamondCard, target: 0, playAs: { as: 'lebusishu', skill: '国色' } };
            }
        }

        // 优先级5.6: 火攻（直接伤害）
        const huogong = this.findCard(ai.hand, 'huogong');
        if (huogong && ai.hand.length > 1 && !(hasSkill(player.hero, '帷幕') && !huogong.isRed)) {
            return { action: 'play', card: huogong, target: 0 };
        }

        // 优先级5.7: 桃园结义（回血，仅在残血时使用）
        if (ai.hp < ai.maxHp) {
            const taoyuan = this.findCard(ai.hand, 'taoyuanjieyi');
            if (taoyuan) {
                return { action: 'play', card: taoyuan, target: 1 };
            }
        }

        // 优先级5.8: 五谷丰登
        const wugu = this.findCard(ai.hand, 'wugufengdeng');
        if (wugu) {
            return { action: 'play', card: wugu, target: 1 };
        }

        // 优先级6: 南蛮入侵/万箭齐发
        const nanman = this.findCard(ai.hand, 'nanmanruqin');
        if (nanman && ai.hand.length > 2) {
            return { action: 'play', card: nanman, target: 1 };
        }
        const wanjian = this.findCard(ai.hand, 'wanjianqifa');
        if (wanjian && ai.hand.length > 2) {
            return { action: 'play', card: wanjian, target: 1 };
        }

        // 优先级7: 决斗（手牌中有杀时使用）
        const juedou = this.findCard(ai.hand, 'juedou');
        if (juedou && !(hasSkill(player.hero, '帷幕') && !juedou.isRed)) {
            const shaCount = ai.hand.filter(c => c.defKey === 'sha').length;
            const wushengCard = ai.hand.find(c => c.isRed && c.defKey !== 'sha' && c.defKey !== 'tao' && c.defKey !== 'shan');
            if (shaCount >= 2 || (shaCount >= 1 && hasSkill(ai.hero, '武圣') && wushengCard)) {
                // 检查对方是否有空城
                if (!(hasSkill(player.hero, '空城') && player.hand.length === 0)) {
                    return { action: 'play', card: juedou, target: 0 };
                }
            }
        }
        // 双雄（颜良文丑）：黑色牌当决斗
        if (hasSkill(ai.hero, '双雄')) {
            const blackCard = ai.hand.find(c => !c.isRed && c.defKey !== 'juedou' && c.defKey !== 'sha' && c.defKey !== 'shan');
            if (blackCard) {
                const shaCount = ai.hand.filter(c => c.defKey === 'sha').length;
                if (shaCount >= 1 && !(hasSkill(player.hero, '空城') && player.hand.length === 0)) {
                    return { action: 'play', card: blackCard, target: 0, playAs: { as: 'juedou', skill: '双雄' } };
                }
            }
        }

        // 优先级8: 出杀
        if (!game.hasSlashedThisTurn || this.canSlashUnlimited(ai)) {
            const sha = this.findCard(ai.hand, 'sha');
            if (sha) {
                // 检查对方空城
                if (hasSkill(player.hero, '空城') && player.hand.length === 0) {
                    // 不能杀
                } else {
                    return { action: 'play', card: sha, target: 0 };
                }
            }
            // 关羽武圣：红色牌当杀
            if (!game.hasSlashedThisTurn || this.canSlashUnlimited(ai)) {
                if (hasSkill(ai.hero, '武圣')) {
                    const redCard = ai.hand.find(c => c.isRed && c.defKey !== 'sha' && c.defKey !== 'tao');
                    if (redCard) {
                        // 检查对方空城
                        if (!(hasSkill(player.hero, '空城') && player.hand.length === 0)) {
                            return { action: 'play_wusheng', card: redCard, target: 0 };
                        }
                    }
                }
            }
        }

        // 没有可出的牌了
        return { action: 'end' };
    },

    /**
     * AI决定是否出闪（响应杀）
     * @returns {object} {dodge: boolean, cards: [card]} 
     */
    decideDodge(game, needCount) {
        const ai = game.players[1];
        const player = game.players[0];
        
        // 裸衣（许褚）：不能使用闪
        if (hasSkill(ai.hero, '裸衣')) {
            return { dodge: false, cards: [] };
        }
        
        // 赵云龙胆：闪当杀，杀当闪
        const availableShans = ai.hand.filter(c => c.defKey === 'shan');
        const availableShas = hasSkill(ai.hero, '龙胆') ? ai.hand.filter(c => c.defKey === 'sha') : [];
        // 倾国（甄姬）：黑色手牌当闪
        const qingguoCards = hasSkill(ai.hero, '倾国') ? ai.hand.filter(c => !c.isRed && c.defKey !== 'shan') : [];
        const totalAvailable = [...availableShans, ...availableShas, ...qingguoCards];
        
        if (totalAvailable.length < needCount) {
            // 不够闪
            // 如果HP危急且手里有闪，尽量闪
            if (ai.hp <= 1 && availableShans.length > 0) {
                return { dodge: true, cards: [availableShans[0]] };
            }
            return { dodge: false, cards: [] };
        }

        // 判断是否需要闪
        const incomingDamage = 1;
        const hpAfterDamage = ai.hp - incomingDamage;
        
        // 如果受到伤害会死，一定闪
        if (hpAfterDamage <= 0) {
            return { dodge: true, cards: this.pickDodgeCardsWithQingguo(availableShans, availableShas, qingguoCards, needCount) };
        }

        // HP低时倾向闪
        if (ai.hp <= 2) {
            return { dodge: true, cards: this.pickDodgeCardsWithQingguo(availableShans, availableShas, qingguoCards, needCount) };
        }

        // HP较高时有一定概率闪
        const dodgeProb = 0.5 + (1 - ai.hp / ai.maxHp) * 0.3;
        if (Math.random() < dodgeProb) {
            return { dodge: true, cards: this.pickDodgeCardsWithQingguo(availableShans, availableShas, qingguoCards, needCount) };
        }

        return { dodge: false, cards: [] };
    },

    /**
     * AI决定是否出杀（响应南蛮入侵）
     */
    decideNanmanDodge(game) {
        const ai = game.players[1];
        const shas = ai.hand.filter(c => c.defKey === 'sha');
        // 龙胆：闪当杀
        const longdanShans = hasSkill(ai.hero, '龙胆') ? ai.hand.filter(c => c.defKey === 'shan') : [];
        const allShas = [...shas, ...longdanShans];

        if (allShas.length === 0) return { dodge: false, card: null };

        // HP低时一定要出杀
        if (ai.hp <= 2) return { dodge: true, card: allShas[0] };

        // 手牌多时倾向出杀
        if (ai.hand.length > 4) return { dodge: true, card: allShas[0] };

        // 随机
        if (Math.random() < 0.5) return { dodge: true, card: allShas[0] };

        return { dodge: false, card: null };
    },

    /**
     * AI决定是否出闪（响应万箭齐发）
     */
    decideWanjianDodge(game) {
        const ai = game.players[1];
        const shans = ai.hand.filter(c => c.defKey === 'shan');
        const shas = hasSkill(ai.hero, '龙胆') ? ai.hand.filter(c => c.defKey === 'sha') : [];
        // 倾国（甄姬）：黑色手牌当闪
        const qingguoCards = hasSkill(ai.hero, '倾国') ? ai.hand.filter(c => !c.isRed && c.defKey !== 'shan') : [];
        const total = [...shans, ...shas, ...qingguoCards];
        
        if (total.length === 0) return { dodge: false, card: null };
        
        if (ai.hp <= 2) return { dodge: true, card: shans[0] || shas[0] || qingguoCards[0] };
        if (ai.hand.length > 4) return { dodge: true, card: shans[0] || shas[0] || qingguoCards[0] };
        if (Math.random() < 0.5) return { dodge: true, card: shans[0] || shas[0] || qingguoCards[0] };
        
        return { dodge: false, card: null };
    },

    /**
     * AI决斗响应 - 是否出杀
     */
    decideDuelResponse(game) {
        const ai = game.players[1];
        const shas = ai.hand.filter(c => c.defKey === 'sha');
        // 龙胆：闪当杀
        const longdanShans = hasSkill(ai.hero, '龙胆') ? ai.hand.filter(c => c.defKey === 'shan') : [];
        const allShas = [...shas, ...longdanShans];
        
        if (allShas.length === 0) return { play: false, card: null };
        
        // HP低时尽量出杀
        if (ai.hp <= 2) return { play: true, card: allShas[0] };
        
        // 手牌中杀多时继续出
        if (allShas.length >= 2) return { play: true, card: allShas[0] };
        
        // 随机
        if (Math.random() < 0.4) return { play: true, card: allShas[0] };
        
        return { play: false, card: null };
    },

    /**
     * AI濒死时是否用桃
     */
    decidePeachOnDying(game) {
        const ai = game.players[1];
        const tao = this.findCard(ai.hand, 'tao');
        if (tao) return { use: true, card: tao };
        
        // 刘备仁德：任意手牌当桃
        if (hasSkill(ai.hero, '仁德') && ai.hand.length > 0) {
            // 优先用最没用的牌
            const uselessCard = ai.hand.find(c => c.defKey === 'guohechaiqiao') 
                || ai.hand.find(c => c.defKey === 'shunshouqiannyang')
                || ai.hand.find(c => c.defKey === 'nanmanruqin')
                || ai.hand.find(c => c.defKey === 'wanjianqifa')
                || ai.hand.find(c => c.defKey === 'juedou')
                || ai.hand[0];
            return { use: true, card: uselessCard, asSkill: true };
        }
        
        // 华佗急救：红色牌当桃
        if (hasSkill(ai.hero, '急救')) {
            const redCard = ai.hand.find(c => c.isRed && c.defKey !== 'tao');
            if (redCard) return { use: true, card: redCard, asSkill: true };
        }
        
        return { use: false, card: null };
    },

    /**
     * AI刚烈触发
     */
    decideGanglie(game) {
        const ai = game.players[1];
        // 如果手牌多，弃牌；如果手牌少或HP高，让对方掉血
        if (ai.hand.length >= 3) {
            return { choice: 'discard' };
        }
        return { choice: 'damage' };
    },

    /**
     * AI选择过河拆桥的目标
     */
    chooseSabotageTarget(game) {
        const player = game.players[0];
        
        // 优先拆武器
        if (player.equipment.weapon) return { type: 'equip', slot: 'weapon' };
        // 其次拆防具
        if (player.equipment.armor) return { type: 'equip', slot: 'armor' };
        // 再拆坐骑
        if (player.equipment.mountMinus) return { type: 'equip', slot: 'mountMinus' };
        if (player.equipment.mountPlus) return { type: 'equip', slot: 'mountPlus' };
        
        // 拆手牌
        if (player.hand.length > 0) return { type: 'hand', index: Math.floor(Math.random() * player.hand.length) };
        
        return null;
    },

    /**
     * AI选择顺手牵羊的目标
     */
    chooseStealTarget(game) {
        return this.chooseSabotageTarget(game);
    },

    /**
     * AI选择弃牌
     */
    chooseDiscard(game, count) {
        const ai = game.players[1];
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
     * AI选择反间给出的牌（选最没用的牌）
     */
    chooseFanjianCard(game) {
        const ai = game.players[1];
        // 优先给装备牌或锦囊牌
        const equip = ai.hand.find(c => c.type === 'equipment');
        if (equip) return equip;
        const trick = ai.hand.find(c => c.type === 'trick' && c.defKey !== 'wushengshengyou');
        if (trick) return trick;
        // 其次给杀
        const sha = ai.hand.find(c => c.defKey === 'sha');
        if (sha && ai.hand.length > 2) return sha;
        // 最后给任意牌
        return ai.hand[0];
    },

    /**
     * AI决定是否接受反间的牌
     */
    decideFanjianResponse(game, card) {
        const ai = game.players[1];
        // 如果血量低且牌可用，选择使用
        if (ai.hp <= 1 && (card.defKey === 'tao' || card.defKey === 'sha')) {
            return 'use';
        }
        // 如果牌是杀且对方没空城，使用
        if (card.defKey === 'sha' && ai.hand.filter(c => c.defKey === 'sha').length < 2) {
            return 'use';
        }
        // 如果是桃且需要回血，使用
        if (card.defKey === 'tao' && ai.hp < ai.maxHp) {
            return 'use';
        }
        // 如果是装备，装备上
        if (card.type === 'equipment') {
            return 'use';
        }
        // 血量高时承受伤害
        if (ai.hp > 2) {
            return 'damage';
        }
        // 默认承受伤害
        return 'damage';
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
        // 张飞咆哮 or 诸葛连弩
        return hasSkill(player.hero, '咆哮') || (player.equipment.weapon && player.equipment.weapon.defKey === 'zhugecrossbow');
    },

    pickDodgeCards(shans, shas, count) {
        const cards = [];
        // 优先用闪
        for (let i = 0; i < shans.length && cards.length < count; i++) {
            cards.push(shans[i]);
        }
        // 不够用杀（龙胆）
        for (let i = 0; i < shas.length && cards.length < count; i++) {
            cards.push(shas[i]);
        }
        return cards;
    },

    pickDodgeCardsWithQingguo(shans, shas, qingguoCards, count) {
        const cards = [];
        for (let i = 0; i < shans.length && cards.length < count; i++) cards.push(shans[i]);
        for (let i = 0; i < shas.length && cards.length < count; i++) cards.push(shas[i]);
        for (let i = 0; i < qingguoCards.length && cards.length < count; i++) cards.push(qingguoCards[i]);
        return cards;
    }
};
