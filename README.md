# Django Channels Chat
To launch a project from Docker, go to the directory with docker-compose.yml file and run Docker Desktop.
## Docker start
While in the directory, enter the following commands into the terminal
```
docker-compose build
docker-compose up -d
```
If after the entered commands you see «This Site Can’t Be Reached» this mean that the services are being started. The startup speed depends on the power of the computer. It takes me about 10 seconds.

To view the launch status of the services, you can enter the command
```
docker-compose logs -f
```

If you have done everything correctly, then wait 15 seconds and you will see the following
```
web      | Operations to perform:
web      |   Apply all migrations: account, admin, auth, chat, contenttypes, sessions
web      | Running migrations:
web      |   No migrations to apply.
web      | Watching for file changes with StatReloader
web      | Performing system checks...
web      | 
web      | System check identified no issues (0 silenced).
web      | July 03, 2023 - 18:30:17
web      | Django version 4.1, using settings 'jatte.settings'
web      | Starting ASGI/Daphne version 4.0.0 development server at http://0.0.0.0:8000/
web      | Quit the server with CONTROL-C.
```

After that, go to http://127.0.0.1:8000/

###  Project Information
Chat implemented using Django Channels. Allows you to exchange messages in real time. The user who entered the chat sees which user joined him. You can also see if your interlocutor is typing a message. As soon as the user who started the chat disconnects, the chat closes.
