// Atelier (D2), the words and facts of the case, shared by the gallery world and its plain reading mode, in English and
// Chinese: every text is L('English', '中文') and pages pick one with useCaseLang().t (product/i18n.jsx).
// Sources: cases/d2-atelier/BRIEF.md and d2-atelier-prototype/README.md + DESIGN.md + src/artworks.json (Oct 19, 2026;
// round 2, after a model-assisted design review). Every number comes from the prototype or the brief. Research is still
// a plan: illustrator pain points are labeled Hypothesis until Jay's interviews on test day.
import {L} from '../../i18n';
import {art, largestSharp, printCheck, sizes} from './model';

export const HERO = {
  title: 'Atelier',
  outcome: L('A print studio for illustrators: from a finished painting to a published, shareable print in five named steps, with print quality and earnings checked before anything goes live.',
    '给插画师的印品工作室。从一幅画好的画，到一件发布出去、能分享的印品，一共五步，每步都有名字。上架之前，先核对印刷质量和收入。'),
  chips: [L('Solo: research, product and visual design, code', '独立完成：研究、产品与视觉设计、代码'), L('October 2026', '2026 年 10 月'), L('iOS concept', 'iOS 概念设计'), L('Not yet tested with artists', '还没找画师测试')],
};

export const NUMBERS = [
  {value: '22', label: L('Screens in the coded prototype', '代码原型的界面'), note: L('Artist and collector sides, checkout included, all clickable', '画师端和藏家端，含结账流程，全部可点')},
  {value: '8', label: L('Paintings of mine as the catalog', '全是我自己的画'), note: L('No stock art and no generated images', '没有图库素材，也没有 AI 图')},
  {value: '300', unit: 'dpi', label: L('Floor for every print size', '每个尺寸的下限'), note: L('A size below it can’t be sold', '低于它，不能卖')},
];

/** The eight paintings as the prototype lists them (artworks.json), in the order they hang on the gallery wall:
    the drop painting first, the collector's painting last. `focus` is a point worth a close look, as fractions of
    the image (the press's loupe starts there). Titles stay English; `zh` is a Chinese gloss shown beside them. */
const HANG = [
  {id: 'blue-hour', zh: '蓝调时刻', about: L('A winter village at dawn, painted in violet and rose.', '黎明时分的冬日村庄，用紫色和玫瑰色画成。'), focus: [.52, .74]},
  {id: 'quiet-gate', zh: '静谧之门', about: L('A stone gate beneath a dense forest canopy.', '茂密林冠下的一座石门。'), focus: [.56, .26]},
  {id: 'spring', zh: '春天停留的地方', about: L('Cherry trees in bloom above an island village.', '海岛村落上方盛开的樱花树。'), focus: [.4, .3]},
  {id: 'between', zh: '两界之间', about: L('A ruined archway in a mountain landscape.', '山间的一道残破拱门。'), focus: [.62, .5]},
  {id: 'return', zh: '归处', about: L('Afternoon light across a temple courtyard.', '午后的光洒过寺院庭院。'), focus: [.3, .68]},
  {id: 'red-planet', zh: '红色星球', about: L('A creature crossing the red terrain of Mars.', '一只巨兽走过火星的红土。'), focus: [.42, .34]},
  {id: 'clouds', zh: '云上', about: L('A vast tree rising above a bank of clouds.', '一棵巨树高出云海。'), focus: [.46, .3]},
  {id: 'signal', zh: '远方的信号', about: L('A lone traveler approaching a distant beacon.', '独行的旅人走向远处的光柱。'), focus: [.56, .5]},
];
export const WORKS = HANG.map(h => {
  const a = art.find(x => x.id === h.id);
  return {...a, ...h, top: largestSharp(a)};
});
export const workOf = id => WORKS.find(w => w.id === id);
/** A painting's title inside running text: as is in English, 《Title》 in Chinese. */
export const named = (a, zh) => (zh ? `《${a.title}》` : a.title);

/** Base images (the embedded prototype's copies) and the original files at their own pixel size. */
export const wallSrc = id => `/proto/atelier/art/${id}.webp`;
export const fullSrc = id => `/assets/product/atelier/world/full/${id}.webp`;
export const thumbSrc = id => `/assets/product/atelier/thumbs/${id}.webp`;

