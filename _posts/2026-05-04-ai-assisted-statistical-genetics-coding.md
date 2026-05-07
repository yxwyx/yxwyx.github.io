---
layout: post
title: "AI Agents in Statistical Genetics Coding: A Practical Guide"
date: 2026-05-04
tags: [AI, statistical genetics, coding, tutorial]
excerpt: "A practical guide to integrating AI coding agents — Copilot, Claude Code, Codex, and others — into statistical genetics research workflows, including tips for handling sensitive genomic data."
extra_css: /assets/css/blog.css
---

I'm a postdoctoral researcher at the Broad Institute working on statistical genetics. My projects span blood lipid GWAS meta-analysis across hundreds of thousands of participants, whole-genome sequencing in the TOPMed consortium, rare variant association testing in long non-coding RNAs, and functional genomics screens linking genetic regulatory effects to complex traits. These projects are coding-intensive: on any given day I might be writing R scripts for quality control, building GWAS pipelines in Python, submitting batch jobs to a UGER cluster, or debugging statistical models.

Over the past year, AI coding agents have fundamentally changed how I work. This post covers the tools I use, the concepts that make them effective, and practical patterns for statistical genetics specifically — including how to work safely with sensitive genomic data.

<p style="margin: 1.2em 0 0.5em"><a href="/assets/slides/ai-workflow-slides.html" target="_blank" rel="noopener" style="display:inline-block; background:#0f4d92; color:#fff; padding:6px 16px; border-radius:4px; text-decoration:none; font-size:0.88rem; font-family:sans-serif">&#9654; View as slides</a> <span style="font-size:0.82rem; color:#666; font-family:sans-serif">— 18-slide deck for lab meetings</span></p>

## The AI toolkit

### VS Code: the hub

All my AI tools live inside VS Code, which I use both locally and via remote SSH to cluster head nodes. This makes the IDE the natural integration point.

### GitHub Copilot

For Broad researchers, GitHub Copilot is available through BITS — no personal subscription needed. This makes it the lowest-friction entry point.

Copilot in VS Code has come a long way. The **Copilot Chat** panel now does most of what you'd get from a dedicated AI CLI: it can read files, make edits, run terminal commands, and work through multi-step tasks in your project. Recent additions make it especially useful:

- **Autopilot mode** runs tasks end-to-end without asking for approval on every step. VS Code added configurable approval levels — including an "approve all" option — so you can let the agent run uninterrupted, similar to using a CLI tool.
- **Auto model** lets the agent self-select the best model for each task. The pool includes Claude models, Codex, and Gemini. This is genuinely useful: simpler tasks route to faster, cheaper models, while complex reasoning gets a capable one. Copilot claims this delivers around 10% cost savings, though part of that may simply be cheaper models handling easier tasks.
- **Local models** are also supported — Qwen and custom endpoints if you have them. Open-source models have caught up substantially for routine tasks: boilerplate generation, simple refactoring, format conversions. They may be a few months behind on complex reasoning, but "a few months behind the best" is often fine for everyday research coding.

**One important note for Broad researchers**: starting June 1, 2026, [GitHub Copilot is moving to usage-based billing](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/). It is worth checking with BITS whether the enterprise agreement covers this or whether costs will change.

### Claude Code

Claude Code is a terminal-first AI coding agent from Anthropic. I use it as a personal subscription alongside Copilot. It operates in your shell, can read and write files across your project, run commands, and maintain context about your entire codebase. Its strength is in extended, multi-step tasks where having the full project context matters.

Claude Code introduces a few concepts worth knowing even if you use other agents, because the ideas transfer:

- **Memory**: persistent context that carries across sessions — your project structure, conventions, HPC environment details, which packages you prefer. You don't re-explain your setup every time.
- **Skills**: reusable, domain-specific capabilities you can invoke by name. Think of them as encoded expertise for recurring task types.
- **Hooks**: automated actions triggered by events — for example, running a linter after every file edit, or checking that a generated SLURM script has valid memory and partition settings before submission.
- **Multi-agents**: spawning parallel agents to explore different parts of a codebase or documentation simultaneously, with results feeding back into the main task.

