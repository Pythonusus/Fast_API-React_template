from pydantic import BaseModel


class MirrorRequest(BaseModel):
    message: str
