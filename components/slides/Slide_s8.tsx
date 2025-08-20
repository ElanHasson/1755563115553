import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

export default function Slide() {
  const markdown = `- We design agent societies with memory and law. Safety emerges from boundaries, not from wishes.
- Govern state explicitly: what can be remembered, for how long, and by whom.
- Make PII flows visible and enforceable at write-time, not after an incident.
- Sandboxing and prompt-injection defenses are architectural patterns, not bolt-on filters.
---

### State and Memory Boundaries (safety by construction)
- Treat state as a first-class resource: run-state, blackboard, long-term memory.
- Apply TTLs, summarization with provenance, and access policies per agent.
- Separate system, user, and retrieved context; sign what must not change.
\`\`\`mermaid
flowchart LR
  U[User Goal] --> O[Orchestrator]
  O --> A1[Agent A]
  O --> A2[Agent B]
  A1 & A2 --> BB[(Blackboard)]
  BB --> SUM[Summarizer]
  SUM --> BB
  BB --> PII{PII Gate}
  PII -->|redact| BB
  C[Critic/Policy] --> BB
  O --> Trace[(Trace & Budgets)]
\`\`\`
\`\`\`json
// Example: memory slice contract surfaced to an agent
{
  "memory": {
    "run_scratch": {"ttl_s": 3600},
    "blackboard_view": ["artifact:task-123", "artifact:policy-summary"],
    "long_term_keys": ["case:similar-requests"],
    "provenance_required": true
  }
}
\`\`\`
---

### PII Governance: lifecycle and redaction
- Classify and redact at ingestion; store only what policy allows.
- Tag artifacts with sensitivity, retention, and lineage.
- Audit every read/write; default deny for cross-domain access.
\`\`\`mermaid
sequenceDiagram
  participant U as User/Input
  participant I as Ingest
  participant C as Classifier
  participant R as Redactor
  participant E as Evidence Store
  participant RM as Retention Manager
  U->>I: submit data
  I->>C: detect PII classes
  C-->>I: labels (email, phone, secret)
  I->>R: redact/transform
  R-->>E: write redacted + hashes + provenance
  RM-->>E: enforce TTL/holds
\`\`\`
\`\`\`python
# Python: write-time PII scrubber with provenance
PII_PATTERNS = {
    "email": r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
    "phone": r"\\+?\\d[\\d\\-\\s]{7,}\\d",
    "ssn": r"\\b\\d{3}-\\d{2}-\\d{4}\\b"
}

def scrub(record, policy, source):
    labels = {k: bool(re.search(v, record)) for k, v in PII_PATTERNS.items()}
    redacted = record
    for label, pat in PII_PATTERNS.items():
        if labels[label] and policy["pii"][label]["redact"]:
            redacted = re.sub(pat, f"{{{{{label}_redacted}}}}", redacted)
    return {
        "text": redacted,
        "provenance": {"source": source, "hash": sha256(record)},
        "labels": labels,
        "retention": policy["retention"],
    }
\`\`\`
---

### Sandboxing and Least Privilege for Tools
- Per-run credentials; scope networks, files, and side effects.
- Deny-by-default egress; allowlist domains and methods.
- Time, memory, and rate limits per tool call.
\`\`\`mermaid
graph LR
  A[Agent] --> TP[Tool Proxy]
  TP --> PE[Policy Engine]
  PE --> SB[Sandbox]
  SB --> EXT[(External APIs/DBs)]
  Vault[(Secrets Vault)] --> TP
  Logs[(Audit/Trace)] --> PE
\`\`\`
\`\`\`yaml
# Tool sandbox policy (YAML)
version: 1
tools:
  search_web:
    network:
      egress_allow: ["https://api.duckduckgo.com", "https://example.com"]
    filesystem: {read: [], write: []}
    cpu_ms: 200, mem_mb: 128, timeout_s: 5, rate_per_min: 30
  update_customer:
    side_effects: write
    approvals: ["risk_owner"]  # requires explicit approval token
    network: {egress_allow: ["https://internal.api"]}
    scopes: ["customer:read", "customer:write:masked"]
\`\`\`
---

### Prompt-Injection Defenses: layered and explicit
- Segment system, user, and retrieved text; never merge blindly.
- Require justification tied to signed context IDs before risky actions.
- Validate intents; refuse attempts to alter policy or jailbreak.
\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant R as Retriever
  participant S as Segmenter
  participant L as LLM Agent
  participant P as Policy/Guard
  participant G as Tool Gate
  U->>S: user_msg
  R-->>S: docs_with_signatures
  S-->>L: {system, user, context[]}
  L->>P: propose tool_call + justification
  P-->>G: validate against rules & signatures
  alt injection detected
    G-->>L: reject + ask for grounded plan
  else allowed
    G-->>Tool: execute
  end
\`\`\`
\`\`\`python
# Tool gating with justification & signature checks
@dataclass
class ToolProposal:
    name: str
    args: dict
    justification: str
    cited_context_ids: list[str]

def guard(proposal: ToolProposal, context_index, policy) -> bool:
    if proposal.name in policy.denylist:
        return False
    if is_instruction_injection(proposal.justification):
        return False
    if policy.requires_context[proposal.name]:
        if not proposal.cited_context_ids:
            return False
        if not all(context_index.is_signed(cid) for cid in proposal.cited_context_ids):
            return False
    return risk_score(proposal) <= policy.max_risk
\`\`\`
---

### Governance Diagram: control plane around non-determinism
- Contracts + schemas limit behavior; critics and rules verify.
- Budgets, traces, and audits make emergence observable and steerable.
- Human-in-the-loop for high-risk branches.
\`\`\`mermaid
flowchart TD
  Plan[Planner/DAG] --> Exec[Executors]
  Exec --> Valid[Schema + Policy Validators]
  Valid --> Critic[Critic/Judge]
  Critic -->|fix or accept| Exec
  Valid -->|pass| Done[Resolution]
  subgraph Controls
    Bud[Budgets/Quotas]
    Tr[Trace/Audit]
    HR[Human Review]
  end
  Exec -.-> Bud
  Exec -.-> Tr
  Critic -.-> HR
\`\`\`
\`\`\`json
// Structured output contract with tool-call ledger
{
  "result": {"type": "object", "properties": {"answer": {"type": "string"}}},
  "tool_calls": [{
    "name": "update_customer",
    "args": {"id": "123", "fields": {"email": "{email_redacted}"}},
    "justification": "Requested by user; cites ctx:doc_77",
    "cited_context_ids": ["doc_77"],
    "risk": "medium",
    "approval_token": null,
    "status": "dry_run"
  }]
}
\`\`\``;
  
  return (
    <div className="slide markdown-slide">
      <h1>Memory, governance, and safety by construction: state, PII, sandboxing, prompt‑injection defenses</h1>
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