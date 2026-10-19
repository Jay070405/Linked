import CaseLayout from '../CaseLayout';
import {Callout, Chart, Figure, FigureSlot, Metric, Metrics, Note, Noted, Table, TLDR, Todo} from '../CaseKit';
import {DesignToCodeChartSlot} from '../charts';
import heroDrawing from '../media/design-to-code-hero.svg?raw';

// Template only. The benchmark is still running, so every section is a TODO with Jay's draft underneath.
// It also exercises every part of the case kit once: TLDR, a note for each evidence label, an image figure,
// a drawing, a chart slot, metrics, an options table and a callout.

export default function DesignToCodeCase({item, reduced}) {
  return <CaseLayout item={item} reduced={reduced} legend={{
    meanings: {Measured: 'Counted in the benchmark runs', Sourced: 'Public docs, checked on a date', Estimated: 'Math from a sample, as a range', Simulated: 'AI personas, not real people', Hypothesis: 'Written down before any run'},
  }}>
    <TLDR
      outcome={<Todo>One sentence with the headline finding, once all 36 generations are scored.</Todo>}
      facts={[
        ['Role', 'Research design, benchmark, plugin prototype, product proposal'],
        ['Timeline', 'Oct 2026 – now'],
        ['Team', 'Solo, independent project'],
        ['Tools', 'Figma, Figma MCP server, Claude Code, Node, pixelmatch'],
        ['Type', 'Benchmark and plugin'],
      ]}/>

    <Chart wide svg={heroDrawing}
      title="The same sign-in screen built three ways in Figma: raw layers, auto layout, and components with variables. All three look the same."
      caption={<>Placeholder drawing. <Todo inline>Replace with the real benchmark frames.</Todo> The three levels look the same on purpose; only how they are built differs.</>}/>

    <Callout title="Status: benchmark in progress">
      <p>The protocol was written on 18 October 2026, before any run, and results will be reported as they come out, including the ones that contradict it. <Todo inline>Update or remove this box when the results are in.</Todo></p>
    </Callout>

    <h2>Problem</h2>
    <Todo>Jay rewrites this section in their own voice. Draft below.</Todo>
    <p>Coding agents can now read a Figma file through Figma’s MCP server and write the front end for it. Teams are starting to hand agents real production files. Nobody has measured how much the way a file is built, as opposed to how it looks, changes what the agent writes.</p>
    <Noted>
      <p>A human developer can look at a messy file and guess what the designer meant. An agent also gets a screenshot, so it can copy the look and still miss the structure underneath.</p>
      <Note label="Sourced" source="TODO: link Figma’s MCP server docs, checked on [date]"><Todo inline>What <code>get_design_context</code> sends the agent: code hints plus a screenshot by default. Quote under 15 words.</Todo></Note>
    </Noted>

    <h2>Who has this problem</h2>
    <Todo>Who feels this, how often, and what it costs them. Draft: designers handing files to engineers who use agents, and engineers who get code that looks right at one width and breaks at the next.</Todo>
    <Noted>
      <p>The plan is a rough count of how many real files are laid out without auto layout, from a sample of public Community files.</p>
      <Note label="Estimated" source="TODO: sample of N public Community files; method in the appendix"><Todo inline>Share of sampled frames that position layout absolutely. Give a range, not a single number.</Todo></Note>
    </Noted>

    <h2>Evidence</h2>
    <h3>Benchmark design</h3>
    <Noted>
      <p>I built 6 screens in Figma, each at 3 levels of structure: raw layers, auto layout with named layers, and a full system with components, variables and text styles. A pixel diff between levels of the same screen stays under 0.5%, so they look the same. A fresh agent built each frame twice from the same prompt, for 36 generations in all.</p>
      <Note label="Hypothesis" source="Pre-registered protocol, 18 Oct 2026 (H1)">At the frame’s own width, the three levels will look about the same, because the agent can copy the screenshot.</Note>
      <Note label="Hypothesis" source="Pre-registered protocol, 18 Oct 2026 (H2)">Resized, the raw level will break far more often: absolute positions become fixed layouts.</Note>
    </Noted>
    <p>Each generation is scored on four things: visual match at the frame’s native width, how much of the frame’s text survives, whether the page holds up at two other widths, and how the code is built, counting absolute positions, hard-coded colors and semantic elements.</p>
    <Metrics>
      <Metric value="[N] of 12" label="Raw-level generations that overflowed at a new width (TODO)" evidence="Measured"/>
      <Metric value="[N] of 12" label="Systematized generations that overflowed (TODO)" evidence="Measured"/>
    </Metrics>
    <Noted>
      <p><Todo inline>One paragraph on the headline result.</Todo> Draft: at the frame’s own width the three levels scored within [N] points of each other. Resized, raw files broke in [N] of 12 generations and systematized files in [N] of 12.</p>
      <Note label="Measured" source="results.csv, TODO: link the benchmark repo"><Todo inline>Median and range of responsive checks passed, per level.</Todo> 36 generations is a small sample, so read this as direction, not proof.</Note>
    </Noted>
    <Chart wide label="Measured" title="Placeholder chart: responsive checks passed for raw, structured and systematized files. Results pending."
      caption={<><Todo inline>Responsive checks passed by structure level, median of 12 generations each, with the range.</Todo> These frames are empty placeholders, not data.</>}>
      <DesignToCodeChartSlot/>
    </Chart>

    <h3>What the simulation said, and what people said</h3>
    <Todo>Run synthetic interviews with AI personas of front-end engineers who receive Figma files, then 4–5 real interviews. Write what each group said and where they disagreed.</Todo>
    <Noted>
      <p>Draft finding to test: engineers will say they’d rather get a structured file late than a raw file early.</p>
      <Note label="Simulated" source="TODO: persona prompts and transcripts in the appendix"><Todo inline>The top complaint from simulated engineers, and whether the real interviews agreed.</Todo></Note>
    </Noted>

    <h2>Insight</h2>
    <Todo>The one thing the evidence shows that wasn’t obvious before. The pre-registered thesis is that a file can look right and still be built wrong, and that structure matters more after the first screenshot: resizing, theming, upkeep.</Todo>

    <h2>Options and decision</h2>
    <Table wide chosen={1} name="Two options compared"
      head={['', 'A. Readiness check inside Figma', 'B. Repair structure on the agent side']}
      rows={[
        ['Who acts', 'The designer, before handoff', 'The engineer’s agent, after handoff'],
        ['When it helps', 'Before any code exists', 'At generation time only'],
        ['Build cost', 'TODO (Estimated)', 'TODO (Estimated)'],
        ['Main risk', 'Designers ignore one more warning', 'The agent guesses intent the file never had'],
      ]}
      caption={<Todo inline>Confirm the decision and add cost estimates after the benchmark.</Todo>}/>
    <Todo>Why A. Draft: the file is where intent lives. Fixing structure before handoff helps every tool downstream, and every person too.</Todo>

    <h2>Solution</h2>
    <Todo>The plugin: what it checks, how a fix works, and a link to the demo video.</Todo>
    <Figure src="/assets/product/design-to-code-plugin-placeholder.svg" width={640} height={400}
      alt="Placeholder for the readiness plugin panel: a list of five checks, two of them flagged."
      caption={<><Todo inline>Real plugin panel screenshot, exported at 2x.</Todo></>}/>
    <FigureSlot what="Demo video of a fix: the check flags a frame, one click adds auto layout, the agent rebuilds it." caption="Planned: a 30-second screen recording."/>

    <h2>Metrics</h2>
    <Todo>North star, input and guardrail metrics. Draft: north star is the share of handed-off frames that pass the check. Input is checks run per active file. Guardrail: time from “design done” to handoff does not go up.</Todo>
    <Todo>Add “if the north star drops 10%, here is how I’d look into it” to the appendix.</Todo>

    <h2>Launch and risks</h2>
    <Todo>Figma Community release plan, who tests it first, and what could go wrong.</Todo>

    <h2>Decision log</h2>
    <Todo>At least one disagreement, with a reviewer, a tester or the data, and how it was settled.</Todo>

    <h2>Reflection</h2>
    <Todo>What I’d do differently. Limits to state up front: one generator model family, and only 36 generations.</Todo>

    <h2>Appendix</h2>
    <Todo>Full protocol, scoring scripts, raw results, persona prompts.</Todo>
  </CaseLayout>;
}