### Other tools

I use **Codex** for quick one-off generation and explaining unfamiliar code, and **Gemini** when I need a large context window — processing long documentation, comparing multiple pipeline scripts, or working with lengthy summary statistics files.

## Setting up your agent for success: the context file

The single most impactful thing you can do before using any AI agent on a research project is give it explicit context about your environment. For Claude Code, this is a `CLAUDE.md` file at the project root. Copilot and other tools have equivalents (`.github/copilot-instructions.md` for Copilot, `AGENTS.md` for some others).

A good context file tells the agent:
- What the project is about scientifically
- Where things live (data directories, code directories, output paths)
- What environment it's running in (HPC scheduler, node types, container runtime)
- What tools and packages you use and prefer
- What coding conventions to follow
- What to avoid

Here's an example from one of my active projects:

```markdown
## Scientific Focus

- Prioritize statistical and biological correctness over surface-level style
- When reviewing analysis scripts, lead with the science before describing mechanics

## Project Structure

- Pipeline: limma differential expression → gene-level effect sizes →
  burden correlation → plots
- Key directories: ref_data/ (reference), results/ (per-analysis outputs),
  data/ (intermediate), results/

## HPC Environment (UGER / Grid Engine)

- Submit jobs with qsub; interactive sessions with qrsh
- GPU jobs require three flags: -l gpu=1, -l os=RedHat8, -hard
- Container runtime: podman (rootless, Docker CLI-compatible)
- GPU batch job template:
    #!/usr/bin/env bash
    #$ -l gpu=1
    #$ -l os=RedHat8
    #$ -hard
    #$ -l h_rt=HH:MM:SS
    #$ -l h_vmem=<N>G
    podman run --device nvidia.com/gpu=all --rm \
      --security-opt=label=disable <image> <command>

## Data Conventions

- Use ENSG IDs throughout (not gene symbols)

## Coding Standards

- R is primary; use data.table and apply family over loops
- Scripts must be self-contained with explicit seeds
- Keep commit messages ≤ 5 words
```

This kind of file turns generic AI suggestions into project-aware ones. The agent knows to write `data.table::fread` not `read.csv`, to target UGER not SLURM, to use `podman` not `docker`, and to reference ENSG IDs in any gene-level code. It takes twenty minutes to write and saves hours of corrections.

## The workflow: Explore, Plan, Implement, Commit

Regardless of which AI tool you use, this four-phase pattern produces better results than jumping straight to "write me a script."

### Explore

Before writing code, let the agent understand what already exists. Point it at your project and ask it to find existing implementations, read relevant documentation, or understand how a previous analysis was structured. This prevents reinventing the wheel and ensures new code is consistent with the rest of the project.

```
# Example prompt to an agent
"I need to run a rare variant burden test on TOPMed data.
Search this project for any existing STAAR or SKAT scripts.
Check the renv lockfile for which R packages are installed.
Look at how previous analyses handled variant annotation."
```

### Plan

Before writing code, outline the approach. What are the inputs and outputs? Which existing functions can be reused? What edge cases matter — missing phenotype data, multi-allelic variants, related individuals? For statistical genetics work, this step is especially important because a subtle mistake in variant filtering or covariate adjustment can invalidate an entire analysis.

Most AI agents support a plan-first mode. Use it. Review the plan before any code is written.

### Implement

Write code with the agent's assistance. At this stage it has context from exploration and planning, so suggestions are project-aware. Tips:

- Be specific about statistical methods. "Run a burden test" is too vague. "Run STAAR-O with MAF < 0.01, adjusting for age, sex, and the first 10 PCs, looping over all annotated genes on chr22" is actionable.
- Let the agent handle boilerplate: SLURM/UGER headers, argument parsing, logging, file-path handling.
- Stay involved in the statistics. The agent can implement any method you name; choosing the right method requires your domain expertise.

### Commit

Review the diff, run a sanity check, and commit. A good agent writes a concise commit message, checks that no hardcoded local paths leaked into the script, and verifies the `.gitignore` excludes data files.

## Working with sensitive genomic data

This deserves its own section because the stakes are higher.

