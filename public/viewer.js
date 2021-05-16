let pc, socket, room;
const endCall = document.getElementById('end_call');
const remoteVideo = document.getElementById('remote_video');
const remote = document.querySelector('.viewer');
const yourFriend = document.querySelector('.yourFriend');
const copyCode = document.getElementById('copy');

async function view() {
    socket = io('http://localhost:3000');
    pc = new RTCPeerConnection();

    const { location } = window;
    const params = new URLSearchParams(location.search);

    room = location.pathname.split('/').pop();
    // const rcs = {};
    const main = document.getElementById('main');
    const streams = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
    });
    main.srcObject = streams;
    streams.getTracks().forEach((t) => pc.addTrack(t, streams));

    socket.emit('viewer', room, params.get('name'));

    pc.ontrack = (e) => {
        const remoteStream = new MediaStream();
        remoteStream.addTrack(e.track, remoteStream);
        remoteVideo.srcObject = remoteStream;
        remote.classList.remove('hidden');
        endCall.classList.remove('hidden');
    };
    socket.on('answer', async (data) => {
        console.log('Answer');
        await pc.setRemoteDescription(data);
    });

    socket.on('offer', async (offer, friend) => {
        console.log('New Offer', friend);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('sendAnswer', answer, room, params.get('name'));
        yourFriend.innerHTML = friend;
    });

    socket.on('candidate', async (candidate) => {
        await pc.addIceCandidate(candidate);
    });
    socket.on('Invalid Room', () => {
        window.location = window.location.origin;
    });

    socket.on('endCall', () => {
        const { origin } = window.location;
        window.location = `${origin}/`;
    });
}

view().catch((err) => {
    console.error('Viewer Error: ', err.message);
});

endCall.onclick = (e) => {
    socket.emit('endCall', room);
    window.location = window.location.origin;
};

copyCode.onclick = async (e) => {
    navigator.clipboard
        .writeText(room)
        .then(() => {
            alert('Copied to clipboard');
        })
        .catch((err) => {
            alert(err.message);
        });
};
