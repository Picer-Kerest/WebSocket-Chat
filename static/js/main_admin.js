
const chatRoom = document.querySelector('#room_uuid').textContent.replaceAll('"', '')
let chatSocket = null
const chatLogElement = document.querySelector('#chat_log')
const chatInputElement = document.querySelector('#chat_message_input')
const chatSubmitElement = document.querySelector('#chat_message_submit')


function scrollToBottom() {
    chatLogElement.scrollTop = chatLogElement.scrollHeight
// Если я прокручиваю вниз на 5 пикселей в этом окне, значение окна scrollTop равно 5.
//    В нашем случае значение равно высоте всего окна,
//    то есть отлистали на максимум
}


function sendMessage() {
    chatSocket.send(JSON.stringify({
        // send Для отправки данных на сервер websocket. receive
        'type': 'message',
        'message': chatInputElement.value,
        'name': document.querySelector('#user_name').textContent.replaceAll('"', ''),
        'agent': document.querySelector('#user_id').textContent.replaceAll('"', '')
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

        if (!data.agent) {
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
    } else if (data.type == 'writing_active') {
        console.log('data.type == writing_active from main_admin.js')
        if (!data.agent) {
            let tmpInfo = document.querySelector('.tmp-info')

            if (tmpInfo) {
                tmpInfo.remove()
            }

            chatLogElement.innerHTML += `
                <div class="tmp-info flex w-full mt-2 space-x-3 max-w-md">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>

                    <div>
                        <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">The client is typing...</p>
                        </div>
                    </div>
                </div>
            `
        }
    }

    scrollToBottom()
}

chatSocket = new WebSocket(`ws://${window.location.host}/ws/${chatRoom}/`)

chatSocket.onmessage = (e) => {
    // onmessage - для прослушивания сообщений, которые приходят на клиент. chat_message
    onChatMessage(JSON.parse(e.data))
//        JSON -> JS obj
}

chatSocket.onopen = (e) => {
    console.log('On open from admin js file')

    scrollToBottom()
}

chatSocket.onclose = (e) => {
    console.log('On close from admin js file')
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


chatInputElement.onfocus = (e) => {
    console.log('onfocus main_admin.js')
    // onfocus при наведении и в input'e
    chatSocket.send(JSON.stringify({
        'type': 'update',
        'message': 'writing_active from main_admin.js',
        'name': document.querySelector('#user_name').textContent.replaceAll('"', ''),
        'agent': document.querySelector('#user_id').textContent.replaceAll('"', '')
    }))
}

