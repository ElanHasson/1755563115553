import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Slide() {
  const markdown = `## What we’re building + success criteria
- End-to-end research-and-write pipeline with citations and a critic gate
- Contracts: strict JSON outputs; tools and budgets per agent
- Deterministic quality gates: schema + citation validator
- Full trace: spans, tool calls, tokens, latency, verdicts
- Philosophy: we don’t remove uncertainty; we bound it with governance

\`\`\`json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DraftWithCitations",
  "type": "object",
  "required": ["title", "sections", "citations"],
  "properties": {
    "title": {"type": "string"},
    "sections": {"type": "array", "items": {"type": "string"}},
    "claims": {
      "type": "array",
      "items": {"type": "object", "required": ["text", "citation_ids"],
        "properties": {
          "text": {"type": "string"},
          "citation_ids": {"type": "array", "items": {"type": "string"}}
        }
      }
    },
    "citations": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["url", "quote"],
        "properties": {"url": {"type": "string"}, "quote": {"type": "string"}}
      }
    }
  }
}
\`\`\`

## System at a glance (conductor topology)
\`\`\`mermaid
flowchart TD
  U[User Brief] --> P[Planner]
  P --> R[Research Agent]
  R -->|search_web/get_pdf| T[(Evidence Store)]
  R --> O[Outline Agent]
  O --> D[Draft Agent]
  D --> C[Critic/Judge]
  C -->|accept| F[Final Report]
  C -->|repair| R
  subgraph Observability
    X[Trace Collector]\n(spans, costs, latencies)
  end
  R -.-> X
  D -.-> X
  C -.-> X
  T -. provenance .-> D
\`\`\`

## Agent contracts + tools (framework-agnostic)
- Small, strict interfaces; least-privilege tools
- Separate creative vs precise steps via temperatures
- Deterministic validators before/after model calls

\`\`\`python
AgentInput = TypedDict("AgentInput", {
  "task": str, "constraints": dict, "tools": list, "memory": dict,
  "budget": {"tokens": int, "seconds": int}
})

AgentOutput = TypedDict("AgentOutput", {
  "result": dict, "tool_calls": list, "next_actions": list,
  "metrics": {"tokens": int, "latency_ms": int, "confidence": float}
})

@dataclass
class Tool:
    name: str; version: str; schema: dict; fn: Callable

def search_web(query: str) -> list[dict]: ...  # deterministic args, typed return

def citation_check(draft: dict, evidence: dict) -> tuple[bool, str]:
    for claim in draft.get("claims", []):
        for cid in claim.get("citation_ids", []):
            if cid not in evidence: return (False, f"Missing citation: {cid}")
    return (True, "ok")
\`\`\`

## Orchestrator loop + quality gates
- Plan -> assign -> execute -> verify -> repair-or-accept
- Parallelize independents; enforce budgets; circuit breakers
- Log every span with inputs/outputs (redacted), tokens, costs

\`\`\`python
DAG = plan(goal)
state = init_state(DAG)
while ready := next_ready(DAG, state):
    for task in ready:
        agent = assign(task)
        out = run_agent(agent, task, tools=allowed(task), temp=task.temp)
        ok, why = validate_schema(out, task.schema)
        if ok and task.name == "draft":
            ok, why = citation_check(out["result"], state.evidence)
        record_span(task, out, verdict=ok, note=why)
        if ok: commit(state, task, out)
        else: repair(state, task, why)
        if exceeded_limits(state): break
final = assemble(state)
\`\`\`

\`\`\`mermaid
flowchart LR
  A[Agent Output] --> S[Schema Validator]
  S -->|pass| R1[Rules/Business Checks]
  S -->|fail| Fix1[Repair]
  R1 -->|pass| J[Critic/Judge]
  R1 -->|fail| Fix2[Repair]
  J -->|accept| Done[Publish]
  J -->|request fix| Fix3[Repair Loop]
\`\`\`

## End-to-end trace (demo view)
- Spans capture dependencies, tools, verdicts
- Enables replay, regression, and cost/latency analysis

\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant P as Planner
  participant R as Research
  participant E as EvidenceStore
  participant D as Draft
  participant C as Critic
  U->>P: goal
  P->>R: task: research
  R->>E: write evidence {id:url, quote}
  P->>D: task: draft + memory slice
  D->>E: read citations
  D-->>C: draft.json (claims, citation_ids)
  C-->>D: missing citation -> request repair
  D->>E: add citation
  D-->>C: revised draft
  C-->>P: accept
\`\`\`

\`\`\`json
[
  {"id":"1","name":"plan","dur_ms":120,"tokens":420},
  {"id":"2","parent":"1","name":"research","dur_ms":9800,
   "tool_calls":[{"tool":"search_web","q":"sodium-ion batteries 2024"}],
   "artifacts":3},
  {"id":"3","parent":"1","name":"draft","dur_ms":4200,
   "tokens":860, "citations_used":["c1","c2"]},
  {"id":"4","parent":"3","name":"critic:citation_check","dur_ms":60,
   "verdict":"fail","reason":"Missing citation: c3"},
  {"id":"5","parent":"3","name":"draft:repair","dur_ms":1800,
   "tokens":220, "citations_used":["c1","c2","c3"]},
  {"id":"6","parent":"3","name":"critic:citation_check","dur_ms":55,
   "verdict":"accept"}
]
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
      <h1>Case study demo: research‑and‑write pipeline with citations and critics — End‑to‑End Trace</h1>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(w+)/.exec(className || '');
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