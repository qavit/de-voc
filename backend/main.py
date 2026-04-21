from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, engine
from backend.routers import llm, review, stats, vocabularies

Base.metadata.create_all(bind=engine)

app = FastAPI(title="German Vocab Master API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vocabularies.router)
app.include_router(review.router)
app.include_router(stats.router)
app.include_router(llm.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to German Vocab Master API"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
