import {L} from '../../i18n';

// The case's words and figures, carried over unchanged from cases/ChooseNotToLoseCase.jsx (v4), in English and Chinese
// (L(en, zh), rendered with useCaseLang().t). Sources: cases/d4-choose-not-to-lose/BRIEF.md and
// d4-choose-not-to-lose-prototype/README.md (round 2, after a model-assisted design review), Oct 19 2026. The plans
// are fictional and every dollar figure comes from the prototype's tested cost model. The study count is from
// Bhargava, Loewenstein & Sydnor (QJE 2017), as cited in the brief. Nothing here has been tested with people yet.
// Chinese insurance terms follow the usual US-plan glossaries; each is glossed with the English on first use on the
// page (in PlanLines, which comes first): 保费 premium, 免赔额 deductible, 共同保险 coinsurance,
// 自付额上限 out-of-pocket maximum, 承保医疗费用 covered bills, 网络内 in-network, 被占优 dominated.

export const A = '/assets/product/choose-not-to-lose/';

// The chapter index: every id is an element on the page.
export const CHAPTERS = [
  {id: 'cn-quiz', label: L('Pick a plan', '选一个方案')},
  {id: 'cn-problem-section', label: L('The problem', '问题')},
  {id: 'cn-bills', label: L('Scrub the year', '拖动一年')},
  {id: 'cn-roll', label: L('Roll your year', '随机抽一年')},
  {id: 'cn-flow', label: L('The redesign', '重新设计')},
  {id: 'cn-decisions', label: L('Decisions', '设计决策')},
  {id: 'cn-compare', label: L('Before and after', '前后对比')},
  {id: 'try', label: L('Try it', '动手试试')},
  {id: 'cn-testing-section', label: L('Testing', '测试')},
  {id: 'cn-reflection-section', label: L('Reflection', '反思')},
];

export const FIELDS = [
  [L('Role', '角色'), L('Solo: research, design and prototype', '独立完成：研究、设计和原型')],
  [L('When', '时间'), L('October 2026', '2026 年 10 月')],
  [L('Where', '平台'), L('Desktop web, benefits enrollment', '桌面网页，员工福利选保')],
  [L('Status', '状态'), L('Not yet tested with people', '尚未做用户测试')],
];

export const NUMBERS = [
  {value: 23894, label: L('Employees in the “Choose to Lose” study', '“Choose to Lose” 研究中的员工人数'), ev: 'Sourced',
    note: L('Bhargava, Loewenstein and Sydnor, Quarterly Journal of Economics, 2017', 'Bhargava、Loewenstein 和 Sydnor，《经济学季刊》（Quarterly Journal of Economics），2017')},
  {value: 4, label: L('Fictional plans in the prototype', '原型里的虚构方案'), note: L('Same network and covered services; different prices and terms', '医疗网络和承保服务相同，价格和条款不同')},
  {value: 3, label: L('Bill examples, priced for every plan', '账单示例，每个方案都算好了价格'), note: L('$300, $4,000 and $40,000 in covered bills a year', '每年 $300、$4,000 和 $40,000 的承保医疗费用')},
];

