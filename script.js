import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


// =====================================================
// GAME VARIABLES
// =====================================================

let scene;
let camera;
let renderer;
let clock;

let player;

let gameRunning = false;

let score = 0;
let coins = 0;
let lives = 3;

let speed = 0.55;

let lane = 1;

let targetX = 0;

let spawnTimer = 0;

let sceneryTimer = 0;

let jumping = false;
let sliding = false;

let selectedCharacter = 0;

let objects = [];


// Three lanes

const LANES = [-3, 0, 3];


// =====================================================
// CHARACTERS
// =====================================================

const characters = [

    {
        name: "KAI",

        body: 0x1769aa,
        pants: 0x222222,
        shoes: 0xffffff,
        skin: 0xffc49b,

        speed: 1.0,
        jump: 1.0,
        agility: 1.0
    },

    {
        name: "MAYA",

        body: 0xe91e63,
        pants: 0x252525,
        shoes: 0xffffff,
        skin: 0xd89a73,

        speed: .95,
        jump: 1.15,
        agility: 1.05
    },

    {
        name: "LEO",

        body: 0xff9800,
        pants: 0x222222,
        shoes: 0xeeeeee,
        skin: 0xc9825b,

        speed: 1.1,
        jump: 1.0,
        agility: 1.2
    },

    {
        name: "ZARA",

        body: 0x7b1fa2,
        pants: 0x171717,
        shoes: 0xffffff,
        skin: 0xb87353,

        speed: 1.05,
        jump: 1.1,
        agility: 1.05
    },

    {
        name: "REX",

        body: 0x2e7d32,
        pants: 0x202020,
        shoes: 0xffcc80,
        skin: 0xe0a078,

        speed: 1.2,
        jump: .95,
        agility: .95
    }

];


// =====================================================
// DOM
// =====================================================

const scoreEl =
    document.getElementById("score");

const coinEl =
    document.getElementById("coinCount");

const livesEl =
    document.getElementById("lives");
    
const startScreen =
    document.getElementById("startScreen");

const gameOver =
    document.getElementById("gameOver");

const characterName =
    document.getElementById("characterName");

const selectedText =
    document.getElementById("selectedText");

const previewCharacter =
    document.getElementById("previewCharacter");

const finalScore =
    document.getElementById("finalScore");

const finalCoins =
    document.getElementById("finalCoins");


// =====================================================
// SOUND
// =====================================================

let audioContext;

function initAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }

}


function sound(
    frequency,
    duration,
    type = "sine",
    volume = .08
) {

    if (!audioContext) return;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency.value =
        frequency;

    gain.gain.value =
        volume;

    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
        .001,
        audioContext.currentTime + duration
    );

    oscillator.stop(
        audioContext.currentTime + duration
    );

}


function coinSound() {

    sound(900, .08, "sine", .08);

    setTimeout(() => {
        sound(1300, .12, "sine", .06);
    }, 60);

}


function jumpSound() {

    sound(350, .12, "triangle", .08);

    setTimeout(() => {
        sound(600, .15, "triangle", .06);
    }, 80);

}


function hitSound() {

    sound(100, .3, "sawtooth", .12);

}


function powerSound() {

    sound(500, .1, "square", .08);

    setTimeout(() => {
        sound(900, .15, "square", .06);
    }, 100);

}


// =====================================================
// INITIALIZE
// =====================================================

function init() {

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(0x78c7e8);

    scene.fog =
        new THREE.Fog(
            0x78c7e8,
            40,
            190
        );


    // Camera

    camera =
        new THREE.PerspectiveCamera(
            62,
            window.innerWidth /
            window.innerHeight,
            .1,
            400
        );

    camera.position.set(
        0,
        5,
        13
    );


    // Renderer

    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    document
        .getElementById("game")
        .appendChild(renderer.domElement);


    // Lighting

    const skyLight =
        new THREE.HemisphereLight(
            0xffffff,
            0x444444,
            2.2
        );

    scene.add(skyLight);


    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            3
        );

    sun.position.set(
        20,
        30,
        10
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    scene.add(sun);


    createWorld();

    createPlayer();

    createScenery();


    clock =
        new THREE.Clock();


    window.addEventListener(
        "resize",
        resize
    );


    animate();

}