/** Paper size in inches, in the painting's orientation, as the prototype writes it: "10 × 8". */
export const inches = (a, s) => { const r = printCheck(a, s); return `${r.w} × ${r.h}`; };
export const px = n => n.toLocaleString('en-US');
/** "in" after a size, in either language. */
export const IN = L('in', '英寸');
export {sizes};

/** The prototype's sentence for a size (model.checkSentence), in either language. */
export function checkLine(a, s, zh) {
  const r = printCheck(a, s);
  if (!zh) return `${r.w} × ${r.h} in · ${r.dpi} dpi. ${r.ok ? 'Sharp at this size, with the full artwork and white border.' : 'Requires 300 dpi. Choose a smaller size or upload a larger original.'}`;
  return `${r.w} × ${r.h} 英寸，${r.dpi} dpi。${r.ok ? '印得清楚，画面完整，带白边。' : '需要 300 dpi。请选更小的尺寸，或上传更大的原图。'}`;
}
/** The prototype's two papers. */
export const PAPER = {matte: L('Studio matte', '哑光纸'), cotton: L('Cotton rag', '棉浆纸')};

// Round 2 of the prototype: five named steps ("Step n of 5") with a saved-draft status, then publish and share.
export const STEPS = [
  {id: 'upload', screen: 'upload', label: L('Artwork', '作品'), title: L('Start from the finished piece', '从画好的作品开始'),
    alt: L('Step 1 of 5, Artwork: a grid of eight paintings with their pixel sizes', '第 1 步（共 5 步），作品：八幅画排成网格，每幅标着像素尺寸'),
    text: L('A drop begins with the original file, not a product form. The sample archive is eight of my own paintings, each listed with its real pixel size. Every step is named, and the draft saves as you go.',
      '上新从原图开始，不从商品表单开始。示例作品库是我自己的八幅画，每幅都标着真实的像素尺寸。每一步都有名字，草稿边做边存。')},
  {id: 'check', screen: 'check', label: L('Print quality', '印刷质量'), title: L('Check the print before anything else', '先检查印刷效果'),
    alt: L('Step 2 of 5, Print check: offer prints up to 10 by 8 inches, sharp at 300 dpi, with the details folded away', '第 2 步（共 5 步），印前检查：最大可卖 10 × 8 英寸，300 dpi 下印得清楚，细节默认收起'),
    text: L('Atelier reads the file’s pixels and leads with the answer. The Blue Hour is 4,096 × 2,160 px, so it can be sold up to 10 × 8 in at 300 dpi, whole, with a white border. The ruler and the dpi behind each size open on request.',
      'Atelier 读文件的像素，先给结论。《The Blue Hour》是 4,096 × 2,160 px，按 300 dpi 能卖到 10 × 8 英寸，画面完整，带白边。标尺和每个尺寸对应的 dpi，想看再展开。')},
  {id: 'sizes', screen: 'sizes', label: L('Sizes and paper', '尺寸与纸张'), title: L('Offer only sizes that print well', '只上架印得好的尺寸'),
    alt: L('Step 3 of 5, Sizes and paper: 3 by 2, 5 by 3, 7 by 5 and 10 by 8 inches, with 7 by 5 and 10 by 8 offered', '第 3 步（共 5 步），尺寸与纸张：3 × 2、5 × 3、7 × 5、10 × 8 英寸，其中上架 7 × 5 和 10 × 8'),
    text: L('Only sizes that passed the check are on the list, the paper turned to match the painting. Studio matte is included; cotton rag adds $4 to the production cost.',
      '列表里只有通过检查的尺寸，纸张方向也随画面转好。哑光纸已含在内；棉浆纸的制作成本多 $4。')},
  {id: 'price', screen: 'price', label: L('Price', '定价'), title: L('See what you keep before you publish', '在发布之前，先看到手多少'),
    alt: L('Step 4 of 5, Set your price: $38 for 10 by 8, minus $11 print and paper and $3.34 fee, you keep $23.66', '第 4 步（共 5 步），设定价格：10 × 8 卖 $38，减去印刷和纸张 $11、手续费 $3.34，到手 $23.66'),
    text: L('At $38 for a 10 × 8: $11 for print and paper, $3.34 in fees (8% + $0.30), $23.66 to the artist. Other sizes are priced so the artist keeps the same amount.',
      '一张 10 × 8 卖 $38：印刷和纸张 $11，手续费 $3.34（8% + $0.30），画师到手 $23.66。换成其他尺寸，定价也会让画师到手一样多。')},
  {id: 'preview', screen: 'preview', label: L('Review', '预览'), title: L('Look at it the way a collector will', '用藏家的眼光看一遍'),
    alt: L('Step 5 of 5, Review your drop: the painting large, the sizes on offer and the starting price, from $33.65', '第 5 步（共 5 步），预览上新：大图、可选尺寸和起价，$33.65 起'),
    text: L('The shop page before it goes live: the painting large inside its white border, the sizes on offer, and the starting price, from $33.65. No listing fee.',
      '上线前的店铺页面：画作放大，放在白边里，列出可选尺寸和起价，$33.65 起。上架不收费。')},
  {id: 'share', screen: 'share', label: L('Publish and share', '发布与分享'), title: L('Publish, then share the whole story', '发布，然后分享整张快拍'),
    alt: L('Share this drop: the full 1080 by 1920 story image with the painting, title, price and a Shop tag, above Save story image and Copy shop link', '分享这次上新：完整的 1080 × 1920 快拍图，含画作、标题、价格和购买标签，下方是“保存快拍图”和“复制店铺链接”'),
    text: L('Publishing opens the share sheet with the whole 1080 × 1920 story in view: the painting, the title, the price and a Shop tag. Save the image or copy the shop link.',
      '发布后会打开分享面板，完整显示 1080 × 1920 的快拍：画作、标题、价格和一个购买标签。可以保存图片，也可以复制店铺链接。')},
];

