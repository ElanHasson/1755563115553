import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Slide() {
  const markdown = `- We don't eliminate uncertainty; we bound it with contracts
- From goal -> plan (DAG) -> execute with tools -> verify -> converge
- We'll live-build 4 primitives: agent contract, tool adapter, planner skeleton, orchestrator loop
- Philosophy: choose norms and let emergence happen inside guardrails
---

## Agent contract (small, strict)
- Inputs: context, allowed tools, budget/timeouts, memory slice
- Outputs: structured_result, tool_calls, next_actions, metrics
- Determinism via JSON schema + validator
\`\`\`json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AgentOutput",
  "type": "object",
  "properties": {
    "structured_result": {"type": "object"},
    "tool_calls": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "args": {"type": "object"},
          "status": {"type": "string", "enum": ["success", "error"]}
        },
        "required": ["name", "args", "status"],
        "additionalProperties": false
      }
    },
    "next_actions": {"type": "array", "items": {"type": "string"}},
    "metrics": {
      "type": "object",
      "properties": {
        "tokens": {"type": "integer"},
        "latency_ms": {"type": "number"},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1}
      },
      "required": ["tokens", "latency_ms"]
    }
  },
  "required": ["structured_result", "tool_calls", "metrics"],
  "additionalProperties": false
}
\`\`\`
\`\`\`python
# minimal, framework-agnostic agent runner
from jsonschema import validate, ValidationError

def run_agent(input_ctx, model, schema, system_prompt):
    prompt = system_prompt.format(**input_ctx)
    raw = model.generate(prompt, temperature=0.2, response_format="json")
    try:
        validate(instance=raw, schema=schema)
    except ValidationError as e:
        return {"ok": False, "error": f"schema_error: {e.message}", "raw": raw}
    return {"ok": True, "value": raw}
\`\`\`
---

## Tool adapter (typed, sandboxed)
- Name/version, JSON args, typed return
- Side-effect policy: read-only vs write; idempotency_key
- Retries with backoff, timeouts, quotas
\`\`\`python
from pydantic import BaseModel, Field
import time

class SearchArgs(BaseModel):
    query: str
    top_k: int = Field(5, ge=1, le=10)

class SearchResult(BaseModel):
    items: list[dict]  # {title, url, snippet}

class Tool:
    def __init__(self, name, version, func, read_only=True):
        self.name = name; self.version = version
        self.func = func; self.read_only = read_only

    def call(self, args: BaseModel, timeout_s=8, idempotency_key=None):
        start = time.time()
        # quota, rate-limit, and sandbox checks go here
        out = self.func(args)
        if time.time() - start > timeout_s:
            raise TimeoutError(self.name)
        return out

# example adapter
def search_web(args: SearchArgs) -> SearchResult:
    # call your API here; mock for demo
    return SearchResult(items=[{"title": "Doc", "url": "https://...", "snippet": "..."}])

SEARCH_TOOL = Tool("search_web", "1.0.0", search_web, read_only=True)
\`\`\`
---

## Planner skeleton (decompose -> DAG)
- Returns tasks and dependencies
- Keep it explicit and auditable
\`\`\`python
def plan(goal: str, constraints: dict):
    tasks = [
        {"id": "A", "name": "research", "budget": 0.01},
        {"id": "B", "name": "outline",  "budget": 0.005},
        {"id": "C", "name": "draft",    "budget": 0.03},
        {"id": "D", "name": "review",   "budget": 0.005},
    ]
    deps = [("A", "C"), ("B", "C"), ("C", "D")]  # edges: from -> to
    return {"tasks": tasks, "deps": deps}
\`\`\`
---

## Orchestrator loop (centralized)
- Ready set = tasks with deps satisfied
- Parallelize independent tasks
- Validate, update DAG, handle failures
\`\`\`python
from concurrent.futures import ThreadPoolExecutor

def orchestrate(goal, model):
    st = {"plan": plan(goal, {}), "artifacts": {}, "failures": {}, "done": False}
    with ThreadPoolExecutor(max_workers=3) as pool:
        while not st["done"]:
            runnable = [t for t in st["plan"]["tasks"] if ready(t, st)]
            if not runnable: break
            futures = [pool.submit(run_task, t, model, st) for t in runnable]
            for f in futures: f.result()
            st["done"] = all_completed(st)
    return assemble(st)

# helper stubs: ready, run_task, all_completed, assemble
\`\`\`
---

## DAG: planner -> executors -> critic
\`\`\`mermaid
graph LR
  A[Research] --> C[Draft]
  B[Outline] --> C
  C --> D[Review]
  D -->|accept| E[Done]
  D -.->|fix| C
\`\`\`
---

## Execution sequence (one task)
\`\`\`mermaid
sequenceDiagram
  participant U as User Goal
  participant O as Orchestrator
  participant P as Planner
  participant X as Agent(Executor)
  participant T as Tool(search_web)
  participant C as Critic

  U->>O: goal
  O->>P: plan(goal)
  P-->>O: tasks + DAG
  O->>X: run(research, tools=[T])
  X->>T: call(query)
  T-->>X: results
  X-->>O: JSON output
  O->>C: validate(output)
  C-->>O: accept/fix
  O-->>U: artifact or iteration
\`\`\`
---

## Flow control with quality gates
- Schema -> business rules -> policy -> accept/repair
- Circuit breakers, retries, max-iterations
\`\`\`mermaid
flowchart TD
  S[Start] --> R[Ready tasks]
  R --> E[Execute agent]
  E --> V[Validate output]
  V -->|pass| UDT[Update DAG]
  V -->|fail| RP[Repair/Retry]
  RP --> R
  UDT --> D{All done?}
  D -->|yes| F[Finish]
  D -->|no| R
\`\`\`
---

## Minimal live test outline
- Run planner -> view DAG
- Execute research with \`SEARCH_TOOL\`
- Validate via schema + critic
- Update DAG and iterate`;
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
      <h1>Live build from first principles: agent contracts, tool adapters, planner skeleton, orchestrator loop</h1>
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