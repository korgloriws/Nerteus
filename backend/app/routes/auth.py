from datetime import timedelta

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from ..auth import create_access_token, login
from ..config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    token = await login(form_data)
    settings = get_settings()
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    return {"access_token": token, "token_type": "bearer", "expires_in": int(expires.total_seconds())}

