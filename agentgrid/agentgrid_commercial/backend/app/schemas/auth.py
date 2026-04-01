from pydantic import BaseModel, EmailStr, Field


class TenantRegistration(BaseModel):
    company_name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=120, pattern=r"^[a-z0-9-]+$")
    brand_name: str = Field(min_length=2, max_length=160)
    brand_tagline: str = Field(default="", max_length=255)
    owner_name: str = Field(min_length=2, max_length=255)
    owner_email: EmailStr
    password: str = Field(min_length=8)
    plan_code: str = Field(default="starter", min_length=2, max_length=50)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    tenant: dict
