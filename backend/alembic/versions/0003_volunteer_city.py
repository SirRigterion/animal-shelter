"""Город волонтёра: обязательное поле в заявке на волонтёрство.

Revision ID: 0003_volunteer_city
Revises: 0002_pet_details
Create Date: 2026-10-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_volunteer_city"
down_revision: Union[str, None] = "0002_pet_details"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column(
        "volunteer_applications",
        sa.Column("city", sa.String(length=100), nullable=False, server_default=""),
    )

def downgrade() -> None:
    op.drop_column("volunteer_applications", "city")
