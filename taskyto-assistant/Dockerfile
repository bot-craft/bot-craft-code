# Dockerfile para backend
FROM python:3.10-slim AS assistant-flask_img
ENV PYTHONUNBUFFERED 1

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=Europe/Madrid

RUN apt update && DEBIAN_FRONTEND=noninteractive apt install -y --no-install-recommends tzdata net-tools file wget tar sudo adduser nano htop netstat-nat net-tools curl less procps \
&& rm -rf /var/lib/apt/lists/* && pip install --upgrade pip

# Argumentos para UID y GID - DEBEN estar ANTES de usarse
ARG USER_UID=1000
ARG USER_GID=1000

# Create user ubuntu con UID/GID específicos
RUN groupadd -g ${USER_GID} ubuntu && \
    useradd -m -s /bin/bash -u ${USER_UID} -g ${USER_GID} ubuntu && \
    usermod -aG sudo ubuntu && \
    echo "ubuntu ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/ubuntu && \
    chmod 044 /etc/sudoers.d/ubuntu && \
    echo 'ubuntu:ubuntu' | chpasswd

COPY ./requirements.txt .
RUN pip install pipenv && PIPENV_VENV_IN_PROJECT=1 pipenv install -r requirements.txt && rm Pipfile* && find /.venv -name "*.pyc" -delete

# Cambiar ownership DESPUÉS de crear todo
RUN chown -R ${USER_UID}:${USER_GID} /.venv

# Crear y configurar permisos del directorio de trabajo
RUN mkdir -p /home/ubuntu/app/assistant-flask && \
    chown -R ${USER_UID}:${USER_GID} /home/ubuntu

USER ${USER_UID}:${USER_GID}

ENV PATH="/.venv/bin:$PATH"

WORKDIR /home/ubuntu/app/assistant-flask

# Uso de script entrypoint para manejo de permisos en tiempo de ejecución
COPY --chown=${USER_UID}:${USER_GID} ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
