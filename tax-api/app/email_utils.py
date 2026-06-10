import os
import smtplib
import logging

logger = logging.getLogger(__name__)


def send_email(recipient: str, subject: str, body: str) -> None:
    """
    Отправляет email пользователю через SMTP.
    Если SMTP_HOST не задан — выводит в консоль (dev-режим).
    """
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not smtp_host:
        logger.info("=" * 60)
        logger.info(f"[DEV] To: {recipient}")
        logger.info(f"[DEV] Subject: {subject}")
        logger.info("-" * 60)
        logger.info(body)
        logger.info("=" * 60)
        print(f"\n📧 [DEV EMAIL] to {recipient}")
        print(f"   Subject: {subject}")
        print(f"   Body:\n{body}\n")
        return

    try:
        msg = f"From: {smtp_from}\nTo: {recipient}\nSubject: {subject}\n\n{body}"
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, [recipient], msg.encode("utf-8"))
        logger.info(f"Email sent to {recipient}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipient}: {e}")
        print(f"\n❌ EMAIL FAILED to {recipient}: {e}\n")