// =====================================================
// WORLD
// =====================================================

function createWorld() {

    // Track

    const trackGeometry =
        new THREE.PlaneGeometry(
            14,
            600
        );

    const trackMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x383838,
            roughness: .9
        });

    const track =
        new THREE.Mesh(
            trackGeometry,
            trackMaterial
        );

    track.rotation.x =
        -Math.PI / 2;

    track.position.z =
        -250;

    track.receiveShadow = true;

    scene.add(track);


    // Railway sleepers

    for (
        let z = 10;
        z > -550;
        z -= 5
    ) {

        createSleeper(z);

    }


    // Rails

    for (
        const x of [-4.5, -1.5, 1.5, 4.5]
    ) {

        const geometry =
            new THREE.BoxGeometry(
                .16,
                .14,
                600
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: 0x999999,
                metalness: .8
            });

        const rail =
            new THREE.Mesh(
                geometry,
                material
            );

        rail.position.set(
            x,
            .12,
            -250
        );

        scene.add(rail);

    }


    // Lane separators

    for (
        const x of [-1.5, 1.5]
    ) {

        const geometry =
            new THREE.BoxGeometry(
                .06,
                .02,
                600
            );

        const material =
            new THREE.MeshBasicMaterial({
                color: 0xffcc33
            });

        const line =
            new THREE.Mesh(
                geometry,
                material
            );

        line.position.set(
            x,
            .03,
            -250
        );

        scene.add(line);

    }

}


// =====================================================
// SLEEPER
// =====================================================

function createSleeper(z) {

    const geometry =
        new THREE.BoxGeometry(
            12,
            .25,
            .65
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x654b39
        });

    const sleeper =
        new THREE.Mesh(
            geometry,
            material
        );

    sleeper.position.set(
        0,
        .1,
        z
    );

    scene.add(sleeper);

}


// =====================================================
// BUILDINGS
// =====================================================

function createBuilding(
    x,
    z
) {

    const width =
        5 + Math.random() * 5;

    const height =
        7 + Math.random() * 16;

    const geometry =
        new THREE.BoxGeometry(
            width,
            height,
            8
        );

    const colors = [
        0x6d6875,
        0x495057,
        0x7f8c8d,
        0x5c677d,
        0x6c584c
    ];

    const material =
        new THREE.MeshStandardMaterial({
            color:
                colors[
                    Math.floor(
                        Math.random() *
                        colors.length
                    )
                ]
        });

    const building =
        new THREE.Mesh(
            geometry,
            material
        );

    building.position.set(
        x,
        height / 2,
        z
    );

    building.castShadow = true;

    building.receiveShadow = true;

    scene.add(building);


    // Windows

    for (
        let y = 3;
        y < height - 1;
        y += 3
    ) {

        const windowGeometry =
            new THREE.BoxGeometry(
                .08,
                .8,
                .8
            );

        const windowMaterial =
            new THREE.MeshBasicMaterial({
                color: 0xffe082
            });

        const windowMesh =
            new THREE.Mesh(
                windowGeometry,
                windowMaterial
            );

        windowMesh.position.set(
            x -
            width / 2 -
            .05,
            y,
            z
        );

        scene.add(windowMesh);

    }

}


// =====================================================
// LIGHT POLE
// =====================================================

