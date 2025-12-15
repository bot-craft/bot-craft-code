# Dockerfile para frontend
FROM node:22 as node-react_img

RUN apt update && apt install -y sudo && rm -rf /var/lib/apt/lists/*

RUN usermod -aG sudo node && echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node \
&& chmod 044 /etc/sudoers.d/node && echo 'node:node' | chpasswd

USER node:node

WORKDIR /app/frontend-react
COPY ./frontend-react /app/frontend-react

RUN mkdir ~/.npm-global && \
    npm config set prefix '~/.npm-global' && \
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc && \
    . ~/.bashrc
    # . ~/.bashrc && \
RUN npm install -g npm@10.9.0

RUN sudo rm -rf node_modules && \
    npm install

ARG REACT_APP_IP_ADDRESS
ENV REACT_APP_IP_ADDRESS=$REACT_APP_IP_ADDRESS

CMD ["npm", "start"]
# CMD bash