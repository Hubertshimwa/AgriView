from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "Agri_View_Master_Prompt.md"
OUTPUT = ROOT / "output" / "pdf" / "Agri_View_Updated_Master_Prompt.pdf"

FOREST = colors.HexColor("#1f553d")
FOREST_DARK = colors.HexColor("#153c2c")
LIME = colors.HexColor("#c2e477")
BLUE = colors.HexColor("#3d83a8")
CYAN = colors.HexColor("#35a7b5")
AMBER = colors.HexColor("#e0b14e")
INK = colors.HexColor("#203128")
SOFT = colors.HexColor("#56645b")
MUTED = colors.HexColor("#7b887f")
PAPER = colors.HexColor("#f6f7f1")
LINE = colors.HexColor("#dce3d9")
WHITE = colors.white


def register_fonts() -> tuple[str, str, str]:
    candidates = [
        (Path(r"C:\Windows\Fonts\segoeui.ttf"), Path(r"C:\Windows\Fonts\segoeuib.ttf")),
        (Path(r"C:\Windows\Fonts\arial.ttf"), Path(r"C:\Windows\Fonts\arialbd.ttf")),
    ]
    for regular, bold in candidates:
        if regular.exists() and bold.exists():
            pdfmetrics.registerFont(TTFont("AgriBody", str(regular)))
            pdfmetrics.registerFont(TTFont("AgriBold", str(bold)))
            return "AgriBody", "AgriBold", "Courier"
    return "Helvetica", "Helvetica-Bold", "Courier"


BODY_FONT, BOLD_FONT, MONO_FONT = register_fonts()


def inline_markup(text: str) -> str:
    """Convert the small inline Markdown subset used in this prompt to ReportLab markup."""
    tokens: list[str] = []

    def stash(value: str) -> str:
        tokens.append(value)
        return f"@@TOKEN{len(tokens) - 1}@@"

    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        lambda match: stash(
            f'<link href="{html.escape(match.group(2), quote=True)}" color="#245c43">'
            f"<u>{html.escape(match.group(1))}</u></link>"
        ),
        text,
    )
    text = re.sub(r"`([^`]+)`", lambda match: stash(f'<font name="{MONO_FONT}">{html.escape(match.group(1))}</font>'), text)
    text = re.sub(r"\*\*([^*]+)\*\*", lambda match: stash(f"<b>{html.escape(match.group(1))}</b>"), text)
    escaped = html.escape(text, quote=False)
    for index, value in enumerate(tokens):
        escaped = escaped.replace(f"@@TOKEN{index}@@", value)
    return escaped