function createLightPole(
    x,
    z
) {

    const group =
        new THREE.Group();


    const poleGeometry =
        new THREE.CylinderGeometry(
            .08,
            .08,
            5,
            10
        );

    const poleMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x333333
        });

    const pole =
        new THREE.Mesh(
            poleGeometry,
            poleMaterial
        );

    pole.position.y =
        2.5;

    group.add(pole);


    const lampGeometry =
        new THREE.SphereGeometry(
            .28,
            12,
            12
        );

    const lampMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xfff0a0
        });

    const lamp =
        new THREE.Mesh(
            lampGeometry,
            lampMaterial
        );

    lamp.position.y =
        5;

    group.add(lamp);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

}


// =====================================================
// SCENERY
// =====================================================

function createScenery() {

    for (
        let z = 0;
        z > -450;
        z -= 18
    ) {

        createBuilding(
            -13 - Math.random() * 3,
            z
        );

        createBuilding(
            13 + Math.random() * 3,
            z
        );

    }


    for (
        let z = 0;
        z > -450;
        z -= 25
    ) {

        createLightPole(
            -7,
            z
        );

        createLightPole(
            7,
            z - 10
        );

    }

}


// =====================================================
// PLAYER
// =====================================================

function createPlayer() {

    const data =
        characters[selectedCharacter];


    player =
        new THREE.Group();


    // Body

    const bodyGeometry =
        new THREE.BoxGeometry(
            1.15,
            1.45,
            .7
        );

    const bodyMaterial =
        new THREE.MeshStandardMaterial({
            color: data.body,
            roughness: .6
        });

    const body =
        new THREE.Mesh(
            bodyGeometry,
            bodyMaterial
        );

    body.position.y =
        2.25;

    body.castShadow = true;

    player.add(body);


    // Head

    const headGeometry =
        new THREE.SphereGeometry(
            .48,
            24,
            24
        );

    const headMaterial =
        new THREE.MeshStandardMaterial({
            color: data.skin
        });

    const head =
        new THREE.Mesh(
            headGeometry,
            headMaterial
        );

    head.position.y =
        3.35;

    head.castShadow = true;

    player.add(head);


    // Hair

    const hairGeometry =
        new THREE.SphereGeometry(
            .5,
            20,
            20,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );

    const hairMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x241c1c
        });

    const hair =
        new THREE.Mesh(
            hairGeometry,
            hairMaterial
        );

    hair.position.y =
        3.55;

    player.add(hair);


    // Legs

    const legGeometry =
        new THREE.BoxGeometry(
            .36,
            1.25,
            .38
        );

    const legMaterial =
        new THREE.MeshStandardMaterial({
            color: data.pants
        });


    const leftLeg =
        new THREE.Mesh(
            legGeometry,
            legMaterial
        );

    const rightLeg =
        new THREE.Mesh(
            legGeometry,
            legMaterial
        );


    leftLeg.position.set(
        -.3,
        .72,
        0
    );

    rightLeg.position.set(
        .3,
        .72,
        0
    );


    leftLeg.castShadow = true;
    rightLeg.castShadow = true;


    player.add(leftLeg);
    player.add(rightLeg);


    // Shoes

    const shoeGeometry =
        new THREE.BoxGeometry(
            .45,
            .2,
            .65
        );

    const shoeMaterial =
        new THREE.MeshStandardMaterial({
            color: data.shoes
        });


    const leftShoe =
        new THREE.Mesh(
            shoeGeometry,
            shoeMaterial
        );

    const rightShoe =
        new THREE.Mesh(
            shoeGeometry,
            shoeMaterial
        );


    leftShoe.position.set(
        -.3,
        .08,
        -.1
    );

    rightShoe.position.set(
        .3,
        .08,
        -.1
    );


    player.add(leftShoe);
    player.add(rightShoe);


    // Arms

    const armGeometry =
        new THREE.BoxGeometry(
            .32,
            1.1,
            .32
        );


    const leftArm =
        new THREE.Mesh(
            armGeometry,
            bodyMaterial
        );

    const rightArm =
        new THREE.Mesh(
            armGeometry,
            bodyMaterial
        );


    leftArm.position.set(
        -.78,
        2.25,
        0
    );

    rightArm.position.set(
        .78,
        2.25,
        0
    );


    player.add(leftArm);
    player.add(rightArm);


    // Store animation parts

    player.userData.leftLeg =
        leftLeg;

    player.userData.rightLeg =
        rightLeg;

    player.userData.leftArm =
        leftArm;

    player.userData.rightArm =
        rightArm;


    player.position.set(
        0,
        0,
        5
    );


    player.scale.set(
        1,
        1,
        1
    );


    scene.add(player);

}


