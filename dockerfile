FROM microsoft/aspnetcore
ENV HOME /home
ENV FUNCPACK_TESTS_V2 1
RUN apt-get update \ 
    && apt-get install -my wget gnupg \ 
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt-get install -y nodejs openssh-server

COPY sshd_config /etc/ssh

RUN mkdir -p /home/.azurefunctions/bin

RUN npm i -g azure-functions-core-tools@core --unsafe-perm

WORKDIR /content

COPY . ./
RUN npm i

WORKDIR /content/test/e2e/sample
RUN npm i

WORKDIR /content

CMD ["npm", "run", "test"]