class CoverArt(Flowable):
    def __init__(self, width: float, height: float):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self) -> None:
        c = self.canv
        w, h = self.width, self.height
        c.saveState()
        c.setFillColor(FOREST_DARK)
        c.roundRect(0, 0, w, h, 13, stroke=0, fill=1)

        # Quiet contour rings give the cover a field-map motif.
        c.setStrokeColor(colors.Color(0.82, 0.92, 0.76, alpha=0.18))
        c.setLineWidth(0.8)
        cx, cy = w * 0.79, h * 0.62
        for radius in (40, 58, 77, 98, 121):
            c.ellipse(cx - radius * 1.3, cy - radius, cx + radius * 1.3, cy + radius, stroke=1, fill=0)

        # Original monochrome data sphere.
        orb_x, orb_y = w * 0.79, h * 0.62
        c.setFillColor(colors.HexColor("#f0f2ec"))
        c.setStrokeColor(colors.HexColor("#ffffff"))
        c.setLineWidth(1.2)
        c.circle(orb_x, orb_y, 42, stroke=1, fill=1)
        c.setFillColor(colors.HexColor("#9aa79c"))
        c.circle(orb_x - 9, orb_y + 8, 25, stroke=0, fill=1)
        c.setFillColor(colors.HexColor("#25392e"))
        c.circle(orb_x + 8, orb_y - 10, 28, stroke=0, fill=1)
        c.setStrokeColor(colors.HexColor("#ffffff"))
        c.setLineWidth(0.8)
        c.ellipse(orb_x - 30, orb_y - 14, orb_x + 30, orb_y + 14, stroke=1, fill=0)
        c.ellipse(orb_x - 16, orb_y - 36, orb_x + 16, orb_y + 36, stroke=1, fill=0)

        c.setFillColor(LIME)
        c.roundRect(29, h - 56, 34, 24, 7, stroke=0, fill=1)
        c.setFillColor(FOREST_DARK)
        c.setFont(BOLD_FONT, 11)
        c.drawCentredString(46, h - 49, "AV")
        c.setFillColor(colors.HexColor("#d4e0d1"))
        c.setFont(MONO_FONT, 8)
        c.drawString(75, h - 48, "RWANDA AGRICULTURE INTELLIGENCE")

        c.setFillColor(WHITE)
        c.setFont(BOLD_FONT, 32)
        c.drawString(31, h - 148, "AGRI VIEW")
        c.setFillColor(LIME)
        c.setFont(BODY_FONT, 17)
        c.drawString(32, h - 180, "Updated Codex Master Prompt")
        c.setFillColor(colors.HexColor("#e2e9df"))
        c.setFont(BODY_FONT, 11)
        c.drawString(32, h - 216, "A light-first React website for Rwanda's agriculture")
        c.drawString(32, h - 233, "statistics, crop knowledge and practical field notes.")

        c.setStrokeColor(colors.Color(1, 1, 1, alpha=0.24))
        c.line(32, h - 270, w - 32, h - 270)
        c.setFillColor(colors.HexColor("#d8e3d5"))
        c.setFont(MONO_FONT, 8)
        c.drawString(32, h - 295, "VERSION 2.0")
        c.drawString(131, h - 295, "PREPARED 1 NOVEMBER 2026")
        c.drawString(32, h - 314, "LIGHT MODE FIRST  /  SOURCE-LED  /  RESPONSIVE")

        c.setFillColor(colors.HexColor("#c8d6c7"))
        c.setFont(BODY_FONT, 9)
        c.drawString(32, 27, "See Rwanda's harvest clearly.")
        c.drawRightString(w - 30, 27, "NISR  /  MINAGRI  /  RAB  /  NAEB")
        c.restoreState()


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="AVH1", parent=styles["Heading1"], fontName=BOLD_FONT,
        fontSize=21, leading=25, textColor=FOREST_DARK, spaceBefore=3,
        spaceAfter=14, keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="AVH2", parent=styles["Heading2"], fontName=BOLD_FONT,
        fontSize=14, leading=17, textColor=FOREST, spaceBefore=9,
        spaceAfter=7, keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="AVH3", parent=styles["Heading3"], fontName=BOLD_FONT,
        fontSize=10.3, leading=13, textColor=INK, spaceBefore=7,
        spaceAfter=4, keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="AVBody", fontName=BODY_FONT, fontSize=9.1, leading=13.2,
        textColor=INK, spaceAfter=7, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="AVSmall", fontName=BODY_FONT, fontSize=7.7, leading=10.2,
        textColor=SOFT, spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="AVList", fontName=BODY_FONT, fontSize=8.8, leading=12.3,
        textColor=INK, leftIndent=13, firstLineIndent=-12, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="AVTableHead", fontName=BOLD_FONT, fontSize=7.5, leading=9.1,
        textColor=WHITE,
    ))
    styles.add(ParagraphStyle(
        name="AVTableCell", fontName=BODY_FONT, fontSize=7.6, leading=9.5,
        textColor=INK,
    ))
    styles.add(ParagraphStyle(
        name="AVQuote", fontName=BODY_FONT, fontSize=9, leading=13,
        textColor=FOREST_DARK, leftIndent=9, rightIndent=6,
        borderColor=LIME, borderWidth=3, borderPadding=8,
        backColor=colors.HexColor("#eff5e5"), spaceBefore=3, spaceAfter=10,
    ))
    return styles


