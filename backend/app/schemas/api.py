"""
Schemas for the backend application.

A Pydantic schema is a class that describes the shape of a piece of data:
which fields exist, and what type each one must be. Classes here subclass
``BaseModel``, so Pydantic can turn raw input (usually a JSON body) into a
Python object and reject anything that does not match.

How that works on a request:

1. An endpoint declares a parameter typed as one of these models, for example
   ``def mirror(request: MirrorRequest)``.
2. FastAPI reads the JSON body and asks Pydantic to build that model.
3. Pydantic checks every field. ``message: str`` accepts a string and rejects
   a missing field, ``null``, or a non-string such as a number.
4. If validation fails, FastAPI returns HTTP 422 with a list of the bad
   fields. The endpoint function never runs.
5. If validation succeeds, the function receives a ``MirrorRequest`` instance
   and reads fields as attributes (``request.message``).

The same class also becomes the request schema in the generated OpenAPI docs,
so the documented body and the validated body stay the same definition.
"""
from pydantic import BaseModel


class MirrorRequest(BaseModel):
    message: str
