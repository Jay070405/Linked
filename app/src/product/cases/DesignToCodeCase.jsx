import CaseLayout from '../CaseLayout';
import {Go} from '../Go';
import {C, Chart, Diagram, Note, Noted, Table, TLDR} from '../CaseKit';
import {CoherenceCharts, WiringGrid} from '../charts';
import {LayersCompare, Pipeline, TestSet} from '../figures';

// Source: cases/p2-design-to-code/draft.md (v2). The author's wording is kept; bracketed evidence labels became
// margin notes or table labels. The repo and Figma file links are not public yet, and plugin validation comes later.

export default function DesignToCodeCase({item, reduced}) {
  return <CaseLayout item={item} reduced={reduced} legend={{
    labels: ['Measured', 'Sourced', 'Estimated', 'Hypothesis'],
    meanings: {Measured: 'Comes from my benchmark', Sourced: 'Public, source named', Estimated: 'My assumption', Hypothesis: 'Still needs testing'},
  }}>
    <TLDR
      outcome="My pre-registered layout hypothesis failed: agents rebuilt clean, responsive layouts even from the messiest file. A follow-up ablation showed that binding variables, and nothing else, made 6 of 6 builds follow a design-token change (vs. a median of 50% without them). I propose surfacing that check where the agent reads the file."
      facts={[
        ['Role', 'Solo: question, study design, Figma test file, scoring harness, analysis, plugin prototype, proposal'],
        ['When', 'October 2026'],
        ['Type', 'Independent research and prototype, not Figma work'],
      ]}
      note="Data, harness and protocol: link coming soon"/>

    <Diagram wide label="Measured"
      caption="Same picture, different wiring. The pricing screen (S2) built from the raw file (L0) and from the raw file with variables bound (L0V). The two files look identical in Figma, and so did the two builds. Then I injected the same token change into each page: primary to magenta, text to green, background to yellow, border to cyan. The L0 build picked up only the primary and border colors; the L0V build followed all four.">
      <WiringGrid/>
    </Diagram>

    <h2>Problem</h2>
    <Noted>
      <p>Designers increasingly hand Figma files straight to coding agents through Figma’s MCP server. <C id="mcp">Figma reported that the server’s weekly active users grew 5× quarter over quarter in Q1 2026,</C> <C id="ai-report">and its 2026 AI report found the share of designers who also do development work rose from 21% to 41%.</C></p>
      <Note label="Sourced" claim="mcp">Figma Q1 2026 earnings release.</Note>
      <Note label="Sourced" claim="ai-report">Figma 2026 AI report.</Note>
    </Noted>
    <Noted>
      <p>People who do this describe the same gap. <C id="forum">One developer on Figma’s forum wrote that “the model has to guess which token to use from the codebase based on the raw value provided.”</C> <C id="vallaure">A design-systems writer put it as “the pipe has nothing clean to read, and the result comes back messy.”</C></p>
      <Note label="Sourced" claim="forum">Figma Forum, Jun 2025.</Note>
      <Note label="Sourced" claim="vallaure">Christine Vallaure, Jul 2026.</Note>
    </Noted>
    <Noted>
      <p>The advice designers get is “clean up your file first.” <C id="guide">Figma’s guide lists components, Code Connect, variables, semantic layer names and auto layout.</C> A designer on deadline can’t do all of that on every frame, and nothing says which habit matters most for agent output. <C id="check">Figma’s Check designs can find hard-coded values and replace them with matching variables, but it’s limited to Organization and Enterprise plans and isn’t framed around code generation.</C> <C id="scorers">Third-party “AI-readiness” scorers exist, but none shows that its score predicts better code.</C></p>
      <Note label="Sourced" claim="guide">Figma developer docs.</Note>
      <Note label="Sourced" claim="check">Figma help center.</Note>
      <Note label="Sourced" claim="scorers">My review of 4 tools.</Note>
    </Noted>
    <p>My question: <strong>which file habits change what an agent builds?</strong></p>

    <h2>Evidence</h2>
    <p><strong>Test file.</strong> Six screens (sign-in, pricing, settings, product grid, dashboard, profile), each built at three levels, plus one ablation level I added later:</p>
    <Diagram wide
      caption="The test set: six screens from one small design system. Sign-in (S1), settings (S3) and profile (S6) are 390 px mobile frames; pricing (S2), product grid (S4) and dashboard (S5) are 1440 px desktop frames. Each screen exists in four structural versions that render identically; shown here are the L2 exports, cropped at the top.">
      <TestSet/>
    </Diagram>
    <Table wide plainFirst name="The four levels of the test file"
      head={['Level', 'What the file has']}
      rows={[
        ['L2 Systematized', 'Variables bound everywhere, text styles, components, auto layout, semantic names'],
        ['L1 Structured', 'L2 minus variables, styles and components; auto layout and names kept'],
        ['L0 Raw', 'L1 minus auto layout; every layer renamed “Frame 12”, “Text” and so on'],
        [<strong key="l">L0V (ablation)</strong>, <strong key="v">L0 plus the same variable bindings as L2, and nothing else</strong>],
      ]}/>
    <Noted>
      <p><C id="identical">All versions of a screen export to byte-identical PNGs,</C> so the agents saw the same picture every time. Only the structure behind it changed.</p>
      <Note label="Measured" claim="identical">Compared the PNG exports of every level of each screen.</Note>
    </Noted>
    <Diagram wide label="Measured"
      caption="Same picture, different structure. The first 14 layers of the sign-in screen (S1), read from the test file. In L2 the layers have semantic names, 10 of the 14 use auto layout, 3 are component instances and 13 are bound to variables for color, spacing or radius. In L0 the same screen is generic frames and text: no auto layout, no instances, nothing bound. Both export to the same PNG.">
      <LayersCompare/>
    </Diagram>
    <p><strong>Protocol.</strong> Before running anything I wrote down the setup, metrics and five hypotheses (the protocol is in the repo; link coming soon). The main one (H2) was that without auto layout, the code would break when resized. Each frame went to a fresh Claude agent (Sonnet 5.5) with the same prompt: build this frame as one production-quality HTML file using the Figma MCP tools. A harness I built rendered each result in headless Chrome and scored it. This page reports one run per frame, 24 builds; a second round, as pre-registered, is in progress. Every change to the plan is logged with its date and reason in the protocol’s amendments section.</p>
    <Diagram wide caption="One build, start to finish. Each of the 24 frames went through this once, with nothing shared between builds.">
      <Pipeline/>
    </Diagram>

    <h3>Result 1, pre-registered: no detectable difference</h3>
    <Table wide numeric name="Pre-registered results by level" label="Measured" caption="Median of 6 builds per level."
      head={['Median (n = 6 per level)', 'L0', 'L1', 'L2']}
      rows={[
        ['Visual similarity to the Figma export (SSIM)', '0.985', '0.985', '0.984'],
        ['Responsive checks passed at two other widths', '6/6', '6/6', '6/6'],
        [<><code>position: absolute/fixed</code> declarations</>, '2', '2', '2'],
        ['Colors routed through CSS variables', '97%', '97%', '97%'],
      ]}/>
    <p>H2 failed. When an agent got absolutely positioned code from an L0 frame, it rebuilt the layout with flex and grid; one wrote, “The Figma output was all absolute positioning, so I rebuilt it as flex/gap.” These checks hit a ceiling, so “no detectable difference” is the honest reading, not “identical.”</p>

    <h3>Result 2, exploratory: did the code join the design system?</h3>
    <p>After the first six results came back flat, I added two measures. They weren’t pre-registered, and I label them that way.</p>
    <ul>
      <li><strong>Name coverage:</strong> the share of the screen’s design-system variable names (such as <code>--color-text-primary</code>) that appear in the code.</li>
      <li><strong>Theme propagation:</strong> I injected CSS that redefines four design-system variables on the page, as if the design-system team had shipped a token change, and measured how much of each token’s original color actually changed. It tests one thing: whether the code is wired to the system’s names.</li>
    </ul>

    <h3>Result 3, the ablation</h3>
    <p>L2 differs from L1 in three things at once, so the exploratory result couldn’t say which one mattered. L0V isolates variables:</p>
    <Chart wide label="Measured"
      title="Exploratory results, median of 6 builds per level. Design-system names used: L0 28%, L0V 100%, L1 33%, L2 100%. Follows a token change: L0 50%, L0V 100%, L1 37%, L2 100%."
      caption="Exploratory, not pre-registered. Bars are medians of 6 builds per level; lines show the lowest and highest build. L0V is the raw file with variables bound and nothing else.">
      <CoherenceCharts/>
    </Chart>
    <Table wide numeric highlight={2} name="Ablation results by level" label="Measured" caption="Exploratory measures. Median of 6 builds per level."
      head={['Median (n = 6 per level)', 'L0', 'L0V', 'L1', 'L2']}
      rows={[
        ['Design-system names used', '28%', <strong key="a">100%</strong>, '33%', '100%'],
        ['Follows a token change (4 tokens)', '50%', <strong key="b">100%</strong>, '37%', '100%'],
        ['…text color token', '0%', <strong key="c">100%</strong>, '0%', '100%'],
        ['…background token', '0%', <strong key="d">100%</strong>, '0%', '100%'],
        ['Variable names the agent invented', '14', <strong key="e">4</strong>, '13', '9'],
      ]}/>
    <p>All six L0V builds followed every token change, even though their files still had no auto layout, no components and meaningless layer names. Without variables, the code was just as tidy (97% of its colors went through CSS variables), but each agent invented its own names (<code>--color-text</code>, <code>--color-bg</code>, <code>--color-brand</code>). Changes reached only the tokens whose generic names the agent happened to guess, mostly <code>--color-primary</code> and <code>--color-border</code>.</p>

    <h2>Insight</h2>
    <p>In this test, agents recovered layout from the screenshot but never recovered the design system’s names unless the file carried them as variables.</p>
    <p>That splits “clean up your file” into two jobs with different audiences. Auto layout and good names help the people who maintain the file. Variable bindings are what reach the code. L1 shows the gap: it had both of the habits people usually mean by a clean file, and it behaved like L0.</p>
    <Noted>
      <p>The cost of skipping variables doesn’t show up on the first screen. It shows up the first time the system changes. <C id="private">Each build without them added 11 to 15 private variable names,</C> <C id="audit">so a 50-screen product built this way would leave roughly 600 declarations to audit before a rebrand or dark mode.</C></p>
      <Note label="Measured" claim="private">Counted in the L0 and L1 builds.</Note>
      <Note label="Estimated" claim="audit">50 × ~12; declarations, not unique names.</Note>
    </Noted>

    <h2>Why it matters to Figma</h2>
    <Noted>
      <p>Figma’s bet on agents depends on generated code staying tied to the design system. <C id="seats">Customers paying more than $100K a year who use MCP grew full seats about 70% faster than those who don’t,</C> and variables and libraries are the part of the system Figma owns. Code that invents its own tokens weakens the case for maintaining that system in Figma.</p>
      <Note label="Sourced" claim="seats">Figma Q1 2026 prepared remarks.</Note>
    </Noted>
    <Noted>
      <p>The fix already exists inside Check designs. The gap is distribution and timing. <C id="customers">Check designs reaches only Organization and Enterprise plans; Figma has about 690,000 paying customers, of which about 16,000 pay over $10,000 a year,</C> <C id="plans">so most paying teams probably can’t use it.</C> And it runs when a designer opens a panel, not when an agent is reading the file.</p>
      <Note label="Sourced" claim="customers">Figma Q1 and Q2 2026 earnings.</Note>
      <Note label="Estimated" claim="plans">Plan mix isn’t disclosed.</Note>
    </Noted>

    <h2>Options and decision</h2>
    <Table wide plainFirst name="Options compared"
      head={['Option', 'Reach', 'Cost', 'Call']}
      rows={[
        ['A. Rank the habits in the docs, using evidence like this', 'Everyone, passively', 'Low', 'Yes, but not enough'],
        [<>B. Readiness note in the MCP response: <em>“Colors on this frame are raw values; 23 match variables in your library”</em></>, 'Every plan using MCP', 'Low', <strong key="b">Ship first</strong>],
        ['C. Bring Check designs’ existing “replace with variable” fix to Professional plans, linked from the note', 'Professional plans', 'Medium (reuses a shipped feature)', <strong key="c">Second, if B moves binding</strong>],
        ['D. Auto-convert frames to auto layout', 'Everyone', 'High', 'No: it didn’t move code output'],
      ]}/>
    <Noted>
      <p>B goes first because the agent is the one acting at that moment, and in my test it couldn’t recover names from the screenshot. B also tests demand cheaply: if designers who see the note don’t bind values, C isn’t worth building. <C id="stop">I’d stop B if it adds noticeable latency or if fewer than 10% of noted frames get any new bindings within a week.</C></p>
      <Note label="Hypothesis" claim="stop">The 10% threshold is my own and hasn’t been tested.</Note>
    </Noted>

    <h2>Prototype: Agent-Ready</h2>
    <p>To check that the flow works, I built a Figma plugin prototype for teams without Check designs.</p>
    <ul>
      <li>It lists the findings that matter for agents first: how many values are raw, and how many of those exactly match an existing variable.</li>
      <li><strong>Bind to variables</strong> previews exact matches and applies them in one undoable step. When two variables share a value, it asks instead of guessing.</li>
      <li>The secondary checks (auto layout, naming, components) are labeled as helping people maintain the file, which my data says is where they matter.</li>
      <li>There’s no single readiness grade. The ablation supports one strong finding about variables, and 24 builds can’t justify precise weights.</li>
      <li>Code Connect can’t be read from the plugin API, so it shows “not checked.”</li>
    </ul>
    {/* The product-design case about this check. */}
    <aside className="pp-slot-card is-live" aria-labelledby="pp-handoff-title">
      <h3 id="pp-handoff-title">Designing the handoff</h3>
      <p>The interaction design for this check is its own case study: <Go to="/product/ready-for-agents">Ready for agents</Go>.</p>
    </aside>

    <h2>Metrics</h2>
    <Noted>
      <ul>
        <li><strong>North star:</strong> share of MCP code generations from frames where at least 90% of color and spacing values are bound to variables.</li>
        <li><strong>Leading:</strong> note impressions; frames that gain bindings within 7 days of a note; values bound per frame.</li>
        <li><strong>Downstream, where Figma sees the code</strong> (Make, Code Layers): share of generated style values that reference existing tokens.</li>
        <li><strong>Guardrails:</strong> added MCP latency; wrong bindings reported; note dismiss rate.</li>
        <li><strong>First experiment:</strong> A/B the note for MCP users; primary outcome is new bindings on the same frame within 7 days.</li>
      </ul>
      <Note label="Hypothesis">All of these are proposals; none has been measured.</Note>
    </Noted>

    <h2>Limits</h2>
    <ul>
      <li><strong>Small and narrow.</strong> 24 builds, one model family, one run per frame so far. Six clean screens from one small design system. Messy production files, large frames and other agents could behave differently.</li>
      <li><strong>Not tested:</strong> Code Connect and component reuse, which Figma calls the best route to real components; the same name problem probably applies, but I haven’t measured it.</li>
      <li><strong>The theme test is name-based on purpose.</strong> It shows whether code uses the system’s names, not that a real token pipeline would pick it up.</li>
      <li><strong>No user interviews yet.</strong> Problem evidence here comes from public posts. I’d interview designers who build with agents before pushing B.</li>
    </ul>

    <h2>Reflection</h2>
    <p>I expected auto layout to matter most and it didn’t. Pre-registering the hypotheses and logging every change kept me from rewriting the question after the fact. An outside review of my first draft pointed out that the first result couldn’t separate variables from styles and components; the L0V ablation came from that review.</p>
    <p>Next: finish round 2, replicate with a second model family on the same captured inputs, add a Code Connect condition, and talk to five designers who build with agents.</p>
    <p>I used Claude Code to build the harness and the plugin. The 24 builds were done by Claude agents on purpose; they’re the subject of the study.</p>
  </CaseLayout>;
}
