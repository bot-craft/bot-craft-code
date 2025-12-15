from typing import Dict, Any, List
# agents
from crewai import Agent, Crew, Task
from langchain_openai import OpenAI  # Updated
import os
import json
import time

from langchain.memory import ConversationBufferMemory, FileChatMessageHistory


from assistant_prompts import AGENT_BACKSTORY, TASK_EXPECTED_OUTPUT, TASK_DESCRIPTION
from assistant_prompts import IGNORED_KEYWORDS_DICT

from time import sleep

def simple_chat(prompt: str, context: Dict[str, Any] = None, api_key: str = None) -> Dict[str, Any]:
    ic(prompt, context)  # Using icecream for debugging

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
    }, file_history)

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

# create agent
def create_simple_agent(memory: ConversationBufferMemory, api_key: str) -> Agent:
    # With memory in this case

    ic(api_key)

    os.environ["OPENAI_API_KEY"] = api_key

    sleep(1)  # Small delay to ensure the environment variable is set

    ic(os.getenv("OPENAI_API_KEY"))

    llm = OpenAI(
            model= "gpt-4o-mini",
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            max_tokens=4096,  # Adjust as needed
            temperature=0.1  # Low for more precise and technical responses
        )
        
    # Create the agent with prompt template directly
    agent = Agent(
        role="Taskyto Chatbots Expert Assistant",
        goal="Understand, help understand and, if necessary (if the user has requested it), generate valid YAML content for Taskyto YAML file definitions",
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
def create_crew_inputs(crew_inputs: dict[str, str], file_history: FileChatMessageHistory) -> dict:


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

    crew_inputs.update(IGNORED_KEYWORDS_DICT)

    return crew_inputs
