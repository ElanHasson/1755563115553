import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

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
\`\`\``;
  
  return (
    <div className="slide markdown-slide">
      <h1>Why Orchestration? We don’t build agents—we build societies</h1>
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