**The core rule**: do not let AI agents read your data files directly. Genetic and health data are often subject to data use agreements (DUAs), IRB restrictions, and institutional policies. Even if the agent runs locally, the risk of data being embedded in conversation logs, sent to a remote API, or cached somewhere unexpected is real.

The practical workflow instead:

1. **You inspect the data yourself.** Check file headers and directory structure manually:

   ```bash
   head -3 pheno.txt
   ls -lh /protected/data/topmed/
   zcat variants.vcf.gz | head -20
   ```

2. **Paste the metadata — not the data — into the agent.** Give it the column names, the file format, the variable descriptions, the directory tree. This is usually enough for it to write correct code.

   ```
   My phenotype file has these columns (tab-separated, header row):
   FID, IID, AGE, SEX, BMI, LDL, HDL, TG
   There are ~8,000 rows. File path: /protected/topmed/pheno.txt

   My genotype data is PLINK2 format (pgen/psam/pvar) at:
   /protected/topmed/geno/chr{1..22}.*

   Write a REGENIE step 1 command that uses this phenotype file and
   includes age, sex, and BMI as covariates.
   ```

3. **The agent writes code; you run it.** Review the generated script, then execute it in your own environment. The data never leaves your cluster.

4. **For exploratory analysis on results** (summary statistics, QQ plots, effect size distributions): these are typically non-identifiable and lower risk. Even so, check your DUA — some restrict any sharing of intermediate results.

This pattern lets you get full AI assistance on the hardest part (writing correct statistical code) while keeping identifiable data entirely within your controlled environment.

## Common workflows where agents shine

**GWAS QC pipeline**: a sequence of PLINK2 commands for sample and variant QC — missingness, Hardy-Weinberg equilibrium, sex discrepancy, relatedness. Provide the filter criteria; the agent produces a complete, commented shell script.

**Rare variant aggregation tests**: R scripts using STAAR or SKAT that read annotation files, define variant sets, specify null models, and loop over genomic regions. The boilerplate-to-logic ratio is high — ideal for agent assistance.

**Visualization**: Manhattan plots, QQ plots, regional association plots, forest plots. These are `ggplot2`-heavy and benefit from inline suggestions for aesthetics and from agents that can iterate on layout.

**HPC job submission**: SLURM or UGER scripts that array over chromosomes or genomic regions. The agent handles job array syntax, resource flags, output file naming — things that are easy to get wrong and expensive to debug on a busy cluster. The context file (CLAUDE.md or equivalent) that encodes your scheduler details pays off most here.

## Advanced usage

### Models vs. agents: understanding what is actually running

This distinction matters practically, not just conceptually.

An **LLM (Large Language Model)** is the underlying neural network that reads text and generates responses: Claude Opus, Claude Sonnet, Claude Haiku, GPT-4o, Gemini 1.5 Pro, Qwen, and so on. It is stateless — it has no memory between calls, no ability to run code, and no awareness of your file system. By itself, it is a very powerful text-in / text-out function.

An **agent** is a system built on top of one or more LLMs that adds the infrastructure to actually do things:

- **Tools**: the ability to read and write files, run shell commands, call APIs, search the web
- **Memory / context management**: persisting project state across turns, loading relevant files into the prompt
- **Action loop**: the cycle of generating a plan, executing a tool call, observing the result, and planning the next step
- **Orchestration**: routing sub-tasks to different models or spawning parallel workers

Claude Code, GitHub Copilot, and OpenClaw are all agents. They each have their own orchestration logic, tool sets, and UX — but they can all be powered by many of the same underlying LLMs. Claude Sonnet running inside Claude Code and Claude Sonnet running inside Copilot is the same model, producing identical raw capabilities, in two different agent wrappers. The agent wrapper determines what the model can *act on*, not what it can *reason about*.

Why does this matter for research?

- You can swap the underlying model in most agents without rewriting your prompts or workflow. The context file (CLAUDE.md) works regardless of which model is in the loop.
- The "best" agent for a task is not always the one with the most powerful model — it is the one whose tool set and orchestration fit the task. A lightweight model inside an agent with direct HPC access beats a frontier model that can only suggest commands.
- Cost and speed are model properties, not agent properties. You pay for tokens processed by the model, not by the agent wrapper. Switching to a smaller model within the same agent cuts cost without changing your workflow.

