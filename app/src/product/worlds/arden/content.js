import {L} from '../../i18n';

/* The words and numbers on the Arden page, English first, Chinese beside it (L('en', 'zh'); site-spec/zh-glossary.md).
   Sources: cases/d5-glasses/BRIEF.md, ARCHITECTURE.md (every size, mass and power figure below is its row, Sourced or
   Estimate as it says), cases/ideation-3d/RESULTS.md §二.1 (bystander evidence) and RESULTS-FEATURE.md (Hearing
   Check-in), the companion app's own copy. Links checked 20 Oct 2026. */

export const TITLE = 'Arden';

/* ---------- 1. hero ---------- */
export const HERO = {
  kind: L('Hardware and iOS concept', '硬件与 iOS 概念设计'),
  title: L('Arden. Glasses first.', 'Arden。​先是​一副眼镜。'),
  line: L('AI glasses with a camera, open-ear audio and a small display in the right lens, designed to be worn as glasses before anything else.',
    '一副 AI 眼镜：有摄像头、开放式音频，右镜片里还有一块小显示屏。设计时先把它当眼镜来做。'),
  concept: L('Concept. Not affiliated with any company.', '概念作品，与任何公司无关。'),
  chips: [L('Solo: product and industrial design, 3D, iOS app', '独立完成：产品与工业设计、3D、iOS app'), L('October 2026', '2026 年 10 月'), L('Not yet tested with people', '还没找人测试')],
  skip: L('Skip the experience: read it plainly', '跳过体验，直接读简洁版'),
  look: L('See inside', '看看里面'),
  alt: L('Arden glasses in black titanium, lit from the side on a black background.', '黑色钛金属的 Arden 眼镜，黑色背景，侧光。'),
};

export const CHAPTERS = [
  {id: 'ar-top', label: L('Overview', '概览')},
  {id: 'ar-problem', label: L('Problem', '问题')},
  {id: 'ar-day', label: L('A day', '一天')},
  {id: 'ar-charge', label: L('Charging', '充电')},
  {id: 'ar-design', label: L('Design', '设计')},
  {id: 'ar-inside', label: L('Inside', '内部')},
  {id: 'ar-app', label: L('App', 'app')},
  {id: 'ar-eval', label: L('Evaluation', '评估')},
];

/* ---------- 2. the problem ---------- */
export const PROBLEM = {
  eyebrow: L('The problem', '问题'),
  heading: L('AI glasses got useful. They still feel like gadgets.', 'AI 眼镜已经有用了，​戴起来却还像个​电子产品。'),
  lede: L('Three things still give them away.', '有三件事，​还是让人一眼看出它是个电子产品。'),
  points: [
    {title: L('They’re heavy.', '太重。'), text: L('Each feature adds grams to something that sits on your nose all day. The display models weigh the most.', '每加一个功能就多几克，而它整天压在你的鼻梁上。带显示屏的最重。'), ev: 'Sourced'},
    {title: L('The camera makes people tense.', '摄像头让旁人紧张。'), text: L('The people around you can’t tell when it’s filming, and a small light is easy to miss or cover.', '旁人不知道它什么时候在拍，一颗小灯也很容易看漏，或者被遮住。'), ev: 'Sourced'},
    {title: L('The app serves the camera.', 'app 围着摄像头转。'), text: L('Companion apps tend to centre on captures. The glasses themselves (fit, battery, display, hearing) come second.', '配套 app 往往围着拍摄内容转，眼镜本身（佩戴、电量、显示、听力）排在后面。'), ev: 'Hypothesis'},
  ],
};

/** Sourced. Each card says only what its source says. */
export const EVIDENCE = [
  {
    title: L('What shipped glasses weigh', '已上市眼镜的重量'),
    rows: [
      [L('Ray-Ban Meta, original', 'Ray-Ban Meta 初代'), '48.6 g', 'EDN', 'https://www.edn.com/ray-ban-metas-ai-glasses-a-transparency-enabled-pseudo-teardown-analysis/'],
      [L('Ray-Ban Meta Gen 2', 'Ray-Ban Meta 第二代'), '51–53 g', 'Digital Camera World', 'https://www.digitalcameraworld.com/cameras/digital-cameras/ray-ban-meta-gen-2-headliner-review-truly-smart-glasses-in-every-sense-of-the-word'],
      [L('Meta Ray-Ban Display', 'Meta Ray-Ban Display'), '69 g', 'Meta', 'https://about.fb.com/br/news/2025/09/apresentando-o-meta-ray-ban-display-uma-categoria-revolucionaria-de-oculos-inteligentes/'],
      [L('Even Realities G1 (no camera, no speakers)', 'Even Realities G1（没有摄像头和扬声器）'), '44 g', 'WIRED', 'https://es.wired.com/articulos/even-realities-desafia-a-meta-con-las-nuevas-gafas-inteligentes-even-g2'],
    ],
  },
  {
    title: L('Bystanders act on it', '旁人会有所行动'),
    text: L('A CHI 2026 study surveyed 525 people and interviewed 20, in China. In sensitive settings, 65–90% of bystanders said they would take defensive action.',
      'CHI 2026 的一项研究在中国调查了 525 人，访谈了 20 人。在敏感场合，65%–90% 的旁人表示会采取防御行动。'),
    sources: [{name: 'Wang et al., CHI 2026', href: 'https://arxiv.org/abs/2603.04930'}],
  },
  {
    title: L('The light gets hidden', '指示灯会被藏起来'),
    text: L('In Brussels, men filmed women in the street with camera glasses; RTBF found tutorials on concealing the recording light “abundant and easily accessible online.” Meta’s answer, in a mandatory July 2026 update, is to disable the camera when the light is covered or tampered with.',
      '在布鲁塞尔，有男人戴着摄像头眼镜在街上偷拍女性；RTBF 发现，网上教人遮住录像指示灯的教程“很多，也很好找”。Meta 在 2026 年 7 月的强制更新里给出的办法是：指示灯被遮住或被改动，摄像头就停用。'),
    sources: [
      {name: 'The Brussels Times, on RTBF', href: 'https://www.brusselstimes.com/2166072/women-unknowingly-filmed-in-brussels-with-meta-smart-glasses-raise-concerns'},
      {name: 'Meta', href: 'https://about.fb.com/news/2026/07/metas-ai-glasses-your-questions-answered/'},
      {name: '9to5Google', href: 'https://9to5google.com/2026/07/07/meta-ray-ban-smart-glasses-privacy-light-camera-update/'},
    ],
  },
];

/* ---------- 3. the principle ---------- */
export const PRINCIPLE = {
  eyebrow: L('The principle', '原则'),
  heading: L('Glasses first.', '先是​一副眼镜。'),
  you: [L('For you', '对你来说'), L('a pair of glasses you’d wear anyway: titanium, a calm browline, the weight and fit of a real frame.', '是一副你本来就愿意戴的眼镜：钛金属，平稳的眉线，重量和佩戴感都像一副真正的镜框。')],
  them: [L('For the people around you', '对你身边的人来说'), L('a pair of glasses, not a camera pointed at them. When it does record, they can tell.', '它就是一副眼镜，不是一台对着他们的相机。真在拍的时候，他们也看得出来。')],
};