// Camera rects are in the prototype's own 1440-wide page pixels; CNTL_PAGE_KIT shows a 1440 x 900 window onto a
// 1440 x 2080 page, so y reaches down the page the way a scroll would.
export const STEPS = [
  {id: 'baseline', screen: 'baseline', label: L('Benefits table', '福利表格'), title: L('Start where most portals stop', '从大多数门户止步的地方开始'),
    camera: {x: 0, y: 150, w: 1440}, phoneCamera: {x: 0, y: 400, w: 900},
    alt: L('Medical plan selection: a table of four plans with monthly premium, deductible, coinsurance and out-of-pocket maximum, and a radio button per plan',
      '医疗方案选择：四个方案的表格，列出月保费、免赔额、共同保险和自付额上限，每个方案一个单选按钮'),
    body: L('Four plans, four terms each, a radio button. Every number is true, and the year’s arithmetic is left to you. This is the baseline the redesign is tested against.',
      '四个方案，每个四项条款，一个单选按钮。每个数字都没错，全年的账却留给你自己算。重新设计就拿这个基线做对照测试。')},
  {id: 'scenarios', screen: 'scenarios', label: L('Bill examples', '账单示例'), title: L('Three bill amounts, no forecasts', '三个账单金额，不做预测'),
    camera: {x: 120, y: 180, w: 1200}, phoneCamera: {x: 200, y: 360, w: 1040},
    alt: L('Explore three bill amounts: $300, $4,000 or $40,000 in covered bills per year, with $4,000 selected',
      '查看三个账单金额：每年 $300、$4,000 或 $40,000 的承保医疗费用，当前选中 $4,000'),
    body: L('$300, $4,000 or $40,000 in covered bills a year. Round 1 called them “Barely use it” and “A big surprise”; amounts don’t pretend to know anyone’s health, or how likely each year is.',
      '每年 $300、$4,000 或 $40,000 的承保医疗费用。第一轮把它们叫作“几乎用不上”和“意外大病”；金额不会假装了解任何人的健康状况，也不暗示哪种年份更可能出现。')},
  {id: 'chart', screen: 'math', label: L('Yearly cost', '全年费用'), title: L('Every plan on one yearly axis', '所有方案放在同一条全年费用轴上'),
    camera: {x: 20, y: 380, w: 1080}, phoneCamera: {x: 16, y: 470, w: 800},
    alt: L('Compare total yearly cost: each plan a row with three points for the three bill amounts, and the premium, deductible and coinsurance stacked under each row',
      '比较全年总费用：每个方案一行，三个点对应三个账单金额，每行下方叠放保费、免赔额和共同保险'),
    body: L('Each row is a plan; each point is its yearly total for one bill amount, premiums included. Show the breakdown and premium, deductible and coinsurance stack into the total, for all four plans at once.',
      '每一行是一个方案，每个点是它在某个账单金额下的全年总费用，保费已算在内。展开明细后，保费、免赔额和共同保险叠成总额，四个方案同时显示。')},
  {id: 'proof', screen: 'math', label: L('The proof', '证明'), title: L('Flag the plan that loses, and prove it', '标出吃亏的方案，并给出证明'),
    camera: {x: 16, y: 1180, w: 1100}, phoneCamera: {x: 16, y: 1265, w: 900},
    alt: L('An informational note: Plan B costs $600 more per year for the same coverage in this example, with the proof open: the same deductible, coinsurance and maximum, and $600 more at each bill amount',
      '一条说明提示：在这个示例中，保障相同的 Plan B 每年多花 $600；证明已展开：免赔额、共同保险和上限都相同，每个账单金额下都多 $600'),
    body: L('Plan B has Plan A’s deductible, coinsurance and maximum, and a higher premium, so it costs exactly $600 more at every bill amount, not only the three shown. The note says so in blue, and the proof opens in place.',
      'Plan B 的免赔额、共同保险和上限都与 Plan A 相同，保费却更高，所以在任何账单金额下都正好多花 $600，不只是图上这三个。提示用蓝色写明这一点，证明可以就地展开。')},
  {id: 'maximum', screen: 'worst-year', label: L('Maximum', '上限'), title: L('Know the most a year can cost', '知道一年最多要花多少'),
    camera: {x: 120, y: 256, w: 1200}, phoneCamera: {x: 230, y: 400, w: 980},
    alt: L('Maximum yearly cost: annual premiums plus the out-of-pocket maximum, $8,160 for Plan A, $8,760 for B, $8,820 for C and $7,100 for D',
      '全年最高费用：年保费加自付额上限，Plan A 为 $8,160，B 为 $8,760，C 为 $8,820，D 为 $7,100'),
    body: L('Annual premiums plus the out-of-pocket maximum: $7,100 to $8,820 a year. Plan C has the lowest premium and the highest maximum. Uncovered and out-of-network bills can add more, and the page says so.',
      '年保费加自付额上限：每年 $7,100 到 $8,820。Plan C 保费最低，上限却最高。不在承保范围内或网络外的账单还可能更多，页面上写明了这一点。')},
  {id: 'option', screen: 'review-b', label: L('Keep the option', '保留选项'), title: L('Choosing Plan B still works', '仍然可以选 Plan B'),
    camera: {x: 0, y: 190, w: 1440}, phoneCamera: {x: 16, y: 280, w: 800},
    alt: L('Take one more look at Plan B: the note about the $600, a checkbox to confirm it, and Save Plan B disabled until it’s checked',
      '再看一眼 Plan B：关于那 $600 的提示、一个确认复选框，勾选之前“保存 Plan B”不可用'),
    body: L('No plan is preselected, and Plan B stays on the list at full strength. Saving it asks you to confirm the $600 first. The arithmetic informs the choice; it doesn’t make it.',
      '没有预选方案，Plan B 也完整地留在列表里。保存它之前，要先确认那 $600。算式为选择提供依据，但不替你选。')},
  {id: 'confirm', screen: 'confirmation', label: L('Confirmation', '确认页'), title: L('End on a sentence you can check', '最后一句话，经得起核对'),
    camera: {x: 0, y: 190, w: 1440}, phoneCamera: {x: 16, y: 280, w: 800},
    alt: L('A choice you can explain: maximum for covered, in-network care, including annual premiums, $8,160 per year on Plan A; in this $4,000 example, $4,160 per year',
      '一个说得清的选择：网络内承保医疗的最高费用（含年保费），Plan A 为每年 $8,160；在这个 $4,000 的示例中，每年 $4,160'),
    body: L('“Maximum for covered, in-network care, including annual premiums: $8,160 per year on Plan A. In this $4,000 example: $4,160 per year.” The same numbers as the table, the chart and the maximum panel.',
      '“网络内承保医疗的最高费用（含年保费）：Plan A 每年 $8,160。在这个 $4,000 的示例中：每年 $4,160。”数字和表格、图表、上限面板里的一致。')},
];

