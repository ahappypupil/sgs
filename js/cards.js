// ===== 卡牌系统 =====

// 卡牌类型
const CARD_TYPE = {
    BASIC: 'basic',      // 基本牌
    TRICK: 'trick',      // 锦囊牌
    EQUIPMENT: 'equipment' // 装备牌
};

// 花色
const SUIT = {
    SPADE: '♠',
    HEART: '♥',
    DIAMOND: '♦',
    CLUB: '♣'
};

// 花色颜色
function suitColor(suit) {
    return (suit === SUIT.HEART || suit === SUIT.DIAMOND) ? 'red' : 'black';
}

// 装备子类型
const EQUIP_TYPE = {
    WEAPON: 'weapon',    // 武器
    ARMOR: 'armor',      // 防具
    MOUNT: 'mount'       // 坐骑
};

// 卡牌定义模板
const CARD_DEFS = {
    // ===== 基本牌 =====
    sha: {
        name: '杀',
        type: CARD_TYPE.BASIC,
        desc: '出牌阶段使用，对一名其他角色造成1点伤害。每回合限用一次。',
        short: '杀'
    },
    shan: {
        name: '闪',
        type: CARD_TYPE.BASIC,
        desc: '当你成为【杀】的目标时，使用【闪】抵消该伤害。',
        short: '闪'
    },
    tao: {
        name: '桃',
        type: CARD_TYPE.BASIC,
        desc: '出牌阶段使用，回复1点体力。或当一名角色处于濒死状态时，回复其1点体力。',
        short: '桃'
    },

    // ===== 锦囊牌 =====
    wushengshengyou: {
        name: '无中生有',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段使用，从牌堆摸两张牌。',
        short: '无中'
    },
    guohechaiqiao: {
        name: '过河拆桥',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段对一名其他角色使用，弃置其一张牌（手牌或装备区）。',
        short: '拆桥'
    },
    shunshouqiannyang: {
        name: '顺手牵羊',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段对一名其他角色使用，获得其一张牌（手牌或装备区）。',
        short: '顺手'
    },
    juedou: {
        name: '决斗',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段对一名其他角色使用，由目标开始轮流出杀，先不出杀者受到1点伤害。',
        short: '决斗'
    },
    nanmanruqin: {
        name: '南蛮入侵',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段使用，所有其他角色需出一张杀，否则受到1点伤害。',
        short: '南蛮'
    },
    wanjianqifa: {
        name: '万箭齐发',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段使用，所有其他角色需出一张闪，否则受到1点伤害。',
        short: '万箭'
    },

    // ===== 额外锦囊牌 =====
    lebusishu: {
        name: '乐不思蜀',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段对一名其他角色使用，将【乐不思蜀】置于其判定区。该角色判定阶段进行判定：若不为红桃，跳过其出牌阶段。',
        short: '乐不'
    },
    huogong: {
        name: '火攻',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段对一名有手牌的角色使用，展示一张手牌，若对方也展示同花色手牌，对其造成1点火焰伤害。',
        short: '火攻'
    },
    taoyuanjieyi: {
        name: '桃园结义',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段使用，所有角色各回复1点体力。',
        short: '桃园'
    },
    wugufengdeng: {
        name: '五谷丰登',
        type: CARD_TYPE.TRICK,
        desc: '出牌阶段使用，所有角色从牌堆摸一张牌。',
        short: '五谷'
    },
    wuxiekeji: {
        name: '无懈可击',
        type: CARD_TYPE.TRICK,
        desc: '当一张锦囊牌生效前，你可以使用【无懈可击】抵消该锦囊对一名角色的效果。',
        short: '无懈'
    },

    // ===== 装备牌 =====
    zhugecrossbow: {
        name: '诸葛连弩',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.WEAPON,
        desc: '武器：你出杀的次数没有限制。',
        short: '连弩'
    },
    qinglongyanyuedao: {
        name: '青龙偃月刀',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.WEAPON,
        desc: '武器：当你使用【杀】被【闪】抵消时，你可以对目标造成1点伤害。',
        short: '青龙'
    },
    zhangbashemao: {
        name: '丈八蛇矛',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.WEAPON,
        desc: '武器：你可以将两张手牌当一张【杀】使用或打出。',
        short: '蛇矛'
    },
    fangtianhuaji: {
        name: '方天画戟',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.WEAPON,
        desc: '武器：若你手牌仅有【杀】，此杀可额外指定一个目标。',
        short: '方天'
    },
    cixiongshuanggujian: {
        name: '雌雄双股剑',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.WEAPON,
        desc: '武器：你使用【杀】指定目标后，你可以令其弃一张手牌或让你摸一张牌。',
        short: '雌雄'
    },
    qilingong: {
        name: '麒麟弓',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.WEAPON,
        desc: '武器：你使用【杀】对目标造成伤害后，你可以弃置其一张坐骑牌。',
        short: '麒麟'
    },
    baguazhen: {
        name: '八卦阵',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.ARMOR,
        desc: '防具：当你成为杀的目标时，可以进行判定，若为红色则视为使用了一张闪。',
        short: '八卦'
    },
    renwangdun: {
        name: '仁王盾',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.ARMOR,
        desc: '防具：黑色【杀】对你无效。',
        short: '仁王'
    },
    chitu: {
        name: '赤兔',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.MOUNT,
        desc: '坐骑：其他角色与你的距离+1。',
        short: '赤兔'
    },
    dilu: {
        name: '的卢',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.MOUNT,
        desc: '坐骑：其他角色与你的距离+1。',
        short: '的卢'
    },
    zhaohuangfeidian: {
        name: '爪黄飞电',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.MOUNT,
        desc: '坐骑：你与其他角色的距离-1。',
        short: '爪黄'
    },
    jueying: {
        name: '绝影',
        type: CARD_TYPE.EQUIPMENT,
        equipType: EQUIP_TYPE.MOUNT,
        desc: '坐骑：其他角色与你的距离+1。',
        short: '绝影'
    }
};

