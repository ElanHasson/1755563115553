import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

export default function Slide() {
  const markdown = `- We don't build agents; we build societies of processes that negotiate meaning. Orchestration is institutional design under uncertainty.
- Core terms (fast pass):
  - **Agent** = perceives, reasons, acts via tools/messages.
  - **Tool** = callable capability (API, DB, code exec, retrieval).
  - **Orchestrator** = coordinates agents/tools toward a goal.
  - **Choreography** = no central conductor; agents follow shared protocols.
- When to prefer each:
  - **Orchestration**: strong SLAs, compliance, tight budgets, observability.
  - **Choreography**: scalability, resilience, local autonomy, loose coupling.

\`\`\`mermaid
flowchart LR
  subgraph SB["Diagram A — Contracts and Flows (System Boundary)"]
    IN[Inputs\n- Goal\n- Constraints\n- Tool permissions\n- Memory slice] --> ORCH[Orchestrator\nplan → assign → execute → verify]
    ORCH --> OUT[Outputs\n- Structured result\n- Trace\n- Metrics]
    ORCH --> TOOLS[(Tools/APIs)]
    ORCH --> MEM[(Shared Memory/Blackboard)]
  end
\`\`\`

- Orchestration lives or dies by contracts:
  - Keep agent I/O small and strict (JSON schemas, typed tools, budgets).
  - Separate creative vs. precise phases; allow emergence within boundaries.

\`\`\`mermaid
flowchart LR
  C[Context] --> A[Agent]
  T[(Tools)] --> A
  M[(Memory)] --> A
  A --> J[JSON Output]
  A --> TC[Tool Calls]
  A --> NA[Next Actions]
  %% Diagram B — Agent I/O
\`\`\`

- Validation is not an afterthought; it's the spine.
  - Layer checks: schema → business rules → policy → optional human.

\`\`\`mermaid
flowchart LR
  O[Agent Output] --> S[Schema Validation]
  S -- ok --> B[Business Rules]
  S -- fail --> R1[Repair/Refuse]
  B -- ok --> P[Policy/Safety]
  B -- fail --> R2[Repair/Refine]
  P -- ok --> H{Human?}
  P -- fail --> R3[Repair/Refuse]
  H -- approve --> D[Done]
  H -- request changes --> R4[Revise]
  %% Diagram E — Validation Layers
\`\`\`

- Minimal, buildable contracts (Python-ish):

\`\`\`python
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ValidationError

class ToolCall(BaseModel):
    name: str
    args: Dict[str, Any]
    status: str

class AgentInput(BaseModel):
    context: str
    resources: Dict[str, Any]  # tools allowed, budget, timeouts
    state: Dict[str, Any]      # memory slice, deps

class AgentOutput(BaseModel):
    structured_result: Dict[str, Any]
    tool_calls: List[ToolCall] = Field(default_factory=list)
    next_actions: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)

def run_agent(model, system_prompt: str, inp: AgentInput) -> AgentOutput:
    prompt = system_prompt.format(**inp.model_dump())
    raw = model.generate(prompt, response_format="json")
    try:
        return AgentOutput.model_validate_json(raw)
    except ValidationError as e:
        # deterministic repair: request self-fix with explicit schema hint
        repair_prompt = f"Return valid JSON per schema. Errors: {e}"
        fixed = model.generate(prompt + "\n" + repair_prompt, response_format="json")
        return AgentOutput.model_validate_json(fixed)

# Orchestrator hook: execute → validate → route

def execute_task(agent, validators: List, task: AgentInput) -> AgentOutput:
    out = run_agent(agent.model, agent.system_prompt, task)
    for v in validators:
        verdict = v(out)
        if not verdict.ok:
            out = agent.repair(task, verdict)
            break
    return out
\`\`\`

- Practical takeaways:
  - Start centralized; upgrade to blackboard/choreography when scale demands.
  - Version everything: prompts, tools, models, policies.
  - Treat traces as first-class: every step, tool, cost, and decision is a node on your graph.
  - Make quality gates explicit; never rely on regex-only parsing for critical paths.
`;
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
      <h1>What multi‑agent orchestration really means: Agents, Tools, Orchestrators, Choreo vs Orchestration — Diagrams A/B/E</h1>
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