### Switching models mid-workflow with cc-switch

In Claude Code, `/model` (or `--model` at the CLI) lets you swap the underlying LLM without leaving your session. You can use this deliberately as a cost-and-speed strategy:

```bash
# Start a session with a powerful model for exploration and planning
claude --model claude-opus-4-7

# Inside the session, switch to a faster model for implementation
/model claude-sonnet-4-6

# Or switch to the fastest model for pure boilerplate generation
/model claude-haiku-4-5-20251001
```

A practical pattern for a GWAS pipeline:

1. **Exploration and planning** (Opus or Sonnet): "Here is my project structure. Here are the column names from my phenotype file. Design a REGENIE step 1 and step 2 pipeline that handles related individuals using the KING kinship matrix." Let the model reason carefully about the design.
2. **Implementation** (Sonnet or Haiku): "Now write the SLURM array script for step 2, one job per chromosome." This is mostly template-filling — a smaller model is fast and sufficient.
3. **Review** (back to Sonnet): "Read the generated script and check for statistical correctness: are the covariate flags right, is the phenotype file path correct, does the output naming make sense?"

The same principle applies in VS Code Copilot's Auto model mode, which does this automatically based on task complexity. Explicitly controlling the switch yourself gives you more precision; Auto mode gives you convenience.

### OpenClaw: a local-first alternative