// 创建一张卡牌实例
let cardIdCounter = 0;
function createCard(defKey, suit, number) {
    const def = CARD_DEFS[defKey];
    return {
        id: 'card_' + (cardIdCounter++),
        defKey: defKey,
        name: def.name,
        type: def.type,
        suit: suit,
        number: number,
        desc: def.desc,
        short: def.short,
        equipType: def.equipType || null,
        isRed: suitColor(suit) === 'red'
    };
}

// 构建完整牌堆
function createDeck() {
    const deck = [];
    
    // 杀 x24
    const shaCards = [
        [SUIT.SPADE, 4], [SUIT.SPADE, 5], [SUIT.SPADE, 6], [SUIT.SPADE, 7],
        [SUIT.SPADE, 8], [SUIT.SPADE, 8], [SUIT.SPADE, 9], [SUIT.SPADE, 9],
        [SUIT.SPADE, 10], [SUIT.SPADE, 10], [SUIT.SPADE, 11], [SUIT.SPADE, 11],
        [SUIT.HEART, 10], [SUIT.HEART, 10], [SUIT.HEART, 11], [SUIT.HEART, 11],
        [SUIT.HEART, 12], [SUIT.HEART, 12],
        [SUIT.DIAMOND, 6], [SUIT.DIAMOND, 7], [SUIT.DIAMOND, 8], [SUIT.DIAMOND, 9],
        [SUIT.DIAMOND, 10], [SUIT.DIAMOND, 13],
        [SUIT.CLUB, 5], [SUIT.CLUB, 6], [SUIT.CLUB, 7], [SUIT.CLUB, 8]
    ];
    shaCards.forEach(([s, n]) => deck.push(createCard('sha', s, n)));

    // 闪 x15
    const shanCards = [
        [SUIT.SPADE, 2], [SUIT.SPADE, 3], [SUIT.SPADE, 4], [SUIT.SPADE, 5],
        [SUIT.SPADE, 6],
        [SUIT.HEART, 2], [SUIT.HEART, 2], [SUIT.HEART, 8], [SUIT.HEART, 9],
        [SUIT.HEART, 11], [SUIT.HEART, 13],
        [SUIT.DIAMOND, 2], [SUIT.DIAMOND, 3], [SUIT.DIAMOND, 4], [SUIT.DIAMOND, 5]
    ];
    shanCards.forEach(([s, n]) => deck.push(createCard('shan', s, n)));

    // 桃 x8
    const taoCards = [
        [SUIT.HEART, 3], [SUIT.HEART, 4], [SUIT.HEART, 5], [SUIT.HEART, 6],
        [SUIT.HEART, 7], [SUIT.HEART, 8], [SUIT.HEART, 9],
        [SUIT.DIAMOND, 12]
    ];
    taoCards.forEach(([s, n]) => deck.push(createCard('tao', s, n)));

    // 无中生有 x4
    [
        [SUIT.HEART, 7], [SUIT.HEART, 8], [SUIT.HEART, 9], [SUIT.HEART, 11]
    ].forEach(([s, n]) => deck.push(createCard('wushengshengyou', s, n)));

    // 过河拆桥 x3
    [
        [SUIT.SPADE, 3], [SUIT.SPADE, 4], [SUIT.SPADE, 12]
    ].forEach(([s, n]) => deck.push(createCard('guohechaiqiao', s, n)));

    // 顺手牵羊 x3
    [
        [SUIT.SPADE, 3], [SUIT.DIAMOND, 4], [SUIT.CLUB, 11]
    ].forEach(([s, n]) => deck.push(createCard('shunshouqiannyang', s, n)));

    // 决斗 x2
    [
        [SUIT.SPADE, 1], [SUIT.CLUB, 1]
    ].forEach(([s, n]) => deck.push(createCard('juedou', s, n)));

    // 南蛮入侵 x2
    [
        [SUIT.SPADE, 7], [SUIT.CLUB, 7]
    ].forEach(([s, n]) => deck.push(createCard('nanmanruqin', s, n)));

    // 万箭齐发 x1
    deck.push(createCard('wanjianqifa', SUIT.HEART, 1));

    // 乐不思蜀 x2
    [
        [SUIT.CLUB, 6], [SUIT.HEART, 6]
    ].forEach(([s, n]) => deck.push(createCard('lebusishu', s, n)));

    // 火攻 x2
    [
        [SUIT.HEART, 2], [SUIT.DIAMOND, 3]
    ].forEach(([s, n]) => deck.push(createCard('huogong', s, n)));

    // 桃园结义 x1
    deck.push(createCard('taoyuanjieyi', SUIT.HEART, 1));

    // 五谷丰登 x1
    deck.push(createCard('wugufengdeng', SUIT.HEART, 3));

    // 无懈可击 x3
    [
        [SUIT.SPADE, 2], [SUIT.DIAMOND, 11], [SUIT.CLUB, 12]
    ].forEach(([s, n]) => deck.push(createCard('wuxiekeji', s, n)));

    // 诸葛连弩 x1
    deck.push(createCard('zhugecrossbow', SUIT.CLUB, 1));

    // 青龙偃月刀 x1
    deck.push(createCard('qinglongyanyuedao', SUIT.SPADE, 5));

    // 丈八蛇矛 x1
    deck.push(createCard('zhangbashemao', SUIT.SPADE, 1));

    // 方天画戟 x1
    deck.push(createCard('fangtianhuaji', SUIT.DIAMOND, 12));

    // 雌雄双股剑 x1
    deck.push(createCard('cixiongshuanggujian', SUIT.SPADE, 2));

    // 麒麟弓 x1
    deck.push(createCard('qilingong', SUIT.HEART, 5));

    // 八卦阵 x1
    deck.push(createCard('baguazhen', SUIT.CLUB, 2));

    // 仁王盾 x1
    deck.push(createCard('renwangdun', SUIT.CLUB, 2));

    // 赤兔 x1
    deck.push(createCard('chitu', SUIT.HEART, 5));

    // 的卢 x1
    deck.push(createCard('dilu', SUIT.CLUB, 5));

    // 爪黄飞电 x1
    deck.push(createCard('zhaohuangfeidian', SUIT.SPADE, 13));

    // 绝影 x1
    deck.push(createCard('jueying', SUIT.SPADE, 5));

    return deck;
}

// 洗牌
function shuffleDeck(deck) {
    const arr = [...deck];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 检查卡牌是否为红色
function isCardRed(card) {
    return card && card.isRed;
}

// 获取卡牌在游戏中的显示名称
function getCardDisplayName(card) {
    if (!card) return '';
    return card.name;
}