export const DECISIONS = [
  {id: 'year', title: L('The year, not the month', '看全年，不看每月'), verdict: L('A monthly premium is only part of the price.', '月保费只是价格的一部分。'),
    tried: L('The portal’s columns: a monthly premium, then terms to add up yourself.', '门户的那几列：一个月保费，再加几项要你自己算的条款。'),
    chose: L('One axis of yearly totals, premiums plus what you pay for covered care, for every plan at once.', '一条全年总费用轴：保费加上承保医疗的自付部分，所有方案同时比较。'),
    img: {src: `${A}decision-year.webp`, w: 2112, h: 1408, position: '30% 50%'}},
  {id: 'bills', title: L('Bill amounts, not life stories', '用账单金额，不讲人生故事'), verdict: L('Don’t imply a medical forecast you can’t support.', '不要暗示一个拿不出依据的医疗预测。'),
    tried: L('“Barely use it,” “A few visits + a prescription,” “A big surprise.”', '“几乎用不上”“看几次医生加一张处方”“意外大病”。'),
    chose: L('$300, $4,000 and $40,000 in covered bills, labeled as illustrations with no likelihood attached.', '$300、$4,000 和 $40,000 的承保医疗费用，标明只是示例，不附任何概率。'),
    img: {src: `${A}decision-bills.webp`, w: 2048, h: 1200, position: '4% 50%'}},
  {id: 'inform', title: L('Inform, don’t scold', '说明，而不是责备'), verdict: L('Explain the loss without treating the choice as an error.', '讲清损失，但不把这个选择当成错误。'),
    tried: L('A red error callout: “Plan B costs more than Plan A. Every time.”', '一条红色错误提示：“Plan B 比 Plan A 贵。每次都是。”'),
    chose: L('A blue note with the exact $600 and a proof that opens in place. Red marks only money differences.', '一条蓝色提示，写明确切的 $600，附一个可以就地展开的证明。红色只用来标金额差。'),
    img: {src: `${A}decision-inform.webp`, w: 2144, h: 1580, position: '50% 0%'}},
  {id: 'option', title: L('Keep the bad option', '保留不划算的选项'), verdict: L('Never hide a plan; make the cost of choosing it explicit.', '不隐藏任何方案，把选它的代价说清楚。'),
    tried: L('Plan A preselected, and maximum-cost rows that quietly changed the election.', '预选 Plan A，最高费用那几行还会悄悄改掉已选的方案。'),
    chose: L('No default. Plan B stays selectable at full strength; saving it asks you to confirm the $600.', '没有默认选项。Plan B 照样可以选；保存前要先确认那 $600。'),
    img: {src: `${A}decision-option.webp`, w: 1660, h: 1120, position: '0% 60%'}},
  {id: 'sentence', title: L('Say what the number covers', '说清这个数字包含什么'), verdict: L('A confirmation should survive a careful reader.', '确认页要经得起仔细的读者推敲。'),
    tried: L('“Your worst year on Plan A costs $8,160; a typical year about $4,160.”', '“Plan A 最坏的一年要 $8,160；普通的一年大约 $4,160。”'),
    chose: L('“Maximum for covered, in-network care, including annual premiums: $8,160 per year on Plan A. In this $4,000 example: $4,160 per year.”',
      '“网络内承保医疗的最高费用（含年保费）：Plan A 每年 $8,160。在这个 $4,000 的示例中：每年 $4,160。”'),
    img: {src: `${A}decision-sentence.webp`, w: 1660, h: 1120, position: '0% 30%'}},
];