[OpenClaw](https://github.com/openclaw/openclaw) is an open-source personal AI assistant designed to run on your own devices rather than in the cloud. Where Claude Code operates primarily in your terminal and VS Code, OpenClaw routes AI interactions through messaging channels you already use — WhatsApp, Telegram, Slack, Discord — and adds voice capabilities on macOS and iOS.

For researchers, the most relevant properties are:

- **Local-first**: the Gateway (control plane) runs on your own machine. Conversations route through your device rather than a hosted service, which reduces concerns about where data is processed.
- **Multi-channel**: you can ask a question via Slack while your cluster job is running and get the response in the same thread. Useful for asynchronous workflows on HPC where you are not sitting in front of a terminal.
- **Model-agnostic**: connects to multiple providers. You can point it at Claude, GPT-4o, a locally-hosted Qwen instance, or a custom endpoint.
- **Skills registry**: similar in concept to Claude Code's skills — reusable agent capabilities you can invoke by name.

The tradeoff relative to Claude Code or Copilot is that OpenClaw is less focused on code editing and file manipulation, and more on being an always-available assistant across your communication channels. Think of it as complementary: Claude Code for heads-down coding sessions; OpenClaw for quick questions, job monitoring, or retrieval tasks when you are away from your IDE.

It is also a useful reference implementation if you want to build a custom agent that routes to your own HPC environment — the architecture (Gateway + channel adapters + model backends) maps well onto research infrastructure.

## MCP: connecting agents to external tools

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is an open standard that lets AI agents connect to external data sources and tools through a common interface. Instead of pasting PubMed abstracts into the chat, you install an MCP server and the agent can search PubMed directly. Instead of copy-pasting gnomAD allele frequencies, the agent queries gnomAD itself.

The architecture is straightforward: an MCP server sits between the agent and the external resource, translating the agent's requests into API calls and returning structured results. Once a server is registered in your agent's config, you use it like any other tool — you describe what you need in plain language, the agent decides which server to call, and the result comes back into the conversation.

For statistical genetics, a handful of MCP servers are immediately practical:

- **PubMed / NCBI**: search literature, retrieve abstracts and metadata without leaving the coding session. Useful for verifying a method's original paper or checking whether a gene has known lipid associations.
- **bioRxiv**: access preprint metadata and abstracts directly. Particularly useful for tracking recent GWAS results before peer review.
- **ChEMBL**: query compound bioactivity, targets, and drug mechanisms. Relevant if you work near the drug-gene interface (lipid-lowering targets, Mendelian randomization for therapeutic targets).
- **ClinicalTrials.gov**: search registered trials by condition or intervention. Useful for translational context around GWAS findings.
- **gnomAD** (via custom or community servers): retrieve population-level allele frequencies, variant annotations, and constraint metrics without switching browser tabs.

The practical value accumulates in workflow continuity. A typical task without MCP: you're writing a lncRNA annotation script, pause, open a browser, search gnomAD, copy a frequency, paste it back, lose your train of thought. With a gnomAD MCP server registered, you stay in the agent session and say: "check the gnomAD allele frequency for rs12345 in EUR and AFR populations." The agent calls the server, the answer appears inline, and you keep coding.

Setting up MCP in Claude Code is done via the `claude mcp add` command or by editing your project's `.mcp.json`. For VS Code Copilot, MCP support has been added in recent versions — check the Copilot settings panel under "MCP Servers."

The [MCP registry](https://registry.mcphub.io) lists community-maintained servers across many domains. If nothing exists for a niche resource (say, a specific population biobank), the MCP specification is simple enough to implement a lightweight server yourself in an afternoon.

## Cost awareness

With Copilot's enterprise plan, your usage is measured in **multipliers against a monthly quota**, not raw dollars. Understanding the tiers matters because a single agentic session can burn quota much faster than you expect.

| Tier | Multiplier | Examples |
|------|-----------|---------|
| Standard | **1×** | GPT-4.5, Claude Sonnet 4.6 — baseline rate, most everyday tasks |
| Premium | **3×** | Claude Opus 4.6 — stronger reasoning, three times the quota consumption |
| High-tier / Agentic | **15×** | Claude Opus 4.7, specialized agentic modes — complex multi-step tasks, exhausts quota rapidly |

In practice: if your monthly quota supports 1,000 standard interactions, switching to a 15× model means you burn through that same quota in roughly 67 interactions. One long agentic GWAS pipeline run at 15× can consume a significant fraction of a month's allowance.

**Practical strategies for managing quota**:

- **Default to Standard for most coding tasks**: Sonnet-class models handle GWAS QC scripting, plot generation, and boilerplate equally well at 1× cost.
- **Reserve Premium (3×) for planning and architecture**: designing a pipeline, reasoning about a statistical model, debugging a subtle error — tasks where stronger reasoning pays off.
- **Use High-tier (15×) deliberately**: for genuinely complex multi-step agentic work only. Don't leave an Opus 4.7 session running overnight on routine tasks.
- **Don't add large files to context**: sharing an entire VCF header or a full phenotype file when you only need the column names multiplies your usage on every subsequent turn in that session.
- **Prefer targeted questions**: "why is my REGENIE step 2 producing NA p-values for chromosome 6?" consumes far less quota than "review my entire pipeline." Specificity is both cheaper and more effective.
- **Check your usage dashboard**: Copilot usage is in your GitHub settings under Billing. Worth checking after your first few agentic sessions to calibrate your intuition.

From June 1, 2026, GitHub Copilot Enterprise plans move to usage-based billing for some features. Check with BITS on how the Broad's agreement handles this before running extended high-tier sessions.

## Tips and caveats

**What AI agents are reliably good at:**
- Syntactically correct code in R, Python, and bash
- Translating a described statistical method into working code
- Generating boilerplate (job scripts, argument parsers, logging)
- Refactoring messy scripts into clean, modular functions
- Explaining error messages and suggesting fixes

**What they are not good at (yet):**
- Choosing the right statistical method for your data. They can implement any method you name; the choice requires your expertise.
- Knowing your cluster's specifics without being told. The context file is how you bridge this.
- Validating scientific results. A Manhattan plot can be generated correctly but still represent a batch artifact — that judgment is yours.

**How to verify AI-generated statistical code:**
1. Read every line. A wrong sign, a dropped covariate, or an off-by-one in variant filtering can silently produce wrong results.
2. Test on a small subset (e.g., chromosome 22) before submitting a 22-chromosome array job.
3. Compare against known results or a previous version of the pipeline where possible.
4. Check that test statistics, p-values, and effect sizes are in plausible ranges.

The bottom line: AI agents do not replace statistical genetics expertise — they amplify it. They handle the mechanical parts of coding so you can focus on the science.
