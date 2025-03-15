from redmail.email.sender import EmailSender

from ..config import config

_email = None


def is_enabled() -> bool:
    return config.get("Mail", "enabled") == "true"


def get_email() -> EmailSender:
    """
    Get the email sender object.
    We late initialize this to avoid connection setup until it is actually needed.

    Mail must be enabled in the config and at least a host, port and from_address must be set.
    """
    global _email
    if _email is None:
        if not is_enabled():
            raise ValueError("Mail is not enabled")

        if not config.get("Mail", "host"):
            raise ValueError("Mail host is not set")

        if not config.get("Mail", "port"):
            raise ValueError("Mail port is not set")

        if not config.get("Mail", "default_from_address"):
            raise ValueError("Mail default from address is not set")

        _email = EmailSender(
            host=config.get("Mail", "host"),
            port=config.getint("Mail", "port"),
            username=config.get("Mail", "username"),
            password=config.get("Mail", "password"),
        )
    return _email


def send_mail(
    subject: str,
    text: str,
    html: str | None,
    to: str | list[str],
    from_address: str | None = None,
) -> None:
    email = get_email()
    email.send(
        subject=subject,
        text=text,
        html=html,
        receivers=to,
        sender=from_address or config.get("Mail", "default_from_address"),
    )
