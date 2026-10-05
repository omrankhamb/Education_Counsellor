import os
import subprocess
import markdown

def convert_md_to_pdf():
    md_path = "DOCUMENTATION.md"
    html_path = "DOCUMENTATION.html"
    pdf_path = "DOCUMENTATION.pdf"

    if not os.path.exists(md_path):
        print(f"Error: {md_path} not found.")
        return

    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Convert Markdown to HTML with tables, code fences, etc.
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "nl2br", "sane_lists", "toc"]
    )

    # Wrap in beautiful, executive styling
    html_full = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Education Counsellor - Complete Project Documentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@500;600;700;800&family=Fira+Code:wght@400;500&display=swap');

  @page {{
    size: A4 portrait;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-center {{
      content: "Education Counsellor | Project Documentation";
      font-size: 9pt;
      color: #94A3B8;
    }}
  }}

  * {{
    box-sizing: border-box;
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1E293B;
    background: #FFFFFF;
    line-height: 1.65;
    font-size: 13.5px;
    margin: 0;
    padding: 0;
  }}

  /* Executive Header */
  .doc-header {{
    background: linear-gradient(135deg, #1A237E 0%, #283593 50%, #3949AB 100%);
    color: #FFFFFF;
    padding: 36px 32px;
    border-radius: 12px;
    margin-bottom: 28px;
    box-shadow: 0 8px 24px rgba(26, 35, 126, 0.15);
  }}

  .doc-header h1 {{
    font-family: 'Poppins', sans-serif;
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 8px 0;
    color: #FFFFFF;
    letter-spacing: -0.3px;
  }}

  .doc-header p {{
    font-size: 13.5px;
    color: #E0E7FF;
    margin: 0 0 16px 0;
    line-height: 1.5;
  }}

  .doc-header-badges {{
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }}

  .badge {{
    display: inline-block;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}

  .badge-warning {{
    background: #FFB300;
    color: #1A237E;
  }}

  .badge-light {{
    background: rgba(255, 255, 255, 0.2);
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }}

  /* Headings */
  h1, h2, h3, h4, h5 {{
    font-family: 'Poppins', sans-serif;
    color: #0F172A;
    margin-top: 26px;
    margin-bottom: 12px;
    page-break-after: avoid;
  }}

  h1 {{
    font-size: 20px;
    font-weight: 800;
    border-bottom: 2px solid #E2E8F0;
    padding-bottom: 6px;
    color: #1A237E;
  }}

  h2 {{
    font-size: 16.5px;
    font-weight: 700;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 4px;
    color: #283593;
    margin-top: 22px;
  }}

  h3 {{
    font-size: 14.5px;
    font-weight: 600;
    color: #334155;
  }}

  p, li {{
    color: #334155;
    margin-bottom: 10px;
  }}

  ul, ol {{
    padding-left: 24px;
    margin-bottom: 14px;
  }}

  li {{
    margin-bottom: 4px;
  }}

  strong {{
    color: #0F172A;
  }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 18px 0;
    font-size: 12px;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    overflow: hidden;
    page-break-inside: avoid;
  }}

  th {{
    background: #1A237E;
    color: #FFFFFF;
    font-weight: 700;
    text-align: left;
    padding: 9px 12px;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }}

  td {{
    padding: 8px 12px;
    border-top: 1px solid #E2E8F0;
    color: #334155;
    vertical-align: top;
  }}

  tr:nth-child(even) td {{
    background: #F8FAFC;
  }}

  /* Code & Pre */
  code {{
    font-family: 'Fira Code', Consolas, monospace;
    font-size: 11.5px;
    background: #F1F5F9;
    color: #1E293B;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #E2E8F0;
  }}

  pre {{
    background: #0F172A;
    color: #E2E8F0;
    padding: 14px 18px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 11.5px;
    line-height: 1.5;
    margin: 14px 0;
    page-break-inside: avoid;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }}

  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
  }}

  /* Blockquote / Alert callouts */
  blockquote {{
    margin: 16px 0;
    padding: 12px 18px;
    background: #FFFBEB;
    border-left: 4px solid #F59E0B;
    border-radius: 0 8px 8px 0;
    color: #78350F;
    font-size: 13px;
    page-break-inside: avoid;
  }}

  blockquote p {{
    margin: 0;
    color: inherit;
  }}

  hr {{
    border: none;
    height: 1px;
    background: #E2E8F0;
    margin: 24px 0;
  }}

  /* Print specific formatting */
  @media print {{
    body {{
      font-size: 12px;
    }}
    .doc-header {{
      background: #1A237E !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    th {{
      background: #1A237E !important;
      color: #FFFFFF !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    tr:nth-child(even) td {{
      background: #F8FAFC !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    pre {{
      background: #0F172A !important;
      color: #E2E8F0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    blockquote {{
      background: #FFFBEB !important;
      border-left-color: #F59E0B !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    a {{
      color: #1A237E;
      text-decoration: none;
    }}
  }}
</style>
</head>
<body>

  <div class="doc-header">
    <h1>🎓 Education Counsellor</h1>
    <p>AI-Powered Hybrid College Recommendation & Interactive Student Guidance System<br>
    Comprehensive Engineering, Architecture, Rationale & Operational Documentation</p>
    <div class="doc-header-badges">
      <span class="badge badge-warning">Full Stack System</span>
      <span class="badge badge-light">React 18 + Vite 5</span>
      <span class="badge badge-light">FastAPI + Uvicorn</span>
      <span class="badge badge-light">MongoDB Persistence</span>
      <span class="badge badge-light">Google Gemini 2.5 Flash</span>
      <span class="badge badge-light">Academic Year 2026</span>
    </div>
  </div>

  {html_body}

</body>
</html>
"""

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_full)

    print(f"Generated clean styled HTML: {html_path}")

    # Look for Chrome or Edge
    browser_candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]

    browser_exe = None
    for b in browser_candidates:
        if os.path.exists(b):
            browser_exe = b
            break

    if not browser_exe:
        print("No headless browser found to print PDF directly.")
        return

    abs_html = os.path.abspath(html_path)
    abs_pdf = os.path.abspath(pdf_path)

    cmd = [
        browser_exe,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={abs_pdf}",
        f"file:///{abs_html.replace(os.sep, '/')}"
    ]

    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if os.path.exists(abs_pdf):
        size_kb = os.path.getsize(abs_pdf) / 1024
        print(f"SUCCESS: Generated {pdf_path} ({size_kb:.1f} KB)")
    else:
        print(f"PDF generation failed: {result.stderr}")

if __name__ == "__main__":
    convert_md_to_pdf()
