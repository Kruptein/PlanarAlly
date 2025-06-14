from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


class HostPortConnection(BaseModel):
    type: Literal["hostport"] = "hostport"
    host: str = "0.0.0.0"
    port: int = 8000


class SocketConnection(BaseModel):
    type: Literal["socket"] = "socket"
    socket: str


class SslConfig(BaseModel):
    # Can be used to disable SSL,
    # without having to remove the ssl section entirely
    enabled: bool = False
    fullchain: str
    privkey: str


class WebserverConfig(BaseModel):
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
    cors_allowed_origins: Optional[str | list[str]] = None

    # This limits the maximum size a single request to the server can be.
    # This does _not_ limit the maximum size of assets. (See AssetsConfig)
    # Campaign uploads will be chunked by the client according to this setting.
    # Defaults to 10 * 1024 ** 2 = 10 MB
    max_upload_size_in_bytes: int = 10_485_760


class AssetsConfig(BaseModel):
    # Can be used to signal that assets are stored in a different directory
    directory: Optional[str] = None

    # Configuration limits for User asset uploads
    # Single asset is simply the max allowed upload size for a single asset
    # Total asset is the total sum of all assets the user has uploaded
    # These settings only apply to checks done on new uploads and not on existing assets
    # (i.e. no assets will be removed if they're already over the limit when these settings are changed)
    #
    # A number <=0 means no limit
    max_single_asset_size_in_bytes: int = 0
    max_total_asset_size_in_bytes: int = 0


class GeneralConfig(BaseModel):
    # Location of the save file
    # This is relative to the server root
    save_file: str = "data/planar.sqlite"

    # The client url is the full URL to the landing page of the application (e.g. https://app.planarally.io)
    # It should include the desired protocol (http or https)
    # This is used for generated URLs (e.g. password reset link, invitation URL)
    # If not specified, this will be guessed or simply not available
    # It's strongly suggested to set this value
    client_url: Optional[str] = None

    # Allow users to sign up
    # If disabled, only existing accounts can login
    # Accounts can be created manually using the CLI by the admin
    allow_signups: bool = True

    # Enable exporting of campaigns
    # If disabled, users will not be able to export campaigns
    enable_export: bool = True

    # These settings are used for log rotating,
    # see https://docs.python.org/3/library/logging.handlers.html#logging.handlers.RotatingFileHandler for details
    max_log_size_in_bytes: int = 200_000
    max_log_backups: int = 5


class MailConfig(BaseModel):
    # Can be used to disable email functionality
    # without having to remove the mail section entirely
    enabled: bool = True
    # HOST:PORT combination for the SMTP server
    host: str
    port: int
    # Username/password are optional for SMTP servers that do not require authentication
    username: Optional[str] = None
    password: Optional[str] = None
    # The default from address to use for emails
    default_from_address: EmailStr
    ssl_mode: Literal["ssl", "tls", "starttls", "lmtp"] = "starttls"


class StatsConfig(BaseModel):
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


class ServerConfig(BaseModel):
    general: GeneralConfig = GeneralConfig()
    assets: AssetsConfig = AssetsConfig()
    webserver: WebserverConfig = WebserverConfig()
    stats: StatsConfig = StatsConfig()
    mail: Optional[MailConfig] = None
    # Optional API server configuration
    # If not specified, the API server will not be started
    # Note: ensure that a different connection string is used
    apiserver: Optional[WebserverConfig] = None
