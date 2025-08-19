import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

export default function Slide() {
  const markdown = `- Four canonical coordination topologies: centralized conductor, blackboard, marketplace, and event bus
- Think of these as institutional designs: who decides, how memory flows, how quality is governed
- You can combine them; start simple, evolve as complexity and scale grow

---

Conductor (centralized orchestrator)
- Strong control and observability; simple to reason about end-to-end
- Great for 101 builds, regulated flows, and strict SLAs
- Risks: bottleneck, single point of failure, coordinator fatigue
- Add critics/validators as first-class steps

\`\`\`mermaid
flowchart LR
  U[User Goal] --> O[Orchestrator]
  O --> A[Agent A]
  O --> B[Agent B]
  O --> C[Critic / Validator]
  A --> T1[(Tool/API)]
  B --> T2[(Retrieval/DB)]
  A --> C
  B --> C
  C --> O
  O --> R[Result]
\`\`\`

\`\`\`python
# Orchestrator sketch
for task in dag.ready():
    agent = assign(task)
    out = run_agent(agent, task, tools=allowed[agent])
    valid = validate(out, schemas[task], business_rules[task])
    if valid:
        dag.complete(task, artifact=out)
    else:
        dag.repair_or_retry(task, policy="backoff:3, escalate:critic")
\`\`\`

---

Blackboard (shared memory)
- Loose coupling via shared artifacts; scales concurrency
- Convergence is a design problem: norms, locks, and merge rules
- Use versioned artifacts, TTLs, and critics that watch the board
- Great for discovery-heavy or mixed-modality workflows

\`\`\`mermaid
flowchart TD
  subgraph BB[Blackboard]
    X[(Artifact X v1..n)]
    Y[(Hypotheses/Tasks)]
  end
  P[Planner] -- posts tasks --> BB
  A1[Agent A] -- reads -> BB
  A1 -- writes -> BB
  A2[Agent B] -- reads -> BB
  A2 -- writes -> BB
  Crit[Critic] -- monitors -> BB
  Crit -- accept/fix flags -> BB
\`\`\`

\`\`\`python
# Blackboard IO
aid = agent_id()
art = read_latest("outline")
with lock("outline"):
    new = improve(art, context)
    write("outline", new, meta={"by": aid, "parent": art.version, "ttl": "7d"})
critique = critic.evaluate("outline", rules=[coherence, coverage])
annotate("outline", critique)
\`\`\`

---

Marketplace (contract net)
- Dynamic allocation by capability, price, and confidence
- Useful when agent skills/costs vary or resources are elastic
- Needs auction design: bidding schema, deadlines, tie-breakers
- Overhead is real; reserve for non-trivial tasks or scarce tools

\`\`\`mermaid
sequenceDiagram
  participant P as Planner/Buyer
  participant A as Agent A
  participant B as Agent B
  participant S as Selector
  P->>A: RFQ(task, constraints)
  P->>B: RFQ(task, constraints)
  A-->>S: bid(cost, eta, confidence)
  B-->>S: bid(cost, eta, confidence)
  S-->>P: award(Agent B)
  P->>B: contract(task)
  B-->>P: deliver(artifact, metrics)
\`\`\`

\`\`\`python
# Contract-net core
rfq = make_rfq(task, budget=5.00, sla="2m")
bids = gather_bids(rfq, agents=pool, timeout=1.0)
win = argmin(bids, key=lambda b: (b.risk, b.cost, b.eta))
result = execute(win.agent, task)
assert validate(result)
\`\`\`

---

Event Bus (event-driven choreography)
- Decoupled producers/consumers; resilient and composable
- Harder to reason about global guarantees; use idempotency and tracing
- Great for cross-team integrations and long-lived processes
- Add a saga/compensation story for partial failures

\`\`\`mermaid
flowchart TD
  subgraph Bus[Event Bus / Topics]
    EVT[(events: task.created, artifact.ready, policy.flag)]
  end
  A[Agent A] -->|publish: task.created| Bus
  B[Agent B] -->|publish: artifact.ready| Bus
  C[Agent C] -->|publish: policy.flag| Bus
  A <-->|subscribe: artifact.ready| Bus
  B <-->|subscribe: task.created| Bus
  C <-->|subscribe: artifact.ready, task.created| Bus
\`\`\`

\`\`\`python
# Subscriber with idempotency
@subscribe(topic="artifact.ready")
def handle(evt):
    if seen(evt.id): return
    with saga(evt.correlation_id) as tx:
        out = act(evt.payload)
        publish("policy.flag" if out.risky else "step.done", out)
        mark_seen(evt.id)
\`\`\`

---

Choosing quickly
- Prototype and regulated flows: start with Conductor
- Exploration or many specialists: add a Blackboard
- Variable skills/costs or scarce tools: introduce a Marketplace
- Org-scale integrations and async ops: route via an Event Bus
- Hybridize deliberately; keep contracts, validators, and traces constant`;
  const mermaidRef = useRef(0);
  
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#667eea',
        primaryTextColor: '#fff',
        primaryBorderColor: '#7c3aed',
        lineColor: '#5a67d8',
        secondaryColor: '#764ba2',
        tertiaryColor: '#667eea',
        background: '#1a202c',
        mainBkg: '#2d3748',
        secondBkg: '#4a5568',
        tertiaryBkg: '#718096',
        textColor: '#fff',
        nodeTextColor: '#fff',
      }
    });
    
    // Find and render mermaid diagrams
    const renderDiagrams = async () => {
      const diagrams = document.querySelectorAll('.language-mermaid');
      for (let i = 0; i < diagrams.length; i++) {
        const element = diagrams[i];
        const graphDefinition = element.textContent;
        const id = `mermaid-${mermaidRef.current++}`;
        
        try {
          const { svg } = await mermaid.render(id, graphDefinition);
          element.innerHTML = svg;
          element.classList.remove('language-mermaid');
          element.classList.add('mermaid-rendered');
        } catch (error) {
          console.error('Mermaid rendering error:', error);
        }
      }
    };
    
    renderDiagrams();
  }, [markdown]);
  
  return (
    <div className="slide markdown-slide">
      <h1>Coordination topologies at a glance: Conductor, Blackboard, Marketplace, Event Bus — Diagrams 1–4</h1>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, className, children, ...props}: any) {
            const match = /language-(w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !className;
            
            if (!isInline && language === 'mermaid') {
              return (
                <pre className="language-mermaid">
                  <code>{String(children).replace(/\n$/, '')}</code>
                </pre>
              );
            }
            
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}