// =====================================================
// RUNNING ANIMATION
// =====================================================

function runningAnimation(time) {

    if (!player) return;


    const swing =
        Math.sin(
            time * .018 *
            (speed * 1.5)
        ) * .75;


    // Legs

    player.userData.leftLeg.rotation.x =
        swing;

    player.userData.rightLeg.rotation.x =
        -swing;


    // Arms opposite legs

    player.userData.leftArm.rotation.x =
        -swing;

    player.userData.rightArm.rotation.x =
        swing;


    // Body bounce

    if (!jumping && !sliding) {

        player.position.y =
            Math.abs(
                Math.sin(
                    time * .018 *
                    (speed * 1.5)
                )
            ) * .08;

    }

}


// =====================================================
// LANE MOVEMENT
// =====================================================

function moveLeft() {

    if (!gameRunning) return;

    if (lane > 0) {

        lane--;

        targetX =
            LANES[lane];

    }

}


function moveRight() {

    if (!gameRunning) return;

    if (lane < 2) {

        lane++;

        targetX =
            LANES[lane];

    }

}


// =====================================================
// JUMP
// =====================================================

function jump() {

    if (!gameRunning) return;

    if (jumping || sliding) return;

    jumping = true;

    jumpSound();


    const start =
        performance.now();

    const jumpHeight =
        4.2 *
        characters[selectedCharacter].jump;


    function jumpFrame(now) {

        const progress =
            (now - start) / 750;


        if (progress >= 1) {

            player.position.y = 0;

            jumping = false;

            return;

        }


        player.position.y =
            Math.sin(
                progress *
                Math.PI
            ) *
            jumpHeight;


        requestAnimationFrame(
            jumpFrame
        );

    }


    requestAnimationFrame(
        jumpFrame
    );

}


// =====================================================
// SLIDE
// =====================================================

function slide() {

    if (!gameRunning) return;

    if (jumping || sliding) return;

    sliding = true;

    player.scale.y =
        .5;

    player.position.y =
        .3;


    setTimeout(() => {

        player.scale.y =
            1;

        player.position.y =
            0;

        sliding = false;

    }, 750);

}


// =====================================================
// TRAIN
// =====================================================

function createTrain() {

    const train =
        new THREE.Group();


    // Main carriage

    const bodyGeometry =
        new THREE.BoxGeometry(
            2.5,
            3.4,
            9
        );

    const bodyMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xd62828,
            metalness: .25,
            roughness: .55
        });

    const body =
        new THREE.Mesh(
            bodyGeometry,
            bodyMaterial
        );

    body.position.y =
        1.75;

    body.castShadow = true;

    train.add(body);


    // Roof

    const roofGeometry =
        new THREE.BoxGeometry(
            2.7,
            .25,
            9.2
        );

    const roofMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x222222
        });

    const roof =
        new THREE.Mesh(
            roofGeometry,
            roofMaterial
        );

    roof.position.y =
        3.5;

    train.add(roof);


    // Windows

    for (
        let z = -3;
        z <= 3;
        z += 2
    ) {

        const windowGeometry =
            new THREE.BoxGeometry(
                2.02,
                .8,
                .08
            );

        const windowMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x14213d,
                metalness: .7
            });

        const window =
            new THREE.Mesh(
                windowGeometry,
                windowMaterial
            );

        window.position.set(
            0,
            2.45,
            z
        );

        train.add(window);

    }


    // Head lights

    for (
        const x of [-.7, .7]
    ) {

        const lightGeometry =
            new THREE.SphereGeometry(
                .18,
                12,
                12
            );

        const lightMaterial =
            new THREE.MeshBasicMaterial({
                color: 0xffffcc
            });

        const light =
            new THREE.Mesh(
                lightGeometry,
                lightMaterial
            );

        light.position.set(
            x,
            .8,
            4.55
        );

        train.add(light);

    }


    const randomLane =
        Math.floor(
            Math.random() * 3
        );


    train.position.set(
        LANES[randomLane],
        0,
        -130
    );


    scene.add(train);


    objects.push({

        mesh: train,

        type: "train",

        lane: randomLane,

        hit: false

    });

}