export const DECISIONS = [
  {id: 'ruler', title: L('The answer first, the ruler on request', '先给结论，标尺按需展开'), verdict: L('Lead with what the artist can sell; explain it when asked.', '先说画师能卖什么，问了再解释。'),
    tried: L('A ladder of checkmarks, then a ruler of every paper size up front.', '一串对勾，然后把每种纸张尺寸的标尺一次摆出来。'),
    chose: L('“Offer prints up to 10 × 8 inches” first. The ruler at 12 px per inch and the dpi behind each size open one tap away.', '先显示“最大可卖 10 × 8 英寸”。每英寸 12 px 的标尺和各尺寸 dpi，点一下展开。'),
    image: {screen: 'check', position: '50% 40%'}},
  {id: 'fees', title: L('Earnings that don’t shrink', '收入不会缩水'), verdict: L('A bigger print shouldn’t pay the artist less.', '印得更大，画师不该拿得更少。'),
    tried: L('Raising each larger size by its extra print cost.', '大尺寸只加多出的印刷成本。'),
    chose: L('Dividing the extra cost by 0.92 before rounding, so the 8% fee doesn’t eat into the artist’s cut.', '多出的成本先除以 0.92 再取整，这样 8% 的手续费不会吃掉画师的那份。'),
    image: {screen: 'price', position: '50% 66%'}},
  {id: 'wall', title: L('Scale you can trust', '比例要靠得住'), verdict: L('A size only means something next to furniture.', '尺寸放在家具旁边才有意义。'),
    tried: L('A flat room with a small, static print.', '一个平面的房间，墙上挂着一张固定不动的小画。'),
    chose: L('A lit wall, a 36-inch console and a fixed 48-inch view. The print is drawn at its physical width; Apply keeps a size, Cancel puts it back.', '一面有光的墙、一张 36 英寸的边柜，视野固定为 48 英寸宽。印品按实际宽度画出来；“应用”保留尺寸，“取消”恢复原样。'),
    image: {src: '/assets/product/atelier/wall-room.webp', position: '50% 50%'}},
  {id: 'ink', title: L('Ink for actions', '按钮用墨色'), verdict: L('The paintings should be the only color on screen.', '屏幕上的颜色，只该来自画。'),
    tried: L('Royal-blue, full-width pill buttons.', '宝蓝色、通栏的胶囊按钮。'),
    chose: L('Deep ink buttons with 12 px corners; one muted ultramarine for links and selection.', '深墨色按钮，12 px 圆角；链接和选中只用一种低饱和的群青。'),
    image: null},
  {id: 'story', title: L('A story worth posting', '值得一发的快拍'), verdict: L('If the image isn’t worth posting, the link never gets shared.', '图不值得发，链接也就没人分享。'),
    tried: L('A lavender card with small type.', '一张淡紫色卡片，字很小。'),
    chose: L('The painting large and framed on neutral paper, with a title, price and Shop tag you can read in a story.', '画作放大装框，放在中性色纸面上，标题、价格和购买标签在快拍里也看得清。'),
    image: {src: '/assets/product/atelier/story.webp', position: '50% 40%'}},
];

