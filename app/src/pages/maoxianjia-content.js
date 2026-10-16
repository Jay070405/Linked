const L = (zh, en) => ({ zh, en });

export const loopSteps = [
  {
    title: L('掷骰，选择路线', 'Roll and choose a route'),
    body: L(
      '沿棋盘前进，在岔路选择方向。道具能调整移动，也能干扰对手。',
      'Move around the board and choose a direction at junctions. Items can change your movement or disrupt a rival.',
    ),
  },
  {
    title: L('停下，获得线索', 'Land and find a clue'),
    body: L(
      '停在线索格才获得信息。外貌与街区线索逐步缩小二十位居民的候选范围。',
      'Land on a clue tile to gain information. Appearance and district clues narrow the field of twenty residents.',
    ),
  },
  {
    title: L('判断，再走下一步', 'Reconsider the next move'),
    body: L(
      '根据新线索决定继续调查，还是赶往可能的主人所在街区；饱食度让等待也有成本。',
      'Use each clue to decide whether to investigate further or head toward a likely owner. Hunger gives waiting a cost.',
    ),
  },
  {
    title: L('找到主人，尝试相认', 'Find your owner'),
    body: L(
      '向前经过寻人格即可尝试相认，不必集齐线索。先认对主人获胜，猜错则付出时间和饱食度。',
      'Passing a reunion tile while moving forward lets you make a guess before collecting every clue. The first correct reunion wins; a wrong guess costs time and food.',
    ),
  },
];

export const decisions = [
  {
    number: '01',
    title: L('线索必须停下拿', 'Clues require a landing'),
    body: L(
      '“路过就拿”的版本更快，却削弱了落点选择。我保留停下取线索，再调整线索格与精准移动道具，让路线规划仍然有用。',
      'Collecting clues in passing made games faster but weakened landing decisions. I kept exact landings and adjusted clue tiles and precise movement items so route planning still mattered.',
    ),
  },
  {
    number: '02',
    title: L('允许冒险，用代价约束', 'Keep the choice to take a risk'),
    body: L(
      '相认不设线索门槛。为避免盲猜取代推理，认错改为停三回合、扣三点饱食度；若因此归零，则改为住院五回合，不再叠加三回合惩罚。',
      'Reunions have no clue requirement. A wrong guess costs three turns and three food points. If food reaches zero, five hospital turns replace the three-turn penalty; the penalties do not stack.',
    ),
  },
  {
    number: '03',
    title: L('改路网，让小路成为捷径', 'Make side paths meaningful'),
    body: L(
      '星星岛的对称结构方便平衡，路线变化却有限。我比较三套路网后选择方案 C，做成河湾岛，再用模拟检查功能建筑与格子分布。',
      'Star Island’s symmetry helped balance but offered limited route variety. I compared three networks, chose option C for Riverbend Island, then used simulations to check facility and tile placement.',
    ),
  },
];

export const iterations = [
  {
    version: '01',
    label: L('先跑通一局', 'Complete the first playable loop'),
    body: L(
      '从独立规则核心和灰盒开始，连通选角、掷骰、线索、相认与结算。',
      'Start with a standalone rules core and a greybox, connecting character selection, movement, clues, reunions and results.',
    ),
  },
  {
    version: '02',
    label: L('重排信息与视觉', 'Restructure the interface'),
    body: L(
      '按 Figma 样稿整理常驻信息，把教程、手牌和按钮统一成撕纸、贴纸与蓝色标题。',
      'Reorganize persistent information from the Figma layouts, unifying tutorials, cards and buttons through torn paper, stickers and blue headings.',
    ),
  },
  {
    version: '03',
    label: L('让每次行动说清楚', 'Make each action readable'),
    body: L(
      '补上落点预告、卡面说明与收牌确认；演出依次交代顶骰、移动和格子效果。',
      'Add landing previews, card explanations and collection confirmation. Present the dice roll, movement and tile effect in sequence.',
    ),
  },
  {
    version: 'v0.8',
    label: L('整理为可交付 Demo', 'Package the playable demo'),
    body: L(
      '提交版整合两张地图、十五种小游戏和局域网联机；保留演示视频、设计讲解与迭代记录。',
      'The submission build brings together two maps, fifteen minigames and LAN multiplayer, accompanied by a gameplay video, design presentation and iteration records.',
    ),
  },
];

export const metrics = [
  {
    label: L('获胜轮数中位数', 'Median winning round'),
    star: '20',
    river: '18',
  },
  {
    label: L('“见面就猜”代理胜率', 'Reckless agent win rate'),
    star: '19.5%',
    river: '24.6%',
  },
  {
    label: L('每人每局无法行动回合', 'Inactive turns per player / game'),
    star: '1.46',
    river: '1.17',
  },
];

export const simulationNote = L(
  '数据取自讲解 PPT 采用的三批机器人模拟，每批一万局；操作小游戏以简化的骰子规则代替。这是规则验证记录，不是真人试玩统计，也不代表 v0.8 的最新复测结果。',
  'These figures come from the three batches selected for the presentation, each with 10,000 bot games. Simplified dice rules stand in for the action minigames. They document rules validation, not human playtests or the latest v0.8 results.',
);

export const contributions = L(
  '我负责主题与规则边界、Figma 界面和卡牌方向，以及试玩后的取舍与审阅。AI 编程代理协助代码、场景搭建与模拟；角色模型使用 Tripo 生成，再导入和调整。',
  'I defined the theme and rule boundaries, directed the Figma interface and cards, and reviewed changes through playtesting. AI coding agents assisted with code, scene setup and simulation; character models were generated with Tripo, then imported and adjusted.',
);