def make_table(lines: list[str], width: float, styles) -> Table:
    raw_rows = [[cell.strip() for cell in line.strip().strip("|").split("|")] for line in lines]
    if len(raw_rows) > 1 and all(set(cell.replace(":", "").replace("-", "").strip()) == set() for cell in raw_rows[1]):
        raw_rows.pop(1)
    columns = max(len(row) for row in raw_rows)
    header = [Paragraph(inline_markup(cell), styles["AVTableHead"]) for cell in raw_rows[0]]
    body = [[Paragraph(inline_markup(cell), styles["AVTableCell"]) for cell in row] for row in raw_rows[1:]]
    data = [header] + body

    if columns == 3:
        col_widths = [width * 0.43, width * 0.29, width * 0.28]
    elif columns == 4:
        col_widths = [width * 0.36, width * 0.22, width * 0.22, width * 0.20]
    else:
        col_widths = [width / columns] * columns

    table = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FOREST),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PAPER]),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def parse_markdown(body: str, styles, width: float) -> list:
    flowables: list = []
    lines = body.splitlines()
    index = 0
    paragraph: list[str] = []

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            joined = " ".join(part.strip() for part in paragraph).strip()
            if joined:
                flowables.append(Paragraph(inline_markup(joined), styles["AVBody"]))
            paragraph = []

    while index < len(lines):
        line = lines[index].rstrip()
        if not line.strip():
            flush_paragraph()
            index += 1
            continue
        if line.strip() == "<!-- pagebreak -->":
            flush_paragraph()
            flowables.append(PageBreak())
            index += 1
            continue
        if line.startswith("|"):
            flush_paragraph()
            table_lines = []
            while index < len(lines) and lines[index].lstrip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            flowables.append(make_table(table_lines, width, styles))
            flowables.append(Spacer(1, 9))
            continue
        if line.startswith("- ") or re.match(r"^\d+\.\s", line):
            flush_paragraph()
            numbered = bool(re.match(r"^\d+\.\s", line))
            while index < len(lines):
                candidate = lines[index].rstrip()
                if numbered and re.match(r"^\d+\.\s", candidate):
                    marker = re.match(r"^(\d+)\.\s", candidate).group(1)
                    content = re.sub(r"^\d+\.\s", "", candidate)
                elif not numbered and candidate.startswith("- "):
                    marker = "-"
                    content = candidate[2:]
                else:
                    break
                flowables.append(Paragraph(inline_markup(f"{marker}  {content}"), styles["AVList"]))
                index += 1
            continue
        if line.startswith("# "):
            flush_paragraph()
            flowables.append(Paragraph(inline_markup(line[2:].strip()), styles["AVH1"]))
            index += 1
            continue
        if line.startswith("## "):
            flush_paragraph()
            flowables.append(Paragraph(inline_markup(line[3:].strip()), styles["AVH2"]))
            index += 1
            continue
        if line.startswith("### "):
            flush_paragraph()
            flowables.append(Paragraph(inline_markup(line[4:].strip()), styles["AVH3"]))
            index += 1
            continue
        if line.startswith("> "):
            flush_paragraph()
            flowables.append(Paragraph(inline_markup(line[2:].strip()), styles["AVQuote"]))
            index += 1
            continue
        paragraph.append(line)
        index += 1
    flush_paragraph()
    return flowables


def draw_page(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        page_width, page_height = A4
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.45)
        canvas.line(doc.leftMargin, page_height - 34, page_width - doc.rightMargin, page_height - 34)
        canvas.setFillColor(MUTED)
        canvas.setFont(MONO_FONT, 7)
        canvas.drawString(doc.leftMargin, page_height - 25, "AGRI VIEW  /  UPDATED CODEX MASTER PROMPT")
        canvas.drawRightString(page_width - doc.rightMargin, page_height - 25, "VERSION 2.0  |  1 NOV 2026")
        canvas.line(doc.leftMargin, 34, page_width - doc.rightMargin, 34)
        canvas.setFont(BODY_FONT, 7)
        canvas.drawString(doc.leftMargin, 22, "SOURCE-LED  /  LIGHT MODE FIRST  /  RWANDA")
        canvas.drawRightString(page_width - doc.rightMargin, 22, f"PAGE {doc.page}")
    canvas.restoreState()


def main() -> None:
    source_text = SOURCE.read_text(encoding="utf-8")
    lines = source_text.splitlines()
    cover_end = lines.index("<!-- pagebreak -->")
    cover_markdown = lines[:cover_end]
    body_text = "\n".join(lines[cover_end + 1:])

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = A4
    left = 19 * mm
    right = 19 * mm
    top = 18 * mm
    bottom = 17 * mm
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=A4, leftMargin=left, rightMargin=right,
        topMargin=top, bottomMargin=bottom,
        title="Agri View Updated Codex Master Prompt",
        author="Agri View",
        subject="Rwanda agriculture intelligence and knowledge website brief",
    )
    frame = Frame(
        left, bottom, page_width - left - right, page_height - top - bottom,
        id="normal", leftPadding=0, rightPadding=0, topPadding=0,
        bottomPadding=0, showBoundary=0,
    )
    doc.addPageTemplates([PageTemplate(id="agri", frames=[frame], onPage=draw_page)])
    styles = build_styles()

    content_width = page_width - left - right
    cover = CoverArt(content_width, page_height - top - bottom - 10)
    flowables = [Spacer(1, 4), cover, PageBreak()]
    flowables.extend(parse_markdown(body_text, styles, content_width))
    doc.build(flowables)
    print(OUTPUT)


if __name__ == "__main__":
    main()
