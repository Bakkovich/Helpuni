import email
from fastapi import APIRouter, HTTPException, status, Depends
from user.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user,
    get_current_admin_user,
)
from user.dao import UsersDAO
from user.schemas import SUserRegister, SUserAuth, SUserUpdate, SUserDelete
from fastapi.responses import Response
from user.models import User
from user.auth import get_authorized_session

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register/")
async def register_user(user_data: SUserRegister) -> dict:

    user = await UsersDAO.find_one_or_none(email=user_data.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Пользователь уже существует"
        )
    if (
        await get_authorized_session(email=user_data.email, password=user_data.password)
        is False
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверная почта или пароль от админки",
        )
    user_dict = user_data.dict()
    user_dict["password"] = get_password_hash(user_data.password)
    await UsersDAO.add(**user_dict)
    return {"message": "Вы успешно зарегистрированы!"}


@router.post("/login/")
async def auth_user(response: Response, user_data: SUserAuth):
    if (
        await get_authorized_session(email=user_data.email, password=user_data.password)
        is False
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверная почта или пароль от админки, пожалуйста, обратитесь к @Bakkovich",
        )
    check = await authenticate_user(email=user_data.email, password=user_data.password)
    if check is False:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Данная почта не зарегестрированна"
        )
    if check is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверная почта или пароль"
        )
    access_token = create_access_token({"sub": str(check.id)})
    response.set_cookie(key="users_access_token", value=access_token, httponly=True)
    return {"access_token": access_token, "refresh_token": None}


@router.post("/logout/")
async def logout_user(response: Response):
    response.delete_cookie(key="users_access_token")
    return {"message": "Пользователь успешно вышел из системы"}


@router.get("/me/")
async def get_me(user_data: User = Depends(get_current_user)):
    return user_data


@router.get("/all_users/")
async def get_all_users(user_data: User = Depends(get_current_admin_user)):
    return await UsersDAO.find_all()


@router.put("/update/")
async def update_user(User: SUserUpdate, user_data: User = Depends(get_current_user)):
    check = await UsersDAO.update(
        {
            "id": User.id,
        },
        is_service=User.is_service,
        is_admin=User.is_admin,
        first_name=User.first_name,
        last_name=User.last_name,
        email=User.email,
        sipun_login=User.sipun_login,
        sipun_password=User.sipun_password,
        Login_ssh=User.Login_ssh,
        key_ssh=User.key_ssh,
    )
    if check:
        return {"message": "Данные обновлены!", "присвоен новый статус": User}
    else:
        return {"message": "Ошибка при обновлении пользователя!"}


@router.delete("/Delete/")
async def delete_user(
    User: SUserDelete, user_data: User = Depends(get_current_admin_user)
):
    check = await UsersDAO.delete(
        {
            "id": User.id,
        }
    )
    if check:
        return {"message": "Данные обновлены!", "Удален пользователь": User.id}
    else:
        return {"message": "Ошибка при удалении пользователя!"}
