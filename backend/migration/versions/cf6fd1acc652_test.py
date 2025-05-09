"""test

Revision ID: cf6fd1acc652
Revises: f40221deacad
Create Date: 2025-01-14 18:49:22.979705

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf6fd1acc652'
down_revision: Union[str, None] = 'f40221deacad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('sipun_login', sa.VARCHAR(), nullable=True))
    op.add_column('users', sa.Column('sipun_password', sa.VARCHAR(), nullable=True))
    op.add_column('users', sa.Column('Login_ssh', sa.VARCHAR(), nullable=True))
    op.add_column('users', sa.Column('key_ssh', sa.VARCHAR(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'key_ssh')
    op.drop_column('users', 'Login_ssh')
    op.drop_column('users', 'sipun_password')
    op.drop_column('users', 'sipun_login')
    # ### end Alembic commands ###
