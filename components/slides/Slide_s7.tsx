import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

export default function Slide() {
  const markdown = `**Why non-determinism matters (and why we don’t fight it, we frame it)**
- Uncertainty is a feature of learning systems; our job is to bound it with contracts.
- Govern with schemas, sampling discipline, validation layers, and repair loops.
- Separate creative phases from precise phases to reduce chaos where it hurts.
- Trace everything: runs, tools, costs, and decisions become your debugger.

\`\`\`mermaid
flowchart LR
  U[User Goal] --> O[Orchestrator]
  O --> A[Agent(s)]
  A -->|Outputs| V[Validators]
  V -->|Pass| R[Result]
  V -->|Fail| F[Repair Loop]
  F --> A
\`\`\`

**Schemas and contracts (make uncertainty legible)**
- Use strict JSON Schema or function-calling for outputs.
- Deny unknown fields; enforce enums and patterns.
- Version schemas; pin model versions per schema.
- Fail fast on schema errors; never silently coerce.

\`\`\`ts
// TypeScript: strict agent output schema using AJV
import Ajv from "ajv";
const ajv = new Ajv({allErrors: true, strict: true});

const outputSchema = {
  $id: "agent.output.v1",
  type: "object",
  additionalProperties: false,
  required: ["status", "structured_result", "tool_calls", "metrics"],
  properties: {
    status: { enum: ["ok", "needs_more_info", "fail"] },
    structured_result: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "citations"],
      properties: {
        summary: { type: "string", minLength: 1 },
        citations: {
          type: "array",
          items: { type: "string", pattern: "^CIT-\\d+$" },
          minItems: 1
        }
      }
    },
    tool_calls: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "args", "status"],
        properties: {
          name: { type: "string" },
          args: { type: "object" },
          status: { enum: ["success", "error"] }
        }
      }
    },
    metrics: {
      type: "object",
      additionalProperties: false,
      required: ["tokens", "latency_ms"],
      properties: {
        tokens: { type: "integer", minimum: 0 },
        latency_ms: { type: "integer", minimum: 0 }
      }
    }
  }
};

const validate = ajv.compile(outputSchema);
export function check(output: unknown) {
  if (!validate(output)) throw new Error(ajv.errorsText(validate.errors));
  return output; // typed and trusted
}
\`\`\`

**Sampling discipline (separate creativity from precision)**
- Low temperature for schema-bound steps; higher for ideation.
- Use best-of-N with a judge for brittle steps; keep N small.
- Fix seeds where supported; otherwise log logprobs for audit.
- Stable prompts: canonical templates; explicit role and constraints.

\`\`\`python
# Python-like pseudocode
PHASES = {
  "plan":    dict(temp=0.7, top_p=0.95, n=1),     # creative
  "execute": dict(temp=0.2, top_p=0.9,  n=1),     # precise
  "critique":dict(temp=0.0, top_p=1.0,  n=3)      # judge best-of-3
}

def run_step(phase, prompt, schema=None):
  cfg = PHASES[phase]
  outs = [model.generate(prompt,
                         temperature=cfg["temp"],
                         top_p=cfg["top_p"],
                         response_format=schema) for _ in range(cfg["n"])]
  if phase == "critique":
    return judge_select(outs)  # LLM-as-judge with rubric + deterministic checks
  return outs[0]
\`\`\`

**Validation layers (syntax → semantics → policy)**
- Syntax: JSON schema, type checks, allowed enums.
- Semantics: business rules, unit checks, referential integrity.
- Policy: compliance, safety, PII, tool permissions.
- Tool execution: dry-run, idempotency, side-effect gating.

\`\`\`mermaid
flowchart TD
  O[Agent Output] --> S[Schema Validator]
  S -->|ok| B[Business Rules]
  S -->|fail| RP[Repair]
  B -->|ok| P[Policy & Safety]
  B -->|fail| RP
  P -->|ok| AC[Accept]
  P -->|fail| RJ[Reject or Human]
  RP --> O
\`\`\`

**Repair loops (tight, bounded, and typed)**
- Always include a reason for failure and a targeted fix hint.
- Limit iterations; add circuit breakers and fallbacks.
- Prefer surgical edits over full re-generation.

\`\`\`python
MAX_ITERS = 3

def repair_loop(task, attempt):
  for i in range(MAX_ITERS):
    try:
      out = run_agent(task)
      validate_schema(out)
      check_business_rules(out)
      check_policy(out)
      return out  # success
    except ValidationError as e:
      attempt = attempt + 1
      hint = make_repair_hint(e)  # cite exact path: e.g., $.citations[0]
      task.prompt = inject_hint(task.prompt, hint)
      if attempt >= MAX_ITERS:
        return hard_fail(e)
  return hard_fail("exceeded repairs")
\`\`\`

\`\`\`mermaid
sequenceDiagram
  participant A as Agent
  participant V as Validators
  participant R as Repairer
  A->>V: Produce JSON output
  V-->>A: Schema error at $.citations[0]
  V->>R: Emit repair hint + diff
  R-->>A: Apply targeted fix instruction
  A->>V: Regenerate minimally
  V-->>A: Pass
\`\`\`

**Quality Control Diagram (integrated in orchestration)**
- Planner→Executor→Validator→Critic→Repair→Trace.
- Every edge logged with metrics and provenance.
- Accept only when all gates pass or escalate.

\`\`\`mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant O as Orchestrator
  participant P as Planner
  participant X as Executor
  participant T as Tool(s)
  participant V as Validators
  participant C as Critic/Judge
  participant B as Blackboard/Trace

  U->>O: Goal + constraints
  O->>P: Decompose into tasks (DAG)
  P-->>O: Tasks + deps
  loop ready tasks
    O->>X: Assign task + schema + budget
    X->>T: Tool calls (sandboxed)
    T-->>X: Typed results
    X-->>V: Structured output (JSON)
    V-->>C: Validated artifact or errors
    alt pass
      C-->>O: Accept
      O->>B: Log artifact + metrics
    else fail
      C-->>O: Reasons + repair hints
      O->>X: Repair with targeted instructions
    end
  end
  O-->>U: Final result + trace id
\`\`\`

**Metrics, budgets, and drift checks (close the loop)**
- Track first-pass yield, rounds-to-accept, p95 latency, cost.
- Budget caps per agent; circuit breakers on repeated failures.
- Regression tests on schema/rules/model updates.

\`\`\`mermaid
pie title Validation failure taxonomy (last 7 days)
  "Schema" : 35
  "Business rules" : 25
  "Policy" : 15
  "Tool errors" : 20
  "Other" : 5
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
      <h1>Taming non‑determinism: schemas, sampling discipline, validation layers, repair loops — Quality Control Diagram</h1>
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