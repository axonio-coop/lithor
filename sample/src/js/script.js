
const SIZE = 100;
const WIDTH = 1;
const SPEED = .02;
const BG_COLOR = '#11111b';
const COLOR = '#181825';
const MOUSE_SIZE = 100;
const MOUSE_COLOR = '#585b70';
const MOUSE_FADE_SPEED = .005;
const ANGLE = 15;

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const main = document.querySelector('main');

let mouseX = 0;
let mouseY = 0;
let mousePresent = false;
let mouseOpacity = 0;
let lastUpdate;

function resize(){
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
addEventListener('resize', resize);
resize();

(function update(){

    ctx.fillStyle = COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mouse

    let diff = typeof lastUpdate === 'undefined'
        ? 0
        : Date.now() - lastUpdate;
    lastUpdate = Date.now();

    mouseOpacity += diff * MOUSE_FADE_SPEED * (+mousePresent * 2 - 1);
    if(mouseOpacity > 1) mouseOpacity = 1;
    if(mouseOpacity < 0) mouseOpacity = 0;

    let gradient = ctx.createRadialGradient(
        mouseX, mouseY, 0,
        mouseX, mouseY, MOUSE_SIZE * mouseOpacity
    );
    let op = Math.floor(mouseOpacity * 0xff).toString(16).padStart(2, '0');
    gradient.addColorStop(0, MOUSE_COLOR + op);
    gradient.addColorStop(1, MOUSE_COLOR + '00');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Squares

    ctx.fillStyle = BG_COLOR;
    for(
        let x = - (Date.now() * SPEED) % SIZE;
        x < innerWidth;
        x += SIZE + WIDTH
    ){
        for(
            let y = - (Date.now() * SPEED) % SIZE;
            y < innerHeight;
            y += SIZE + WIDTH
        ){
            ctx.fillRect(x, y, SIZE, SIZE);
        }
    }

    // Card

    let rotX = Math.abs(innerHeight / 2 - mouseY);
    rotX = rotX * ANGLE / (innerHeight / 2);
    rotX *= +(mouseY < innerHeight / 2) * 2 - 1;
    rotX *= mouseOpacity;
    
    let rotY = Math.abs(innerWidth / 2 - mouseX);
    rotY = rotY * ANGLE / (innerWidth / 2);
    rotY *= +(mouseX > innerWidth / 2) * 2 - 1;
    rotY *= mouseOpacity;

    main.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

    requestAnimationFrame(update);

})();

addEventListener('mousemove', e=>{
    mousePresent = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener('mouseleave', ()=>mousePresent = false)