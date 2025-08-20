import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

export default function Slide() {
  const markdown = `- Live poll: What's your risk appetite today?
  - Low: tight contracts, deterministic paths, human approvals
  - Medium: guardrails + critics + canaries; ship within budgets
  - High: explore emergence; recover with monitors and rollbacks
  - Vote in the poll panel; we’ll tailor the Q&A based on results
\`\`\`mermaid
pie title Risk appetite (sample)
  "Low" : 40
  "Medium" : 45
  "High" : 15
\`\`\`
- Lightning Q&A themes (fast takes)
  - Traps: prompt injection, ungrounded claims, hidden coupling
  - Budgets: tokens, tool calls, wall-clock; per-agent caps
  - Loops: step limits, heartbeats, similarity checks, circuit breakers
- Budget governor (first principles)
\`\`\`python
class Budget:
    def __init__(self, tokens=20000, tools=50, seconds=120):
        self.tokens=tokens; self.tools=tools; self.deadline=time.time()+seconds
    def allow_call(self, cost_tokens=0, tool=False):
        if time.time()>self.deadline: return False, "time"
        if self.tokens - cost_tokens < 0: return False, "tokens"
        if tool and self.tools - 1 < 0: return False, "tools"
        self.tokens -= cost_tokens; self.tools -= int(tool); return True, None
\`\`\`
- Loop guard (stop the spin)
\`\`\`python
def should_stop(iter_i, last, curr, max_iter=8, sim_thr=0.97):
    if iter_i >= max_iter: return True, "max_iter"
    if heartbeat_missed(): return True, "heartbeat"
    if cosine_sim(emb(last), emb(curr)) > sim_thr: return True, "stagnation"
    return False, None
\`\`\`
\`\`\`mermaid
flowchart TD
  A[Task start] --> B{Exceeded limits?}
  B -->|yes| X[Stop & escalate]
  B -->|no| C[Execute agent]
  C --> D[Validate: schema + rules + policy]
  D -->|fail| E[Repair or backoff]
  E --> F{Loop guard}
  F -->|trip| X
  F -->|safe| B
  D -->|pass| G[Commit artifact]
  G --> H{All goals met?}
  H -->|yes| Y[Finish]
  H -->|no| B
\`\`\`
- Philosophical pointer
  - We don’t eliminate uncertainty; we circumscribe it with contracts, critics, and budgets
  - Your constitution > your framework; frameworks just make the constitution executable`;
  
  return (
    <div className="slide markdown-slide">
      <h1>Interactive: live poll (risk appetite) + Q&amp;A lightning round (traps, budgets, loops)</h1>
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