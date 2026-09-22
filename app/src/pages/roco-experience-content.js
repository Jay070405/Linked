const L=(zh,en)=>({zh,en});

// Reading copy is separate from the audited source, model inputs and draft rules.
export const readingTitles={
 contribution:L('这份提案，具体改了什么？','What the proposal changes.'),
 's3-loop':L('一次捕捉，怎样变成奇遇？','From capture to encounter.'),
 evidence:L('这 10 批记录，能说明什么？','What ten batches can tell us.'),
 's5-options':L('S5 的两条路线，怎么选？','Two proposals for S5.'),
 prototype:L('中断之后，保留同一个结果。','Keep the same result through retries.'),
};

export const readingEntrances=[
 {id:'roco-s3',code:'S3',label:L('现有循环','Current loop'),title:L('捕捉之后，发生了什么？','What follows a capture?'),detail:L('从实机步骤看书、奇遇与入库的关系。','Follow the gameplay from a book appearing to a creature entering storage.'),action:L('查看 S3 流程','Explore the S3 loop'),image:'/assets/roco/current/s3-5.png',alt:L('S3 童话书奇遇实机截图','S3 Storybook encounter gameplay')},
 {id:'roco-s5',code:'S5',label:L('双方案','Two proposals'),title:L('连续捕捉，或主动调查。','Capture or investigate.'),detail:L('A 复用捕捉循环；B 把调查与奖励选择交给玩家。','A builds on capture; B introduces investigation and reward choices.'),action:L('比较 S5 双方案','Compare the S5 proposals'),image:'/assets/projects/roco-cover.png',alt:L('S5 个人森林概念封面，非官方、AI 辅助','Personal S5 forest concept cover, unofficial and AI-assisted')},
 {id:'roco-calc',code:'MODEL',label:L('投入模型','The model'),title:L('这批球，预计能带回什么？','What might these balls return?'),detail:L('10 批记录、6,632 球。调整投入，检查估算条件。','10 recorded batches, 6,632 balls. Change inputs and inspect the assumptions.'),action:L('试算一次投入','Try an input scenario'),image:'/assets/roco/test-01.png',alt:L('TEST-01 作者实机记录截图','Author’s original TEST-01 gameplay record')},
];

// These explanations describe existing steps, without adding a new game simulation.
export const routeNotes={
 A:[
  L('先指定想要的精灵。不同目标分别保存进度，切换目标不转移保障。','Choose the desired creature. Each target keeps separate progress; changing targets does not transfer its guarantee.'),
  L('只有匹配目标来源的捕捉才计入音符。球种对应 1／2／4 音符，赛季球及必中球给 4。','Only captures from an eligible target source add notes: 1/2/4 by ball type, with seasonal and guaranteed balls giving 4.'),
  L('每满 28 音符生成一条乐章，余数保留。累计 30 条未开奖乐章时暂停积累。','Each 28 notes creates a movement and keeps the remainder. Accumulation pauses at 30 pending movements.'),
  L('确认演奏时锁定结果；预览不开奖。之后的重入或重播不会重抽。','Confirming a performance locks the result. Previewing does not generate it, and returning or replaying does not reroll it.'),
  L('破罩后再展示精灵属性与保障变化，揭晓前不提前泄露结果。','Show the creature’s attributes and guarantee changes after the shield breaks, keeping the result hidden before reveal.'),
  L('捕捉成功才入库。失败、断线或补给不足时保留同一只候选。','Only a successful capture adds the creature to storage. Failure, disconnects or supply shortages retain the same candidate.'),
 ],
 B:[
  L('先指定目标精灵。线索与保障按目标保存，A、B 两套方案的进度也分别记录。','Choose the target creature. Clues and guarantees belong to that target; A and B also keep separate progress.'),
  L('四类线索中选择两类，各积累 120 点。拍照或观察每次给 10 点，每类非捕捉最多 60 点。','Choose two of four clue types and gather 120 points of each. Photos or observations give 10 points, capped at 60 non-capture points per type.'),
  L('定位消耗这两类线索，并创建调查实例。这一步还没有生成奖励精灵。','Locating spends the selected clues and creates an investigation instance. It does not generate the reward creature yet.'),
  L('首次进入区域开始 12 分钟计时。三项任务共 100 分，完成后停表；离线不暂停。','A 12-minute timer starts on first entry. Finish all three tasks totaling 100 points to stop it; going offline does not pause it.'),
  L('调查完成后选择外观、血脉或资源路线，确认时才锁定奖励。只有外观路线推进外观印记。','After investigating, choose appearance, lineage or resources. Confirmation locks the reward; only appearance advances its marks.'),
  L('揭晓同一只已锁定候选，捕捉成功才入库。30 分钟后转存手册，重入不重抽。','Reveal the locked candidate and capture it to collect it. After 30 minutes it moves to the handbook; re-entry never rerolls it.'),
 ],
};
