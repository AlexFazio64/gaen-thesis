from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
from dotenv import load_dotenv
import requests
import os

from db import get_context

from agents import (
    Agent,Model,
    ModelProvider,
    OpenAIChatCompletionsModel,
    RunConfig,Runner,
    set_tracing_disabled,
)

load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, 
                   allow_origins=["*"], 
                   allow_methods=["*"],
                   allow_headers=["*"])
models = []

BASE_URL = os.getenv("BASE_URL") or ""
MODELS_URL = os.getenv("MODELS_URL") or ""
API_KEY = os.getenv("API_KEY") or ""
MODEL_NAME = os.getenv("MODEL_NAME") or ""

if not BASE_URL or not API_KEY or not MODEL_NAME:
    raise ValueError("Please set BASE_URL, API_KEY, MODEL_NAME via env var or code.")

client = AsyncOpenAI(base_url=BASE_URL, api_key=API_KEY)
set_tracing_disabled(disabled=True)

class OllamaProvider(ModelProvider):
    def get_model(self, model_name: str | None) -> Model:
        return OpenAIChatCompletionsModel(model=MODEL_NAME, openai_client=client)

class FormatterProvider(ModelProvider):
    def get_model(self, model_name: str | None) -> Model:
        return OpenAIChatCompletionsModel(model="gemma3:1b", openai_client=client)

class SpoilerOutput(BaseModel):
    text: str = Field(default="", description="The entire text provided to the agent.")
    extracted_text: str = Field(default="", description="The extracted spoiler from the text. reported as is.")
    spoiler: bool = Field(default=False, description="Whether a spoiler was extracted from the text.")
    confidence: float = Field(default=0.0, description="The confidence of the agent in its decision. [0.0, 1.0]")

async def run_agent(agent: Agent, input_text: str, run_config: RunConfig, ctx: list[str]) -> SpoilerOutput:
    """Helper function to run the agent and handle errors."""
    try:
        result = await Runner.run(agent, input=input_text, run_config=run_config, context=ctx)
        return result.final_output
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, 
                            detail=f"Agent processing failed: {e}")

# --- FastAPI Endpoints ---
# Initialize agent and run config.
agent = Agent(name="Assistant", output_type=SpoilerOutput, instructions=
"""
You will try to extract a spoiler from the given text.
The text will be a social media post, a review, or a summary of a movie, TV show, or book.
Please be careful as there may be typos in the text. Don't correct them, extract them as they are.
There will be some context in the form of keywords given to you to help you better understand the text.
If there is no context, try to understand the text as it is.
Try to extract the spoiler from the text if there is one, and report it back as it is.
If there is a spoiler, set the spoiler field to true, and gauge the confidence of your decision.
If there is no spoiler, set the spoiler field to false, and gauge the confidence of your decision.
""")
run_config = RunConfig(model_provider=OllamaProvider())

def remove_html_tags(text: str) -> str:
    """Removes HTML tags from the given text."""
    import re
    clean = re.compile("<.*?>")
    return re.sub(clean, "", text)

@app.post("/check-spoiler/")
async def check_spoiler(body: dict):
    """Detects spoilers in the given text."""
    text = remove_html_tags(body.get("text"))
    ctx = get_context(text)
    resp = await run_agent(agent, text, run_config, ctx)
    return resp

@app.get("/set/{model_name}")
async def set_model(model_name: str):
    """Sets the model."""
    global run_config, MODEL_NAME, models
    if not model_name in models:
        raise HTTPException(status_code=400, 
                            detail="Model name cannot be empty")
    MODEL_NAME = model_name
    run_config = RunConfig(model_provider=OllamaProvider())
    return JSONResponse(content={"message": f"Model set to {model_name}"})

@app.post("/emb/")
async def get_embedding(body: dict):
    """Gets the embedding for the given text."""
    text = body.get("text")
    if not text:
        raise HTTPException(status_code=400, 
                            detail="Text cannot be empty")
    ctx = get_context(text)
    return ctx

if __name__ == "__main__":
    import uvicorn
    
    resp = requests.get(f"{MODELS_URL}")
    models = [_.get("name") for _ in resp.json().get("models")]
    models.sort(key=lambda x: x.split(":")[0])
    
    uvicorn.run(app, host="127.0.0.1", port=8000)
