"""test\

Revision ID: f40221deacad
Revises: 8279d82c840f
Create Date: 2024-10-15 15:45:02.938396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f40221deacad'
down_revision: Union[str, None] = '8279d82c840f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'is_support')
    op.drop_column('users', 'is_user')
    op.drop_column('users', 'nickname')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('nickname', sa.VARCHAR(), autoincrement=False, nullable=False))
    op.add_column('users', sa.Column('is_user', sa.BOOLEAN(), server_default=sa.text('true'), autoincrement=False, nullable=False))
    op.add_column('users', sa.Column('is_support', sa.BOOLEAN(), server_default=sa.text('false'), autoincrement=False, nullable=False))
    # ### end Alembic commands ###
