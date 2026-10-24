import json

svg_template = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1480 1020" width="100%" height="100%" style="background-color: #121212; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fd7e14" />
    </marker>
    <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#f76707" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Container 1: State-Specific Child Agents -->
  <rect x="410" y="280" width="930" height="340" rx="12" fill="#1c0e05" stroke="#e8590c" stroke-width="1.8" />
  <text x="430" y="310" fill="#ff922b" font-size="16" font-weight="600">State-Specific Child Agents (Live Workers)</text>

  <!-- Container 2: Live Web Scraping Engine -->
  <rect x="1055" y="650" width="315" height="330" rx="12" fill="#1c0e05" stroke="#e8590c" stroke-width="1.8" />
  <text x="1070" y="680" fill="#ff922b" font-size="15" font-weight="600">Live Web Scraping &amp; Extraction Engine</text>

  <!-- Arrows -->
  <path d="M 855 115 L 855 160" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 855 235 L 855 320" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 695 197 L 245 197 L 245 260" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />
  
  <path d="M 855 420 L 855 460 L 533 460 L 533 520" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 855 420 L 855 460 L 758 460 L 758 520" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 855 420 L 855 460 L 982 460 L 982 520" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 855 420 L 855 460 L 1212 460 L 1212 520" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />

  <path d="M 1212 595 L 1212 695" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 1212 760 L 1212 790" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 1212 855 L 1212 885" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Loopback arrow -->
  <path d="M 1212 950 L 1212 985 L 1395 985 L 1395 197 L 1015 197" fill="none" stroke="#fd7e14" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Branch badges -->
  <rect x="490" y="445" width="86" height="22" rx="4" fill="#2b1406" stroke="#f76707" stroke-width="1.2" />
  <text x="533" y="460" fill="#ffa94d" font-size="11" font-weight="bold" text-anchor="middle">Tamil Nadu</text>

  <rect x="715" y="445" width="86" height="22" rx="4" fill="#2b1406" stroke="#f76707" stroke-width="1.2" />
  <text x="758" y="460" fill="#ffa94d" font-size="11" font-weight="bold" text-anchor="middle">Karnataka</text>

  <rect x="940" y="445" width="86" height="22" rx="4" fill="#2b1406" stroke="#f76707" stroke-width="1.2" />
  <text x="983" y="460" fill="#ffa94d" font-size="11" font-weight="bold" text-anchor="middle">Other State</text>

  <rect x="1165" y="445" width="94" height="22" rx="4" fill="#2b1406" stroke="#f76707" stroke-width="1.2" />
  <text x="1212" y="460" fill="#ffa94d" font-size="11" font-weight="bold" text-anchor="middle">Maharashtra</text>

  <!-- Diamond: State Classifier -->
  <polygon points="855,320 915,370 855,420 795,370" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="855" y="375" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">State Classifier</text>

  <!-- Main Nodes -->
  <!-- Student -->
  <rect x="625" y="40" width="460" height="75" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="855" y="70" fill="#ffa94d" font-size="16" font-weight="bold" text-anchor="middle">👨‍🎓 Student / Live Query</text>
  <text x="855" y="94" fill="#ffd8a8" font-size="13" text-anchor="middle">(e.g., &apos;What is current fee &amp; intake for VJTI Mumbai?&apos;)</text>

  <!-- Orchestrator -->
  <rect x="695" y="160" width="320" height="75" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="855" y="190" fill="#ffa94d" font-size="16" font-weight="bold" text-anchor="middle">👑 Main Orchestrator Agent</text>
  <text x="855" y="214" fill="#ffd8a8" font-size="13" text-anchor="middle">(Live Router &amp; Synthesizer)</text>

  <!-- Live Output -->
  <rect x="60" y="260" width="370" height="75" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="245" y="290" fill="#ffa94d" font-size="15" font-weight="bold" text-anchor="middle">⚡ Live Output Response</text>
  <text x="245" y="314" fill="#ffd8a8" font-size="12" text-anchor="middle">(Fresh data + Source URL + Timestamp + Exact Quote)</text>

  <!-- Child Agents -->
  <rect x="430" y="520" width="205" height="75" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="532" y="550" fill="#ffa94d" font-size="14" font-weight="bold" text-anchor="middle">🚇 Tamil Nadu Child Agent</text>
  <text x="532" y="574" fill="#ffd8a8" font-size="12" text-anchor="middle">(Context: Anna Univ, TNEA)</text>

  <rect x="655" y="520" width="205" height="75" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="757" y="550" fill="#ffa94d" font-size="14" font-weight="bold" text-anchor="middle">🚇 Karnataka Child Agent</text>
  <text x="757" y="574" fill="#ffd8a8" font-size="12" text-anchor="middle">(Context: VTU, KEA, COMEDK)</text>

  <rect x="880" y="520" width="205" height="75" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="982" y="550" fill="#ffa94d" font-size="14" font-weight="bold" text-anchor="middle">🚇 State-Specific Worker</text>
  <text x="982" y="574" fill="#ffd8a8" font-size="12" text-anchor="middle">(Context: State Higher Ed Dept)</text>

  <rect x="1105" y="520" width="215" height="75" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="1212" y="550" fill="#ffa94d" font-size="13" font-weight="bold" text-anchor="middle">🚇 Maharashtra Child Agent</text>
  <text x="1212" y="574" fill="#ffd8a8" font-size="11" text-anchor="middle">(Context: DTE codes, SPPU, MU, CET Cell)</text>

  <!-- Engine boxes -->
  <rect x="1075" y="695" width="275" height="65" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="1212" y="723" fill="#ffa94d" font-size="13" font-weight="bold" text-anchor="middle">🌐 Live Official Domain Resolver</text>
  <text x="1212" y="745" fill="#ffd8a8" font-size="11" text-anchor="middle">(Finds official verified .ac.in / .edu.in)</text>

  <rect x="1075" y="790" width="275" height="65" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="1212" y="818" fill="#ffa94d" font-size="12" font-weight="bold" text-anchor="middle">⚡ Async Parallel Web Fetcher</text>
  <text x="1212" y="840" fill="#ffd8a8" font-size="10.5" text-anchor="middle">(Live GET /admissions, /fees, /mandatory-disclosure)</text>

  <rect x="1075" y="885" width="275" height="65" rx="10" fill="#2b1406" stroke="#f76707" stroke-width="2" filter="url(#glow)" />
  <text x="1212" y="913" fill="#ffa94d" font-size="12" font-weight="bold" text-anchor="middle">🧠 Grounded Fact Extractor</text>
  <text x="1212" y="935" fill="#ffd8a8" font-size="10.5" text-anchor="middle">(Gemini with strict Verbatim Quote requirement)</text>
</svg>'''

with open('c:/Users/OMPRASAD/.gemini/antigravity/scratch/hybrid-college-recommendation/college_recommendation_architecture.svg', 'w', encoding='utf-8') as f:
    f.write(svg_template)

with open('C:/Users/OMPRASAD/.gemini/antigravity/brain/c0e071a7-6376-430c-b885-d347c873ef81/college_recommendation_architecture.svg', 'w', encoding='utf-8') as f:
    f.write(svg_template)

print('SVG files created successfully!')