export const TASKS = [
  {id: 'size', screen: 'check', art: 'blue-hour', title: L('Check whether The Blue Hour can be sold at 16 × 12 in', '看看《The Blue Hour》能不能卖 16 × 12 英寸'),
    hint: L('Open Print quality & size details, then tap 16 × 12 on the ruler to see its dpi and the reason.', '展开 Print quality & size details，点标尺上的 16 × 12，看它的 dpi 和原因。')},
  {id: 'price', screen: 'price', art: 'blue-hour', title: L('Set a price for a 10 × 8 and see what you keep', '给 10 × 8 定个价，看看自己能拿多少'),
    hint: L('Change the price; the breakdown and “You keep” update as you type.', '改价格时，明细和 You keep 会跟着更新。')},
  {id: 'wall', screen: 'wall', art: 'signal', title: L('As a collector, try A Distant Signal on the wall in each size it’s sold in', '换成藏家，把《A Distant Signal》每个在售尺寸都挂上墙看看'),
    hint: L('Pick a size: the print changes to its physical width next to the 36-inch console. Apply keeps it; Cancel puts it back.', '选一个尺寸：印品会按实际宽度显示在 36 英寸边柜旁。Apply 保留，Cancel 恢复。')},
  {id: 'buy', screen: 'drop', art: 'signal', title: L('Buy a print, then find the order in the artist’s studio', '买一张印品，再去画师的工作室里找到这笔订单'),
    hint: L('Checkout takes no money: pay with the Apple Pay demo. After the receipt, open the screen menu (the three dots) and go to Orders.', '结账不会扣钱：用 Apple Pay 演示付款即可。看到收据后，打开界面菜单（三个点），进入 Orders。')},
];

