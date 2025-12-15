# <a name="readme">taskyto-web-platform</a>
A web platform for Taskyto chatbots

#### CLONE

```bash
git clone --recurse-submodules git@github.com:satori-chatbots/taskyto-web-platform.git -b assistant_and_taskyto_chat
```

```bash
cd taskyto-web-platform
```

##### Ensure to be sticked to the sumodule corresponding branch

```bash
cd chatbot-llm
```

```bash
git checkout kalopanja-fork
```
#### DEPLOYMENT

##### Deploying Frontend and Chatbot-llm

```bash
cd .. && docker compose up -d
```

##### Deploying database

```bash
cd db/ && docker compose up -d
```

##### Installing venv

```bash
sudo apt update
sudo apt install python3.10-venv
```

##### Deploying backend

```bash
cd ../backend/backend-flask/
```
(the following command only the first time)
```bash
python -m venv venv_backend_flask
```

```bash
. venv_backend_flask/bin/activate
```

(the following command only the first time)
```bash
pip install -r requirements.txt
```

```bash
python app.py
```

##### Deploying Taskyto-assistant (on a new terminal)

```bash
cd <workdir>/taskyto-web-platform/taskyto-assistant/
```

(the following command only the first time)
```bash
python -m venv venv_agents_flask
```

```bash
. venv_agents_flask/bin/activate
```

(the following command only the first time)
```bash
pip install -r requirements.txt
```

```bash
python app.py
```

#### EXECUTION

<a>http://localhost:9000</a>

#### TURN OFF

```bash
docker compose down # on previous  directories "where we made docker compose up -d"
```

"ctrl + c" on python executions (backend and taskyto-assistant)
