"""Детали питомца: краткое описание, история, характер, паспорт.

Поля нужны сайту: карточка в каталоге показывает short_desc,
страница питомца – story и характер (список черт), бейдж «Паспорт».

Revision ID: 0002_pet_details
Revises: 0001_initial
Create Date: 2026-10-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_pet_details"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column("pets", sa.Column("short_desc", sa.String(length=500), nullable=True))
    op.add_column("pets", sa.Column("story", sa.Text(), nullable=True))
    op.add_column("pets", sa.Column("has_passport", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("pets", sa.Column("character", sa.JSON(), nullable=True))

def downgrade() -> None:
    op.drop_column("pets", "character")
    op.drop_column("pets", "has_passport")
    op.drop_column("pets", "story")
    op.drop_column("pets", "short_desc")