/* ---------- 4. design ---------- */
export const DESIGN = {
  eyebrow: L('Design', '设计'),
  heading: L('One piece of *titanium*, from brow to hinge.', '从眉线到铰链，​是一整块*钛金属*。'),
  lede: L('No visible screws. The temples match the finish, tone on tone.', '看不到一颗螺丝，​镜腿和金属同色系。'),
  finishLabel: L('Finish', '配色'),
  finishes: [
    {id: 'natural', still: 'cmf-natural', name: L('Natural Titanium', '原色钛金属'), swatch: 'linear-gradient(135deg,#d9d7d2,#a9a7a2)'},
    {id: 'black', still: 'cmf-black', name: L('Black Titanium', '黑色钛金属'), swatch: 'linear-gradient(135deg,#55565a,#1d1d1f)'},
    {id: 'desert', still: 'cmf-desert', name: L('Desert Titanium', '沙漠色钛金属'), swatch: 'linear-gradient(135deg,#e4d3bd,#b49c80)'},
  ],
  alt: name => L(`Arden in ${name}, three-quarter view.`, `${name}的 Arden，四分之三视角。`),
  lineup: L('One front, three finishes; the temples follow.', '同一个前框，三种配色，镜腿跟着变。'),
  lineupAlt: L('Arden in Desert, Black and Natural Titanium, one behind the other.', '沙漠色、黑色和原色钛金属的 Arden，前后错开摆在一起。'),
  detailsHeading: L('Details you notice when you hold them.', '拿在手里才会注意到的细节。'),
  detailsHint: L('Tap a detail to look closer.', '点一下，看近一点。'),
  details: [
    {id: 'symmetry', still: 'ortho-front', wide: true, focus: [50, 32], zoom: 1.25, title: L('Camera and sensor, matched', '摄像头和传感器，左右对称'),
      text: L('Camera left, light sensor right, behind matching windows. Neither looks like an eye.', '左边摄像头，右边光线传感器，​小窗一模一样，​哪边都不像眼睛。')},
    {id: 'camera', still: 'detail-camera-off', focus: [56, 52], zoom: 1.6, title: L('A small grey lens', '一个灰色的小镜头'),
      text: L('12 MP, 8 × 8 × 6 mm. The capture light hides beside it.', '1200 万像素，8 × 8 × 6 毫米，​指示灯就藏在旁边。')},
    {id: 'control', still: 'detail-temple', focus: [42, 50], zoom: 1.7, title: L('Capture control and squeeze zone', '拍摄按键和按压区'),
      text: L('A flush sapphire control takes photos; the temple senses a squeeze.', '齐平的蓝宝石按键拍照，​镜腿本身感应按压。')},
    {id: 'hinge', still: 'cmf-natural', focus: [63, 66], zoom: 2.6, title: L('A spring hinge', '弹簧铰链'),
      text: L('Stainless steel with a spring; the flex passes through the fold.', '带弹簧的不锈钢铰链，​柔性板从折叠处穿过。')},
    {id: 'pads', still: 'ortho-front', focus: [50, 56], zoom: 3, title: L('Adjustable nose pads', '可调鼻托'),
      text: L('Clear silicone on titanium arms, home of the proposed voice sensor.', '透明硅胶配钛金属托臂，​语音传感器（方案中）也在这里。')},
    {id: 'contacts', still: 'detail-bridge-contacts', focus: [50, 52], zoom: 1.15, title: L('Charging contacts', '充电触点'),
      text: L('Two gold pads under the bridge meet the case’s spring contacts.', '鼻梁下两块镀金触点，​对上盒里的弹簧触点。')},
  ],
  // sun mode: the lenses tint by themselves (ARCHITECTURE.md, Revision E); renders/sun/hero-tint-0, -50, -85
  sunTitle: L('Sun mode', '阳光模式'),
  sunText: L('A dimming cell on the world side of each lens tints it in strong sun, in about 0.3 s. Unpowered, it goes clear.', '每片镜片外侧有一层变色膜，​阳光强时约 0.3 秒变深，​断电就恢复透明。'),
  sunClear: L('Clear', '透明'), sunTinted: L('Tinted', '变深'),
  sunSlider: L('Lens tint', '镜片深浅'),
  sunAlt: n => L(`Arden from the front, lenses tinted ${n}%.`, `Arden 正面，镜片变深 ${n}%。`),
  foldTitle: L('Fold them', '折起来'),
  foldText: L('Drag a temple, or press the button.', '拖动镜腿，​或者按一下按钮。'),
  fold: L('Fold', '折起'), unfold: L('Unfold', '展开'),
  foldAlt: L('Arden folding: the temples swing in on their hinges.', 'Arden 正在折起：两条镜腿绕铰链合拢。'),
  turnHeading: L('Turn it over.', '翻过来看看。'),
  turnHint: L('Drag to turn it; flick it to spin.', '拖动来转，​轻轻一甩还会再转一会儿。'),
  turnKeys: L('Arrow keys turn it 5° at a time.', '方向键每次转 5°。'),
  turnLabel: L('Arden on a turntable', '转台上的 Arden'),
  turned: deg => L(`Turned ${deg}°`, `转了 ${deg}°`),
  turnPending: L('The turntable is still rendering. This is the still it starts from.', '转台还在渲染，这是它的起始画面。'),
};
export const OBJECT = {turnLabel: DESIGN.turnLabel, turned: DESIGN.turned, turnHint: DESIGN.turnHint, turnKeys: DESIGN.turnKeys};

/* ---------- 6. inside ---------- */
export const INSIDE = {
  eyebrow: L('Inside', '内部'),
  heading: L('Every part, with its size and weight.', '每个零件，​都标了尺寸和重量。'),
  lede: L('Point at a number to see the part. Every number is an estimate.', '点一个编号看那个零件。​数字都是估算。'),
  spin: L('↻ 360°', '↻ 360°'),
  spinHint: L('Drag to turn it around', '拖动，​把它转一圈'),
  legendTitle: L('Parts', '零件'),
  sizeMass: L('Envelope · mass', '包络尺寸 · 质量'),
  alt: L('Exploded view of Arden: the right lens’s layers fanned out in front of the frame, the projector and camera modules pulled forward, the front flex lifted above the brow, and each temple’s layers stacked apart, the right temple above and the left below.',
    'Arden 的爆炸图：右镜片的各层在镜框前方展开，投影模组和摄像头模组往前拉出，前框柔性板抬到眉线上方，两条镜腿的各层分开排列，右镜腿在上，左镜腿在下。'),
  cutHeading: L('What each temple carries.', '两条镜腿里各装了什么。'),
  cutLede: L('Left: a battery and a speaker. Right: the mainboard, the other battery, a speaker and the antenna.',
    '左边：电池和扬声器。​右边：主板、另一块电池、扬声器和天线。'),
  sides: {left: L('Left temple', '左镜腿'), right: L('Right temple', '右镜腿')},
  hingeHeading: L('The flex through the hinge.', '穿过铰链的柔性板。'),
  hingeText: L('0.06 mm thick where it bends, to be tested for 20,000 folds.', '弯折处只有 0.06 毫米厚，​计划测试 2 万次折叠。'),
  lensHeading: L('Focus the world. Keep the HUD steady.', '调焦现实，显示保持稳定。'),
  lensText: L('Hard coat → dimming cell → LC focus layer → waveguide → prescription inner lens. An optician fits and bonds the prescription inner lens into the eye side of the stack, with no visible second lens. Focus sits on the world side of the waveguide, so near add leaves the HUD focus unchanged.', '硬化外层 → 变色层 → 液晶调焦层 → 波导片 → 处方内镜。处方内镜由配镜师验配并胶合进镜片叠层的眼侧，外观上看不到第二片镜片。调焦层在波导外侧，近用加光不会改变 HUD 的焦点。'),
  lensBudget: L('Revision G specifies 5.17 mm before the prescription inner lens; the listed layers sum to 5.10 mm. The 0.07 mm discrepancy and final bonded stack thickness still need reconciliation; prescription thickness varies.', 'Revision G 标注处方内镜之前的总厚度为 5.17 毫米，所列各层相加为 5.10 毫米。0.07 毫米差异及胶合后的总厚度仍待核对；处方内镜厚度随处方变化。'),
  partsNote: L('Dimensions are per component unless stated; masses are installed totals. Grouped callouts are not additive BOM rows. Squeeze sensing uses the original touch-strip allowance, pending validation. Voice-sensor dimensions/mass and grille dimensions are unspecified; grilles share the assembly allowance. Prescription inner lenses are optician-fitted and bonded into the stack. The existing 0.10 g allowance is held pending a revised lens integration budget.', '除特别说明外，尺寸为单件尺寸，重量为装机总量。分组标注不能直接相加作为物料总重。按压检测沿用原触控条预算，尚待验证。语音传感器尺寸和重量、格栅尺寸尚未指定；格栅计入装配预算。处方内镜由配镜师验配并胶合进叠层。原有 0.10 克预算暂予保留，镜片集成预算仍待修订。'),
  lensLayers: [
    [L('Hard coat and AR carrier', '硬化增透外层'), '1.0 mm'],
    [L('Dimming cell (sun mode)', '变色层（阳光模式）'), '0.30 mm'],
    [L('LC focus layer', '液晶调焦层'), '0.40 mm'],
    [L('Air gap', '空气隙'), '0.2 mm'],
    [L('Waveguide (right lens)', '波导片（右镜片）'), '1.6 mm'],
    [L('Air gap', '空气隙'), '0.2 mm'],
    [L('AR-coated inner cover', '增透内层保护片'), '1.4 mm'],
    [L('Prescription inner lens (bonded)', '处方内镜（胶合）'), L('2.0 mm nominal; prescription-dependent', '标称 2.0 毫米；随处方变化')],
  ],
  hingeAlt: L('Cutaway of the hinge: the flex cable folds through the hinge knuckle in a rolling loop.', '铰链剖视：柔性板在铰链关节里绕成一个圈穿过去。'),
  lensAlt: L('Hard coat, dimming and LC focus layers before the waveguide, with an optician-fitted prescription inner lens bonded into the eye side of the stack, with no visible second lens.', '波导前方的硬化、变色和液晶调焦层，以及由配镜师验配、胶合进叠层眼侧的处方内镜，外观上看不到第二片镜片。'),
};

