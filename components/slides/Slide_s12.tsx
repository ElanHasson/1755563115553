import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

export default function Slide() {
  const markdown = `- **Your constitution > your framework**
  - Define success, non‑negotiables, and accountability first
  - Contracts: agent I/O schemas, tool scopes, budgets, validators
  - Governance beats knobs: iterate the rules, then swap frameworks
- **Concrete next steps (7‑day sprint)**
  - Day 1: Write the constitution (goals, hard no’s, guardrails)
  - Day 2: Sketch a simple DAG; pick centralized orchestrator to start
  - Day 3: Implement Planner + Critic first; keep agent contracts tiny
  - Day 4–5: Add tracing, golden tests, policy validators
  - Day 6–7: Canary a pilot; set kill switch; measure p50/p95, FPY
\`\`\`json
{
  "success": {"acceptance": "goldens pass", "sla_ms": 8000},
  "hard_nos": ["unguarded code exec", "PII exfil"],
  "agents": {
    "research": {"in": "Goal", "out": "Evidence[]", "tools": ["search_web"], "budget": {"tokens": 2000}},
    "draft": {"in": "Outline+Evidence", "out": "Draft", "tools": ["extract_citations"], "budget": {"tokens": 3000}}
  },
  "validators": [
    {"name": "schema"},
    {"name": "policy", "rules": ["no-ungrounded-claims", "no-PII"]},
    {"name": "citations", "type": "function", "args": {"coverage": 1.0}}
  ],
  "orchestration": {"topology": "centralized", "max_iterations": 6, "concurrency": 4},
  "observability": {"trace": true, "redaction": "PII", "run_id": "uuid"}
}
\`\`\`
\`\`\`mermaid
flowchart LR
  C["Constitution\n(contracts, policies, evals)"] --> O[Orchestrator/DAG]
  O --> P[Planner]
  O --> A1[Agents]
  O --> V[Validators/Critic]
  A1 --> T[Tools]
  V -->|accept/fix| O
  O --> R[Result + Trace]
\`\`\`
\`\`\`mermaid
gantt
  title Week-1 Implementation Plan
  dateFormat  X
  section Define
  Constitution Doc           :a1, 0, 1
  section Build
  Planner + Critic           :a2, 1, 2
  Orchestrator Skeleton      :a3, 2, 1
  Tracing + Goldens          :a4, 3, 2
  section Operate
  Canary + Kill Switch       :a5, 5, 2
\`\`\`
- **Resources to keep you honest**
  - Patterns: planner–executor, critique–refine, router–specialist, blackboard
  - Eval: goldens, LLM-as-judge + deterministic checks, offline replay
  - Ops & safety: OpenTelemetry-like traces, least-privilege tools, redaction
  - Framework zone: pick any graph/DAG + function-calling + vector store + sandbox; version everything`;
  
  return (
    <div className="slide markdown-slide">
      <h1>Closing: your constitution &gt; your framework — concrete next steps and resources</h1>
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
                <Mermaid chart={String(children).replace(/\n$/, '')} />
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