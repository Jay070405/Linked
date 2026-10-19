import CaseLayout from '../CaseLayout';
import {C, Callout, Chart, Figure, FigureSlot, Note, Noted, Table, TLDR} from '../CaseKit';
import {RocoBatchChart} from '../charts';

// Source: cases/p6-roco/draft.md (case body only). Evidence labels in the draft became margin notes or figure labels.
const PROTOTYPE = 'https://s5-encounter-lab.linke0704.chatgpt.site';

export default function RocoCase({item, reduced}) {
  return <CaseLayout item={item} reduced={reduced} legend={{
    labels: ['Measured', 'Estimated', 'Hypothesis'],
    meanings: {Measured: 'My own logged play', Estimated: 'My assumption, including every Season 5 design value', Hypothesis: 'Still needs testing'},
  }}>
    <Callout title="Personal research, not official work">
      <p>This is personal research on Roco Kingdom: World. It is not official Roco Kingdom or Tencent work. I had no access to server data or internal configs, and every unpublished value below is either my reconstruction or my own proposal.</p>
    </Callout>

    <TLDR
      outcome="Recommended an investigation-based redesign (B), with a cheaper progress-and-guarantee model (A) as the fallback for a short schedule. Neither has been tested with players."
      facts={[
        ['Role', 'Solo. Play logging, system mapping, economy model, two redesign proposals, clickable prototype'],
        ['Timeline', 'Aug – Sep 2026'],
        ['Team', 'Just me (logged sessions were played in two-player co-op)'],
        ['Tools', 'Lark Docs and Sheets, Excel, flowcharts, an HTML prototype'],
        ['Type', 'Personal research'],
      ]}/>

    <Figure wide priority src="/assets/product/roco-s3-throwing.webp" width={1440} height={790}
      alt="Two player characters run through a grassy field in a co-op session. A thrown ball streaks across the grass, leaving a trail of small green clovers."
      caption="Season 3 in two-player co-op: every throw costs a ball. Screenshot from one of my logged sessions; the game's text is in Chinese."/>

    <h2>Problem</h2>
    <p>Shinies are rare color variants of creatures, and for many Roco Kingdom: World players they’re the long-term goal of a season. I’m one of them: I’ve played since Season 1 and collected nearly every Season 2 and 3 shiny, so I started this project as a user with a complaint.</p>
    <Noted>
      <p>In Season 3 (S3), most shinies come out of a hidden encounter loop. You throw balls at wild creatures. Every throw costs a ball, and only a successful capture adds to a chain. When the chain reaches a trigger value, a Storybook or, more rarely, a Picture Book appears. A Storybook leads to a short battle that reveals one creature, which may be shiny. <C id="picture-book">A Picture Book plays a five-act story and ends with ten candidates, at least one of them shiny.</C></p>
      <Note label="Measured" claim="picture-book">Seen in my own sessions, not taken from published rules.</Note>
    </Noted>
    <p>Either way, you still have to capture it to keep it. The end-of-run review pays out Beans, the in-game currency, which buy the next round of balls.</p>
    <Figure src="/assets/product/roco-s3-storybook-battle.webp" width={1440} height={801}
      alt="A short battle in a grassy field. The player’s creatures face a green, scribbled clover sketch."
      caption="A Storybook battle from one of my sessions: my creatures against the clover sketch, the green scribble on the right."/>
    <p>None of this has its own screen. The trigger value, how each ball type converts into chain progress, how the candidate pool is chosen and the shiny rate are all unpublished, and the client doesn’t display them.</p>
    <p>A collector’s real question is “how much more do I need to put in to get the shiny I want?” The S3 loop can’t answer it. Players can’t see their progress or tell which pool their captures are feeding, and the best outcome the system promises is <em>a</em> shiny, which may not be the one they’re chasing.</p>
    <p>My goal for the redesign was to give collectors a target they can see and work toward, so they keep playing through the season, without making shinies feel cheap or publishing exact rates.</p>

    <h2>Evidence</h2>
    <p><strong>What I logged.</strong> Over 10 co-op sessions (“batches”) I recorded every ball thrown, every clover sketch (the object that appears when you touch a Storybook), shiny results and Beans earned.</p>
    <Table numeric name="What I logged" label="Measured" caption="Batch totals from my own logs. The income figure already includes my co-op partner’s share."
      head={['Measure', 'Value']}
      rows={[
        ['Batches', '10'],
        ['Throws', '6,632, from 225 to 1,099 per batch'],
        ['Clover sketches', '499, about 7.5 per 100 throws'],
        ['Shiny records', '13, sources mixed (see limits)'],
        ['Beans earned ÷ Beans spent on balls', '59.4% (144.5M ÷ 243.2M)'],
      ]}/>
    <Noted>
      <p>Ball prices were 80,000 Beans for the seasonal Fairy-tale Ball, 15,000 for the Advanced Gulu Ball and 3,000 for the Net Ball.</p>
      <Note label="Measured">Prices as recorded in my logs. The Advanced Gulu Ball price was checked in the in-game shop.</Note>
    </Noted>
    <p>Six batches used a single ball type, which let me compare them:</p>
    <Table numeric wide name="Single-ball batches" label="Measured" caption="I didn’t control these batches for area, target creature or partner, so ball type is tangled up with my other choices. The Net Ball row is a single batch."
      head={['Ball (price in Beans)', 'Batches', 'Throws', 'Clover sketches per 100 throws', 'Beans earned ÷ ball cost']}
      rows={[
        ['Fairy-tale (80,000)', '3', '1,506', '14.1', '33.7%'],
        ['Advanced Gulu (15,000)', '2', '2,036', '3.6', '98.2%'],
        ['Net (3,000)', '1', '1,099', '4.3', '438.7%'],
      ]}/>
    <Noted>
      <p><strong>What I reconstructed.</strong> I mapped the S3 loop as a player-and-system flow, then rebuilt it as 11 configuration tables: season window, ball-to-chain conversion, encounter types, pool matching, pool members, appearance rates, story scripts, global parameters, branch resources, event lifetime and exception messages. Writing it as tables forced me to name every value a designer would tune, and it surfaced six edge cases the rules must handle. <C id="edge-cases">A failed capture spends the ball and adds no progress, for example, and the warning at 30 unprocessed books is only a reminder: you can keep collecting past it.</C></p>
      <Note label="Measured" claim="edge-cases">Both behaviors observed in my own play.</Note>
    </Noted>
    <FigureSlot wide ratio="16 / 6" what="Redraw the S3 player-and-system flow with English labels (source: assets/roco/current/s3-flow.svg)."
      caption="The S3 loop as I reconstructed it: throw, chain, Storybook or Picture Book, reveal, capture, review."/>
    <p><strong>What the evidence can’t support.</strong> The 10 batches are a non-random sample from one player and a co-op partner. My shiny records don’t separate Storybook, Picture Book and wild sources, and I didn’t count completed encounters, so I can’t compute a base shiny rate; dividing shinies by clover sketches would give a wrong answer. The income figure includes my co-op partner’s share while the cost side counts only my balls, so 59.4% overstates what one player recovers. The values in my reconstructed tables are placeholders. And everything here comes from my own play: I don’t have interview data from other collectors yet.</p>

    <h2>Insight</h2>
    <Noted>
      <p>Throwing is both the only lever and the main cost. <C id="trade">In my single-ball batches, the seasonal ball produced about four times as many Storybook encounters per throw as the Advanced Gulu Ball, yet earned back only a third of its cost, where the Advanced Gulu Ball earned back almost all of its own.</C></p>
      <Note label="Measured" claim="trade">14.1 against 3.6 clover sketches per 100 throws; 33.7% against 98.2% of ball cost earned back. Confounded: the batches weren’t controlled for area, target or partner.</Note>
    </Noted>
    <Chart title="Scatter plot of the 10 logged batches. Batches thrown only with the Fairy-tale Ball sit at 13.5 to 14.7 clover sketches per 100 throws; batches with no Fairy-tale Balls sit at 3.3 to 4.3; mixed batches fall in between."
      label="Measured" caption="Each dot is one logged batch. The more of a batch’s throws used the seasonal ball, the more clover sketches it produced. Filled dots are single-ball batches, hollow dots are mixed.">
      <RocoBatchChart/>
    </Chart>
    <p>Players are already trading Beans for time. The game never tells them the exchange rate, so they can’t plan a budget around a target.</p>
    <p>Second, a collector values the shiny they want far more than one they don’t. The loop’s strongest promise, the Picture Book’s guaranteed shiny among ten candidates, covers any shiny, so progress toward the outcome players care about stays invisible and a “win” can still feel like a miss.</p>
    <p>That became the design rule for both proposals: let players pick a target, show progress toward it, and keep the reveal itself a surprise. I chose not to expose real rates.</p>

    <h2>Options and decision</h2>
    <p>I wrote two proposals for a hypothetical Season 5. They share a core: the player picks a target shiny, progress is saved per target, and a guarantee applies to that target.</p>
    <Table wide chosen={2} name="Two proposals compared" caption="Build cost is my own rating; neither proposal has been sized in person-weeks."
      head={['', 'A · Woodland Echoes', 'B · Ecological Migration']}
      rows={[
        ['Player actions', 'Capture, perform, reveal', 'Capture, observe, photograph, investigate'],
        ['Target control', 'Fixed target plus a weighted pool', 'Fixed target plus a choice of reward route'],
        ['Reuse', 'Mostly the existing capture loop', 'New zones, tasks and states'],
        ['Config tables touched', '5', '9 (3 shared with A)'],
        ['Build cost (my rating)', 'Low to medium', 'High'],
        ['Main risk', 'Repetitive throwing stays dominant', 'Preparation and travel slow the pace'],
      ]}/>
    <p>I recommend B. A makes the existing loop readable, but throwing stays the only lever, and my data says throwing is where the cost sits. B lets players put time into observation and photography to cover part of what they’d otherwise spend on balls, and it lets them choose what kind of reward they’re after. If the team only has room for a smaller change, A is the fallback because it reuses almost everything players already know.</p>
    <p>Without player data, I can’t claim B improves satisfaction or retention. The metrics below are how I’d find out.</p>

    <h2>Solution</h2>
    <Noted>
      <p><strong>A · Woodland Echoes.</strong> Only captures that match the target’s sources earn notes: 1, 2 or 4 per capture, with seasonal and guaranteed-capture balls giving 4. Every 28 notes forms a “movement” and the remainder carries over; 30 unopened movements pause accumulation. Each movement draws from the target, related creatures and guests at 70/20/10, with a 5% chance of any shiny. From the 61st movement the chance rises by 0.5 points per movement, and the 80th guarantees the target shiny. Only a target shiny resets the counter.</p>
      <Note label="Estimated">Every number in A is my proposal for a hypothetical Season 5, not a live value.</Note>
    </Noted>
    <Noted>
      <p><strong>B · Ecological Migration.</strong> The player gathers two of four clue types (tracks, calls, traces, habitat), 120 points each, to locate a zone. Captures give 1, 2 or 4 points. A photo or observation gives 10, capped at 60 per type, so non-capture actions can supply at most half. A 12-minute investigation with three tasks follows. The player then picks a reward route: appearance (5% shiny, with a guarantee on the fourth round after three misses), lineage (5% shiny plus a 20% rare lineage) or resources (5% shiny plus 90,000 Beans and six Advanced Gulu Balls).</p>
      <Note label="Estimated">Points, caps, the timer and every reward rate in B are my proposals too.</Note>
    </Noted>
    <FigureSlot wide ratio="16 / 6" what="English redraws of the two Season 5 flows (sources: assets/roco/current/s5-a-flow.svg and s5-b-flow.svg)."
      caption="A and B side by side: where each one changes the S3 loop."/>
    <Noted>
      <p><strong>Rules shared by both.</strong> Generating a result, revealing it and owning it are separate states. Confirming locks the result, and re-entering or retrying a capture never re-rolls it or counts a guarantee twice. Switching targets pauses the old progress, which never transfers, so nobody can farm one target and cash it in on another. <C id="prototype">I built an interactive prototype of both flows to check these rules against my own logic; no players have used it yet.</C></p>
      <Note label="Hypothesis" claim="prototype">The prototype checks the rules’ logic, not whether players understand them. <a href={PROTOTYPE} target="_blank" rel="noreferrer">Open the prototype</a> (in Chinese).</Note>
    </Noted>

    <h2>Metrics</h2>
    <Noted>
      <p>None of these has been measured.</p>
      <Note label="Hypothesis">Every metric in this section is a proposal.</Note>
    </Noted>
    <Noted>
      <ul>
        <li><strong>First check, before building anything:</strong> a comprehension test. Can players say which actions count toward their target and what they keep after switching targets?</li>
        <li><strong>North star:</strong> weekly active days during the season among players with an active target.</li>
        <li><strong>Inputs:</strong> share of active players who set a target; median throws and minutes per target shiny; for B, investigation completion rate and the share of clue points that come from non-capture actions.</li>
        <li><strong>Guardrails:</strong> <C id="baseline">Beans earned ÷ Beans spent per player (my only baseline is 59.4%)</C>; share of active players who own each target shiny, as a rarity check; drop-off during B’s 12-minute timer; support tickets about lost or reset progress.</li>
      </ul>
      <Note label="Measured" claim="baseline">The 59.4% baseline: 144.5M Beans earned ÷ 243.2M spent across all 10 batches. It overstates one player’s return, because income includes my partner’s share.</Note>
    </Noted>

    <h2>Effort and risks</h2>
    <p>I only sized effort relatively. A adds target selection, a note counter and a guarantee to the existing loop and touches 5 config tables. B adds zones, clue tracking, tasks, timers, reward routes and recovery states across 9.</p>
    <ul>
      <li><strong>Mis-tuned guarantees.</strong> I don’t know the live S3 rates, so an 80-movement guarantee could be too generous or too stingy for the real economy. Those values need the team’s data.</li>
      <li><strong>B’s pacing.</strong> The investigation timer keeps running offline by design, which could feel punishing, and travel time may make choice feel like extra work.</li>
      <li><strong>A’s ceiling.</strong> Readable progress does little to cut repetition.</li>
    </ul>

    <h2>Reflection</h2>
    <p>The biggest gap is the logging. I recorded batch totals, which is why I can’t estimate a base rate. Next time I’d log every encounter (throws since the last one, encounter type, outcome, where the shiny came from) and run solo batches so income and cost come from the same player.</p>
    <p>I’d talk to other collectors before choosing between A and B. My recommendation rests on my own play, and three or four interviews would tell me whether other players feel the cost problem the way I do.</p>
    <p>I’d also size effort in person-weeks, as I later did for my League of Legends proposals, and add a do-minimum option: show the existing chain progress and change nothing else. If that alone cleared up most of the confusion, A and B would both be harder to justify.</p>
  </CaseLayout>;
}
