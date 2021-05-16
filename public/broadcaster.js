let pc, socket, room;
const endCall = document.getElementById('end_call');
const remoteVideo = document.getElementById('remote_video');
const remote = document.querySelector('.viewer');
const yourFriend = document.querySelector('.yourFriend');
const copyCode = document.getElementById('copy');

async function broadcast() {
    pc = new RTCPeerConnection();
    socket = io.connect('http://localhost:3000');
    const { location } = window;
    const params = new URLSearchParams(location.search);

    room = location.pathname.split('/').pop();
    const main = document.getElementById('main');

    const streams = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
    });
    main.srcObject = streams;
    streams.getTracks().forEach((t) => pc.addTrack(t, streams));

    socket.emit('broadcaster', room, params.get('name'));

    pc.onicecandidate = (e) => {
        socket.emit('newCandidate', e.candidate, room);
    };

    pc.ontrack = (e) => {
        const remoteStream = new MediaStream();
        remoteStream.addTrack(e.track, remoteStream);
        remoteVideo.srcObject = remoteStream;
        remote.classList.remove('hidden');
        endCall.classList.remove('hidden');
    };

    socket.on('offer', async (data) => {
        await pc.setRemoteDescription(data);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('sendAnswer', answer, room);
    });

    socket.on('answer', async (data, friend) => {
        await pc.setRemoteDescription(data);
        yourFriend.innerHTML = friend;
    });

    socket.on('candidate', async (candidate) => {
        try {
            await pc.addIceCandidate(candidate);
        } catch (err) {
            console.log(err.message);
        }
    });

    socket.on('viewer', async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('sendOffer', offer, room, params.get('name'));
    });

    socket.on('endCall', () => {
        const { origin } = window.location;
        window.location = `${origin}/`;
    });
}

broadcast().catch((err) => {
    console.error('Broadcaster Error: ', err.message);
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
