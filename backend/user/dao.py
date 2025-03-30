from base import BaseDAO
from user.models import User

 
class UsersDAO(BaseDAO):
    model = User