// Round 1 → round 2 of the same screens, from the archived shots (scripts/build-round-pairs.mjs).
const R = '/assets/product/atelier/rounds/';
const r1 = L('Round 1', '第一轮'), r2 = L('Round 2', '第二轮');
export const ROUNDS = [
  {id: 'check', tab: L('Print check', '印前检查'), caption: L('The print check. Round 1 put every paper size on a ruler; round 2 leads with the largest sharp size and keeps the ruler one tap away.', '印前检查。第一轮把所有纸张尺寸都放在一把标尺上；第二轮先给出能印清楚的最大尺寸，标尺点一下才出现。'),
    before: {src: `${R}check-r1.webp`, label: r1}, after: {src: `${R}check-r2.webp`, label: r2}},
  {id: 'wall', tab: L('Size sheet', '尺寸面板'), caption: L('Choosing a size on the wall. Round 1 offered Done and Buy in the same sheet; round 2 has Cancel and Apply, and you buy on the product page.', '在墙上挑尺寸。第一轮在同一个面板里放了“完成”和“购买”；第二轮改成“取消”和“应用”，购买回到商品页。'),
    before: {src: `${R}wall-r1.webp`, label: r1}, after: {src: `${R}wall-r2.webp`, label: r2}},
  {id: 'checkout', tab: L('Checkout', '结账'), caption: L('Checkout. Round 1 placed the order as soon as the address was in; round 2 is step 1 of 3, before payment and a review of the total.', '结账。第一轮填完地址就直接下单；第二轮这里是三步中的第一步，后面还有付款和总价确认。'),
    before: {src: `${R}checkout-r1.webp`, label: r1}, after: {src: `${R}checkout-r2.webp`, label: r2}},
];
// From d2-atelier-prototype/README.md, "Round 2: design review".
export const CHANGES = [
  {what: L('Collectors choose only from sizes the artist offers and the file can print; other formats say why they’re missing.', '藏家只能从画师上架、且文件印得出的尺寸里选；其他规格会说明为什么没有。'), why: L('No “Too small” options sitting next to the ones you can buy.', '不会再有“太小”的选项和能买的选项挤在一起。')},
  {what: L('Cancel and Apply in the size sheet; Buy print lives on the product page.', '尺寸面板里只有“取消”和“应用”；“购买印品”放到了商品页上。'), why: L('Changing an option and committing to a purchase are different moments.', '改选项和决定购买是两个不同的时刻。')},
  {what: L('One price calculation everywhere: +$4 production cost for the artist, the exact +$4.35 retail difference for collectors.', '所有地方用同一套价格算法：画师看到制作成本 +$4，藏家看到精确的零售差价 +$4.35。'), why: L('The artist’s earnings hold, and every total on every screen agrees.', '画师的收入不变，每个界面上的总价也都对得上。')},
  {what: L('A full checkout: delivery, an Apple Pay-style demo or a card, a review with the total, and a way back from a declined card.', '完整的结账流程：收货信息、Apple Pay 式的演示付款或银行卡、带总价的确认页，以及银行卡被拒后的返回路径。'), why: L('Round 1 created the order the moment an address went in. Now it exists only after a (simulated) payment.', '第一轮一填地址就生成订单。现在只有（模拟）付款成功后才有订单。')},
  {what: L('Five named steps, “Step 2 of 5,” a saved-draft status, and a way back in from Home.', '五个有名字的步骤、“第 2 步，共 5 步”、草稿保存状态，以及从首页回到草稿的入口。'), why: L('You can see how much is left, and leave and come back.', '能看出还剩多少，也可以中途离开、过会儿再回来。')},
  {what: L('Larger artwork, a full-screen inspector with zoom, and the whole 9:16 story in view before you save it.', '作品图更大，全屏查看器可缩放，保存前能看到完整的 9:16 快拍。'), why: L('Collectors look at the actual work; artists see the image they’re about to post.', '藏家看到的是作品本身；画师看得到要发出去的图。')},
];
export const REVIEW_NOTE = L('I asked a model to critique round 1 as an Apple design lead would. It scored craft 6, interaction 5 and product thinking 7, and ranked eight fixes; round 2 builds all eight. It’s a critique, not a test with artists.',
  '我让模型站在 Apple 设计负责人的角度评第一轮。它打的分是：工艺 6，交互 5，产品思维 7，还按轻重排了八项修改；第二轮八项全做了。这只是评审，不是找画师做的测试。');

export const PROBLEM = {
  heading: L('Four tools to sell one print', '卖一张印品，要用四个工具'),
  paragraphs: [
    L('The illustrators I studied with sell prints at conventions and online. Online means stitching tools together: Instagram for the audience, a storefront, a print-on-demand service, and DMs for customer service.',
      '和我一起学画的插画师们，在漫展和网上卖印品。网上卖，就得把几个工具拼起来用：Instagram 找观众，一个网店，一个按需印刷服务，私信当客服。'),
    L('Each tool works on its own. My hunch is that artists lose time and sales in the seams between them, so Atelier puts the whole drop in one place.',
      '每个工具单独都好用。我的直觉是，画师的时间和销量就丢在工具之间的缝隙里，所以 Atelier 把整个上新放在一个地方完成。'),
  ],
  hypothesis: L('From the artists I know, not from interviews yet. Test day will confirm or replace it.', '来自我认识的画师，还没有做访谈。测试日会证实它，或者推翻它。'),
  quote: L('Quotes from 3–5 illustrator classmates go here after test day: how they sell now, their last sale, what annoys them.', '测试日之后，这里放 3–5 位插画同学的原话：他们现在怎么卖、最近一次成交、最烦的是什么。'),
  tools: [
    {name: L('Instagram', 'Instagram'), role: L('where the audience is', '观众在这里')},
    {name: L('A storefront', '网店'), role: L('Etsy, Big Cartel, INPRNT or Shopify', 'Etsy、Big Cartel、INPRNT 或 Shopify')},
    {name: L('A print service', '印刷服务'), role: L('makes and ships the print', '负责印刷和发货')},
    {name: L('DMs', '私信'), role: L('customer service, by hand', '手动做客服')},
  ],
  seams: [L('Will this size print sharp?', '这个尺寸印出来清楚吗？'), L('What do I keep after fees?', '扣完手续费我拿多少？'), L('Where’s my order?', '订单到哪了？')],
  seamsNote: L('The tools are real; the questions in the seams are my guess at where time and sales go missing.', '工具都是真的；缝隙里的问题，是我猜时间和销量丢在了哪里。'),
};