export const VISION = {
  title: L('Your vision', '你的视力'),
  tileLens: L('An optician fits and bonds your prescription inner lens into the lens stack, including astigmatism correction, with no visible second lens.', '配镜师将含散光矫正的处方内镜验配并胶合进镜片叠层，外观上看不到第二片镜片。'),
  tileFocus: L('The proposed LC layer adds near focus; your distance prescription remains without power.', '拟议的液晶层提供近用调焦，断电后仍保留远用处方。'),
  prescriptionTitle: L('Your prescription, built into the lens.', '把处方融入镜片。'),
  prescription: L('An optician fits your prescription inner lens from your eye exam: sphere, astigmatism (cylinder), axis and pupillary distance (PD). It is bonded into the lens stack, with no visible second lens. A prescription change requires professional lens replacement.', '配镜师按验光结果验配处方内镜：球镜、散光（柱镜）、轴位和瞳距（PD）。内镜胶合进镜片叠层，外观上看不到第二片镜片。处方变化后，需要由专业人员更换镜片。'),
  focusTitle: L('Near power, when you need it.', '看近时，自动加光。'),
  focus: L('The 0.40 mm LC focus layer automatically adds 0 to +2.5 D for near vision. Proposed ±0.5 D fine-tuning is an unvalidated design target, not a replacement for an eye exam. Arden targets ≤0.3 s switching at 20°C; without power, the prescription inner lens keeps its distance prescription.', '0.40 毫米液晶调焦层自动增加 0 至 +2.5 D 的近用度数。±0.5 D 微调是尚未验证的设计目标，不能代替验光。Arden 目标是在 20°C 下 ≤0.3 秒切换；断电后保留处方内镜的远用处方。'),
  limit: L('Astigmatism correction lives in the prescription inner lens; the proposed LC layer only adds near focus.', '散光矫正由处方内镜承担；拟议的液晶层只提供近用调焦。'),
  precedent: L('Even Realities G1 prescription lenses are the precedent for integrating the prescription into the lens. IXI showed LC autofocus eyewear at CES 2026; EyeSmart reports transitions under 100 ms. ViXion01S measures target distance and changes lens shape, with customisable outer lenses for astigmatism.', 'Even Realities G1 处方镜片是将处方融入镜片的参考先例。IXI 在 CES 2026 展示液晶自动调焦眼镜；EyeSmart 报道切换时间低于 100 毫秒。ViXion01S 测量目标距离并改变镜片形状，外镜可定制以矫正散光。'),
  sources: [
    {name: 'IXI · CES 2026', href: 'https://www.channelnews.com.au/ces-2026-these-smart-glasses-change-prescription-as-you-look-around/'},
    {name: 'IXI · <100 ms', href: 'https://eyesmart.com.au/newsarticle/7358-ixi-redefines-continuously-focusing-eyewear-with-seamless-vision'},
    {name: 'ViXion01S · Nordic', href: 'https://nordicsemi.com/Nordic-news/2025/02/ViXion01S-eyewear-uses-Nordic-nRF52840-SoC-and-nPM1300-PMIC'},
  ],
  near: L('Look near', '看近'), far: L('Look far', '看远'),
  hudNear: L('Focus · near', '调焦 · 近处'), hudFar: L('Focus · far', '调焦 · 远处'),
  cardTitle: L('A moment to read', '读一会儿'),
  card: L('The light moves across the page. You keep reading.', '光线掠过书页，你继续读下去。'),
  demo: L('Focus illustration; not an optical simulation.', '调焦示意，并非光学仿真。'),
};

/** The exploded view's callouts: the part each points at (its anchor and badge spot come from the model, see
    scripts/build-arden-assets.mjs CALLOUTS), and the architecture row. E = Estimate, S = Sourced. */
export const PARTS = [
  {n: 1, id: 'front', name: L('Titanium front and rims', '钛金属前框和下框'), size: '140 × 12 × 12', mass: '7.00 + 1.50', ev: 'E'},
  {n: 2, id: 'lens', name: L('Optical covers and waveguide', '光学保护片和波导片'), size: '52 × 40 × 1.6', mass: '8.00 + 5.50', ev: 'E'},
  {n: 3, id: 'projector', name: L('RGB micro-LED projector', 'RGB 微型 LED 投影模组'), size: '12 × 8 × 7', mass: '1.40', ev: 'E'},
  {n: 4, id: 'camera', name: L('12 MP camera module', '1200 万像素摄像头模组'), size: '8 × 8 × 6', mass: '1.20', ev: 'E'},
  {n: 5, id: 'flex', name: L('Front flex', '前框柔性板'), size: '140 × 5 × 0.1', mass: '1.20', ev: 'E'},
  {n: 6, id: 'pads', name: L('Nose pads', '鼻托'), size: '13 × 7 × 2', mass: '1.20', ev: 'E'},
  {n: 7, id: 'board', name: L('Mainboard, Qualcomm AR1 Gen 1', '主板，高通 AR1 Gen 1'), size: '38 × 10 × 4', mass: '4.50', ev: 'E'},
  {n: 8, id: 'battery', name: L('Batteries, 2 × 120 mAh', '电池，2 × 120 mAh'), size: '32 × 9 × 4.5', mass: '5.00', ev: 'E'},
  {n: 9, id: 'speaker', name: L('Open-ear speakers', '开放式扬声器'), size: '16 × 7 × 4', mass: '2.40', ev: 'E'},
  {n: 10, id: 'spreader', name: L('Heat spreader', '均热片'), size: '45 × 9 × 0.3', mass: '1.50', ev: 'E'},
  {n: 11, id: 'temple', name: L('Temple chassis and soft-touch shells', '镜腿骨架和亲肤外壳'), size: '145 × 12 × 8.5', mass: '8.00', ev: 'E'},
  {n: 12, id: 'capture_control', name: L('Capture button and dome switch', '拍摄按键和锅仔片开关'), size: '5 × 3 × 2', mass: '0.15'},
  {n: 13, id: 'squeeze_sensor', name: L('Squeeze sensor / control flex', '按压传感器／控制柔性板'), size: '35 × 6 × 0.3', mass: '0.20'},
  {n: 14, id: 'mics', name: L('Microphones ×5 · IM69D130', '麦克风 ×5 · IM69D130'), size: '4 × 3 × 1.2', sizeEv: 'S', mass: '0.30'},
  {n: 15, id: 'ambient_light', name: L('Ambient light sensor · OPT3001', '环境光传感器 · OPT3001'), size: '2 × 2 × 0.65', sizeEv: 'S', mass: '0.03'},
  {n: 16, id: 'capture_indicator', name: L('Capture LED, light pipe and monitors', '拍摄 LED、导光件及监测器'), size: '6 × 4 × 3', mass: '0.30'},
  {n: 17, id: 'imu', name: L('Motion sensor · BMI270', '运动传感器 · BMI270'), size: '3 × 2.5 × 0.8', sizeEv: 'S', mass: '0.03'},
  {n: 18, id: 'wear_sensor', name: L('Wear sensor · VCNL36825T', '佩戴传感器 · VCNL36825T'), size: '2 × 1.25 × 0.5', sizeEv: 'S', mass: '0.03'},
  {n: 19, id: 'voice_accel', name: L('Voice accelerometer', '语音加速度计'), size: L('Not specified', '尚未指定'), sizeUnit: false, mass: L('Not yet budgeted', '尚未计入预算'), massUnit: false},
  {n: 20, id: 'charge_pads', name: L('Bridge charging pads', '鼻梁充电触点'), size: L('1.6 × 1.0 each; pitch 3.0', '每块 1.6 × 1.0；间距 3.0'), mass: '0.12'},
  {n: 21, id: 'antennas', name: L('Wi-Fi / Bluetooth antennas', 'Wi-Fi／蓝牙天线'), size: '28 × 5 × 0.2', mass: '0.15'},
  {n: 22, id: 'hinges', name: L('Spring hinges ×2', '弹簧铰链 ×2'), size: '12 × 7 × 11', mass: '2.20'},
  {n: 23, id: 'speaker_grilles', name: L('Speaker grilles ×2', '扬声器格栅 ×2'), size: L('Not specified', '尚未指定'), sizeUnit: false, mass: L('Within 2.00 g assembly allowance', '计入 2.00 克装配预算'), massUnit: false},
  {n: 24, id: 'dimming_layer', name: L('Dimming cells ×2 and driver', '变色层 ×2 及驱动'), size: L('0.30 thick', '厚 0.30'), mass: '1.30'},
  {n: 25, id: 'focus_layer', name: L('LC focus cells ×2 and driver', '液晶调焦层 ×2 及驱动'), size: L('0.40 thick', '厚 0.40'), mass: '1.20'},
  {n: 26, id: 'rx_lens', name: L('Prescription inner lenses ×2 (bonded)', '处方内镜 ×2（胶合）'), size: L('Nominal 2.0; varies by prescription', '标称 2.0；随处方变化'), mass: L('4.5–6.5 g per pair (provisional)', '每对 4.5–6.5 克（暂估）'), massUnit: false},
  {n: 27, id: 'eye_sensors', name: L('Eye sensors (IR)', '眼动传感器（红外）'), size: L('Not specified; 2 LED / photodiode pairs per rim', '尺寸未定；每侧镜框 2 对 LED／光电二极管'), sizeUnit: false, mass: '0.20'},
];