// =====================================================
// COIN
// =====================================================

function createCoin(
    laneNumber,
    z,
    height = 1.5
) {

    const geometry =
        new THREE.TorusGeometry(
            .45,
            .13,
            12,
            24
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0xffd000,
            metalness: .9,
            roughness: .2
        });

    const coin =
        new THREE.Mesh(
            geometry,
            material
        );


    coin.position.set(
        LANES[laneNumber],
        height,
        z
    );


    coin.rotation.y =
        Math.PI / 2;


    scene.add(coin);


    objects.push({

        mesh: coin,

        type: "coin",

        lane: laneNumber,

        collected: false

    });

}


// =====================================================
// COIN TRAIL
// =====================================================

function createCoinTrail() {

    const selectedLane =
        Math.floor(
            Math.random() * 3
        );


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        createCoin(
            selectedLane,
            -90 - i * 5,
            1.5
        );

    }

}


// =====================================================
// POWER UP
// =====================================================

function createPowerup() {

    const geometry =
        new THREE.IcosahedronGeometry(
            .6,
            1
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x006677,
            metalness: .5
        });

    const power =
        new THREE.Mesh(
            geometry,
            material
        );


    const randomLane =
        Math.floor(
            Math.random() * 3
        );


    power.position.set(
        LANES[randomLane],
        1.7,
        -100
    );


    scene.add(power);


    objects.push({

        mesh: power,

        type: "powerup",

        lane: randomLane,

        collected: false

    });

}


// =====================================================
// COLLISION
// =====================================================

function collision(
    object
) {

    const playerBox =
        new THREE.Box3()
            .setFromObject(player);


    const objectBox =
        new THREE.Box3()
            .setFromObject(
                object.mesh
            );


    return playerBox.intersectsBox(
        objectBox
    );

}


// =====================================================
// UPDATE OBJECTS
// =====================================================

function updateObjects() {

    for (
        let i = objects.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            objects[i];


        // Move toward player

        obj.mesh.position.z +=
            speed;


        // Rotate coins

        if (
            obj.type === "coin"
        ) {

            obj.mesh.rotation.z +=
                .08;

            obj.mesh.rotation.y +=
                .05;

        }


        // Rotate powerup

        if (
            obj.type === "powerup"
        ) {

            obj.mesh.rotation.x +=
                .05;

            obj.mesh.rotation.y +=
                .08;

        }


        // Collision zone

        if (
            obj.mesh.position.z >
            0 &&
            obj.mesh.position.z <
            8
        ) {

            if (
                obj.lane === lane &&
                collision(obj)
            ) {


                // Coin

                if (
                    obj.type === "coin" &&
                    !obj.collected
                ) {

                    obj.collected = true;

                    coins++;

                    score += 50;

                    coinSound();

                    removeObject(i);

                    continue;

                }


                // Powerup

                if (
                    obj.type === "powerup" &&
                    !obj.collected
                ) {

                    obj.collected = true;

                    score += 150;

                    powerSound();

                    removeObject(i);

                    continue;

                }


                // Train

                if (
                    obj.type === "train" &&
                    !obj.hit
                ) {

                    // Jump over train

                    if (
                        jumping ||
                        player.position.y > 1.5
                    ) {

                        continue;

                    }


                    // Hit train

                    obj.hit = true;

                    lives--;

                    score =
                        Math.max(
                            0,
                            score - 100
                        );

                    hitSound();

                    updateHUD();


                    if (
                        lives <= 0
                    ) {

                        endGame();

                    }

                }

            }

        }


        // Remove old objects

        if (
            obj.mesh.position.z >
            25
        ) {

            removeObject(i);

        }

    }

}


