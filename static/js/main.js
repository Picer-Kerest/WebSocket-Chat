let chatName = ''
let chatSocket = null
let chatWindowUrl = window.location.href
let chatRoomUuid = Math.random().toString(36).slice(2, 12)

const chatElement = document.querySelector('#chat')
const chatOpenElement = document.querySelector('#chat_open')
const chatJoinElement = document.querySelector('#chat_join')
const chatIconElement = document.querySelector('#chat_icon')
const chatWelcomeElement = document.querySelector('#chat_welcome')
const chatRoomElement = document.querySelector('#chat_room')
const chatNameElement = document.querySelector('#chat_name')
const chatLogElement = document.querySelector('#chat_log')
const chatInputElement = document.querySelector('#chat_message_input')
const chatSubmitElement = document.querySelector('#chat_message_submit')


function scrollToBottom() {
    chatLogElement.scrollTop = chatLogElement.scrollHeight
}

function getCookie(name) {
    // Cookie Example: csrftoken=8c8lY2OdKoPCmkYCQj0gPdMlttEt0ans
    let cookieValue = null
    if (document.cookie && document.cookie != '') {
        let cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim()
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                // Метод substring() извлекает символы из строки,
                // находящиеся между двумя указанными индексами и возвращает новую подстроку. [x;y)
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                break
            }
        }
    }
    return cookieValue
}

function sendMessage() {
    chatSocket.send(JSON.stringify({
        // send Для отправки данных на сервер websocket. receive
        'type': 'message',
        'message': chatInputElement.value,
        'name': chatName,
    }))

    chatInputElement.value = ''
}


function onChatMessage(data) {
    console.log('onChatMessage', data)

    if (data.type == 'chat_message') {
        let tmpInfo = document.querySelector('.tmp-info')

        if (tmpInfo) {
            tmpInfo.remove()
        }

        if (data.agent) {
            chatLogElement.innerHTML += `
                <div class="flex w-full mt-2 space-x-3 max-w-md">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>

                    <div>
                        <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">${data.message}</p>
                        </div>

                        <span class="text-xs text-gray-500 leading-none">${data.created_at} ago</span>
                    </div>
                </div>
            `
        } else {
            chatLogElement.innerHTML += `
                <div class="flex w-full mt-2 space-x-3 max-w-md ml-auto justify-end">
                    <div>
                        <div class="bg-blue-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">${data.message}</p>
                        </div>

                        <span class="text-xs text-gray-500 leading-none">${data.created_at} ago</span>
                    </div>

                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>
                </div>
            `
        }
    } else if (data.type == 'users_update') {
        chatLogElement.innerHTML += '<p class="mt-2">The admin/agent has joined the chat!</p>'
    } else if (data.type == 'writing_active') {
        console.log('data.type == writing_active from main.js')
        if (data.agent) {
            let tmpInfo = document.querySelector('.tmp-info')

            if (tmpInfo) {
                tmpInfo.remove()
            }

            chatLogElement.innerHTML += `
                <div class="tmp-info flex w-full mt-2 space-x-3 max-w-md">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>

                    <div>
                        <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">The agent/admin is writing a message</p>
                        </div>
                    </div>
                </div>
            `
        }
    }

    scrollToBottom()
}

async function joinChatRoom() {
    chatName = chatNameElement.value
    const data = new FormData()
    data.append('name', chatName)
    data.append('url', chatWindowUrl)

    await fetch(`api/create-room/${chatRoomUuid}/`, {
        // Создаём комнату
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: data
    })
        .then(result => result.json())
        .then(data => {
            console.log('Data is: ', data)
        })

    chatSocket = new WebSocket(`ws://${window.location.host}/ws/${chatRoomUuid}/`)
//     создает новый объект WebSocket и устанавливает WebSocket-соединение между клиентом и сервером по указанному адресу.

    chatSocket.onmessage = (e) => {
        // onmessage - для прослушивания сообщений, которые приходят на клиент. chat_message
        onChatMessage(JSON.parse(e.data))
//        JSON -> JS obj
    }

    chatSocket.onopen = (e) => {
        console.log('On open')

        scrollToBottom()
    }

    chatSocket.onclose = (e) => {
        console.log('On close')
    }
}

chatOpenElement.onclick = (e) => {
    e.preventDefault()
    chatIconElement.classList.add('hidden')
    chatWelcomeElement.classList.remove('hidden')
}

chatJoinElement.onclick = (e) => {
    e.preventDefault()
    chatWelcomeElement.classList.add('hidden')
    chatRoomElement.classList.remove('hidden')

    joinChatRoom()
    return false
}

chatSubmitElement.onclick = (e) => {
    e.preventDefault()
    sendMessage()

    return false
}


chatInputElement.onkeyup = (e) => {
    if (e.keyCode == 13) {
        sendMessage()
    }
}

chatNameElement.onkeyup = (e) => {
    if (e.keyCode == 13) {
        e.preventDefault()
        chatWelcomeElement.classList.add('hidden')
        chatRoomElement.classList.remove('hidden')

        joinChatRoom()
        return false
    }
}

chatInputElement.onfocus = (e) => {
    console.log('onfocus main.js')
    // onfocus при наведении и в input'e
    chatSocket.send(JSON.stringify({
        'type': 'update',
        'message': 'writing_active from main.js',
        'name': chatName
    }))
}