/** Cutaway hotspots (percent of each render). */
export const HOTSPOTS = {
  left: [
    {at: [15.5, 49], name: L('Flex through the hinge', '穿过铰链的柔性板'), text: L('0.06 mm thick where it bends.', '弯折处只有 0.06 毫米厚。')},
    {at: [24, 53], name: L('Battery protection', '电池保护板'), text: L('Each cell has its own protection and temperature sensing.', '每块电芯都有独立的保护和温度检测。')},
    {at: [41.5, 51.5], name: L('Battery, 120 mAh', '电池，120 mAh'), text: L('32 × 9 × 4.5 mm. The two cells hold 0.888 Wh together.', '32 × 9 × 4.5 毫米。两块电芯合计 0.888 Wh。')},
    {at: [60.5, 50], name: L('Speaker', '扬声器'), text: L('Open-ear, with its own acoustic chamber.', '开放式，自带声腔。')},
    {at: [20.7, 44], name: L('Microphones', '麦克风'), text: L('Two per temple and one at the bridge, five in all.', '每条镜腿两个，鼻梁一个，一共五个。')},
  ],
  right: [
    {at: [61, 50.5], name: L('Mainboard, AR1 Gen 1', '主板，AR1 Gen 1'), text: L('Camera processing, radios and the display bridge. 38 × 10 × 4 mm, 4.5 g.', '负责图像处理、无线和显示桥接。38 × 10 × 4 毫米，4.5 克。')},
    {at: [37, 50], name: L('Battery, 120 mAh', '电池，120 mAh'), text: L('The second cell, on its own charge channel.', '第二块电芯，独立充电通道。')},
    {at: [19, 48], name: L('Speaker', '扬声器'), text: L('Open-ear, near the ear canal.', '开放式，靠近耳道。')},
    {at: [41.7, 43], name: L('Microphones', '麦克风'), text: L('Beamforming picks your voice out of the room.', '波束成形把你的声音从环境里分出来。')},
    {at: [49, 41.5], name: L('Antenna', '天线'), text: L('Printed on the outer polymer face, with no metal behind it.', '印在外侧的塑料面上，背后没有金属。')},
    {at: [66, 44], name: L('Heat spreader', '均热片'), text: L('Graphite and copper carry heat outward, away from your skin and the battery.', '石墨和铜把热量往外导，远离皮肤和电池。')},
  ],
};

/* ---------- 7. built to be believed ---------- */
export const BELIEVE = {
  eyebrow: L('Built to be believed', '做得出来，才算数'),
  heading: L('Real numbers, including the ones that miss.', '真实的数字，没达标的也写上。'),
  dimsHeading: L('Measured from the model.', '从模型里量出来的尺寸。'),
  dimsNote: L('Millimetres, from the Blender model. A [52] □ [18]-[145] frame.', '单位毫米，取自 Blender 模型。​镜框规格 [52] □ [18]-[145]。'),
  views: {front: L('Front', '正面'), side: L('Side', '侧面'), top: L('Top', '顶面')},
  dimLabels: {
    front_width: L('Front width', '前框宽'), lens_w_left: L('Lens width', '镜片宽'), lens_h_left: L('Lens height', '镜片高'),
    bridge: L('Bridge', '鼻梁'), front_height: L('Front height', '前框高'), temple_length: L('Temple', '镜腿'), overall_depth: L('Overall depth', '总深度'),
    overall_width: L('Overall width', '总宽'),
  },
  weightHeading: L('*[59.61] grams*, [7.61] over the target.', '*[59.61] 克*，比目标多 [7.61] 克。'),
  weightLede: L('59.61 g including a 3.00 g reserve: the parts add up to 56.61 g. A prescription inner lens adds about 1–3 g per pair over the plano cover, so about 60.6–62.6 g with a prescription.', '59.61 克含 3.00 克余量：零件共 56.61 克。处方内镜比平光内盖每副多约 1–3 克，戴处方时约 60.6–62.6 克。'),
  weightPath: L('Getting to 52 g takes 7.61 g of cuts: about 3 g from a custom waveguide and covers, 2.1 g from the chassis and front, and the rest still to find. Each costs stiffness, robustness or yield.',
    '降到 52 克要减掉 7.61 克：定制波导片和保护片省约 3 克，骨架和前框省约 2.1 克，剩下的还得再找。每一项都要拿刚性、耐用度或良率去换。'),
  weightCompare: L('Against shipped glasses', '和已上市眼镜比'),
  reserve: L('Reserve', '余量'),
  powerHeading: L('About [4.4] hours of mixed use.', '混合使用约 [4.4] 小时。'),
  powerLede: L('Two 120 mAh cells, one per temple, shown as one battery; the display and camera sleep unless used. Revision G calculation: 163 mW baseline + 1–3 mW dimming + 3–4 mW focus/sensing = 167–170 mW. The table uses the upper estimate, 170 mW.', '两块 120 mAh 电芯，每条镜腿一块，​在 app 里显示成一个电量；​显示屏和摄像头不用就休眠。Revision G 推算：163 mW 基础功耗 + 1–3 mW 变色 + 3–4 mW 调焦和检测 = 167–170 mW。表格采用 170 mW 上限。'),
  powerCols: {load: L('Load', '负载'), active: L('Active', '工作功耗'), duty: L('Duty', '占空比'), avg: L('Average', '平均')},
  powerNotes: [
    L('At 80% battery health: 3.6 h.', '电池健康度 80% 时：3.6 小时。'),
    L('Continuous translation (display, audio, network at 0.745 W): about 1 h.', '连续翻译（显示、音频、联网，0.745 W）：约 1 小时。'),
    L('Continuous camera: an energy ceiling near 0.6 h; heat would throttle it sooner.', '连续拍摄：按电量算上限约 0.6 小时，发热会让它更早降频。'),
  ],
  caseHeading: L('The case holds about four more charges.', '充电盒还能再充大约四次。'),
  caseText: L('160 × 65 × 47 mm and about 90 g, with a 1,500 mAh cell (5.55 Wh). At 70% transfer that is roughly four refills. A moulded insert holds the lenses in two soft pockets, and a magnet in its saddle seats the bridge on two spring contacts.',
    '160 × 65 × 47 毫米，约 90 克，里面是一块 1500 mAh 的电芯（5.55 Wh）。按 70% 的转换效率算，大约能充满四次。盒里的模压内衬用两个软质凹槽托住镜片，​鞍座里的磁铁把鼻梁吸到两个弹簧触点上。'),
  caseAlts: {
    'case-closed': L('The charging case, closed: a soft grey shell with a thin metal seam.', '合上的充电盒：柔和的灰色外壳，中间一道细细的金属缝。'),
    'case-open': L('The charging case, open, with Arden folded inside.', '打开的充电盒，Arden 折好放在里面。'),
  },
  makeHeading: L('How it would be made.', '它会怎么造出来。'),
  make: [
    [L('Front', '前框'), L('CNC titanium for prototypes, stamped and laser-welded in production.', '样机用 CNC 钛金属，​量产用冲压加激光焊接。')],
    [L('Temples', '镜腿'), L('A nylon chassis in soft-touch TPE. Batteries are never overmoulded.', '尼龙骨架包亲肤 TPE，​电池绝不包胶。')],
    [L('Indicator', '指示灯'), L('30 μm laser-drilled holes in thinned titanium. A trial, not a recipe yet.', '在减薄的钛金属上激光打 30 μm 的孔，​还只是试片。')],
  ],
  rowsLabel: L('Part', '零件'),
};

/** ARCHITECTURE.md, "Component and mass allocation": every row, Estimate (g). Groups add up to the 56.61 g total (Revision H: focus 1.20 g, eye sensors 0.20 g; the prescription inner lens replaces the insert). */
export const MASS_ROWS = [
  ['optics', 'Waveguide', 8.00], ['optics', 'Optical covers', 5.50], ['optics', 'Dimming cells and driver', 1.30], ['optics', 'Focus cells and driver', 1.20],
  ['electronics', 'Eye sensors', 0.20],
  ['structure', 'Titanium front', 7.00], ['structure', 'Lower rims', 1.50], ['structure', 'Hinges', 2.20], ['structure', 'Nose pads', 1.20],
  ['temples', 'Temple chassis and shells', 8.00],
  ['power', 'Batteries', 5.00],
  ['electronics', 'Mainboard', 4.50], ['electronics', 'Camera', 1.20], ['electronics', 'Indicator', 0.30], ['electronics', 'Light sensor', 0.03],
  ['electronics', 'Projector', 1.40], ['electronics', 'Microphones', 0.30], ['electronics', 'Squeeze sensing', 0.20], ['electronics', 'Capture control', 0.15],
  ['electronics', 'Motion sensor', 0.03], ['electronics', 'Wear sensor', 0.03], ['electronics', 'Antenna', 0.15],
  ['audio', 'Speakers', 2.40],
  ['assembly', 'Flex', 1.20], ['assembly', 'Heat spreader', 1.50], ['assembly', 'Charging contacts', 0.12], ['assembly', 'Fasteners, seals, adhesive', 2.00],
];
export const RESERVE_G = 3.00;
export const TARGET_G = 52;
export const MASS_GROUPS = [
  {id: 'optics', name: L('Optics', '光学')},
  {id: 'structure', name: L('Titanium, hinges, pads', '钛框、铰链、鼻托')},
  {id: 'temples', name: L('Temples', '镜腿')},
  {id: 'power', name: L('Batteries', '电池')},
  {id: 'electronics', name: L('Electronics', '电子件')},
  {id: 'audio', name: L('Speakers', '扬声器')},
  {id: 'assembly', name: L('Flex, heat, assembly', '柔性板、散热、装配')},
];
/** Sourced comparators. A range draws as a range. */
export const COMPARE = [
  {name: 'Even Realities G1', g: [44, 44], note: L('display, no camera or speakers', '有显示，没有摄像头和扬声器'), href: EVIDENCE[0].rows[3][3]},
  {name: 'Ray-Ban Meta', g: [48.6, 53], note: L('camera and audio, no display', '有摄像头和音频，没有显示'), href: EVIDENCE[0].rows[1][3]},
  {name: 'Meta Ray-Ban Display', g: [69, 69], note: L('camera, audio and display', '摄像头、音频和显示都有'), href: EVIDENCE[0].rows[2][3]},
];

