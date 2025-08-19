import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Slide() {
  const markdown = `**Why control patterns matter**

- Govern uncertainty: wrap non-determinism with loops, contracts, and tests
- Separate powers: plan, act, judge — different agents, different incentives
- Make emergence safe: allow creativity inside boundaries
- Observable by design: traces, schemas, budgets on every step
\`\`\`mermaid

flowchart LR
  U[User Goal] --> O[Orchestrator]
  O --> P[Planner]
  O --> R[Router]
  O --> D[Debate]
  O --> C[Critic/Judge]
  O --> G[Guardrails]
  P --> E1["Executor(s)"]
  R --> E1
  D --> C
  E1 --> C
  C -->|accept| Done[Result]
  C -->|fix| P
  G -->|enforce/repair| C
\`\`\`
---

### 1) Planner → Executor → Critic (PEC)

- Decompose to a DAG, execute in parallel, validate, repair, converge
- Contracts keep outputs typed; critics keep quality/policy in check
- Use when tasks have dependencies and acceptance criteria
\`\`\`mermaid
flowchart TD
  A[Goal] --> B[Planner -> Tasks DAG]
  B --> C{Ready Tasks}
  C -->|parallel| D[Executors]
  D --> E[Artifacts]
  E --> F[Critic: schema + rules + rubrics]
  F -->|accept| G[Assemble]
  F -->|repair| B
\`\`\`
\`\`\`python
# PEC skeleton (framework-agnostic)
plan = planner.decompose(goal)
state = {"artifacts": {}, "attempts": 0}
MAX_ITERS = 4

while plan.has_ready() and state["attempts"] < MAX_ITERS:
    for task in plan.ready():
        out = executor.run(task, tools=task.tools, schema=task.schema)
        verdict = critic.evaluate(out, rules=["schema", "business", "policy"])
        if verdict.ok:
            state["artifacts"][task.id] = out
            plan.complete(task.id, out)
        else:
            plan.repair(task.id, hint=verdict.hint)
    state["attempts"] += 1

result = assembler.assemble(plan, state["artifacts"]) 
\`\`\`
---

### 2) Debate / Deliberation

- Multiple agents propose, critique, and refine
- Judge aggregates with rubric; optional self-play cross-exam
- Use when solution space is open-ended or adversarial
\`\`\`mermaid
sequenceDiagram
  participant U as User/Spec
  participant A as Debater A
  participant B as Debater B
  participant J as Judge

  U->>A: Provide spec + rubric
  U->>B: Provide spec + rubric
  A-->>J: Proposal A + evidence
  B-->>J: Proposal B + evidence
  A-->>B: Challenges (cross)
  B-->>A: Challenges (cross)
  J-->>J: Score with rubric (groundedness, cost, risk)
  J-->>U: Chosen plan + rationale
\`\`\`
\`\`\`python
rubric = {
  "criteria": [
    {"name": "groundedness", "weight": 0.4},
    {"name": "completeness", "weight": 0.3},
    {"name": "risk/cost", "weight": 0.3}
  ]
}
proposals = [debater_a.propose(spec), debater_b.propose(spec)]
cross = cross_exam(proposals)
judgment = judge.score(proposals, cross, rubric)
selected = max(judgment, key=lambda j: j["score"])  # returns proposal + rationale
\`\`\`
---

### 3) Router / Specialist

- Classify intent; dispatch to the best specialist (small model first)
- Improves cost/latency; isolates prompts by domain
- Add backpressure: quotas and concurrency per lane
\`\`\`mermaid
flowchart LR
  In[Incoming Task] --> RT{Router: intent + risk}
  RT -->|billing| B[Billing Agent]
  RT -->|tech| T[Tech Agent]
  RT -->|legal| L[Legal Agent]
  B & T & L --> C[Critic/Policy]
  C --> Out[Resolution]
\`\`\`
\`\`\`python
def route(task):
    label = tiny_model.classify(task.text, labels=["billing","tech","legal","other"])
    risk = tiny_model.score(task.text, dimension="risk")
    lane = {
      "billing": billing_agent,
      "tech": tech_agent,
      "legal": legal_agent
    }.get(label, generalist_agent)
    return lane, {"risk": risk, "label": label}

agent, meta = route(task)
out = agent.run(task)
verdict = critic.evaluate(out, policy=min("strict", meta["risk"]))
\`\`\`
---

### 4) Constitutional Guardrails

- Rules-as-code: constrain outputs, tools, and data flows
- Automate refusals and repairs before results escape the sandbox
- Treat as a judiciary distinct from critics of quality
\`\`\`mermaid
flowchart TD
  X[Agent Output/Action] --> Y[Rule Engine]
  Y -->|violation| R[Repair prompt or refuse]
  Y -->|compliant| Z[Pass to Critic/Judge]
\`\`\`
\`\`\`yaml
# guardrails.yml
rules:
  - id: PII-001
    when: output.contains_pii == true
    action: redact
    severity: high
  - id: TOOL-004
    when: tool.name == "funds_transfer" and amount > 1000 and not approval_ticket
    action: block
    severity: critical
\`\`\`
\`\`\`python
def apply_guardrails(event, rules):
    for rule in rules:
        if evaluate(rule["when"], event):
            if rule["action"] == "block":
                return {"ok": False, "reason": rule["id"]}
            if rule["action"] == "redact":
                event["output"] = redact(event["output"]) 
    return {"ok": True, "event": event}
\`\`\`
---

### Composition: Pattern Diagram

- Start with PEC for structure; add Router for specialization
- Add Debate where uncertainty is high; enforce Guardrails everywhere
- Measure: first-pass yield, rounds to completion, cost/latency, violation rate
\`\`\`mermaid
flowchart LR
  U[User Goal] --> RT{Router}
  RT --> P[Planner]
  P --> EX[Executors]
  EX --> DB{Debate?}
  DB -->|yes| D[Debaters + Judge]
  DB -->|no| C[Critic]
  D --> C
  C --> GR{Guardrails}
  GR -->|pass| DONE[Deliver]
  GR -->|repair/refuse| P
\`\`\``;
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
      <h1>Control patterns that work: Planner→Executor→Critic, Debate, Router/Specialist, Constitutional Guardrails</h1>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            // Handle inline code
            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            
            // Handle mermaid diagrams
            if (language === 'mermaid') {
              return (
                <pre className="language-mermaid">
                  <code>{String(children).replace(/\n$/, '')}</code>
                </pre>
              );
            }
            
            // Handle code blocks with syntax highlighting
            if (language) {
              return (
                <SyntaxHighlighter
                  language={language}
                  style={atomDark}
                  showLineNumbers={true}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            
            // Default code block without highlighting
            return (
              <pre>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}