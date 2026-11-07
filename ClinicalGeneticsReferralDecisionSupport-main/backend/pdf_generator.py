"""
backend/pdf_generator.py
SaMD Explainable Clinical Evaluation Brief Generator
Using ReportLab to construct publication-quality, statutory vector PDF reports.
"""

import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_clinical_pdf(
    patient_id: str,
    physician_name: str,
    pathway: str,
    evaluation: dict
) -> bytes:
    """
    Constructs an FDA SaMD-compliant vector PDF clinical genetics referral brief.
    Includes Glass-Box rationale, confidence scores, CPT/ICD-10 codes, and statutory disclaimers.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36, leftMargin=36,
        topMargin=36, bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Typography
    h1 = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=colors.HexColor('#022e1f'))
    h2 = ParagraphStyle('SectionHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=colors.HexColor('#065f46'))
    body = ParagraphStyle('BodyDark', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor('#1f2937'))
    mono = ParagraphStyle('MonoSmall', parent=styles['Normal'], fontName='Courier', fontSize=8, leading=11, textColor=colors.HexColor('#111827'))
    alert_box = ParagraphStyle('AlertText', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=colors.white)

    story = []

    # 1. Header & Institutional Metadata
    header_data = [
        [
            Paragraph("<b>GENOBRIDGE CLINICAL GENETICS DSS</b><br/><font size=7 color='#047857'>FDA SaMD DETERMINISTIC EVALUATION PIPELINE</font>", h1),
            Paragraph(f"<b>Report Date:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}<br/><b>Patient MRN:</b> {patient_id}<br/><b>Attending:</b> Dr. {physician_name}", body)
        ]
    ]
    t_header = Table(header_data, colWidths=[330, 210])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_header)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0e4331'), spaceBefore=2, spaceAfter=10))

    # 2. Executive Summary Banner
    risk = str(evaluation.get("risk_level", "ROUTINE")).upper()
    if risk == "URGENT":
        bg_color = colors.HexColor('#881337') # Rose 900
    elif risk == "ROUTINE":
        bg_color = colors.HexColor('#92400e') # Amber 800
    else:
        bg_color = colors.HexColor('#065f46') # Emerald 800
    
    confidence = int(float(evaluation.get("confidence_score", 0.98)) * 100)
    banner_data = [[
        Paragraph(f"TRIAGE OUTCOME: {risk.replace('_', ' ')}", alert_box),
        Paragraph(f"CONFIDENCE MATCH: {confidence}%", alert_box)
    ]]
    t_banner = Table(banner_data, colWidths=[390, 150])
    t_banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_banner)
    story.append(Spacer(1, 10))

    # 3. Recommended Primary Action
    story.append(Paragraph("RECOMMENDED CLINICAL ACTION", h2))
    story.append(Paragraph(evaluation.get("action", "Standard clinical monitoring."), body))
    story.append(Spacer(1, 10))

    # 4. Glass-Box Rationale (Explainable Audit Trail)
    story.append(Paragraph("GLASS-BOX CLINICAL RATIONALE & GROUND TRUTH CITATIONS", h2))
    
    triggering = evaluation.get("triggering_inputs", {})
    inputs_formatted = "<br/>".join([f"• <b>{k}:</b> {v}" for k, v in triggering.items()]) or "No positive high-risk flags."
    
    audit_data = [
        [Paragraph("<b>Matched Rule Key:</b>", body), Paragraph(str(evaluation.get("matched_rule_id", "STD-CARE-00")), mono)],
        [Paragraph("<b>Statutory Guideline:</b>", body), Paragraph(str(evaluation.get("guideline", "ACOG / FOGSI Standards")), body)],
        [Paragraph("<b>Triggering Parameters:</b>", body), Paragraph(inputs_formatted, body)],
        [Paragraph("<b>Recommended CPT:</b>", body), Paragraph(", ".join(evaluation.get("cpt_codes", [])) or "None", mono)],
        [Paragraph("<b>Applicable ICD-10:</b>", body), Paragraph(", ".join(evaluation.get("icd10_codes", [])) or "Z34.90", mono)],
    ]
    t_audit = Table(audit_data, colWidths=[140, 400])
    t_audit.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_audit)
    story.append(Spacer(1, 10))

    # 5. Clinical Counseling Points
    counseling = evaluation.get("counseling_points", [])
    if counseling:
        story.append(Paragraph("CLINICIAN COUNSELING & PATIENT DISCUSSION POINTS", h2))
        counsel_text = "<br/>".join([f"• {pt}" for pt in counseling])
        story.append(Paragraph(counsel_text, body))
        story.append(Spacer(1, 10))

    # 6. Regulatory Disclaimer
    story.append(Paragraph("STATUTORY CLINICAL SAFETY NOTICE", h2))
    disclaimer_text = (
        "This evaluation is generated by a deterministic rule-based decision support algorithm "
        "calibrated against ACOG, NCCN, ACMG, and ASRM clinical practice guidelines. It does not constitute "
        "an independent medical diagnosis. Attending physicians retain exclusive statutory responsibility "
        "for verifying all findings, counseling patients, and issuing diagnostic test orders."
    )
    story.append(Paragraph(disclaimer_text, ParagraphStyle('Disc', parent=body, fontSize=7, leading=9.5, textColor=colors.HexColor('#6b7280'))))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
