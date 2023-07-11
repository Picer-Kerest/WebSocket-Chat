from django.contrib import messages
from django.contrib.auth.models import Group
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.http import require_POST
from .models import Room
from django.contrib.auth.decorators import login_required
from account.models import User
from account.forms import AddUserForm, EditUserForm


@require_POST
def create_room(request, uuid):
    name = request.POST.get('name', '')
    url = request.POST.get('url', '')

    Room.objects.create(uuid=uuid, client=name, url=url)
    return JsonResponse({
        'message': 'Room created'
    })


@login_required
def admin(request):
    rooms = Room.objects.all()
    users = User.objects.filter(is_staff=True)

    return render(request, 'chat/admin.html', {
        'rooms': rooms,
        'users': users
    })


@login_required
def room(request, uuid):
    chat_room = Room.objects.get(uuid=uuid)

    if chat_room.status == Room.WAITING:
        chat_room.status = Room.ACTIVE
        chat_room.agent = request.user
        chat_room.save()

    return render(request, 'chat/room.html', {
        'room': chat_room
    })


@login_required
def user_detail(request, uuid):
    user = User.objects.get(pk=uuid)
    rooms = user.rooms.all()
    # Работа related_name
    # Получаем все комнаты, созданные пользователем
    return render(request, 'chat/user_detail.html', {
        'user': user,
        'rooms': rooms,
    })


@login_required
def delete_room(request, uuid):
    if request.user.has_perm('room.delete_room'):
        chat_room = Room.objects.get(uuid=uuid)
        chat_room.delete()
        messages.success(request, 'The room was successfully deleted')
        return redirect(reverse('chat:admin'))
    else:
        messages.error(request, "You don't have the rights to delete room")
        return redirect(reverse('chat:admin'))


@login_required
def edit_user(request, uuid):
    if request.user.has_perm('user.edit_user'):
        user = User.objects.get(pk=uuid)
        if request.method == 'POST':
            form = EditUserForm(request.POST, instance=user)
            # instance=user - то, что будет уже в форме
            # request.POST - данные, которые были отправлены с формы
            if form.is_valid():
                form.save()
                messages.success(request, 'The changes have been saved!')
                return redirect(reverse('chat:admin'))
        else:
            form = EditUserForm(instance=user)
        # У нас крайне выгодное расположение return, ибо user общий, а
        # form приспосабливаться: если POST и невалидная форма, то вернёт форму с данными до отправки
        # Если же GET-запрос, то вернёт форму с данными из базы данных
        return render(request, 'chat/edit_user.html', {
            'user': user,
            'form': form
        })
    else:
        messages.error(request, "You don't have the rights to edit users")
        return redirect(reverse('chat:admin'))


@login_required
def add_user(request):
    if request.user.has_perm('user.add_user'):
        if request.method == "POST":
            form = AddUserForm(request.POST)
            if form.is_valid():
                user = form.save(commit=False)
                user.is_staff = True
                user.set_password(request.POST.get('password'))
                user.save()
                if user.role == User.MANAGER:
                    # Находим группу с именем
                    # Далее добавляем пользователя в группу, чтобы дать права
                    group = Group.objects.get(name='Managers')
                    group.user_set.add(user)
                messages.success(request, 'The user was added!')
                return redirect(reverse('chat:admin'))
        else:
            form = AddUserForm()
        return render(request, 'chat/add_user.html', {
            'form': form
        })
    else:
        messages.error(request, "You don't have the rights to add users")
        return redirect(reverse('chat:admin'))