const R = `${A}rounds/`;
export const PAIRS = [
  {id: 'portal', tab: L('Portal → yearly view', '门户 → 全年视图'), ratio: '1440 / 1119', size: [1440, 1119],
    caption: L('The same four fictional plans. Left: the benefits table most portals show. Right: the yearly view, premiums and covered care on one axis.',
      '同样的四个虚构方案。左边是大多数门户显示的福利表格，右边是全年视图，保费和承保医疗费用放在同一条轴上。'),
    before: {src: `${R}portal.webp`, label: L('Benefits portal', '福利门户')}, after: {src: `${R}compare-portal.webp`, label: L('Yearly view', '全年视图')}},
  {id: 'rounds', tab: L('Round 1 → Round 2', '第一轮 → 第二轮'), ratio: '1440 / 1310', size: [1440, 1310],
    caption: L('The comparison in both rounds: bill amounts instead of scenario names, a blue note instead of a red error, and no plan preselected.',
      '两轮的比较页：用账单金额代替情景名称，用蓝色提示代替红色错误，也不再预选方案。'),
    before: {src: `${R}compare-r1.webp`, label: L('Round 1', '第一轮')}, after: {src: `${R}compare-r2.webp`, label: L('Round 2', '第二轮')}},
];

// From d4-choose-not-to-lose-prototype/README.md, "Round 2: design review".
export const CHANGES = [
  {what: L('Scenario names became bill amounts: $300, $4,000 and $40,000 in covered bills.', '情景名称改成了账单金额：$300、$4,000 和 $40,000 的承保医疗费用。'),
    why: L('“A few visits + a prescription” implied a medical estimate the numbers don’t support.', '“看几次医生加一张处方”暗示了一个数字撑不起来的医疗估计。')},
  {what: L('“Worst year” became “maximum for covered, in-network care, including annual premiums,” with the exclusions beside it.', '“最坏的一年”改成了“网络内承保医疗的最高费用（含年保费）”，排除项就写在旁边。'),
    why: L('Uncovered and out-of-network bills can go past it; the old name hid that.', '不在承保范围内和网络外的账单可能超出这个数，旧名称把这一点藏起来了。')},
  {what: L('The red “Every time” error became a blue note, “Plan B costs $600 more per year for the same coverage,” with the proof one click away.', '红色的“每次都是”错误提示改成了蓝色提示：“保障相同，Plan B 每年多花 $600”，点一下就能看到证明。'),
    why: L('Explain the consequence without scolding.', '讲清后果，但不责备。')},
  {what: L('No default plan: native radios, visible “Selected” text, and review disabled until you choose.', '不设默认方案：用原生单选按钮，显示“已选择”文字，选定之前不能进入核对。'),
    why: L('Round 1 preselected Plan A, and the maximum-cost rows quietly changed the election.', '第一轮预选了 Plan A，最高费用那几行还会悄悄改掉已选的方案。')},
  {what: L('One measured SVG places every tick, gridline, point and stack.', '用一个经过测量的 SVG 放置每个刻度、网格线、数据点和堆叠条。'),
    why: L('Header ticks drifted from the rows at some widths. In a money chart, that’s a trust problem.', '在某些宽度下，表头刻度和数据行对不齐。在讲钱的图表里，这关乎信任。')},
  {what: L('Each point names its bill amount, and both keys stay visible with the math open.', '每个点都标出对应的账单金额，展开算式时两套图例也都还在。'),
    why: L('Less decoding, and no suggestion that the line is a full spending range.', '读图更省力，也不会让人以为那条线代表完整的花费区间。')},
];

