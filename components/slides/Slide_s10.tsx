import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Slide() {
  const markdown = `- We don't eliminate uncertainty; we instrument it. Build feedback loops first, features second.
- Make success observable: traces, metrics, evaluations, and gates.
- Treat models like dependencies: version, test, canary, and roll back.

### Ops diagram: from runs to decisions
\`\`\`mermaid
flowchart TD
    U[User Goal / Task] --> R[Run Orchestration]
    R --> T[Trace Spans\n(prompts, tools, costs, latencies)]
    T --> O[Offline Replay / Evals]
    O --> M[Metrics\n(success, FPY, p50/p95, cost, validator fail)]
    M --> G[Regression Gate\n(compare vs goldens & SLOs)]
    G -->|pass| C[Canary Rollout]
    G -->|fail| RB[Rollback]
    C --> FR[Full Release]
    C -->|degrade| RB
    RB --> R
\`\`\`

### Minimal tracing (OpenTelemetry-style)
\`\`\`python
from contextlib import contextmanager
from time import monotonic

@contextmanager
def span(name, attrs=None):
    t0 = monotonic()
    try:
        yield
        status = "OK"
    except Exception as e:
        status = f"ERR:{type(e).__name__}"
        raise
    finally:
        t1 = monotonic()
        log_span({
            "name": name,
            "duration_ms": int((t1 - t0)*1000),
            **(attrs or {}),
            "status": status,
        })

with span("agent.run", {"model": "gpt-4o", "run_id": run_id}):
    out = model.generate(prompt, response_format=schema)
    validate(out)
\`\`\`

### Metrics you can act on
- Task success rate, first-pass yield, rounds-to-done
- Latency p50/p95, cost per task, tool success rate
- Validator failure rate, groundedness/citation coverage
- Drift: content change, embedding shift, prompt injection hits

\`\`\`mermaid
classDiagram
class Effectiveness {
  +success_rate%
  +first_pass_yield%
  +rounds_to_done
}
class Efficiency {
  +latency_p50/p95_ms
  +cost_per_task$
}
class Reliability {
  +tool_success_rate%
  +validator_fail_rate%
}
class Drift {
  +embedding_shift
  +source_content_change
}
Effectiveness <|-- Metrics
Efficiency <|-- Metrics
Reliability <|-- Metrics
Drift <|-- Metrics
class Metrics
\`\`\`

### Canary and rollback (sequence)
\`\`\`mermaid
sequenceDiagram
  participant User
  participant Router
  participant Stable as StableModel
  participant Canary as CanaryModel
  participant Judge as Evaluator
  participant Gate
  User->>Router: request
  Router->>Stable: 90% traffic
  Router->>Canary: 10% traffic
  Canary-->>Judge: output + trace
  Judge-->>Gate: scores (quality, latency, cost)
  Gate-->>Router: adjust split / rollback if thresholds violated
\`\`\`

### Regression + canary guard (offline + online)
\`\`\`python
# Offline: replay traces against new model and compare to goldens
results = replay_suite(traces, model="gpt-4o.2025-08")
metrics = compute_metrics(results, goldens)

assert metrics["success_rate"] >= 0.98
assert metrics["latency_p95_ms"] <= 1.10 * baseline["latency_p95_ms"]
assert metrics["validator_fail_rate"] <= baseline["validator_fail_rate"]

# Online: simple canary controller
if window.qoQ_drop("success_rate") > 2.0 or window.latency_p95_ms > SLO:
    rollback(version="gpt-4o.2025-08")
    page_oncall("quality regression detected")
\`\`\`

### Micro-checklist
- Version everything: prompts, models, tools, policies
- Trace every step; redact at write-time; link to run_id
- Maintain goldens; require regression gates before rollout
- Canary with auto-rollback; keep a kill switch
- Review metrics weekly; tune budgets, timeouts, and validators`;
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
      <h1>Operate like an engineer: evaluation, metrics, tracing, regression and canaries — Ops Diagram</h1>
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