"""
backend/email_service.py
HIPAA-Compliant Email Dispatch Service for GenoBridge DSS
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

logger = logging.getLogger("genobridge.email")

def send_clinical_brief_email(
    recipient_email: str,
    patient_mrn_hash: str,
    pathway_title: str,
    pdf_bytes: bytes,
    urgency_level: str
) -> bool:
    """
    Sends an encrypted email brief to the requesting physician.
    Enforces HIPAA Safe Harbor: No patient identifiers (names, DOBs) in subject or unencrypted headers.
    """
    smtp_host = os.environ.get("SMTP_HOST", "smtp.sendgrid.net")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "")
    sender_email = os.environ.get("SMTP_SENDER", "decision-support@genobridge.org")

    # Strict Subject Line: De-identified with internal correlation hash only
    short_hash = patient_mrn_hash[-6:] if len(patient_mrn_hash) >= 6 else patient_mrn_hash
    subject = f"[{urgency_level}] Clinical Decision Support Brief — Case Ref: #{short_hash}"

    msg = MIMEMultipart()
    msg['From'] = f"GenoBridge Clinical Genetics <{sender_email}>"
    msg['To'] = recipient_email
    msg['Subject'] = subject
    msg['X-Priority'] = '1' if urgency_level == "URGENT" else '3'

    body_content = f"""
    CONFIDENTIAL CLINICAL COMMUNICATION — MEDICAL DECISION SUPPORT ONLY

    Dr. Attending,

    A deterministic clinical genetics evaluation has been finalized for:
    Pathway: {pathway_title}
    Triage Level: {urgency_level}
    Reference Identifier: #{short_hash}

    The complete, explainable Glass-Box clinical rationale, matched guideline citations 
    (ACOG / NCCN / ACMG / ASRM), and recommended CPT/ICD-10 procedure codes are attached 
    in the formal vector PDF brief.

    Notice: This message contains protected clinical decision support data. If you are 
    not the intended physician recipient, please notify the sender and delete immediately.
    """
    msg.attach(MIMEText(body_content.strip(), 'plain', 'utf-8'))

    # Attach the vector PDF
    pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
    pdf_attachment.add_header(
        'Content-Disposition',
        'attachment',
        filename=f"Clinical_Brief_Case_{short_hash}.pdf"
    )
    msg.attach(pdf_attachment)

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info(f"Clinical brief successfully delivered to {recipient_email}")
        return True
    except Exception as exc:
        logger.error(f"Failed to dispatch clinical email: {str(exc)}", exc_info=True)
        return False

