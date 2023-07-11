import json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from .templatetags.chat_extras import initials
from django.utils.timesince import timesince
from .models import Message, Room
from account.models import User


# https://channels.readthedocs.io/en/stable/tutorial/part_2.html
class ChatConsumer(AsyncWebsocketConsumer):
    # Обработка входящих сообщений
    async def connect(self):
        # Обязательный метод, вызывается каждый раз при соединении
        # В нем происходит инициализация списка пользователей и проверки авторизации

        self.room_name = self.scope['url_route']['kwargs']['room_name']
        # self.scope предоставляет информацию о текущем соединении, включая обработчик запросов
        # имя комнаты. Берётся из routing.py

        self.room_group_name = f'chat_{self.room_name}'
        # является именем группы, к которой клиент относится, и в которой он может быть подписан на получение
        # сообщений.
        # Группа создается на основе self.room_name, который мы получаем из URL-адреса.

        self.user = self.scope['user']
        # Присваивает текущего авторизованного пользователя

        await self.get_room()
        # Получаем комнату

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        # Присоединяемся к группе.
        # Здесь не нужен sync_to_async, потому что у нас AsyncWebsocketConsumer, а не WebsocketConsumer

        await self.accept()
        # Принимает соединение WebSocket

        if self.user.is_staff:
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'users_update'
            })

    async def disconnect(self, close_code):
        # Метод удаляет канал из группы, если он там зарегистрирован
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        if not self.user.is_staff:
            await self.set_room_closed()

    async def receive(self, text_data=None, bytes_data=None):
        print('receive msg')
        # Receive message from WebSocket (frontend)
        text_data_json = json.loads(text_data)
        # JSON -> dict
        my_type = text_data_json['type']
        message = text_data_json['message']
        name = text_data_json['name']
        agent = text_data_json.get('agent', '')
        if my_type == 'message':
            print('my_type == message')
            new_message = await self.create_message(name, message, agent)
            await self.channel_layer.group_send(self.room_group_name, {
                # Отправляем сообщение от одного пользователя всем в определенной комнате чата
                # 'type': 'chat_message' Значит что будет вызван обработчик, у потребителей, которые подписались
                'type': 'chat_message',
                'message': message,
                'name': name,
                'agent': agent,
                'initials': initials(name),
                'created_at': timesince(new_message.created_at),
            })
        elif my_type == 'update':
            print('my_type == update')
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'writing_active',
                'message': message,
                'name': name,
                'agent': agent,
                'initials': initials(name),
            })

    async def chat_message(self, event):
        print('chat_message')
        # Обрабатывает chat_message событие
        # Получает событие с данными от комнаты чата и отправляет его клиенту
        await self.send(text_data=json.dumps({
            # dict -> JSON
            'type': event['type'],
            'message': event['message'],
            'name': event['name'],
            'agent': event['agent'],
            'initials': event['initials'],
            'created_at': event['created_at']
        }))
        # Отправляем сообщение в веб-сокет Frontend

    async def users_update(self, event):
        print('users_update')
        await self.send(text_data=json.dumps({
            'type': 'users_update'
        }))

    async def writing_active(self, event):
        print('writing_active')
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'message': event['message'],
            'name': event['name'],
            'agent': event['agent'],
            'initials': event['initials']
        }))

    @sync_to_async
    def get_room(self):
        self.room = Room.objects.get(uuid=self.room_name)

    @sync_to_async
    def set_room_closed(self):
        self.room = Room.objects.get(uuid=self.room_name)
        self.room.status = Room.CLOSED
        self.room.save()

    @sync_to_async
    def create_message(self, sent_by, message, agent):
        message = Message.objects.create(body=message, sent_by=sent_by)

        if agent:
            message.created_by = User.objects.get(pk=agent)
            message.save()

        self.room.messages.add(message)
        # Объект модели с ManyToManyField.поле.add.объект привязки
        # Нам не нужно явно сохранять message.
        # При вызове .add Django явно выполнит сохранение
        # Также метод .add вместо явного сохранения позволит избежать ошибок

        return message

