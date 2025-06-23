#from pathlib import Path

from agno.agent import Agent
from agno.models.ollama import Ollama
from agno.team.team import Team
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.hackernews import HackerNewsTools

#urls_file = Path(__file__).parent.joinpath("tmp", "urls__{session_id}.md")
#urls_file.parent.mkdir(parents=True, exist_ok=True)


searcher = Agent(
    name="Searcher",
    role="Searches the top URLs for a topic",
    model=Ollama(id="llama3.2"),
    instructions=[
        ''' You are a research assistant for a leading Kubernetes technical blog.
            Upon receiving a topic, identify three precise search queries that will uncover the latest, most in-depth information on the subject.
            For each query, analyze the search results and select the 10 most credible and technically detailed URLs.
            Prioritize sources such as CNCF, Kubernetes.io, and recognized cloud-native experts.
            Exclude outdated or non-technical content, focusing solely on high-quality, relevant articles.''',
    ],
    tools=[DuckDuckGoTools()],
    add_datetime_to_instructions=True,
)
writer = Agent(
    name="Writer",
    role="Writes a high-quality article",
    model=Ollama(id="llama3.2"),
    description=(
        "You are a senior Kubernetes architect and technical writer. Given a topic and list of URLs, "
        "produce a comprehensive, practitioner-focused article that balances theory with actionable insights."
    ),
     instructions=[
        "1. **Research Phase**:",
        "   - Use `read_article` to thoroughly analyze all provided URLs.",
        "   - Cross-reference information with official Kubernetes.io documentation and CNCF resources.",
        "   - Identify key trends from Hacker News discussions about this topic.",
        
        "2. **Structure Requirements**:",
        "   - Introduction: Explain why this topic matters in modern cloud-native systems (1-2 paragraphs).",
        "   - Core Concepts: Define technical terms (e.g., CRDs, Operators) with Kubernetes-specific examples.",
        "   - Implementation Guide: Include YAML snippets, kubectl commands, and architecture diagrams.",
        "   - Real-World Case Study: Describe a common use case with before/after scenarios.",
        "   - Troubleshooting Section: List 3-5 common pitfalls and solutions.",
        "   - Conclusion: Summarize key takeaways and future trends (2025+ perspective).",

        "3. **Technical Depth**:",
        "   - Compare at least two approaches to solving the problem (e.g., native K8s vs. third-party tools).",
        "   - Include version-specific details (e.g., 'Tested on Kubernetes 1.29').",
        "   - Reference recent developments from Kubernetes release notes.",
        
        "4. **Style Guidelines**:",
        "   - Write for intermediate-to-advanced developers familiar with container orchestration.",
        "   - Use subheadings, bullet points, and code blocks for readability.",
        "   - Add inline comments to complex code examples.",
        "   - Highlight security considerations in every major section.",
        
        "5. **Quality Assurance**:",
        "   - Fact-check against Kubernetes API documentation.",
        "   - Ensure all commands can be run in a default KinD cluster.",
        "   - Maintain 3:1 ratio of original analysis to sourced content.",
        "   - Keep paragraphs under 6 lines for technical readability."
    ],
    tools=[HackerNewsTools()],
    add_datetime_to_instructions=True,
)

editor = Team(
    name="Editor",
    mode="coordinate",
    model=Ollama(id="llama3.2"),
    members=[searcher, writer],
    show_tool_calls=True,
    description=("You are the chief editor for a leading Kubernetes technical blog."
                 "Your mission is to ensure every article is authoritative, technically accurate, and engaging for a global developer audience."),
     instructions=[
        # Step 1: Research
        "1. Request the search agent to identify and return the 10 most authoritative, recent, and technically relevant URLs for the given Kubernetes topic, prioritizing official documentation, CNCF resources, and respected community blogs.",
        
        # Step 2: Drafting
        "2. Instruct the writer agent to draft a detailed, well-structured technical article using the provided URLs, ensuring the content is original, actionable, and tailored to intermediate-to-advanced Kubernetes practitioners.",
        
        # Step 3: Editorial Review
        "3. Edit and proofread the draft with the following editorial checklist:",
        "   - Technical Accuracy: Fact-check all statements against official Kubernetes documentation and current best practices.",
        "   - Structure & Flow: Ensure the article has a clear introduction, logical sectioning, actionable examples (code, YAML, CLI), and a strong conclusion.",
        "   - Depth & Nuance: Confirm the article covers multiple perspectives (e.g., native vs. third-party tools), includes troubleshooting tips, and highlights security considerations.",
        "   - Clarity & Readability: Break up long paragraphs, use subheadings and bullet points, and add inline explanations for complex code.",
        "   - Attribution & Ethics: Verify all sources are properly cited and no content is plagiarized or fabricated.",
        "   - Timeliness: Ensure all advice and references are current as of the article’s date.",
        
        # Step 4: Final Gatekeeping
        "4. Provide constructive feedback to the writer if revisions are needed. Only approve the article for publication when it fully meets the blog’s standards for technical excellence and reader value.",
        "5. As the final gatekeeper, your approval is required before the article goes live. The article must be flawless, insightful, and ready for a discerning Kubernetes audience.",
    ],
    add_datetime_to_instructions=True,
    #send_team_context_to_members=True,
    markdown=True,
    debug_mode=True,
    show_members_responses=True,
)
editor.print_response("Write a technical blog with full explaination and details about the latest kubernetes version release.", stream=True)