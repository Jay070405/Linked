import CaseLayout from '../CaseLayout';
import {C, Chart, Diagram, Figure, FigureSlot, Note, Noted, Table, TLDR} from '../CaseKit';
import {GapChart, YearChain} from '../charts';

// Source: cases/p7-playtest-liveops/draft.md (case body only; the note to Jay and the trailing sections are left out).
// No 2XKO material appears anywhere on this page. League images are Riot's own English client screens only.

export default function PlayersBreakCase({item, reduced}) {
  return <CaseLayout item={item} reduced={reduced} legend={{
    meanings: {Measured: 'My own records', Sourced: 'Public material, source named', Estimated: 'My assumption', Simulated: 'My model output, not game data', Hypothesis: 'Still needs testing'},
  }}>
    <TLDR
      outcome={<>In three different settings, players broke where information arrived late or not at all. I turned that into three League live-ops proposals sized at about 54 person-weeks, ordered so the cheapest and most certain one ships first.</>}
      table={{
        cols: ['Riot 2XKO', 'alt.ctrl rhythm game', 'League of Legends'],
        rows: [
          ['Type', 'External playtest', 'Team project', 'Personal research'],
          ['Role', 'External playtester, gameplay and player experience', 'Systems designer, core mechanics', 'Solo'],
          ['Timeline', 'Jan – Apr 2025', 'Sep – Dec 2025', 'Sep 2026'],
          ['Team', 'Riot’s external playtest program', '7 people', 'Just me'],
          ['Tools', 'Structured playtest notes, mechanism maps', 'Structured feedback forms', 'Lark Docs, charts, a matchmaking simulation'],
        ],
      }}/>

    <h2>Problem</h2>
    <p>When a player fails, there are two very different explanations. Either the game is asking for a skill it means to ask for, or it never told the player something they needed to know. The first is the design working. The second is a product problem that looks like player error. I’ve had to tell these apart in three places: as an external playtester on Riot’s 2XKO, as the systems designer on a 7-person alt.ctrl team, and in a solo teardown of League of Legends live ops.</p>

    <h2>Evidence</h2>
    <p><strong>2XKO (Riot external playtest).</strong> 2XKO is Riot’s 2v2 tag fighting game. I ran structured playtests across its three team mechanics (Tag, Assist and Fuse), looking at strategic depth, execution load and new-player comprehension, and produced mechanism maps and edge-case breakdowns. The builds were pre-release, so I’m describing only my methods and the two findings already on my public résumé, with no footage, build details or internal numbers.</p>
    <p>The two comprehension failures were input tolerance on special moves and judging the payoff of tag timing. For each, I traced what triggered the failure and which guidance was missing beforehand, then separated two causes: too little teaching, and information the game never exposed.</p>
    <Noted>
      <p><strong>Animal-sound rhythm game (team).</strong> Our 7-person team built a rhythm game with a custom physical controller, themed around animal sounds, for an alt.ctrl.GDC submission (it wasn’t selected). I owned core mechanics and turned the theme into three rhythm interaction verbs, each with its own input, judgment window and difficulty curve. I organized 4 playtest cycles with 20+ players each, drawn from mixed ages and backgrounds, and collected structured feedback forms. I sorted 20+ observations by failure type: controls, onboarding and feedback timing. From those, I pushed 4 design iterations through the team, and we retested each fix in the next cycle. I also specified 10+ interface and feedback assets across character select, onboarding and hit feedback.</p>
      <Note label="Measured">Cycles, players, observations, iterations and assets are counts from my own project records.</Note>
    </Noted>
    <p><strong>League of Legends (solo teardown, sources as of Sep 18, 2026).</strong> I mapped the year as a chain: season content brings players back, the battle pass gives them a goal, ranked is the daily core and Worlds is the peak of attention. Then I listed the data behind each screen and checked what players can actually see.</p>
    <Diagram wide caption="The year as I mapped it. Worlds carries attention into the next season. The numbered marks are the three gaps the proposals below address.">
      <YearChain/>
    </Diagram>
    <Noted>
      <ul>
        <li>The pass shows your level and progress within it. It doesn’t show how far a chosen reward is or how long it will take, though by my reading the client already has the XP and match history to work out both.</li>
        <li>The loading screen shows each player’s rank. Matchmaking runs on hidden MMR, and team averages are never shown, so after a loss it’s easy to blame a teammate or the matchmaker.</li>
        <li><C id="fearless">Pro play moved to Fearless Draft in 2025, where a champion used in a series can’t be picked again.</C> <C id="clash">Clash, the in-game tournament, drafts each game independently.</C></li>
      </ul>
      <Note label="Sourced" claim="fearless">LoL Esports 2025 season rules.</Note>
      <Note label="Sourced" claim="clash">Riot Clash FAQ.</Note>
    </Noted>
    <Figure src="/assets/lol/pass-before.webp" width={1280} height={720}
      alt="League of Legends battle pass screen in the English client: a reward track with the player at level 17 and 750 of 5,000 XP toward the next level."
      caption="The battle pass today: your level and the XP to the next one, nothing about the reward you want. Official client screen, Riot Games."/>
    <Figure src="/assets/lol/loading-before.webp" width={1440} height={1080}
      alt="League of Legends loading screen in the English client: ten champion cards, each showing the player's rank emblem, with no team totals or averages."
      caption="The loading screen today: one rank per player and no team averages. Official client screen, Riot Games."/>
    <Noted>
      <p>Riot’s own changes point the same way. Patch 25.13 extended weekly mission expiry from 7 to 21 days and 25.17 cut the pass from 50 to 48 levels, both of which lower catch-up cost. Patch 26.3 added a Climb Indicator that tells players their rank is below their MMR without showing the number.</p>
      <Note label="Sourced">League of Legends patch notes 25.13, 25.17 and 26.3.</Note>
    </Noted>

    <h2>Insight</h2>
    <p>In all three, the breaks clustered where information arrived late or never. In 2XKO, one of the two failures was judging what a well-timed tag would buy. Feedback timing was one of the three failure types in alt.ctrl. In League, the data already exists and is missing from the screen where the decision gets made.</p>
    <p>The rule I took from this: first decide whether a wall is intended skill or an information gap. If it’s a gap, fix the information on a screen players already visit before touching the mechanic, and test whether players understand the change before measuring their behavior.</p>

    <h2>Options and decision</h2>
    <p>In 2XKO I wrote three kinds of recommendation (split onboarding into smaller steps, strengthen feedback, surface information earlier) and argued each against its effect on match pacing and the learning curve. In alt.ctrl, each iteration targeted one failure type and was checked in the following cycle.</p>
    <p>For League, two decisions carried most of the weight.</p>
    <h3>What the loading screen should show</h3>
    <Table wide name="Loading screen options"
      head={['Option', 'What it answers', 'Risk', 'Decision']}
      rows={[
        ['Rank only (today)', 'Each player’s rank', 'Rank and real skill diverge, so losses get blamed on matchmaking', 'Not enough'],
        ['Each player’s hidden MMR', 'Everything', 'Singles out the lowest-rated player before the game starts', 'Rejected'],
        ['Team averages and the gap', 'Whether the match is even overall', 'Can’t explain individual lane matchups', 'Chosen, test first'],
      ]}/>
    <h3>How to run a Fearless Clash</h3>
    <p>Fearless only creates strategy when the same two teams play a series, because each side burns through its champion pool against the same opponent.</p>
    <Table wide numeric name="Fearless Clash formats" label="Estimated"
      head={['Format', 'Time on the path to a title', 'Decision']}
      rows={[
        ['Today’s Clash', '~2 h', 'Baseline'],
        ['Fearless BO3 every round on day 1', '~5 h', 'Too long for amateur teams'],
        ['Fearless across all of day 1', '~2 h', 'Opponents change, so it only restricts yourself'],
        ['Normal day 1, Fearless BO3 on day 2', '2 h + 1.7 h', 'Chosen'],
      ]}
      caption="These times assume about 40 minutes per game including draft and loading, and 2.5 games per BO3."/>

    <h2>Solution</h2>
    <p>All three proposals reuse an existing screen and leave core gameplay alone.</p>
    <Noted>
      <p><strong>1. Battle-pass goal tracking.</strong> <C id="pace">“Set as goal” on the reward panel shows remaining XP and a time range based on the player’s own last 7 days: 3,000 BXP left at 200–300 BXP an hour shows as 10–15 hours.</C> Missions about to expire appear next to the act timer. With no games in the last 7 days, the card shows only the XP gap. If the pace won’t get there in time, it says so plainly, with no countdown pressure.</p>
      <Note label="Estimated" claim="pace">An example, not live data.</Note>
    </Noted>
    <FigureSlot what="The goal-tracking redesign with English UI text (source: assets/lol/b1-pass-redesign-annotated.webp has Chinese labels)."
      caption="The reward panel with a goal set: XP left, and a time range from the player’s own pace."/>
    <Noted>
      <p><strong>2. Loading-screen match fairness.</strong> <C id="tip">The random tip line becomes “Blue avg 1,570 · Red avg 1,575 · Evenly matched”.</C> <C id="sim">To set display tiers I simulated 20,000 games. A gap under 25 covered 69.4% of games, 25–75 covered 29.2% and 75+ covered 1.5%.</C> The top tier explains the cause, such as a widened search after a long queue.</p>
      <Note label="Estimated" claim="tip">The averages are an example.</Note>
      <Note label="Simulated" claim="sim">85% of games with a within-match SD of 35, 15% long-queue games with SD 70, fixed seed. Not Riot data.</Note>
    </Noted>
    <Chart wide label="Simulated" title="Bar chart of 20,000 simulated games by the gap between team average ratings. Most games fall under a 25-point gap (69.4%), 29.2% fall between 25 and 75, and 1.5% are 75 or more."
      caption="How often each gap comes up in 20,000 simulated games, in 5-point bins. The tiers on the loading screen follow these breaks.">
      <GapChart/>
    </Chart>
    <FigureSlot what="The loading-screen redesign with English text (source: assets/lol/b2-loading-redesign-annotated.webp has Chinese labels)."
      caption="Team averages and the gap, in the line where the random tip sits today."/>
    <Noted>
      <p><strong>3. Two-day Worlds Fearless Clash.</strong> Day 1 is a normal 8-team Clash. On day 2, day-1 winners in the same tier play one full Fearless BO3. With roughly 170 champions and 10 bans a game, available picks fall from about 160 to 150 to 140 across the series. Scouting and draft screens show what each side has already used. Anti-smurf rules add 30+ ranked games this season, honor level 2+ with no penalties in 30 days, roster lock and one reward per verified phone number. Day-2 winners get a permanent trophy, a one-year loading-screen title and a shareable lineup card, and each win adds 500 pass XP, which feeds back into proposal 1.</p>
      <Note label="Estimated">Champion counts per game and the 500 XP reward are my estimates.</Note>
    </Noted>
    <FigureSlot wide ratio="16 / 6" what="Clash hub, scouting and draft screens with English text (sources: assets/lol/b3 to b6 clean versions still carry Chinese UI)."
      caption="Day 2 of the Fearless Clash: the hub, the scouting screen and a draft that greys out champions already used."/>

    <h2>Metrics</h2>
    <Table wide name="Metrics by proposal" label="Hypothesis"
      head={['Proposal', 'North star', 'Input', 'Guardrail']}
      rows={[
        ['Pass goal tracking', 'Returning players’ 14-day goal-reward claim rate vs control', '≥80% of test players can say how much play is left (target); share who set a goal', 'Complaints about wrong estimates'],
        ['Loading screen', 'Post-game report rate vs control', 'Comprehension of rank vs averages in testing', 'Early exits no higher than control'],
        ['Fearless Clash', 'Day-1 team sign-ups vs regular Clash in the same period', 'Distinct champions played on day 2 vs day 1', 'Smurf reports no higher'],
      ]}
      caption="None of these has been measured. The 80% comprehension bar is my own target."/>
    <Noted>
      <p>For the pass, detecting a lift from 30% to 32% at 5% two-sided significance and 80% power needs about 8,400 returning players per group. Before that, I’d run a face-to-face comprehension test with 5–8 players.</p>
      <Note label="Estimated">A standard two-proportion sample-size estimate; the 30% baseline is assumed.</Note>
    </Noted>

    <h2>Effort and risks</h2>
    <Table wide numeric name="Effort by proposal" label="Estimated"
      head={['Proposal', 'Effort (person-weeks)', 'Split', 'Plan']}
      rows={[
        ['Pass goal tracking', '~12', 'Design 2, client 5, server 3, QA 2', '2027 season, Act 1'],
        ['Fearless Clash', '~32', 'Server 10, client 8, design 4, art 4, QA 4, bracket pairing 2', 'MSI 2027 pilot, Worlds 2027'],
        ['Loading screen', '~10, with 2 approved first', 'Client 4, server 2, UX research 2, QA 2', 'Prototype test, small experiment mid-2027'],
        ['Total', '~54', '', ''],
      ]}
      caption="Sizes are my own estimates; nothing here comes from Riot."/>
    <FigureSlot wide ratio="16 / 6" what="The launch timeline in English (source: assets/lol/c4-roadmap-annotated.webp has Chinese labels)."
      caption="What ships when, against the 2027 season start, MSI and Worlds."/>
    <Noted>
      <p>Under my scenario assumptions of ¥20,000 per person-week and ¥70 per premium pass, goal tracking costs about ¥240,000 and breaks even at about 3,430 extra passes. The Fearless Clash, about ¥640,000, has no direct revenue line; at 100,000 participants it costs about ¥6.4 per player, which I’d compare against other Worlds events. The loading screen has no revenue case at all, so its 2-person-week test caps the loss if comprehension fails, and it falls back to rank-only if the data looks wrong.</p>
      <Note label="Estimated">Scenario assumptions, not prices from Riot. The break-even treats the whole ¥70 as margin.</Note>
    </Noted>
    <p>So the order is: ship goal tracking first, build the Fearless Clash in parallel for an MSI pilot, and keep the loading screen in research until it passes the comprehension test. The risks I’d watch are estimates being read as promises (show a range, from the player’s own data only), team averages starting new arguments, and the 30-game threshold shutting out casual players, which is why ARAM Clash stays open as it is today.</p>

    <h2>Reflection</h2>
    <p>None of the League proposals has player data yet. The comprehension tests come first for that reason, and I haven’t run them.</p>
    <p>The break-even is rough. It treats the full ¥70 as margin and counts every extra pass as new, ignoring platform fees and players who would have bought the pass anyway. Next time I’d estimate the incremental share explicitly.</p>
    <p>For alt.ctrl, I’d record how many players hit each failure type in every cycle, so each retest gives a rate I can compare across cycles. The habit I took from 2XKO, separating intended difficulty from missing information before writing a single recommendation, is the step I carried into League.</p>
  </CaseLayout>;
}
