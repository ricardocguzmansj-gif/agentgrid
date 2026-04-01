from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Agent
from app.schemas.agent import AgentCreate, AgentOut

router = APIRouter(prefix='/agents', tags=['agents'])


@router.post('', response_model=AgentOut)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)):
    exists = db.query(Agent).filter(Agent.name == payload.name).first()
    if exists:
        raise HTTPException(status_code=409, detail='Agent name already exists')
    agent = Agent(**payload.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get('', response_model=list[AgentOut])
def list_agents(db: Session = Depends(get_db)):
    return db.query(Agent).order_by(Agent.created_at.desc()).all()