/** ARCHITECTURE.md, "Power and charging" (Estimate). mW. */
export const POWER_ROWS = [
  [L('Sleep, connected, wake word and sensors', '休眠、保持连接、唤醒词和传感器'), 65, 100, 65],
  [L('Projector, driver and display processing', '投影、驱动和显示处理'), 300, 15, 45],
  [L('Audio playback', '音频播放'), 180, 20, 36],
  [L('Camera, processing, writing, indicator', '摄像头、处理、写入、指示灯'), 1200, 1, 12],
  [L('Wi-Fi transfers', 'Wi-Fi 传输'), 500, 1, 5],
  [L('Dimming cells + driver (upper estimate)', '变色层及驱动（估算上限）'), 3, 100, 3],
  [L('Focus cells + eye sensing (upper estimate)', '调焦层及眼动检测（估算上限）'), 4, 100, 4],
];
export const BATTERY = {wh: 0.888, usable: 0.85};

/* ---------- 8. the display ---------- */
export const DISPLAY = {
  eyebrow: L('The display', '显示'),
  heading: L('Text in the right lens, only when you need it.', '右镜片里显示文字，只在需要时出现。'),
  lede: L('One small display in the right lens. An RGB micro-LED projector in the end-piece sends light into a waveguide, which carries it to your eye. White text, minimal, only when you need it.',
    '右镜片里有一块小显示屏。桩头里的 RGB 微型 LED 投影把光送进波导片，再由波导片送到眼前。白色文字，很简洁，只在需要的时候出现。'),
  spec: L('The projector class it’s sized for, JBD’s Hummingbird I: 0.4 cc, 1 g, 640 × 480, 30°.', '按这个级别的投影来设计：JBD 的 Hummingbird I，0.4 cc，1 克，640 × 480，30°。'),
  specSource: {name: 'JBD', href: 'https://www.jb-display.com/product_des/6.html'},
  tabs: [
    {id: 'navigation', scene: 'navigation', hud: 'navigation', name: L('Navigation', '导航')},
    {id: 'translation', scene: 'translation', hud: 'translation', name: L('Translation', '翻译')},
    {id: 'ask', scene: 'assistant', hud: 'assistant', name: L('Ask', '提问')},
    {id: 'message', scene: 'idle', hud: 'notification', name: L('Message', '消息')},
    {id: 'boost', scene: 'boost', hud: 'boost', name: L('Boost', '对话增强')},
  ],
  note: L('A screen preview of the in-lens view, not an optical simulation. The scene photos are AI-generated.', '这是镜片视角的屏幕预览，不是光学仿真。背景照片由 AI 生成。'),
  label: L('In-lens view', '镜片里看到的画面'),
};

/* ---------- 9. capture ---------- */
export const CAPTURE = {
  eyebrow: L('Capture, considerately', '拍摄，也顾及旁人'),
  heading: L('Visible, not loud.', '看得见，但不刺眼。'),
  lede: L('People nearby should know when Arden is recording. But many of us tense up in front of a camera, and part of the point of glasses is that nobody feels a phone pointed at them.',
    '身边的人应该知道 Arden 什么时候在拍。可很多人一面对镜头就会紧张，而眼镜的意义之一，就是不让人觉得有部手机正对着自己。'),
  rules: [
    [L('Hidden until lit', '不亮就看不见'), L('A soft white light behind micro-perforations in the titanium, next to the camera. Off, there is nothing to see.', '摄像头旁边的钛金属上有一片微孔，后面是一盏柔和的白灯。不亮的时候，什么也看不出来。')],
    [L('Always on during capture', '拍摄时一定亮'), L('It lights for photos, video and visual questions, and it can’t be turned off. If the light fails or is covered, the camera has no power.', '拍照、录像、问它“我在看什么”时都会亮，而且关不掉。灯坏了或被遮住，摄像头就断电。')],
    [L('Brighter in the sun', '晴天更亮'), L('A light sensor sets the brightness: dim indoors so it doesn’t glare, bright outdoors so it is still seen.', '光线传感器调节亮度：室内暗一些，不刺眼；室外亮一些，照样看得见。')],
    [L('A quiet shutter', '轻轻的快门声'), L('A short, soft sound for photos. The wearer also sees the capture state in the display.', '拍照时有一声很轻的短音。佩戴者在显示屏里也能看到拍摄状态。')],
  ],
  slider: L('Light around you', '周围的光线'),
  places: [
    [10, L('Dim restaurant', '昏暗的餐厅')], [500, L('Office', '办公室')], [10000, L('Overcast street', '阴天的街道')], [100000, L('Direct sun', '阳光直射')],
  ],
  lux: v => L(`${v} lux`, `${v} 勒克斯`),
  output: L('Indicator brightness', '指示灯亮度'),
  curve: L('Estimate. The target ranges are 30–150 cd/m² indoors and 1,500–6,000 cd/m² outdoors; the curve between them is a tuning job, and visibility in sun is untested.',
    '估算。目标范围：室内 30–150 cd/m²，室外 1,500–6,000 cd/m²；两者之间的曲线要靠调校，阳光下能否看清还没测试。'),
  shutter: L('Play the shutter', '听一下快门声'),
  offAlt: L('The left end-piece with the capture light off: plain titanium and a small grey lens.', '指示灯熄灭时的左桩头：一片钛金属和一个灰色小镜头。'),
  onAlt: L('The same end-piece capturing: a soft white glow through six tiny holes beside the lens.', '同一个桩头在拍摄：镜头旁边六个小孔透出柔和的白光。'),
  hardware: L('The camera’s power runs through a supervisor: no LED current, no light seen by its photodiode, or a blocked window, and the camera stays off. App software can’t override it.',
    '摄像头的供电要经过一个监控电路：LED 没有电流、光电二极管没检测到光、或者窗口被挡住，摄像头就不供电。app 软件改不了这条规则。'),
};

/* ---------- 10. Hearing Check-in ---------- */
export const HEARING = {
  eyebrow: L('The signature feature', '招牌功能'),
  heading: L('Hearing Check-in.', 'Hearing Check-in。'),
  lede: L('Arden notices when you ask people to repeat themselves more often, and suggests a hearing test, before you would notice it yourself.',
    'Arden 会留意你是不是越来越常请别人“再说一遍”，然后建议你去做个听力测试，往往比你自己察觉得更早。'),
  nudge: L('A nudge to test, not a diagnosis.', '它只提醒你去测，不做诊断。'),
  counts: [L('What it counts', '它记录什么'), L('Requests like “what?”, “sorry?” or “say that again” in your own voice, per hour of conversation, alongside how loud the room was.', '你自己说出的“什么？”“不好意思？”“再说一遍”之类的话，按每小时对话来算，同时记下当时环境有多吵。')],
  you: [L('How it knows it’s you', '它怎么知道是你'), L('A voice accelerometer in the right nose pad feels your own speech through the bone. It gates the microphones’ on-device analysis.', '右侧鼻托里的语音加速度计通过骨传导感觉到你自己在说话，只有这时，麦克风的本地分析才会启动。')],
  never: [L('What it never stores', '它从不保存什么'), L('Other people’s words, conversation audio and transcripts. Only counts, conversation time and sound-level summaries are kept.', '别人说的话、对话录音和文字记录。只保留次数、对话时长和环境音量的汇总。')],
  sensorNote: L('The voice accelerometer is a proposed part. It isn’t in the 59.61 g budget yet, and needs a supplier, mechanical coupling and validation.', '语音加速度计还只是方案中的零件，没有算进 59.61 克的重量预算，供应商、机械耦合和验证都还没做。'),
  callout: L('Voice accelerometer (proposed)', '语音加速度计（方案中）'),
  phoneAlt: L('The companion app’s Health tab: Hearing Check-in, with an 8-week trend of repeat requests rising from about 1 to 2.8 per hour. Sample data.', '配套 app 的 Health 页：Hearing Check-in，8 周趋势显示请人重复的次数从每小时约 1 次升到 2.8 次。示例数据。'),
  sample: L('Sample data in the app, authored, not collected.', 'app 里是编写的示例数据，不是采集来的。'),
  priorTitle: L('What already exists', '已经有的东西'),
  prior: [
    L('AirPods Pro have a five-minute hearing test, but you have to decide to take it.', 'AirPods Pro 有 5 分钟的听力测试，但得你自己想起来去做。'),
    L('Nuance Audio glasses and Meta’s Conversation Focus make voices louder. They don’t watch for change.', 'Nuance Audio 眼镜和 Meta 的 Conversation Focus 负责把人声放大，不会留意听力的变化。'),
    L('Passive detection exists only as research: in a Google Research preprint, simple keyword spotting scored an F1 of 0.39. So Arden doesn’t claim to detect hearing loss.', '被动检测目前只在研究里出现：Google Research 的一篇预印本中，简单的关键词识别 F1 只有 0.39。所以 Arden 不说自己能“检测听力下降”。'),
  ],
  priorSources: [
    {name: 'Apple', href: 'https://support.apple.com/en-us/120991'},
    {name: 'arXiv 2507.23590', href: 'https://arxiv.org/pdf/2507.23590'},
  ],
  newTitle: L('What’s new', '新在哪里'),
  newText: L('Counting repeat requests passively, over weeks, on something you already wear, and closing the loop with the hearing test and Health.', '在你本来就戴着的东西上，用几周时间被动地记录请人重复的次数，再把它和听力测试、健康 app 串成一个闭环。'),
  why: [
    {text: L('About 430 million people need rehabilitation for disabling hearing loss.', '约 4.3 亿人因听力损失需要康复。'), source: {name: 'WHO', href: 'https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss'}},
    {text: L('Of US adults 20–69 who could benefit from hearing aids, about 16% have used them.', '美国 20–69 岁可能受益于助听器的成年人里，只有约 16% 用过。'), source: {name: 'NIDCD', href: 'https://www.nidcd.nih.gov/health/statistics/quick-statistics-hearing'}},
    {text: L('People wait about seven years, on average, before doing something about it.', '人们平均要拖约 7 年才会去处理。'), source: {name: 'Montgomery County, MD', href: 'https://montgomerycountymd.gov/HHS-Program/Resources/Files/A%26D%20Docs/COA/Helpful%20Resources/Hearing%20loss%20fact%20sheet%202020.pdf'}},
  ],
};

