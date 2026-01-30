from types import NoneType
from typing import Dict, Any, List
from pydantic import BaseModel

class AgentResponse(BaseModel):
   answer: bool | NoneType


# filter requests prompts
from openai import OpenAI as OpenAIClient
from assistant_prompts import RAW_FILTER_PROMPT, RAW_FILTER_TOKEN

# agents
from crewai import Agent, Crew, Task, LLM
from langchain_openai import OpenAI  # Updated
import os
import json
import time

from langchain.memory import ConversationBufferMemory, FileChatMessageHistory

from time import sleep

# import litellm
# litellm.drop_params = True

from assistant_prompts import AGENT_BACKSTORY, TASK_EXPECTED_OUTPUT, TASK_DESCRIPTION
from assistant_prompts import IGNORED_KEYWORDS_DICT
from assistant_prompts import GREETING_RESPONSE, OUT_OF_SCOPE_RESPONSE


# ASSISTANT_LLM_MODEL = "gpt-4.1-mini"
# ASSISTANT_LLM_MODEL = "gpt-4.1-nano"
# ASSISTANT_LLM_MODEL = "gpt-5-nano"
# ASSISTANT_LLM_MODEL = "gpt-5-mini"
ASSISTANT_LLM_MODEL = "gpt-4o-mini"

# FILTER_LLM_MODEL = "gpt-4o-mini"
# FILTER_LLM_MODEL = "gpt-4.1-nano"
# FILTER_LLM_MODEL = "gpt-4.1-mini"
FILTER_LLM_MODEL = "gpt-5-nano"

# FILTER_RESPONSE_LLM_MODEL = "gpt-4o-mini"
# FILTER_RESPONSE_LLM_MODEL = "gpt-5-nano"
# FILTER_RESPONSE_LLM_MODEL = "gpt-4.1-nano"
FILTER_RESPONSE_LLM_MODEL = "gpt-4.1-mini"


def simple_chat(prompt: str, api_key: str = None, attached_files: List[Dict[str, str]] = None, current_file: Dict[str, str] = None) -> Dict[str, Any]:
    ic(prompt)  # Using icecream for debugging
    if attached_files:
        ic(f"Processing {len(attached_files)} attached files")

    response: str = "Hello! This is a simple chat response to your prompt."

    file_history = FileChatMessageHistory("chat_history.json")
    memory = ConversationBufferMemory(
        chat_memory=file_history,
        memory_key="chat_history",
        return_messages=True
    )

    # Initialize the agent
    agent = create_simple_agent(memory, api_key)

    # Create a task for the agent
    task = create_simple_task(agent)

    # Create a Crew 
    crew = Crew(
        agents=[agent],
        tasks=[task],
        # verbose=True,
        # verbose=False,
    )

    # ic(AGENT_BACKSTORY)  # Debugging output

    crew_inputs = create_crew_inputs({
        "user_prompt": prompt,
    }, file_history, attached_files, current_file)

    # ic(crew_inputs)

    start_time = time.monotonic()

    result = str(
        crew.kickoff(
            inputs=crew_inputs,
        )
    )

    end_time = time.monotonic()
    processing_time = end_time - start_time

    # Saving conversation history
    if is_memory_file_valid(file_history):
        memory.chat_memory.add_user_message(prompt)
        memory.chat_memory.add_ai_message(result)

    # ic(result)  # Debugging output

    response = result
    
    # return part
    ret = {
        "response": response,
        "status": "success",
        "processing_time_seconds": processing_time,
    }

    return ret


# request filter
def filter_request(prompt: str, api_key: str = None) -> Dict[str, bool | NoneType | float]:
    # pending pasarle la memoria
    # request filter client
    client = OpenAIClient(api_key=api_key)

    FILTER_PROMPT = RAW_FILTER_PROMPT.replace(RAW_FILTER_TOKEN, prompt)

    ic(FILTER_PROMPT)

    bool_or_none = lambda x: (isinstance(x, bool) or x is None)
    is_valid = ""

    start_time = time.monotonic()

    while not bool_or_none(is_valid):
        llm_classification = client.beta.chat.completions.parse(
            model= FILTER_LLM_MODEL,
            messages=[
                {"role": "system", "content": f"Answer ONLY True, False or None"},
                {"role": "user", "content": FILTER_PROMPT}
            ],
            response_format=AgentResponse
        )

        is_valid = llm_classification.choices[0].message.parsed.answer
        # debug
        print(is_valid if not bool_or_none(is_valid) else "Todo Ok")
        ic(llm_classification)
        ic(is_valid)


    fallback_response_str = None

    if not is_valid:
        
        fall_back_raw_prompt = GREETING_RESPONSE if is_valid is None else OUT_OF_SCOPE_RESPONSE

        ic(FILTER_RESPONSE_LLM_MODEL)
    
        fallback_response = client.chat.completions.create(
            model= FILTER_RESPONSE_LLM_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": 
                        f"Respond something similar to the user prompt in the SAME LANGUAGE as the USER's' prompt that starts and ends with \"####\" DO NOT include \"####\" in your answer. You can use emojis. DO NOT RESPOND ANYTHING ELSE."
                },
                {
                    "role": "user", 
                    "content": 
                        f""" The user prompt is:
                            ####
                            {prompt}
                            ####
                            And the response you have to rephrase is:
                            ------
                            {fall_back_raw_prompt}
                            ------

                            Rephrase it IN THE SAME LANGUAGE as the USER PROMPT. That starts and ends with "####". DO NOT include "####" in your answer.
                        """
                }
            ],
        )

        ic(fallback_response)
        fallback_response_str = fallback_response.choices[0].message.content
        ic(fallback_response_str)

    end_time = time.monotonic()
    processing_time = end_time - start_time 

    ret = {
        "response": fallback_response_str,
        "is_valid": is_valid,
        "status": "success",
        "processing_time_seconds": processing_time
    }

    return ret