export const TASKS = [
  {id: 'table', screen: 'baseline', title: L('Pick a plan from the familiar benefits table', '在熟悉的福利表格里选一个方案'),
    hint: L('This is the baseline most portals show. Then choose Yearly cost view, top right, and compare.', '这是大多数门户显示的基线页面。然后点右上角的 Yearly cost view（全年费用视图）比较。')},
  {id: 'lose', screen: 'compare', title: L('Find the plan that costs more in every example, and why', '找出在每个示例里都更贵的方案，以及原因'),
    hint: L('Read the note under the chart, then Show proof.', '读图表下方的提示，再点 Show proof（显示证明）。')},
  {id: 'high', screen: 'compare', title: L('See how the plans rank with $40,000 in covered bills', '看看承保医疗费用为 $40,000 时各方案如何排序'),
    hint: L('Choose the $40,000 example: the rows re-rank and every total updates.', '选 $40,000 的示例：各行重新排序，每个总额都会更新。')},
  {id: 'b', screen: 'compare', title: L('Choose Plan B anyway, and see what review asks of you', '仍然选 Plan B，看看核对页要你做什么'),
    hint: L('Select Plan B, then review it. Saving asks you to confirm the $600 first.', '选择 Plan B 并进入核对。保存前要先确认那 $600。')},
];

export const TEST_PLAN = [
  L('Five classmates each choose from two fictional menus, one in the baseline table and one in the redesign, in counterbalanced order.',
    '五位同学各从两份虚构的方案菜单里做选择，一份用基线表格，一份用重新设计的页面，先后顺序做平衡。'),
  L('Measures: dominated choices, time to decide, and whether each person can explain their pick back.',
    '测量：选到被占优方案的次数、做决定用的时间，以及每个人能否把自己的选择解释清楚。'),
  L('Questions they haven’t seen, answered before the arithmetic is shown: A and B’s difference at $12,000 in covered bills; whether $0 in bills is the first point; what happens to premiums after the out-of-pocket maximum; whether uncovered bills can go past it.',
    '在展示算式之前，先回答几个没见过的问题：承保医疗费用为 $12,000 时 A 和 B 差多少；$0 账单是不是第一个点；达到自付额上限之后保费会怎样；不在承保范围内的账单能不能超过上限。'),
];
export const HYPOTHESES = [
  L('Pricing the whole year cuts dominated choices.', '按全年算价格，能减少选到被占优方案的情况。'),
  L('People explain their choice back more accurately from the yearly view than from the table.', '用全年视图时，人们比用表格时更能准确解释自己的选择。'),
  L('An informational note changes choices without making anyone feel scolded.', '一条说明性的提示能改变选择，同时不让人觉得被责备。'),
];
export const RESULTS = [L('Chose a dominated plan, table', '选了被占优方案（表格）'), L('Chose a dominated plan, yearly view', '选了被占优方案（全年视图）'), L('Explained their pick back', '能解释自己的选择')];

export const REFLECTION = [
  {title: L('What I’d keep', '我会保留的'), body: L('Proving the loss instead of inferring it from three dots. Plan B is flagged only because its terms match Plan A’s and its premium is higher, so the claim holds at every bill amount, not just the ones on screen.',
    '证明损失，而不是靠三个点去推断。Plan B 被标出来，只是因为它的条款和 Plan A 相同、保费更高，所以这个结论在任何账单金额下都成立，不只是屏幕上那几个。')},
  {title: L('What I don’t know yet', '我还不知道的'), body: L('Whether people read a range chart at all under deadline pressure, and how often real menus, where plans differ in network and drug coverage, leave a plan this cleanly dominated.',
    '截止日期压力下，人们到底会不会看区间图；在真实的方案菜单里，各方案的医疗网络和药品保障都不一样，又有多常出现这样一眼就能证明被占优的方案。')},
  {title: L('What’s next', '下一步'), body: L('The five-person comparison, with answers recorded before the arithmetic is revealed. Then plans that differ in more than price, where the proof gets harder and the design has to say less.',
    '做五人对比测试，在展示算式之前先记下回答。然后处理不止价格不同的方案：那时证明更难，设计也得少说一些。')},
];
