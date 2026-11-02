from pydantic import BaseModel, ConfigDict


class MessageResponse(BaseModel):
    message: str
    success: bool = True
    detail: str | None = None

    model_config = ConfigDict(from_attributes=True)


class StandardResponse[T](BaseModel):
    success: bool = True
    data: T | None = None
    message: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)
