"""поправка экстрегов

Revision ID: d12b3ae79c7f
Revises: 15add4a2b4df
Create Date: 2025-01-23 18:47:43.852550

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd12b3ae79c7f'
down_revision: Union[str, None] = '15add4a2b4df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('extreg_list', sa.Column('extreg_type', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('extreg_list', 'extreg_type')
    # ### end Alembic commands ###
