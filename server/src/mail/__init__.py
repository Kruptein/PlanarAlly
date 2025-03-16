from redmail.email.sender import EmailSender

from ..config import config

_email = None


def get_email() -> EmailSender:
    """
    Get the email sender object.
    We late initialize this to avoid connection setup until it is actually needed.

    Mail must be enabled in the config and at least a host, port and from_address must be set.
    """
    global _email
    if _email is None:
        if not config.mail or not config.mail.enabled:
            raise ValueError("Mail is not enabled")

        if not config.mail.host:
            raise ValueError("Mail host is not set")

        if not config.mail.port:
            raise ValueError("Mail port is not set")

        if not config.mail.default_from_address:
            raise ValueError("Mail default from address is not set")

        _email = EmailSender(
            host=config.mail.host,
            port=config.mail.port,
            # These are wrongly typed in the redmail library
            username=config.mail.username,  # type: ignore
            password=config.mail.password,  # type: ignore
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
    assert config.mail is not None
    email.send(
        subject=subject,
        text=text,
        html=html,
        receivers=to,
        sender=from_address or config.mail.default_from_address,
    )
