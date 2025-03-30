from sqlalchemy import text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base, str_uniq, int_pk


class User(Base):
    __tablename__ = "users"  # Убедитесь, что указано имя таблицы
    extend_existing = True  # Это должно быть на уровне класса, а не атрибута

    id: Mapped[int_pk]  # Обязательное поле
    first_name: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле
    last_name: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле
    email: Mapped[str_uniq] = mapped_column(nullable=True)  # Необязательное поле
    password: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле
    is_service: Mapped[bool] = mapped_column(default=False, server_default=text('false'), nullable=True)  # Необязательное поле
    is_admin: Mapped[bool] = mapped_column(default=False, server_default=text('false'), nullable=True)  # Необязательное поле
    sipun_login: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле
    sipun_password: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле
    Login_ssh: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле
    key_ssh: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле
    
class server_list(Base):
    __tablename__ = "server_list"  # Убедитесь, что указано имя таблицы
    extend_existing = True  # Это должно быть на уровне класса, а не атрибута

    id: Mapped[int] = mapped_column(primary_key=True)  # Уберите nullable=True
    server_adress: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле

class extreg_list(Base):
    __tablename__ = "extreg_list"  # Убедитесь, что указано имя таблицы
    extend_existing = True  # Это должно быть на уровне класса, а не атрибута

    id: Mapped[int] = mapped_column(primary_key=True)  # Уберите nullable=True
    extreg_adress: Mapped[str] = mapped_column(nullable=True)
    extreg_type: Mapped[str] = mapped_column(nullable=True)  # Необязательное поле

    def __repr__(self):
        return f"{self.__class__.__name__}(id={self.id})"