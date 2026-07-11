// ===== 武将系统 =====

// 势力
const FACTION = {
    SHU: '蜀',
    WEI: '魏',
    WU: '吴',
    QUN: '群'
};

// 势力颜色
const FACTION_COLOR = {
    '蜀': '#22aa22',
    '魏': '#2266cc',
    '吴': '#cc4444',
    '群': '#888888'
};

// 身份
const ROLE = {
    LORD: '主公',
    MINISTER: '大臣'
};

// 武将列表
const HEROES = [
    // ===== 蜀 =====
    {
        id: 'liubei',
        name: '刘备',
        faction: FACTION.SHU,
        role: ROLE.LORD,
        maxHp: 4,
        emoji: '备',
        title: '汉昭烈帝',
        bio: '字玄德，汉景帝之子中山靖王刘胜之后。以仁德著称于世，桃园三结义，三顾茅庐，终成帝业。',
        skills: [
            {
                name: '仁德',
                type: 'active',
                desc: '出牌阶段，你可以将任意手牌当【桃】使用。',
                defKey: 'tao'
            }
        ],
        lines: {
            turnStart: ['容我三思', '以德服人'],
            attack: ['且慢', '休走！'],
            dodge: ['闪开！', '且躲一招'],
            damage: ['痛煞我也', '不可小觑'],
            dying: ['备不甘心……', '吾命休矣'],
            heal: ['多谢', '倍感宽慰'],
            skill: ['惟贤惟德，以德服人', '天下兴亡，匹夫有责'],
            victory: ['汉室复兴，指日可待'],
            defeat: ['匡扶汉室，终是梦啊……']
        }
    },
    {
        id: 'guanyu',
        name: '关羽',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '羽',
        title: '汉寿亭侯',
        bio: '字云长，与刘备、张飞桃园结义。温酒斩华雄，过五关斩六将，水淹七军，威震华夏。',
        skills: [
            {
                name: '武圣',
                type: 'active',
                desc: '你可以将一张红色手牌当【杀】使用或打出。',
                defKey: 'sha'
            }
        ],
        lines: {
            turnStart: ['关某在此', '观尔等插标卖首'],
            attack: ['看刀！', '尔等休走'],
            dodge: ['雕虫小技', '岂能伤我'],
            damage: ['哼！', '小小伤痛何足挂齿'],
            dying: ['关某……败了', '义不容辞……'],
            heal: ['多谢', '恩泽铭记于心'],
            skill: ['看尔等乃插标卖首！', '武圣之威，尔等可敢一战？'],
            victory: ['关某所向披靡', '尔等不堪一击'],
            defeat: ['一世英名，毁于一旦……']
        }
    },
    {
        id: 'zhangfei',
        name: '张飞',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '飞',
        title: '西乡侯',
        bio: '字翼德，与刘备、关羽桃园结义。长坂坡一声怒吼，吓退曹军百万雄师。勇猛过人，万人之敌。',
        skills: [
            {
                name: '咆哮',
                type: 'passive',
                desc: '出牌阶段，你可以使用任意数量的【杀】。',
            }
        ],
        lines: {
            turnStart: ['燕人张飞在此！', '谁来与我一战！'],
            attack: ['吃我一矛！', '哇呀呀呀！'],
            dodge: ['休想！', '你也配？'],
            damage: ['好疼！', '可恶！'],
            dying: ['飞……不服……', '大哥……'],
            heal: ['多谢了', '好！'],
            skill: ['咆哮一声，震破敌胆！', '三声喝断当阳桥！'],
            victory: ['哈哈哈哈！痛快！', '尔等皆鼠辈也'],
            defeat: ['大意了……']
        }
    },
    {
        id: 'zhaoyun',
        name: '赵云',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '云',
        title: '永昌亭侯',
        bio: '字子龙，常山真定人。长坂坡七进七出，单骑救主。一身是胆，义薄云天，刘备赞其"子龙一身都是胆也"。',
        skills: [
            {
                name: '龙胆',
                type: 'active',
                desc: '你可以将【杀】当【闪】、【闪】当【杀】使用或打出。',
            }
        ],
        lines: {
            turnStart: ['常山赵子龙在此', '吾乃常山赵子龙也'],
            attack: ['枪出如龙！', '且吃我一枪'],
            dodge: ['休想伤我', '闪'],
            damage: ['可恶', '不痛不痒'],
            dying: ['云……不能倒下', '主公……'],
            heal: ['多谢', '感念恩德'],
            skill: ['能进能退，乃真正法器', '龙胆一现，万军莫敌'],
            victory: ['七进七出，何人能挡', '子龙谢主公知遇之恩'],
            defeat: ['子龙……尽力了……']
        }
    },
    {
        id: 'zhugeliang',
        name: '诸葛亮',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '亮',
        title: '武乡侯',
        bio: '字孔明，号卧龙。三顾茅庐出山辅佐刘备，草船借箭，空城退敌，六出祁山。鞠躬尽瘁，死而后已。',
        skills: [
            {
                name: '空城',
                type: 'passive',
                desc: '当你没有手牌时，不能成为【杀】和【决斗】的目标。',
            }
        ],
        lines: {
            turnStart: ['观天象，知天命', '运筹帷幄之中'],
            attack: ['此计可成', '且看此招'],
            dodge: ['早已料到', '不足为虑'],
            damage: ['岂有此理', '失策了'],
            dying: ['天命难违……', '鞠躬尽瘁……死而后已'],
            heal: ['多谢', '幸有此得'],
            skill: ['空城一曲，万军退避', '我本布衣，躬耕于南阳'],
            victory: ['一切尽在掌握', '兵法如神'],
            defeat: ['谋事在人，成事在天……']
        }
    },
    {
        id: 'machao',
        name: '马超',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '超',
        title: '骠骑将军',
        bio: '字孟起，西凉马腾之子。素有"锦马超"之称，渭水六战，杀得曹操割须弃袍。后归刘备，封骠骑将军。',
        skills: [
            {
                name: '铁骑',
                type: 'passive',
                desc: '你使用【杀】时，可指定目标后进行判定，若为红色则此杀不可被闪避。',
            }
        ],
        lines: {
            turnStart: ['西凉马超在此', '杀得你片甲不留'],
            attack: ['看枪！', '尔等受死'],
            dodge: ['闪', '休想'],
            damage: ['可恶', '好武艺'],
            dying: ['马超……不甘', '父亲……'],
            heal: ['多谢', '甚好'],
            skill: ['铁骑踏阵，所向披靡', '西凉铁骑，天下无双'],
            victory: ['西凉男儿，岂是浪得虚名', '尔等不过如此'],
            defeat: ['天亡我也……']
        }
    },
    {
        id: 'huangzhong',
        name: '黄忠',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '忠',
        title: '后将军',
        bio: '字汉升，老当益壮。定军山一战，阵斩夏侯渊，威名远扬。五虎上将之一，箭术通神，百步穿杨。',
        skills: [
            {
                name: '烈弓',
                type: 'passive',
                desc: '你对目标使用【杀】时，若其手牌数大于等于其体力值，此杀不可被闪避。',
            }
        ],
        lines: {
            turnStart: ['老夫黄忠', '虽老尚能战'],
            attack: ['吃我一箭！', '百步穿杨'],
            dodge: ['闪', '未必'],
            damage: ['好武艺', '老夫不服'],
            dying: ['老夫……力竭了', '主公……'],
            heal: ['多谢', '尚可一战'],
            skill: ['烈弓一出，百步穿杨', '老当益壮，宁移白首之心'],
            victory: ['谁说老夫不行了', '定军山之功，岂是偶然'],
            defeat: ['岁月不饶人……']
        }
    },
    {
        id: 'weiyan',
        name: '魏延',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '延',
        title: '征西大将军',
        bio: '字文长，勇猛过人。随刘备入蜀，屡立战功。曾提出子午谷奇谋，未被采纳。诸葛亮死后因谋反被诛。',
        skills: [
            {
                name: '狂骨',
                type: 'triggered',
                desc: '当你对距离1以内的目标造成伤害后，你可以回复1点体力。',
            }
        ],
        lines: {
            turnStart: ['谁敢与我一战', '魏延在此'],
            attack: ['看刀', '吃我一刀'],
            dodge: ['闪', '休想'],
            damage: ['可恶', '哼'],
            dying: ['魏延……不服', '谁敢杀我……'],
            heal: ['多谢', '正好'],
            skill: ['狂骨噬敌，以战养战', '谁敢杀我！'],
            victory: ['哈哈哈！痛快', '尔等不过如此'],
            defeat: ['谋反……失败了吗……']
        }
    },
    {
        id: 'huangyueying',
        name: '黄月英',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '英',
        title: '蜀中才女',
        bio: '诸葛亮之妻，黄承彦之女。才貌双全，精通天文地理、奇门遁甲。相传木牛流马即出自其手，是三国时期著名的才女。',
        skills: [
            {
                name: '集智',
                type: 'triggered',
                desc: '当你使用一张非转化的普通锦囊牌时，你可以摸一张牌。',
            }
        ],
        lines: {
            turnStart: ['月英在此', '且看此计'],
            attack: ['接招', '看招'],
            dodge: ['闪', '休想'],
            damage: ['可恶', '好疼'],
            dying: ['月英……不甘', '夫君……'],
            heal: ['多谢', '正好'],
            skill: ['集思广益，智慧无穷', '才女之智，不输男儿'],
            victory: ['才女之名，名副其实', '多谢手下留情'],
            defeat: ['才女也有失算时……']
        }
    },
    {
        id: 'sunshangxiang',
        name: '孙尚香',
        faction: FACTION.SHU,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '香',
        title: '枭姬',
        bio: '孙权之妹，刘备之妻。自幼好武，才捷刚猛，有诸兄之风。刘备入蜀后，孙权派人接回，后投江殉情。',
        skills: [
            {
                name: '枭姬',
                type: 'triggered',
                desc: '当你失去装备区里的一张牌后，你可以摸两张牌。',
            }
        ],
        lines: {
            turnStart: ['孙尚香在此', '谁来与我一战'],
            attack: ['看招', '接招'],
            dodge: ['闪', '休想'],
            damage: ['可恶', '好疼'],
            dying: ['香……不甘', '玄德……'],
            heal: ['多谢', '正好'],
            skill: ['枭姬之勇，不输男儿', '看箭'],
            victory: ['承让了', '多谢手下留情'],
            defeat: ['巾帼英雄……也有败时……']
        }
    },

    // ===== 魏 =====
    {
        id: 'caocao',
        name: '曹操',
        faction: FACTION.WEI,
        role: ROLE.LORD,
        maxHp: 4,
        emoji: '操',
        title: '魏武帝',
        bio: '字孟德，沛国谯人。挟天子以令诸侯，官渡之战大败袁绍，统一北方。治世之能臣，乱世之奸雄。',
        skills: [
            {
                name: '奸雄',
                type: 'triggered',
                desc: '当你受到伤害后，你可以获得造成伤害的牌。',
            }
        ],
        lines: {
            turnStart: ['宁教我负天下人', '休教天下人负我'],
            attack: ['且看此招', '杀！'],
            dodge: ['休想', '未必'],
            damage: ['好胆量', '可恶'],
            dying: ['吾命休矣……', '霸业未成……'],
            heal: ['甚好', '幸甚'],
            skill: ['宁我负人，毋人负我', '挟天子以令诸侯'],
            victory: ['天下英雄，唯使君与操耳', '孤之所向，谁敢争锋'],
            defeat: ['一将功成万骨枯……']
        }
    },
    {
        id: 'simayi',
        name: '司马懿',
        faction: FACTION.WEI,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '懿',
        title: '宣帝',
        bio: '字仲达，河内温县人。隐忍多谋，历经曹魏三代。高平陵之变夺权，为西晋王朝奠基。诸葛一生唯谨慎，司马懿一忍定乾坤。',
        skills: [
            {
                name: '反馈',
                type: 'triggered',
                desc: '当你受到伤害后，你可以获得伤害来源的一张牌。',
            }
        ],
        lines: {
            turnStart: ['忍辱负重', '静待天时'],
            attack: ['且慢', '此计妙哉'],
            dodge: ['未尝不可', '闪'],
            damage: ['哼', '忍耐'],
            dying: ['天命……难违', '我的野心……'],
            heal: ['多谢', '正好'],
            skill: ['忍一时风平浪静', '君子报仇，十年不晚'],
            victory: ['天下终究是司马家的', '忍了这么久，终于……'],
            defeat: ['功亏一篑……']
        }
    },
    {
        id: 'xiahoudun',
        name: '夏侯惇',
        faction: FACTION.WEI,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '惇',
        title: '高安乡侯',
        bio: '字元让，沛国谯人。曹操从弟，性烈如火。征吕布时被射伤左眼，拔矢啖睛，怒目奋战。魏国第一猛将。',
        skills: [
            {
                name: '刚烈',
                type: 'triggered',
                desc: '当你受到伤害后，你可以令伤害来源选择一项：弃一张手牌，或受到1点伤害。',
            }
        ],
        lines: {
            turnStart: ['拔矢啖睛，唯我夏侯', '谁敢与我一战'],
            attack: ['看刀！', '杀！'],
            dodge: ['休想', '闪'],
            damage: ['以牙还牙！', '此仇必报'],
            dying: ['夏侯惇……不服', '主公……'],
            heal: ['多谢', '无碍'],
            skill: ['刚烈之性，岂能屈服', '以血还血，以牙还牙'],
            victory: ['敌羞吾去脱他衣', '尔等不堪一击'],
            defeat: ['壮志未酬……']
        }
    },
    {
        id: 'xuachu',
        name: '许褚',
        faction: FACTION.WEI,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '褚',
        title: '牟乡侯',
        bio: '字仲康，谯国谯人。勇力绝人，裸衣斗马超，护卫曹操周全。忠心耿耿，人称"虎痴"。',
        skills: [
            {
                name: '裸衣',
                type: 'passive',
                desc: '你使用【杀】造成的伤害+1，但你不能使用【闪】。',
            }
        ],
        lines: {
            turnStart: ['虎痴许褚在此', '谁敢一战'],
            attack: ['吃我一刀', '看招'],
            dodge: ['不闪！', '硬扛'],
            damage: ['不痛', '再来'],
            dying: ['许褚……倒下了', '主公……'],
            heal: ['多谢', '甚好'],
            skill: ['裸衣上阵，谁与争锋', '虎痴之名，岂是虚传'],
            victory: ['哈哈哈，痛快', '尔等不堪一击'],
            defeat: ['力竭了……']
        }
    },
    {
        id: 'guojia',
        name: '郭嘉',
        faction: FACTION.WEI,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '嘉',
        title: '洧阳亭侯',
        bio: '字奉孝，颍川阳翟人。曹操首席谋士，算无遗策。十胜十败论定大局，遗计定辽东。英年早逝，曹操痛哭。',
        skills: [
            {
                name: '遗计',
                type: 'triggered',
                desc: '当你受到伤害后，你可以摸两张牌，然后将任意张牌交给其他角色。',
            }
        ],
        lines: {
            turnStart: ['算无遗策', '天机已现'],
            attack: ['此计可成', '且看此招'],
            dodge: ['早已料到', '不足为虑'],
            damage: ['失策了', '可恶'],
            dying: ['天妒英才……', '主公，嘉去了……'],
            heal: ['多谢', '幸甚'],
            skill: ['十胜十败，尽在掌中', '遗计定辽东'],
            victory: ['一切尽在算中', '兵法如神'],
            defeat: ['天命难违……']
        }
    },
    {
        id: 'zhangliao',
        name: '张辽',
        faction: FACTION.WEI,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '辽',
        title: '晋阳侯',
        bio: '字文远，雁门马邑人。原属吕布，后归曹操。合肥之战，率八百敢死之士冲杀十万吴军，威震逍遥津，名震天下。',
        skills: [
            {
                name: '突袭',
                type: 'passive',
                desc: '你使用【杀】时，可无视目标防具。',
            }
        ],
        lines: {
            turnStart: ['张文远在此', '谁敢来战'],
            attack: ['突袭！', '看刀'],
            dodge: ['闪', '未必'],
            damage: ['可恶', '好武艺'],
            dying: ['张辽……败了', '主公……'],
            heal: ['多谢', '甚好'],
            skill: ['八百破十万，谁敢争锋', '威震逍遥津'],
            victory: ['尔等不过如此', '张辽之名，可止儿啼'],
            defeat: ['力竭矣……']
        }
    },
    {
        id: 'xunyu',
        name: '荀彧',
        faction: FACTION.WEI,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '彧',
        title: '敬侯',
        bio: '字文若，颍川颍阴人。曹操首席谋臣，有"王佐之才"。挟天子以令诸侯之策出其手，后因反对曹操称魏公而忧愤而终。',
        skills: [
            {
                name: '驱虎',
                type: 'triggered',
                desc: '当你受到伤害后，你可以令伤害来源受到1点伤害。',
            }
        ],
        lines: {
            turnStart: ['运筹帷幄', '王佐之才'],
            attack: ['此计可成', '且看'],
            dodge: ['不足为虑', '闪'],
            damage: ['可恶', '失策'],
            dying: ['荀彧……去了', '主公……保重'],
            heal: ['多谢', '幸甚'],
            skill: ['驱虎吞狼，坐收渔利', '王佐之才，岂是虚名'],
            victory: ['一切尽在掌中', '运筹帷幄，决胜千里'],
            defeat: ['空有王佐之才……']
        }
    },
    {
        id: 'zhenji',
        name: '甄姬',
        faction: FACTION.WEI,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '甄',
        title: '文昭甄皇后',
        bio: '中山无极人，魏文帝曹丕之妻，魏明帝曹叡生母。倾国倾城，才情出众。曹植《洛神赋》相传即为纪念她而作。',
        skills: [
            {
                name: '洛神',
                type: 'triggered',
                desc: '回合开始阶段，你可以进行判定，若为黑色，你获得此牌并可以继续判定。',
            }
        ],
        lines: {
            turnStart: ['翩若惊鸿，婉若游龙', '洛神赋成'],
            attack: ['且看此招', '休走'],
            dodge: ['闪', '未必'],
            damage: ['好疼', '可恶'],
            dying: ['甄姬……去了', '子桓……'],
            heal: ['多谢', '甚好'],
            skill: ['洛神之姿，倾国倾城', '翩若惊鸿，婉若游龙'],
            victory: ['承让了', '多谢手下留情'],
            defeat: ['红颜薄命……']
        }
    },

    // ===== 吴 =====
    {
        id: 'sunquan',
        name: '孙权',
        faction: FACTION.WU,
        role: ROLE.LORD,
        maxHp: 4,
        emoji: '权',
        title: '吴大帝',
        bio: '字仲谋，吴郡富春人。继承父兄基业，坐镇江东。赤壁联刘抗曹，夷陵火烧连营。曹操叹曰："生子当如孙仲谋"。',
        skills: [
            {
                name: '制衡',
                type: 'active',
                desc: '出牌阶段，你可以弃置任意张牌，然后摸等量的牌。',
            }
        ],
        lines: {
            turnStart: ['制衡天下', '江东基业不可失'],
            attack: ['看招', '且慢'],
            dodge: ['闪', '未必'],
            damage: ['可恶', '好胆量'],
            dying: ['父兄基业……', '仲谋不服……'],
            heal: ['多谢', '甚好'],
            skill: ['制衡朝政，稳如泰山', '生子当如孙仲谋'],
            victory: ['江东之地，固若金汤', '天下英雄，谁敢小觑东吴'],
            defeat: ['父兄在上，权愧矣……']
        }
    },
    {
        id: 'zhouyu',
        name: '周瑜',
        faction: FACTION.WU,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '瑜',
        title: '偏将军',
        bio: '字公瑾，庐江舒县人。东吴大都督，姿质风流，仪容秀丽。赤壁之战火烧曹军，奠定三分天下之势。',
        skills: [
            {
                name: '英姿',
                type: 'passive',
                desc: '摸牌阶段，你可以多摸一张牌。',
            }
        ],
        lines: {
            turnStart: ['谈笑间，樯橹灰飞烟灭', '大丈夫当带三尺之剑'],
            attack: ['且看此计', '哼'],
            dodge: ['岂能让你如愿', '闪'],
            damage: ['可恨', '你竟敢'],
            dying: ['既生瑜……何生亮', '天不假年……'],
            heal: ['甚好', '多谢'],
            skill: ['英姿飒爽，谁与争锋', '周郎妙计安天下'],
            victory: ['赤壁一战，名震天下', '谈笑间，樯橹灰飞烟灭'],
            defeat: ['既生瑜，何生亮……']
        }
    },
    {
        id: 'lvmeng',
        name: '吕蒙',
        faction: FACTION.WU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '蒙',
        title: '孱陵侯',
        bio: '字子明，汝南富陂人。初为莽夫，后发愤读书。白衣渡江，奇袭荆州，擒杀关羽。孙权赞曰："士别三日，即更刮目相待"。',
        skills: [
            {
                name: '克己',
                type: 'passive',
                desc: '弃牌阶段，若你本回合未使用过【杀】，你可以跳过此阶段。',
            }
        ],
        lines: {
            turnStart: ['士别三日，当刮目相看', '非复吴下阿蒙'],
            attack: ['看招', '且吃我一刀'],
            dodge: ['闪', '休想'],
            damage: ['可恶', '哼'],
            dying: ['吴下阿蒙……败了', '主公……'],
            heal: ['多谢', '甚好'],
            skill: ['克己复礼，天下归仁', '士别三日，即更刮目相待'],
            victory: ['白衣渡江，一战功成', '非复吴下阿蒙也'],
            defeat: ['轻敌了……']
        }
    },
    {
        id: 'huanggai',
        name: '黄盖',
        faction: FACTION.WU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '盖',
        title: '武锋中郎将',
        bio: '字公覆，零陵泉陵人。三朝老臣，赤壁之战献苦肉计，诈降曹操。周瑜打黄盖，一个愿打一个愿挨。',
        skills: [
            {
                name: '苦肉',
                type: 'active',
                desc: '出牌阶段，你可以流失1点体力，然后摸两张牌。',
            }
        ],
        lines: {
            turnStart: ['老夫尚能一战', '请鞭笞我吧'],
            attack: ['看刀', '老当益壮'],
            dodge: ['闪开', '未必'],
            damage: ['不过如此', '区区小伤'],
            dying: ['老夫……尽力了', '盖……不甘'],
            heal: ['多谢', '正好'],
            skill: ['苦肉计成', '请鞭笞我吧，公瑾！'],
            victory: ['赤壁之功，有我一份', '老夫廉颇未老'],
            defeat: ['身已老矣……']
        }
    },
    {
        id: 'ganning',
        name: '甘宁',
        faction: FACTION.WU,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '宁',
        title: '西陵太守',
        bio: '字兴霸，巴郡临江人。少为锦帆贼，后归东吴。百骑劫魏营，不折一人一骑。曹操闻之丧胆，孙权赞其能敌张辽。',
        skills: [
            {
                name: '奇袭',
                type: 'active',
                desc: '出牌阶段，你可以弃一张牌，然后弃置目标的一张牌。',
            }
        ],
        lines: {
            turnStart: ['锦帆甘宁在此', '谁敢一战'],
            attack: ['百骑劫营！', '看刀'],
            dodge: ['闪', '休想'],
            damage: ['可恶', '好武艺'],
            dying: ['甘宁……不服', '主公……'],
            heal: ['多谢', '甚好'],
            skill: ['百骑劫魏营，不折一人', '锦帆所过，寸草不生'],
            victory: ['尔等不过如此', '百骑破万军'],
            defeat: ['大意了……']
        }
    },
    {
        id: 'daqiao',
        name: '大乔',
        faction: FACTION.WU,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '乔',
        title: '吴国太',
        bio: '庐江皖县人，乔公长女，孙策之妻。国色天香，与妹小乔并称"二乔"。杜牧诗云："东风不与周郎便，铜雀春深锁二乔"。',
        skills: [
            {
                name: '国色',
                type: 'active',
                desc: '出牌阶段，你可以将一张方块牌当【乐不思蜀】使用。',
            }
        ],
        lines: {
            turnStart: ['请多关照', '一切有劳了'],
            attack: ['且看此招', '休走'],
            dodge: ['闪', '未必'],
            damage: ['好疼', '可恶'],
            dying: ['乔……去了', '伯符……'],
            heal: ['多谢', '甚好'],
            skill: ['国色天香，倾国倾城', '将军且慢'],
            victory: ['承让了', '多谢手下留情'],
            defeat: ['红颜薄命……']
        }
    },
    {
        id: 'luxun',
        name: '陆逊',
        faction: FACTION.WU,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '逊',
        title: '江陵侯',
        bio: '字伯言，吴郡吴县人。书生拜将，夷陵之战火烧连营七百里，大败刘备。后任丞相，总领朝政。儒将风范，一代名将。',
        skills: [
            {
                name: '连营',
                type: 'passive',
                desc: '当你失去最后的手牌时，你可以摸一张牌。',
            }
        ],
        lines: {
            turnStart: ['书生亦能拜将', '运筹帷幄'],
            attack: ['且看此计', '出其不意'],
            dodge: ['早已料到', '闪'],
            damage: ['失策了', '可恶'],
            dying: ['陆逊……败了', '主公……'],
            heal: ['多谢', '甚好'],
            skill: ['火烧连营七百里', '书生亦可定乾坤'],
            victory: ['夷陵之功，非偶然也', '儒将之风，谁敢小觑'],
            defeat: ['谋事在人，成事在天……']
        }
    },
    {
        id: 'xiaoqiao',
        name: '小乔',
        faction: FACTION.WU,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '乔',
        title: '吴国佳人',
        bio: '庐江皖县人，乔公次女，周瑜之妻。与其姐大乔并称"二乔"，国色天香，沉鱼落雁。曹操曾言"铜雀春深锁二乔"。',
        skills: [
            {
                name: '天香',
                type: 'triggered',
                desc: '当你受到伤害时，你可以弃置一张红桃手牌，将此伤害转移给一名其他角色。',
            }
        ],
        lines: {
            turnStart: ['小乔在此', '请多关照'],
            attack: ['且看此招', '休走'],
            dodge: ['闪', '未必'],
            damage: ['好疼', '可恶'],
            dying: ['小乔……去了', '公瑾……'],
            heal: ['多谢', '甚好'],
            skill: ['天香国色，倾国倾城', '将军且慢'],
            victory: ['承让了', '多谢手下留情'],
            defeat: ['红颜薄命……']
        }
    },

    // ===== 群 =====
    {
        id: 'lvbu',
        name: '吕布',
        faction: FACTION.QUN,
        role: ROLE.LORD,
        maxHp: 4,
        emoji: '布',
        title: '温侯',
        bio: '字奉先，五原郡九原人。天下第一猛将，手持方天画戟，胯下赤兔马。三英战吕布，辕门射戟。人中吕布，马中赤兔。',
        skills: [
            {
                name: '无双',
                type: 'passive',
                desc: '你使用【杀】时，目标需使用两张【闪】才能抵消。',
            }
        ],
        lines: {
            turnStart: ['人中吕布，马中赤兔', '谁敢与我争锋'],
            attack: ['神挡杀神，佛挡杀佛', '吃我一戟'],
            dodge: ['闪', '岂能伤我'],
            damage: ['可恶', '好胆量'],
            dying: ['吕布……不甘', '貂蝉……'],
            heal: ['哼，正好', '多谢'],
            skill: ['吾乃天下第一', '人中吕布，马中赤兔'],
            victory: ['天下无敌', '尔等皆蝼蚁'],
            defeat: ['人中吕布……终败了……']
        }
    },
    {
        id: 'diaochan',
        name: '貂蝉',
        faction: FACTION.QUN,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '蝉',
        title: '倾国美人',
        bio: '中国古代四大美女之一。王允义女，献连环计，离间董卓与吕布。有"闭月"之容，倾国倾城之貌。',
        skills: [
            {
                name: '离间',
                type: 'active',
                desc: '出牌阶段，你可以弃一张牌，令两名男性角色进行【决斗】。',
            }
        ],
        lines: {
            turnStart: ['貂蝉拜见', '将军请了'],
            attack: ['且看此招', '休走'],
            dodge: ['闪开', '未必'],
            damage: ['好疼', '你竟敢'],
            dying: ['蝉……去了', '奉先……'],
            heal: ['多谢', '甚好'],
            skill: ['离间之计，无往不利', '将军，请为蝉做主'],
            victory: ['承让了', '多谢手下留情'],
            defeat: ['红颜薄命……']
        }
    },
    {
        id: 'huatuo',
        name: '华佗',
        faction: FACTION.QUN,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '佗',
        title: '神医',
        bio: '字元化，沛国谯人。一代神医，发明麻沸散，创五禽戏。医术通神，悬壶济世。后因曹操多疑，惨遭杀害。',
        skills: [
            {
                name: '急救',
                type: 'active',
                desc: '你的回合外，你可以将一张红色牌当【桃】使用。',
                defKey: 'tao'
            }
        ],
        lines: {
            turnStart: ['老夫华佗', '悬壶济世'],
            attack: ['此计可成', '且看'],
            dodge: ['闪', '未必'],
            damage: ['可恶', '老夫不甘'],
            dying: ['医者……不能自医', '天道不公……'],
            heal: ['多谢', '甚好'],
            skill: ['麻沸散，天下奇药', '五禽戏，强身健体'],
            victory: ['医者仁心，不战而屈人', '悬壶济世，功德无量'],
            defeat: ['医者不能自医啊……']
        }
    },
    {
        id: 'yanliangwenchou',
        name: '颜良文丑',
        faction: FACTION.QUN,
        role: ROLE.MINISTER,
        maxHp: 4,
        emoji: '颜',
        title: '河北双雄',
        bio: '袁绍帐下两员大将。颜良勇冠三军，文丑箭术出众。白马之战，颜良被关羽所斩；延津之战，文丑亦殁于关羽刀下。',
        skills: [
            {
                name: '双雄',
                type: 'active',
                desc: '出牌阶段，你可以将一张黑色手牌当【决斗】使用。',
                defKey: 'juedou'
            }
        ],
        lines: {
            turnStart: ['河北双雄在此', '谁敢一战'],
            attack: ['看刀', '吃我一刀'],
            dodge: ['闪', '休想'],
            damage: ['可恶', '好武艺'],
            dying: ['双雄……败了', '主公……'],
            heal: ['多谢', '甚好'],
            skill: ['河北双雄，名震北方', '袁绍帐下，谁敢争锋'],
            victory: ['尔等不过如此', '河北名将，岂是虚传'],
            defeat: ['竟败于一人之手……']
        }
    },
    {
        id: 'jiaxu',
        name: '贾诩',
        faction: FACTION.QUN,
        role: ROLE.MINISTER,
        maxHp: 3,
        emoji: '诩',
        title: '魏寿乡侯',
        bio: '字文和，武威姑臧人。人称"毒士"。计谋狠辣，算无遗策。先从李傕郭汜，后归张绣，终投曹操。历经乱世而善终。',
        skills: [
            {
                name: '完杀',
                type: 'passive',
                desc: '在你的回合内，濒死状态的角色只能使用【桃】自救。',
            }
        ],
        lines: {
            turnStart: ['贾诩此来，必有计较', '且看局势'],
            attack: ['此计可成', '出其不意'],
            dodge: ['早已料到', '闪'],
            damage: ['失策了', '可恶'],
            dying: ['贾诩……失算了', '天命如此……'],
            heal: ['多谢', '正好'],
            skill: ['完杀之计，不留后患', '毒士之名，岂是虚传'],
            victory: ['一切尽在算中', '谋略定乾坤'],
            defeat: ['算无遗策，终有疏漏……']
        }
    }
];

// 根据ID获取武将
function getHeroById(id) {
    return HEROES.find(h => h.id === id);
}

// 自动为每个武将分配头像路径 (优先PNG，回退SVG)
HEROES.forEach(h => {
    const pngPath = `img/heroes/${h.id}.png`;
    const svgPath = `img/heroes/${h.id}.svg`;
    // 使用require或直接判断文件是否存在，这里默认优先PNG
    h.avatar = pngPath;
    h.avatarFallback = svgPath;
});

// 获取武将的被动技能
function getPassiveSkills(hero) {
    return hero.skills.filter(s => s.type === 'passive');
}

// 获取武将的主动技能
function getActiveSkills(hero) {
    return hero.skills.filter(s => s.type === 'active');
}

// 获取武将的触发技能
function getTriggeredSkills(hero) {
    return hero.skills.filter(s => s.type === 'triggered');
}

// 检查武将是否有某技能
function hasSkill(hero, skillName) {
    return hero.skills.some(s => s.name === skillName);
}

// 获取武将随机台词
function getHeroLine(hero, eventType) {
    if (!hero.lines || !hero.lines[eventType]) return null;
    const lines = hero.lines[eventType];
    return lines[Math.floor(Math.random() * lines.length)];
}
