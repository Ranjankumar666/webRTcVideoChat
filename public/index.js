const broadcaster = document.getElementById('broadcaster');
const viewer = document.getElementById('viewer');
const roomCode = document.querySelector('.inputs');
const rc = document.getElementById('room_code');
const createForm = document.getElementById('create');
const name = document.getElementById('name');
const email = document.getElementById('email');

viewer.onclick = (e) => {
    roomCode.classList.toggle('hidden');
};

broadcaster.onclick = (e) => {
    roomCode.classList.add('hidden');
};

roomCode.addEventListener('submit', (e) => {
    e.preventDefault();
    const room_code = rc.value;
    const { origin } = window.location;

    window.location = `${origin}/chat/${room_code}?type=viewer&name=${name.value}&email=${email.value}`;
});
