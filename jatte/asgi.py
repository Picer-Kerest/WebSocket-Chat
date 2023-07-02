import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jatte.settings')

from chat import routing

django_asgi_application = get_asgi_application()
# Получаем ASGI приложение

application = ProtocolTypeRouter(
    # Создаем ASGI-приложение с помощью маршрутизаторов протоколов.
    {
        # Добавляем ASGI-приложение Джанго для работы HTTP-сервера.
        'http': django_asgi_application,
        # Добавляем ASGI-приложение для работы сервера веб-сокетов.
        'websocket': AllowedHostsOriginValidator(
            # AllowedHostsOriginValidator чтобы проверить, что запрос пришел от разрешенного хоста.
            AuthMiddlewareStack(URLRouter(routing.websocket_urlpatterns))
            # AuthMiddlewareStack, проверяет, что пользователь, пытающийся подключиться к WebSocket-соединению,
            # имеет правильные права доступа и имеет возможность выполнять запрашиваемые действия.
            # URLRouter позволяет маршрутизировать запросы к соответствующим обработчикам.
        )
    }
)