/* ---------- 11. worn ---------- */
export const WORN = {
  eyebrow: L('Worn', '戴上'),
  heading: L('On a face, it reads as glasses.', '戴在脸上，看起来就是一副眼镜。'),
  label: L('AI-generated image; the glasses are from my 3D model.', 'AI 生成的图片；眼镜来自我的 3D 模型。'),
  // one photo per finish (DESIGN.finishes ids)
  finish: {'try-on-natural': 'natural', 'try-on-black': 'black', 'try-on-desert': 'desert'},
  alts: {
    'try-on-natural': L('A woman on a city street in overcast light, wearing Arden in Natural Titanium with graphite temples.', '阴天的城市街道上，一位女士戴着原色钛金属的 Arden，镜腿是石墨色。'),
    'try-on-black': L('A man by a café window, mid-conversation, wearing Arden in Black Titanium; the temple and its sleeve are visible.', '咖啡馆窗边，一位男士正在聊天，戴着黑色钛金属的 Arden，看得见镜腿和套筒。'),
    'try-on-desert': L('A young man looking straight at the camera with a calm smile, wearing Arden in Desert Titanium.', '一位年轻男士正对镜头，淡淡地笑着，戴着沙漠色钛金属的 Arden。'),
  },
};

/* ---------- 12. the app ---------- */
export const APP = {
  eyebrow: L('The app', 'app'),
  heading: L('An app for the glasses, not the camera.', '为眼镜做的 app，​不是为摄像头。'),
  lede: L('Three tabs, with the batteries and whatever is live at a glance. Captures move to the Library by themselves while Arden charges.',
    '三个标签页，​电量和正在进行的事一眼就看得到。​Arden 充电时，​拍摄内容会自己移进 Library。'),
  // two stills beside the embed (scripts/capture-arden-screens.mjs: lock, sizes)
  stills: [
    {name: 'lock', text: L('The Lock Screen and the Dynamic Island show what Arden is doing, without opening the app.', '锁屏和灵动岛会显示 Arden 正在做什么，​不用打开 app。'),
      alt: L('The iPhone Lock Screen while Arden records: a Live Activity with “Recording 0:13” and a Stop button.', 'Arden 录像时的 iPhone 锁屏：实时活动显示“Recording 0:13”和停止按钮。')},
    {name: 'sizes', text: L('The Sizes board: every widget, Live Activity and Dynamic Island state, at every size.', 'Sizes 面板：​每种小组件、实时活动和灵动岛状态，​各种尺寸都在。'),
      alt: L('The Sizes board: Live Activity presentations and Lock Screen widgets for Arden, side by side.', 'Sizes 面板：Arden 的实时活动和锁屏小组件并排展示。')},
  ],
  tasksTitle: L('Things to try', '可以试试'),
  tasks: [
    L('Press the capture control on the glasses and watch the Lock Screen.', '按一下眼镜上的拍摄键，​看锁屏。'),
    L('Open the Sizes board.', '打开 Sizes 面板。'),
    L('Simulate a week for Hearing Check-in.', '为 Hearing Check-in 模拟一周。'),
    L('Put Arden in the case and watch the captures move.', '把 Arden 放进盒子，​看拍摄内容自己移过去。'),
  ],
  note: L('It runs in your browser; nothing is sent anywhere.', '只在你的浏览器里运行，​不往任何地方发数据。'),
  reset: L('Reset the prototype', '重置原型'),
  newTab: L('Open it in a new tab', '在新标签页打开'),
  openPhone: L('Open the prototype', '打开原型'),
  phoneNote: L('On a phone it opens full screen.', '在手机上会全屏打开。'),
  frameTitle: L('Arden companion prototype, live and clickable', 'Arden 配套 app 原型，可以直接点'),
  shotAlt: L('The companion app’s Arden tab: “Jay’s Arden · Connected”, Glasses 81% with about 3 h 40 min left, Case 96%, and the three tabs.', '配套 app 的 Arden 页：“Jay’s Arden · Connected”，眼镜 81%、约 3 小时 40 分钟，盒子 96%，下面是三个标签页。'),
  system: L('System font, with Inter standing in on the web. SVG icons.', '系统字体，​网页上用 Inter 代替。​图标是 SVG。'),
};

/* ---------- 13. evaluation ---------- */
export const EVAL = {
  eyebrow: L('Evaluation', '评估'),
  heading: L('What’s estimated, what’s expected, what’s measured.', '哪些是估算，​哪些是预期，​哪些是实测。'),
  estimated: [
    [L('Weight', '重量'), L('59.61 g with reserve; about 60.6–62.6 g with prescription inner lenses; target 52 g', '含余量 59.61 克；含处方内镜约 60.6–62.6 克；目标 52 克')],
    [L('Mixed-use battery', '混合使用续航'), L('4.4 h; 3.6 h at 80% health', '4.4 小时；电池健康 80% 时 3.6 小时')],
    [L('Indicator brightness', '指示灯亮度'), L('30–150 cd/m² indoors, 1,500–6,000 outdoors', '室内 30–150 cd/m²，室外 1,500–6,000')],
    [L('Skin temperature', '皮肤接触温度'), L('Throttle at 40 °C, stop high-power features by 42 °C', '40 °C 降频，42 °C 前停止高功耗功能')],
  ],
  planTitle: L('The tests I’ll run', '我接下来要做的测试'),
  plan: [
    L('Five people.', '5 个人。'),
    L('Try-on comfort, 1–7.', '试戴舒适度，1–7 分。'),
    L('“Did you notice the camera?” from 1.5 m, with the light off and on.', '在 1.5 米外问“你注意到摄像头了吗？”，指示灯分别关和开。'),
    L('HUD legibility outdoors.', '户外能不能看清显示内容。'),
    L('Hearing Check-in: can people explain, in their own words, what it counts and what it doesn’t?', 'Hearing Check-in：大家能不能用自己的话说清楚它记录什么、不记录什么？'),
  ],
  hypTitle: L('Hypotheses to check', '待验证的假设'),
  hypotheses: [
    L('Most people don’t notice the camera at 1.5 m when the light is off, and do when it’s on.', '指示灯不亮时，大多数人在 1.5 米外注意不到摄像头；亮起时能注意到。'),
    L('Comfort scores close to their own glasses, despite the 59.61 g.', '尽管有 59.61 克，舒适度评分接近他们自己的眼镜。'),
    L('People read the Check-in card as a reminder to test, not as a result.', '大家会把签到卡片理解成“该去测一下”，而不是一个检测结果。'),
  ],
  measuredTitle: L('Jay runs these next.', 'Jay 接下来会做这些测试。'),
  measuredRows: [
    [L('Try-on comfort', '试戴舒适度'), '— / 7'],
    [L('Noticed the camera, light off / on', '注意到摄像头：灯灭 / 灯亮'), '— / —'],
    [L('HUD legible outdoors', '户外看清显示内容'), '— / 5'],
    [L('Explained Check-in correctly', '正确解释 Hearing Check-in'), '— / 5'],
  ],
  measuredNote: L('Each result will sit here, next to the estimate it checks.', '每条结果都会放在这里，挨着它要验证的估算。'),
  slot: L('Results, not collected yet', '结果（还没收集）'),
};

/* ---------- 14. still open ---------- */
export const OPEN = {
  eyebrow: L('Still open', '还没解决的'),
  heading: L('What I haven’t solved.', '还没解决的问题。'),
  items: [
    [L('Weight', '重量'), L('59.61 g with reserve, 7.61 g over target; about 60.6–62.6 g with prescription inner lenses. Lens mass and bonding still need validation. Every cut to 52 g trades something.', '含余量 59.61 克，比目标多 7.61 克；含处方内镜约 60.6–62.6 克。镜片重量和胶合工艺仍待验证。每一种减重办法都要拿别的去换。')],
    [L('The waveguide', '波导片'), L('The heaviest part, and the biggest cost and yield risk.', '最重的零件，​也是成本和良率风险最大的。')],
    [L('Battery against the display', '续航和显示的取舍'), L('About an hour of continuous translation.', '持续翻译只有大约 1 小时。')],
    [L('Microphone privacy', '麦克风隐私'), L('The light covers the camera, not the microphones.', '指示灯管得了摄像头，​管不到麦克风。')],
    [L('Prescriptions', '处方镜片'), L('An optician-fitted prescription inner lens is bonded into the stack, with no visible second lens. Prescription range, bonding, replacement and final weight still need validation.', '处方内镜由配镜师验配并胶合进叠层，外观上看不到第二片镜片。处方范围、胶合工艺、更换流程和最终重量仍待验证。')],
  ],
  legendTitle: L('How claims are labeled', '结论怎么标注'),
  legend: [
    ['Sourced', L('public sources, linked', '公开资料，附链接')],
    ['Estimated', L('my calculations, with stated assumptions', '我的计算，假设写明')],
    ['Hypothesis', L('expected, not yet checked', '预期，还没验证')],
    ['Measured', L('from the real tests, still empty', '来自真实测试，目前还空着')],
  ],
};

