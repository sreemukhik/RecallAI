from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    content = Column(Text) # In a real regulated system, this field would be encrypted
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("app.models.user.User")