// =====================================================
// REMOVE OBJECT
// =====================================================

function removeObject(
    index
) {

    scene.remove(
        objects[index].mesh
    );

    objects.splice(
        index,
        1
    );

}


// =====================================================
// SPAWN SYSTEM
// =====================================================

function spawnObjects(
    delta
) {

    spawnTimer += delta;


    if (
        spawnTimer < .85
    ) return;


    spawnTimer = 0;


    const random =
        Math.random();


    if (
        random < .48
    ) {

        createTrain();

    }

    else if (
        random < .83
    ) {

        createCoinTrail();

    }

    else {

        createPowerup();

    }

}


// =====================================================
// CAMERA
// =====================================================

function updateCamera() {

    // Slight movement following lane

    camera.position.x +=
        (
            player.position.x * .25 -
            camera.position.x
        ) * .03;


    camera.lookAt(
        player.position.x * .15,
        1.8,
        -20
    );

}


// =====================================================
// HUD
// =====================================================

function updateHUD() {

    scoreEl.textContent =
        Math.floor(score);

    coinEl.textContent =
        coins;

    livesEl.textContent =
        lives;

}


// =====================================================
// GAME LOOP
// =====================================================

function animate(time) {

    requestAnimationFrame(
        animate
    );


    const delta =
        clock
            ? clock.getDelta()
            : .016;


    if (
        gameRunning
    ) {

        // Smooth lane movement

        player.position.x +=
            (
                targetX -
                player.position.x
            ) *
            .18;


        // Running animation

        runningAnimation(time);


        // Move trains / coins

        updateObjects();


        // Spawn

        spawnObjects(delta);


        // Score

        score +=
            delta * 12 *
            characters[selectedCharacter].speed;


        // Increasing difficulty

        speed +=
            delta * .003;


        // Maximum speed

        speed =
            Math.min(
                speed,
                1.25
            );


        updateCamera();

        updateHUD();

    }


    renderer.render(
        scene,
        camera
    );

}


// =====================================================
// START GAME
// =====================================================

function startGame() {

    initAudio();


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }


    score = 0;

    coins = 0;

    lives = 3;

    speed =
        .55 *
        characters[selectedCharacter].speed;

    lane = 1;

    targetX = 0;

    spawnTimer = 0;

    jumping = false;

    sliding = false;


    // Remove old objects

    objects.forEach(
        object => {

            scene.remove(
                object.mesh
            );

        }
    );


    objects = [];


    player.position.set(
        0,
        0,
        5
    );


    player.scale.set(
        1,
        1,
        1
    );


    gameRunning = true;


    startScreen.classList.add(
        "hidden"
    );

    gameOver.classList.add(
        "hidden"
    );


    updateHUD();

}


// =====================================================
// GAME OVER
// =====================================================

function endGame() {

    gameRunning = false;

    finalScore.textContent =
        Math.floor(score);

    finalCoins.textContent =
        coins;

    gameOver.classList.remove(
        "hidden"
    );

}


// =====================================================
// CHARACTER PREVIEW
// =====================================================