/* ---------- round 2: the opening, "Put them on", and You / Them (site-spec/WORLD-ARDEN.md, Round 2) ---------- */

/** The pinned opening: four text beats over the 120-frame film (frame numbers are 1-based, inclusive). */
export const OPENING = {
  beats: [
    {from: 1, to: 30, size: 'xl', text: L('Arden.', 'Arden。')},
    {from: 35, to: 75, size: 'xl', text: L('Glasses first.', '先是一副眼镜。')},
    {from: 92, to: 106, size: 'l', text: L('A display only you can see.', '一块只有你​看得见的​显示屏。')},
    {from: 108, to: 120, size: 'l', text: L('A light that tells people around you.', '一盏灯，​让身边的人​知道。')},
  ],
  scroll: L('Scroll', '向下滚动'),
  filmLabel: L('A close-up of the titanium brow that pulls back to show Arden from the front, the right lens glowing faintly and the capture light softly lit.',
    '先是钛金属眉线的特写，镜头慢慢拉远，转到 Arden 的正面；右镜片泛着一点微光，拍摄指示灯也柔和地亮着。'),
  worn: L('On a face, it reads as glasses. To you and to everyone around you.', '戴在脸上，​它就是一副眼镜。​对你是，​对身边每个人也是。'),
};

/** The problem as three image-led cards: one plain sentence each, with its label. */
export const PROBLEM_CARDS = {
  heavy: {
    title: L('They’re heavy.', '太重。'),
    text: L('Shipped AI glasses weigh 44 to 69 g.', '已上市的 AI 眼镜重 44 到 69 克。'),
  },
  camera: {
    title: L('The camera makes people tense.', '摄像头让旁人紧张。'),
    text: L('In sensitive settings, 65–90% of bystanders said they would act against it.', '在敏感场合，65%–90% 的旁人说会采取防御行动。'),
    note: L('CHI 2026, 525 people. Meta now disables the camera when its light is covered.', 'CHI 2026，525 人。Meta 现在的做法是：灯被遮住，摄像头就停用。'),
    alt: L('A young man across the table, looking at you, wearing Arden. The camera in the end-piece is barely visible.', '坐在对面的年轻男士看着你，戴着 Arden，桩头里的摄像头几乎看不出来。'),
  },
  app: {
    title: L('The app serves the camera.', 'app 围着摄像头转。'),
    text: L('Companion apps open on your captures. The glasses come second.', '配套 app 一打开就是拍摄内容，​眼镜本身排在后面。'),
    camera: L('Camera first', '以拍摄为先'),
    arden: L('Arden', 'Arden'),
    alt: L('Two wireframe phones. On the left, a companion app built around a viewfinder and a grid of captures. On the right, Arden’s Glasses tab: the glasses, their battery and the case’s, and quick controls.',
      '两台线框手机。左边的配套 app 围着取景框和一格格拍摄内容；右边是 Arden 的眼镜页：眼镜本身、眼镜和充电盒的电量、快捷控制。'),
  },
};

/** You / Them: the same moment, seen by the wearer and by the person across from them. */
export const SIDES = {
  label: L('Whose view', '谁的视角'),
  you: L('You', '你'),
  them: L('Them', '对面的人'),
  display: {
    them: L('Nothing to read. A faint glow at most.', '什么也读不到，​最多看到一点微光。'),
    themAlt: L('Arden seen from across the table, with a faint glow in the right lens.', '从对面看过去的 Arden，右镜片里只有一点微光。'),
    translation: L('They read your words in their language, on your phone.', '对方在你的手机上，​用自己的语言​读你说的话。'),
    translationAlt: L('The app’s “Show to the other person” screen: your reply, translated into Japanese, in large type.', 'app 里的“Show to the other person”页面：你的回答翻译成日语，大字显示。'),
  },
  capture: {
    heading: L('The same moment, from both sides.', '同一个时刻，​两边看。'),
    recording: L('Recording', 'Recording'),
    finish: L('Press capture to finish', 'Press capture to finish'),
    youAlt: L('The lens view while recording: a dot and “Recording 0:04” in the display.', '录像时的镜片视角：显示屏里是一个圆点和“Recording 0:04”。'),
    them: L('A soft light, not a red dot.', '一盏柔和的灯，​不是一个红点。'),
    themAlt: L('The end-piece from the front, with the capture light softly lit beside the camera.', '从正面看桩头，摄像头旁边的拍摄指示灯柔和地亮着。'),
  },
  hearing: {
    them: L('Nothing you say to them is stored.', '你对 TA 说的话，​一句也不会​存下来。'),
    themText: L('Only the wearer’s own voice is counted, told apart by a proposed accelerometer in the right nose pad.', '只统计佩戴者自己的声音，靠右侧鼻托里的加速度计（方案中）来分辨。'),
    themAlt: L('A man mid-conversation, seen from across the table, wearing Arden.', '从对面看过去，一位男士正在说话，戴着 Arden。'),
  },
};

/* ---------- v3 (site-spec/WORLD-ARDEN-V3.md): a day with Arden, how it charges, the interactive inside ---------- */

