from sqlmodel import Session, select

from models.blacklist import BlackListedToken



class BlackListCRUD:
    def __init__(self, db: Session):
        self.db = db

    def add(self,token: str):
        blacklist = BlackListedToken(token=token)
        self.db.add(blacklist)
        self.db.commit()
        self.db.refresh(blacklist)
        return blacklist
    
    def is_blacklisted(self, token: str) -> bool:
        result = self.db.exec(
            select(BlackListedToken).where(BlackListedToken.token == token)
        ).first()
        return result is not None
