"""
Alembic migration environment.

DATABASE_URL is read from the environment / .env file via the app's Settings.
All application models must be imported here so Alembic can detect schema
changes via `alembic revision --autogenerate`.

When adding new domain models (products, quotations, etc.), import them below
the "─── Import all models ───" section.
"""
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Make 'src' importable when running alembic from the api/ directory.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.core.config import get_settings
from src.core.database import Base

from src.models.user import User
from src.models.customer import Customer
from src.models.product import Product
from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.portal import QuoteMessage
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation
from src.models.admin import SubscriptionPlan, GlobalSetting, Category, CustomerTier, DiscountPolicy
from src.models.billing import Invoice, InvoiceLine, Subscription, Payment
from src.models.audit import AuditLog

# ──────────────────────────────────────────────────────────────────────────────

# Alembic Config object — gives access to values in alembic.ini.
config = context.config

# Inject the DATABASE_URL from settings (overrides any sqlalchemy.url in .ini).
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set up Python logging from the alembic.ini [loggers] section.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    Generates SQL scripts without connecting to the database.
    Useful for generating migration SQL to run on a managed DB.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Produce individual transactions per migration step.
        transaction_per_migration=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode — connects to the live database.
    This is the normal path for `alembic upgrade head`.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # No pooling during migrations.
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,          # Detect column type changes.
            compare_server_default=True, # Detect server_default changes.
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