function updateCharacterScreen() {

    const character =
        characters[selectedCharacter];


    characterName.textContent =
        character.name;


    const speedStars =
        Math.round(
            character.speed * 4
        );

    const jumpStars =
        Math.round(
            character.jump * 4
        );

    const agilityStars =
        Math.round(
            character.agility * 4
        );


    document.getElementById(
        "speedStars"
    ).textContent =
        "★".repeat(speedStars) +
        "☆".repeat(
            5 - speedStars
        );


    document.getElementById(
        "jumpStars"
    ).textContent =
        "★".repeat(jumpStars) +
        "☆".repeat(
            5 - jumpStars
        );


    document.getElementById(
        "agilityStars"
    ).textContent =
        "★".repeat(agilityStars) +
        "☆".repeat(
            5 - agilityStars
        );


    const dots =
        characters
            .map(
                (_, index) =>
                    index === selectedCharacter
                        ? "●"
                        : "○"
            )
            .join(" ");


    document.getElementById(
        "characterDots"
    ).textContent =
        dots;


    // Simple animated preview

    const emojis = [
        "🧑",
        "👩",
        "🧑",
        "👩",
        "🧑"
    ];


    previewCharacter.textContent =
        emojis[selectedCharacter];


    previewCharacter.style
        .filter =
        "drop-shadow(0 10px 10px rgba(0,0,0,.4))";

}


// =====================================================
// CHARACTER SELECTION
// =====================================================

document
    .getElementById(
        "previousCharacter"
    )
    .addEventListener(
        "click",
        () => {

            selectedCharacter--;

            if (
                selectedCharacter < 0
            ) {

                selectedCharacter =
                    characters.length - 1;

            }

            updateCharacterScreen();

        }
    );


document
    .getElementById(
        "nextCharacter"
    )
    .addEventListener(
        "click",
        () => {

            selectedCharacter++;

            if (
                selectedCharacter >=
                characters.length
            ) {

                selectedCharacter = 0;

            }

            updateCharacterScreen();

        }
    );


document
    .getElementById(
        "selectCharacter"
    )
    .addEventListener(
        "click",
        () => {

            // Rebuild player

            scene.remove(player);

            createPlayer();


            selectedText.textContent =
                characters[
                    selectedCharacter
                ].name +
                " selected";


            characterScreen.classList.add(
                "hidden"
            );

            startScreen.classList.remove(
                "hidden"
            );

        }
    );


// =====================================================
// START BUTTON
// =====================================================

document
    .getElementById(
        "startButton"
    )
    .addEventListener(
        "click",
        startGame
    );


// =====================================================
// RESTART
// =====================================================

document
    .getElementById(
        "restartButton"
    )
    .addEventListener(
        "click",
        startGame
    );


// =====================================================
// CHANGE CHARACTER
// =====================================================

document
    .getElementById(
        "characterButton"
    )
    .addEventListener(
        "click",
        () => {

            gameOver.classList.add(
                "hidden"
            );

            characterScreen.classList.remove(
                "hidden"
            );

        }
    );


// =====================================================
// KEYBOARD
// =====================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {

            moveLeft();

        }


        if (
            event.key === "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {

            moveRight();

        }


        if (
            event.key === "ArrowUp" ||
            event.key === " "
        ) {

            jump();

        }


        if (
            event.key === "ArrowDown" ||
            event.key.toLowerCase() === "s"
        ) {

            slide();

        }

    }
);


// =====================================================
// MOBILE BUTTONS
// =====================================================

document
    .getElementById(
        "leftButton"
    )
    .addEventListener(
        "click",
        moveLeft
    );


document
    .getElementById(
        "rightButton"
    )
    .addEventListener(
        "click",
        moveRight
    );


document
    .getElementById(
        "jumpButton"
    )
    .addEventListener(
        "click",
        jump
    );


document
    .getElementById(
        "slideButton"
    )
    .addEventListener(
        "click",
        slide
    );


// =====================================================
// RESIZE
// =====================================================

function resize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

}


// =====================================================
// BEGIN
// =====================================================

updateCharacterScreen();

init();