/** A day with Arden. Existing product HUD copy stays English; new beats include Chinese. */
export const DAY = {
  heading: L('A day with Arden', '和 Arden 过一天'),
  putOn: L('Put them on.', '戴上看看。'),
  putOnLine: L('Then spend a day in them. Keep scrolling.', '然后戴着它过一天。继续往下滚。'),
  ai: L('Scenes are AI-generated.', '场景图由 AI 生成。'),
  timeline: L('The day', '这一天'),
  goTo: (time, name) => L(`Go to ${time}, ${name}`, `跳到 ${time}，${name}`),
  sound: {on: L('Sound on', '声音已开'), off: L('Sound off', '声音已关')},
  scenes: [
    {id: 'walk', time: '08:12', min: 492, name: L('Walk', '步行'), scene: 'navigation', focus: '50% 55%', focusM: '46% 50%',
      caption: L('Directions sit in the corner of your right lens. Your eyes stay on the street.', '导航只占右镜片的一角，​眼睛还在看路。')},
    {id: 'cafe', time: '10:30', min: 630, name: L('Café', '咖啡馆'), scene: 'translation', focus: '50% 45%', focusM: '62% 45%', sides: true,
      caption: L('The barista speaks Spanish. You read English, in your lens.', '店员说西班牙语，​你在镜片里读英文。'),
      them: L('Across the counter, they see glasses. To show your reply, you turn your phone around.', '柜台对面的人只看到一副眼镜。​想让对方读你的回答，​就把手机转过去。')},
    {id: 'music', time: '11:40', min: 700, name: L('Music and a message', '音乐与消息'), timelineName: L('Music', '音乐'), scene: 'navigation', focus: '50% 55%', focusM: '46% 50%',
      caption: L('Music keeps you company. A friend’s message appears at a glance.', '边走边听歌，朋友的消息抬眼就能看到。')},
    {id: 'sun', time: '12:20', min: 740, name: L('Sun', '阳光'), scene: 'navigation', focus: '50% 40%', focusM: '60% 40%', sides: 'sun',
      caption: L('In strong sun, the lenses tint by themselves.', '阳光一强，​镜片自己就变深。'),
      them: L('From outside, they darken like sunglasses.', '从外面看，​它像墨镜一样变深。')},
    {id: 'park', time: '13:05', min: 785, name: L('Park', '公园'), scene: 'capture', focus: '50% 50%', focusM: '50% 50%', sides: true,
      caption: L('Press for a photo. Hold to record.', '按一下拍照，长按录像。'),
      them: L('A soft light, not a red dot. It gets brighter in the sun.', '一盏柔和的灯，不是红点。​阳光下会更亮。')},
    {id: 'ask', time: '16:40', min: 1000, name: L('Ask', '提问'), scene: 'assistant', focus: '50% 40%', focusM: '44% 40%',
      caption: L("Squeeze and hold the temple, or say 'Hey Arden'", '捏住镜腿，或说“Hey Arden”')},
    {id: 'dinner', time: '20:15', min: 1215, name: L('Dinner', '晚饭'), scene: 'boost', focus: '50% 50%', focusM: '55% 50%', sides: true,
      caption: L('Hearing Check-in counts how often you ask “what?”. Only your voice.', 'Hearing Check-in 记下你说了几次“什么？”。​只数你自己的声音。'),
      them: L('Nothing they say is stored.', '对方说的话，​一句也不会存下来。')},
    {id: 'case', time: '22:00', min: 1320, name: L('Case', '充电'),
      caption: L('Back in the case for the night. Long videos finish syncing faster while Arden charges.', '晚上放回盒子里。Arden 充电时，长视频能更快完成同步。')},
  ],
  // the HUD, in the app's own words
  hud: {
    playing: L('♪ Playing · open-ear speakers', '♪ 播放中 · 开放式扬声器'),
    paused: L('♪ Paused · open-ear speakers', '♪ 已暂停 · 开放式扬声器'),
    message: L('Mia: Running 5 min late', 'Mia：我会晚到 5 分钟'),
    turn: 'Turn right', street: 'onto Linden Street', arrived: 'Arrived', arrivedSub: 'Linden Street',
    translated: 'TRANSLATED FROM SPANISH',
    lines: [['Hola, ¿qué te pongo?', 'Hi, what can I get you?'], ['¿Para tomar aquí o para llevar?', 'For here or to go?']],
    recording: 'Recording', finish: 'Press capture to finish', saved: 'Video saved', library: 'In your Library',
    listening: 'Listening…', answer: 'Japanese maple', answerSub: 'Leaves turn red in autumn.', more: 'Squeeze to ask more',
    boost: 'Conversation Boost on', boostSub: 'Listening toward the person ahead.', night: 'Put Arden in the case to charge.', low: 'Glasses 10%', lowTime: 'about 30 min',
    sun: 'Bright sun', tint: n => `Tint ${n}% · auto`,
  },
  sunLight: L('Sunlight', '阳光'), shade: L('Shade', '阴凉'), fullSun: L('Full sun', '烈日'),
  tintOut: L('Lens tint', '镜片深浅'),
  capture: L('Capture', '拍摄'),
  photoSynced: L('Photo synced · just now', '照片已同步 · 刚刚'),
  videoSynced: L('Video synced · just now', '视频已同步 · 刚刚'),
  captureHint: L('Click, or Space', '点一下，或按空格'),
  squeeze: L('Squeeze and hold', '按住镜腿'),
  squeezeHint: L('Hold for a moment', '按住一会儿'),
  light: L('Light around you', '周围的光'),
  dim: L('Dim', '暗'), sun: L('Sun', '阳光'),
  indicator: L('Indicator', '指示灯'),
  check: {
    title: 'Hearing Check-in',
    marks: ['what?', 'sorry?', 'say again?', 'what?', 'sorry?'],
    chart: L('Asked to repeat, per hour · 8 weeks', '每小时请人重复的次数 · 8 周'),
    sample: L('Sample data', '示例数据'),
    card: 'Conversations in noisy places seem harder lately.',
    cardSub: 'Take a hearing test with AirPods Pro.',
    themSub: L('Only your own voice is counted, told apart by a proposed accelerometer in the nose pad.', '只数你自己的声音，​靠鼻托里的加速度计（方案中）来分辨。'),
  },
  themAlts: {
    cafe: L('Across the counter: a young man wearing Arden, looking at you.', '柜台对面：一位戴着 Arden 的年轻男士看着你。'),
    park: L('The end-piece from the front, with the capture light softly lit beside the camera.', '从正面看桩头，摄像头旁边的拍摄指示灯柔和地亮着。'),
    sun: L('Arden from the front, the lenses darkening.', 'Arden 正面，镜片正在变深。'),
    phone: L('The app’s “Show to the other person” screen: your reply in Spanish, in large type.', 'app 里的“Show to the other person”页面：你的回答用西班牙语大字显示。'),
  },
  sceneAlts: {
    music: L('A tree-lined street, with music playing and a brief message from Mia in the display.', '林荫街道上，音乐正在播放，镜片里短暂显示 Mia 的消息。'),
    walk: L('A sunny street lined with trees, seen through Arden, with walking directions in the corner of the view.', '透过 Arden 看到的林荫街道，视野一角是步行导航。'),
    cafe: L('A café counter, seen through Arden, with an English subtitle in the corner of the view.', '透过 Arden 看到的咖啡馆柜台，视野一角是英文字幕。'),
    sun: L('A sunlit street, seen through Arden as the lenses tint.', '透过 Arden 看到的阳光街道，镜片正在变深。'),
    park: L('A park path at golden hour, seen through Arden.', '透过 Arden 看到的黄昏公园小路。'),
    ask: L('A tree with red-tinged leaves, seen through Arden.', '透过 Arden 看到的一棵叶子泛红的树。'),
    dinner: L('A dinner table across from a friend, seen through Arden.', '透过 Arden 看到的晚餐桌和对面的朋友。'),
  },
};

/** How it charges. Numbers: ARCHITECTURE.md (case 5.55 Wh, about four refills); the timing is an estimate. */
export const CHARGE = {
  eyebrow: L('How it charges', '怎么充电'),
  heading: L('Put them in the case.', '放进盒子里。'),
  lede: L('Fold them: a magnet in the saddle seats the bridge on its contacts, and two soft pockets hold the lenses.', '折起来放进去：​鞍座里的磁铁把鼻梁吸到触点上，​两个软质凹槽托住镜片。'),
  drag: L('Drag the glasses down into the case', '把眼镜往下拖进盒子'),
  button: L('Put them in the case', '放进盒子'),
  out: L('Take them out', '拿出来'),
  glasses: L('Glasses', '眼镜'), case: L('Case', '盒子'),
  // how long the glasses last at this charge: "about 3 h 40 min", and "about 4.4 h" when full (Estimate)
  lasts: (pct, hours) => {
    if (pct >= 100) return L(`about ${hours} h`, `约 ${hours} 小时`);
    const mins = Math.round(pct / 100 * hours * 60 / 5) * 5, h = Math.floor(mins / 60), m = mins % 60;
    return L(`about ${h ? `${h} h` : ''}${h && m ? ' ' : ''}${m ? `${m} min` : ''}`, `约 ${h ? `${h} 小时` : ''}${h && m ? ' ' : ''}${m ? `${m} 分钟` : ''}`);
  },
  facts: [
    [L('Magnet', '磁铁'), L('in the saddle pulls the bridge into place.', '藏在鞍座里，把鼻梁吸到位。')],
    [L('Pads', '触点'), L('under the bridge take the power. The front flex carries it to both temples.', '在鼻梁下方取电，​前框柔性板再把电送到两条镜腿。')],
    [L('Insert', '内衬'), L('holds the lenses in two soft pockets.', '用两个软质凹槽托住镜片。')],
    [L('USB-C', 'USB-C'), L('charges the case.', '给盒子充电。')],
  ],
  note: L('About four refills from the case’s 5.55 Wh. Full in about 75 minutes.', '盒子 5.55 Wh，大约能充满四次。充满约 75 分钟。'),
  contacts: L('Two gold pads under the bridge meet spring contacts on a saddle in the case. A magnet seats them.', '鼻梁下方两块镀金触点，对上盒里鞍座上的弹簧触点，​磁铁把它们吸到位。'),
  contactsAlt: L('A close-up of the gold pads under the bridge resting on the spring contacts of the case’s saddle.', '鼻梁下方的镀金触点落在盒内鞍座弹簧触点上的特写。'),
  // callouts on the case render (positions from renders/charge/charge.json)
  callouts: {contacts: L('Saddle: contacts and a magnet', '鞍座：触点和磁铁'), usb: L('USB-C', 'USB-C')},
  stageAlt: L('The open charging case, empty, with Arden above it.', '打开的空充电盒，Arden 在它上方。'),
  seatedAlt: L('Arden folded in the open charging case’s insert, the status light on.', 'Arden 折好放在打开的充电盒内衬里，状态灯亮着。'),
  charging: L('Charging', '正在充电'), full: L('Charged', '已充满'),
};

/** The inside, interactive: filters, cards, the signal path. */
export const INSIDE_X = {
  chips: {power: L('Power path', '供电路径'), light: L('Light path', '光路'), sensors: L('Sensors', '传感器')},
  chipParts: {power: ['charge_pads', 'battery', 'board', 'flex', 'dimming_layer', 'focus_layer', 'capture_indicator'], light: ['projector', 'lens', 'camera', 'capture_indicator', 'dimming_layer', 'focus_layer', 'rx_lens'], sensors: ['mics', 'ambient_light', 'imu', 'wear_sensor', 'voice_accel', 'eye_sensors', 'squeeze_sensor']},
  showNumbers: L('Show the numbers', '显示数字'),
  hideNumbers: L('Hide the numbers', '收起数字'),
  signal: L('Press the capture control', '按一下拍摄键'),
  signalAgain: L('Press it again', '再按一次'),
  signalText: L('No light, no camera. The camera’s power runs through the light, and software can’t override it.', '灯不亮，摄像头就不工作。​摄像头的电源要经过指示灯，​软件改不了。'),
  signalAlt: L('The camera end-piece with the capture light on.', '拍摄指示灯亮起的摄像头桩头。'),
  camera: L('Camera and light', '摄像头和指示灯'),
};

/** After the day: the display in one block, Hearing Check-in's evidence in another. */
export const AFTER_DAY = {
  displayTitle: L('The display', '显示'),
  display: L('A micro-LED projector and a waveguide put text in the right lens, for *only you*. Sized for JBD’s Hummingbird I: 0.4 cc, 1 g.',
    '微型 LED 投影加波导片，​把文字放进右镜片，​*只有你*看得见。​按 JBD Hummingbird I 设计：0.4 cc，1 克。'),
  hearingTitle: L('Why Hearing Check-in', '为什么做 Hearing Check-in'),
  hearing: L('About 430 million people need care for hearing loss, and most wait about seven years.',
    '全球约 4.3 亿人需要听力康复，​大多数人要等七年左右才去处理。'),
};