# create agent
def create_simple_agent(memory: ConversationBufferMemory, api_key: str) -> Agent:
    # With memory in this case

    ic(api_key)

    os.environ["OPENAI_API_KEY"] = api_key

    sleep(1)  # Small delay to ensure the environment variable is set

    ic(os.getenv("OPENAI_API_KEY"))

    ic(ASSISTANT_LLM_MODEL)

    if "gpt-5" in ASSISTANT_LLM_MODEL:
        
        llm = LLM(
            model= f"openai/{ASSISTANT_LLM_MODEL}",
            api_key=os.getenv("OPENAI_API_KEY"),
            # max_tokens=4096,  # Adjust as needed
            temperature=0.1,  # Low for more precise and technical responses
            # extra_body={"stop": None},
            drop_params = True,
            additional_drop_params = ["stop", "temperature"]
        )
    else:

        # llm = LLM(
        #     model= f"openai/{ASSISTANT_LLM_MODEL}",
        #     api_key=os.getenv("OPENAI_API_KEY"),
        #     max_tokens=8192,  # Adjust as needed
        #     temperature=0.1,  # Low for more precise and technical responses
        #     # drop_params = True,
        #     # additional_drop_params = ["stop", "temperature"]
        # )

        llm = OpenAI(
                model= ASSISTANT_LLM_MODEL,
                openai_api_key=os.getenv("OPENAI_API_KEY"),
                max_tokens=8192,  # Adjust as needed
                temperature=0.1  # Low for more precise and technical responses
            )

    # Create the agent with prompt template directly
    agent = Agent(
        role="Taskyto Chatbots Expert Assistant",
        goal="Understand, help understand and, if necessary (if the user has requested it), generate valid YAML content for Taskyto YAML file definitions. You may have attached some files from the user. Make your response coherent with the user request in relation with the attached content. This information helps you to understand the actual content and how it is being evolving in order to make it easier for you to satisfy the user's request",
        backstory=AGENT_BACKSTORY,
        llm=llm,
        verbose=True,
        memory=memory,
        # allow_delegation=True,
        llm_kwargs={"openai_api_key": api_key}  # Pass API key here
    )

    return agent

# create task
def create_simple_task(agent: Agent) -> Task:

    task = Task(
        name="Taskyto Assistant user interaction",
        description= \
            f"""
                Considering the user prompt which is: "{{user_prompt}}"

                Considering as well the conversation history: "{{conversation_history}}"

                Considering the current user file (the user has on its active tab): "{{current_file}}"

                Considering the user attached files: "{{attached_files}}"

                {TASK_DESCRIPTION}
            """
        ,

        agent=agent,
        expected_output=
            TASK_EXPECTED_OUTPUT
        ,
    )

    return task

def _empty_memory_file(file_history: FileChatMessageHistory):
    """
    Ensure the file contains an empty list if JSON is invalid
    """
    relative_path = file_history.file_path
    absolute_path = os.path.abspath(relative_path)
    ic(f"Emptying memory file at: {absolute_path}")
    with open(absolute_path, "w") as f:
        json.dump([], f)

# memory error control
def is_memory_file_valid(file_history: FileChatMessageHistory) -> bool:
    try:
        file_history.messages
        
        # # FABADA echarle un vistazo a la estructura de los mensajes si tienes curiosidad
        # # (con más ics)
        # if history_messages:
        #     ic(type(history_messages[0]))

        return True
    except json.JSONDecodeError as e:
        ic(file_history.file_path)
        ic(e)
        _empty_memory_file(file_history)
        return False
    except Exception as e:
        ic(file_history.file_path)
        ic(e)
        _empty_memory_file(file_history)
        return False
    
# create crew inputs
def create_crew_inputs(crew_inputs: dict[str, str], file_history: FileChatMessageHistory, attached_files: List[Dict[str, str]] = None, current_file: Dict[str, str] = None) -> dict:


    # IMPORTANTE: debe ser una lista vacía
    if not is_memory_file_valid(file_history):
        history_messages = []
    else:
        history_messages = file_history.messages

    # Format the history for better context
    formatted_history = ""
    if history_messages:
        formatted_history = "\nPrevious conversation:\n"
        for msg in history_messages:
            role = "User" if msg.type == "human" else "Assistant"
            formatted_history += f"- {role}: {msg.content}\n"
    
    # Add the formatted history to inputs
    crew_inputs["conversation_history"] = formatted_history

    # Format attached files
    formatted_attached_files = ""
    if attached_files:
        formatted_attached_files = "\nAttached Files:\n"
        for f in attached_files:
            filename = f.get('filename', 'Unknown')
            filepath = f.get('filepath', 'Unknown Path')
            filecontent = f.get('filecontent', '')
            formatted_attached_files += f"File: {filename} (Path: {filepath})\nContent:\n{filecontent}\n-------------------\n"
    
    crew_inputs["attached_files"] = formatted_attached_files
    
    # Current File
    formatted_current_file = ""
    if current_file:
        formatted_attached_files = "\nCurrent File:\n"
        
        filename = current_file.get('filename', 'Unknown')
        filepath = current_file.get('filepath', 'Unknown Path')
        filecontent = current_file.get('filecontent', '')
        formatted_current_file += f"File: {filename} (Path: {filepath})\nContent:\n{filecontent}\n-------------------\n"
    
    crew_inputs["current_file"] = formatted_attached_files

    crew_inputs.update(IGNORED_KEYWORDS_DICT)

    return crew_inputs