export const TESTING = {
  plan: [
    L('3–5 illustrator classmates each publish a drop of their own work and buy a print as a collector.', '3–5 位插画同学各自用自己的作品发布一次上新，再以藏家身份买一张印品。'),
    L('Five extra minutes each: how they sell now, their last sale, what they’d pay.', '每人多聊五分钟：现在怎么卖、最近一次成交、愿意付多少。'),
    L('A desk scan of Etsy, INPRNT, Society6, Big Cartel, Shopify with Printful, Instagram Shop and Ko-fi.', '桌面调研 Etsy、INPRNT、Society6、Big Cartel、Shopify 加 Printful、Instagram Shop 和 Ko-fi。'),
  ],
  hypotheses: [
    L('Artists lose time and sales in the seams between tools.', '画师的时间和销量丢在工具之间的缝隙里。'),
    L('Artists can’t tell which sizes of a file will print sharp.', '画师分辨不出一个文件哪些尺寸能印清楚。'),
    L('Seeing earnings before publishing changes the price they set.', '发布前看到收入，会改变他们定的价格。'),
  ],
  results: [
    [L('Published a drop without help', '没人帮忙，自己完成了发布'), L('— of 5', '— / 5')],
    [L('Time from upload to published', '从上传到发布的用时'), L('— min', '— 分钟')],
    [L('Would sell the sizes the check allowed', '愿意只卖检查通过的尺寸'), L('— of 5', '— / 5')],
  ],
};

export const REFLECTION = [
  {title: L('What I’d keep', '我会保留的'), text: L('The print check at the center. It is the one thing a storefront or a print service can’t tell an artist before the sale, and everything after it (sizes, price, preview) gets simpler because of it.',
    '把印前检查放在中心。这是网店和印刷服务都没法在成交前告诉画师的事；有了它，后面的尺寸、定价、预览都变简单了。')},
  {title: L('What I don’t know yet', '我还不知道的'), text: L('Whether the money works at 2–20 sales a month. The 8% + $0.30 fee is a concept number and the print costs are assumptions, not a vendor quote.',
    '每月卖 2–20 张时，这笔账算不算得过来。8% + $0.30 的手续费是概念数字，印刷成本也是假设，不是供应商报价。')},
  {title: L('What’s next', '下一步'), text: L('Test day. Round 2 answered a model’s critique; artists decide round 3. The collector side, now with a full checkout, gets the same scrutiny as the drop flow.',
    '测试日。第二轮回应的是模型的评审；第三轮由画师来定。藏家端现在有了完整的结账流程，也要和上新流程一样仔细检验。')},
];

/** The four inks of the press, in the order they go down. */
export const INKS = [
  {id: 'c', name: L('Cyan', '青'), color: '#1aa3dc', text: L('Cyan goes down first, wherever the file has blue or green.', '青色先印，文件里有蓝色或绿色的地方都会落墨。')},
  {id: 'm', name: L('Magenta', '品红'), color: '#dc2a7d', text: L('Magenta adds the reds and violets. Over cyan it makes blue.', '品红补上红色和紫色；叠在青色上就成了蓝色。')},
  {id: 'y', name: L('Yellow', '黄'), color: '#f3d23a', text: L('Yellow warms everything. Over magenta it makes red and orange.', '黄色让整体变暖；叠在品红上就成了红色和橙色。')},
  {id: 'k', name: L('Black', '黑'), color: '#1d1916', text: L('Black, the key, carries the darks and the edges, so the colors don’t have to.', '黑色（K 版）负责暗部和轮廓，彩色就不必承担这些。')},
];
