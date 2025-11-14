from typing import Literal

from pydantic import BaseModel, EmailStr, Extra


class ConfigModel(BaseModel):
    class Config:
        extra = Extra.forbid


class HostPortConnection(ConfigModel):
    type: Literal["hostport"] = "hostport"
    host: str = "0.0.0.0"
    port: int = 8000


class SocketConnection(ConfigModel):
    type: Literal["socket"] = "socket"
    socket: str


class SslConfig(ConfigModel):
    # Can be used to disable SSL,
    # without having to remove the ssl section entirely
    enabled: bool = False
    fullchain: str
    privkey: str


class WebserverConfig(ConfigModel):
    # Core connection string
    # This is either a HOST:PORT combination
    # or a UNIX socket path
    connection: HostPortConnection | SocketConnection = HostPortConnection(host="0.0.0.0", port=8000)

    # Optional SSL configuration
    # Ideally you use a reverse proxy to handle SSL
    # but the option is here to handle SSL directly
    ssl: SslConfig | None = None

    # CORS configuration
    # This value is passed to the socketio server:
    #   https://python-socketio.readthedocs.io/en/latest/api.html#asyncserver-class
    # A value of '*' can be set to allow all origins,
    # this is useful for testing purposes, but not secure
    cors_allowed_origins: str | list[str] | None = None

    # This limits the maximum size a single request to the server can be.
    # This does _not_ limit the maximum size of assets. (See AssetsConfig)
    # Campaign uploads will be chunked by the client according to this setting.
    # Defaults to 10 * 1024 ** 2 = 10 MB
    max_upload_size_in_bytes: int = 10_485_760


class AssetsConfig(ConfigModel):
    # Can be used to signal that assets are stored in a different directory
    directory: str | None = None

    # Configuration limits for User asset uploads
    # Single asset is simply the max allowed upload size for a single asset
    # Total asset is the total sum of all assets the user has uploaded
    # These settings only apply to checks done on new uploads and not on existing assets
    # (i.e. no assets will be removed if they're already over the limit when these settings are changed)
    #
    # A number <=0 means no limit
    max_single_asset_size_in_bytes: int = 0
    max_total_asset_size_in_bytes: int = 0

class LoggingConfig(ConfigModel):
    # Enable logging to a file 
    destinations: list[Literal["stdout", "file"]] = ["stdout", "file"]
    # The log file path
    file_path: str = "planarally.log"
    # The Log Level
    level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    # These settings are used for log rotating,
    # see https://docs.python.org/3/library/logging.handlers.html#logging.handlers.RotatingFileHandler for details
    max_log_size_in_bytes: int = 200_000
    max_log_backups: int = 5

class GeneralConfig(ConfigModel):
    # Location of the save file
    # This is relative to the server root
    save_file: str = "data/planar.sqlite"

    # The client url is the full URL to the landing page of the application (e.g. https://app.planarally.io)
    # It should include the desired protocol (http or https)
    # This is used for generated URLs (e.g. password reset link, invitation URL)
    # If not specified, this will be guessed or simply not available
    # It's strongly suggested to set this value
    client_url: str | None = None

    # Allow users to sign up
    # If disabled, only existing accounts can login
    # Accounts can be created manually using the CLI by the admin
    allow_signups: bool = True

    # Enable exporting of campaigns
    # If disabled, users will not be able to export campaigns
    enable_export: bool = True

    # These settings are used for log rotating,
    # see https://docs.python.org/3/library/logging.handlers.html#logging.handlers.RotatingFileHandler for details
    # Retiring this for a dedicated logging section
    max_log_size_in_bytes: int | None = None
    max_log_backups: int | None = None

    admin_user: str | None = None

    # Authentication options (local = built-in username/password, oidc = OpenID Connect)
    #  Both methods can be enabled at the same time
    authentication_methods: list[Literal["local", "oidc"]] = ["local"]


class MailConfig(ConfigModel):
    # Can be used to disable email functionality
    # without having to remove the mail section entirely
    enabled: bool = True
    # HOST:PORT combination for the SMTP server
    host: str
    port: int
    # Username/password are optional for SMTP servers that do not require authentication
    username: str | None = None
    password: str | None = None
    # The default from address to use for emails
    default_from_address: EmailStr
    ssl_mode: Literal["ssl", "tls", "starttls", "lmtp"] = "starttls"


class StatsConfig(ConfigModel):
    # Enable collection of stats
    enabled: bool = True

    # Enable exporting of stats
    # If disabled, stats will be collected locally but not sent to the stats server
    enable_export: bool = True

    # The frequency to export stats in seconds
    # Defaults to 24 * 60 * 60 = 1 day
    export_frequency_in_seconds: int = 24 * 60 * 60

    # The base URL to send stats to
    stats_url: str = "https://stats.planarally.io"

class OidcConfig(ConfigModel):
    # The display name for this OIDC provider
    display_name: str 
    # The id of the provider
    provider_id: str 
    # The OIDC Client ID to use for authentication
    client_id: str 
    # The OIDC Client Secret to use for authentication
    client_secret: str 
    # The OIDC Discovery URL used to fetch provider configuration
    discovery_url: str 
    # Whether to use PKCE (Proof Key for Code Exchange) during authentication
    pkce: bool = True
    # The list of scopes to request during authentication (normally you shouldn't need to change this)
    scopes: list[str] = ["openid", "email", "profile"]
    # The claim to use as the username
    username_claim: str = "preferred_username"
    # The claim to use as the email
    email_claim: str = "email"

class ServerConfig(ConfigModel):
    general: GeneralConfig = GeneralConfig()
    assets: AssetsConfig = AssetsConfig()
    webserver: WebserverConfig = WebserverConfig()
    stats: StatsConfig = StatsConfig()
    mail: MailConfig | None = None
    logging: LoggingConfig = LoggingConfig()
    oidc: list[OidcConfig] = []
