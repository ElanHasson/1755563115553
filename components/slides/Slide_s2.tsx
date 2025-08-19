import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

export default function Slide() {
  const markdown = `- We build societies, not solo agents: norms and governance beat raw IQ.
- Orchestration = contracts, coordination, critics, and budgets around non-deterministic learners.
- Topologies: Conductor, Blackboard, Marketplace — pick for control vs emergence.
- Governance turns uncertainty into reliability: schemas, policies, traces.
- Start centralized; evolve as needed. Your constitution matters more than your framework.

\`\`\`mermaid
flowchart LR
  User[User Goal]
  Const((Constitution\nContracts • Policies • Budgets))
  Orch[Orchestrator]
  Market[[Marketplace]]
  BB[(Blackboard)]
  Hub{Specialists}
  A1[Retriever]
  A2[Coder]
  A3[Compliance]
  Critic[Critic/Judge]
  Result[Reliable Outcome]

  User --> Const --> Orch
  Orch --> Market
  Orch --> BB
  Orch --> Hub
  Hub --> A1
  Hub --> A2
  Hub --> A3
  A1 --> BB
  A2 --> BB
  A3 --> Critic
  BB --> Critic
  Critic --> Orch
  Critic --> Result
\`\`\`

\`\`\`mermaid
classDiagram
  class Orchestrator {+plan() +assign() +verify()}
  class Agent {+run(input) +tools[]}
  class Tool {+name +argsSchema +invoke()}
  class Critic {+validate(output) +score()}
  class Memory {+write() +read()}

  Orchestrator --> Agent : schedules
  Agent --> Tool : calls
  Agent --> Memory : reads/writes
  Orchestrator --> Critic : requests eval
  Critic --> Agent : feedback
  Orchestrator --> Memory : traces
\`\`\`

\`\`\`python
# Governance wrapper: emergence within boundaries
def governed_run(task, agent, tools, budget):
    out = run_agent(agent, task, tools=tools, temperature=0.2)
    if not validate_schema(out, task.schema):
        return repair(task, out, reason="schema")
    if not policy_check(out, task.policies):
        return repair(task, out, reason="policy")
    if exceeded_budget(budget):
        raise BudgetExceeded()
    trace_log(task, out, tools=tools, metrics=out.metrics)
    return out
\`\`\`
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
      <h1>Why Orchestration? We don’t build agents—we build societies (philosophical frame)</h1>
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