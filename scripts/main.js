const FPS = 30; // frames per second
const FRICTION = 0.7; // friction coefficient (0 = no friction, 1 = lots of friction)
const GAME_LIVES = 3; // starting number of lives
const LASER_DIST = 0.6; // max distance a laser can travelas fraction of screen width 
const LASER_MAX = 10; // maximum number of projectiles on screen at once
const LASER_SPD = 500; // speed of lasers in pixels per second
const ASTEROIDS_JAG = 0.4; // jaggednes of the asteroids (0 = none, 1 = lots)
const ASTEROIDS_NUM = 1; // starting number of asteroids
const ASTEROIDS_SIZE = 100; // starting number of asteroids
const ASTEROIDS_SPD = 50; // max starting speed of asteroids in pixels per second
const ASTEROIDS_VERT = 10; // average number of vertices on each asteroid
const SHIP_SIZE = 30; // ship height in px
const SHIP_BLINK_DUR = 0.1; // duration of the ship's blink during invulnerability in seconds
const SHIP_EXPLODE_DUR = 0.3; // duration of the ship's explosion
const SHIP_INV_DUR = 1.5; // duration of the ship's invulnerability when spawning in seconds
const SHIP_THRUST = 5; // accelerationof the ship in px per second
const TURN_SPEED = 360; // turn speed in degrees per second
const SHOW_BOUNDING = false; // show or hide collision bounding
const TEXT_FADE_TIME = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; // text font height in pixels

let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

// set up the game parameters
var level, lives, roids, ship, text, textAlpha;
newGame();

var ship = newShip();

// set up event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
    asteroids = [];
    var x, y;
    for (var i = 0; i < ASTEROIDS_NUM + level; i++) {
        do {
            x = Math.floor(Math.random() * canvas.width);
            y = Math.floor(Math.random() * canvas.height);
        } while(distBetweenPoints(ship.x, ship.y, x, y) < ASTEROIDS_SIZE * 2 + ship.r);
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 2)));
    }
}

function destroyAsteroid(index) {
    var x = asteroids[index].x;
    var y = asteroids[index].y;
    var r = asteroids[index].r;

    // split the asteroid in two if necessary
    if (r == Math.ceil(ASTEROIDS_SIZE / 2)) {
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 4)));
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 4)));
    } else if (r ==  Math.ceil(ASTEROIDS_SIZE / 4)) {
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 8)));
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROIDS_SIZE / 8)));
    }

    // destroy the asteroid
    asteroids.splice(index, 1);

    // new level when no asteroids
    if (asteroids.length == 0) {
        level++;
        newLevel();
    }
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a) {
    ctx.strokeStyle = "white";
    ctx.fillStyle = "#8d82a4";
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo( // nose of the ship
        x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
    );
    ctx.lineTo( // rear left
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
    );
    ctx.lineTo( // rear right
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
        y + ship.r * (2 / 3 *Math.sin(a) + Math.cos(a))
    );
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}

function gameOver() {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
}

function keyDown(ev) {
    if (ship.dead) {
        return;
    }
    switch(ev.keyCode) {
        case 32: // spacebar (shoot)
            shootLaser();
            break;
        case 65: // left arrow (rotate left)
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case 68: // right arrow (rotate right)
            ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case 87: // up arrow (move forward)
            ship.thrusting = true;
            break;
    }
}

function keyUp(ev) {
    if (ship.dead) {
        return;
    }
    switch(ev.keyCode) {
        case 32: // spacebar (allow shooting again)
            ship.canShoot = true;
            break;
        case 65: // left arrow (stop rotating left)
            ship.rot = 0;
            break;
        case 68: // right arrow (stop rotating right)
            ship.rot = 0;
            break;
        case 87: // up arrow (stop forward movement)
        ship.thrusting = false;
            break;
    }
}

function newAsteroid(x, y, r) {
    var lvlMult = 1 + 0.1 * level;
    var asteroid = {
        x: x,
        y: y,
        xv: Math.random() * ASTEROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ASTEROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: r, 
        a: Math.random() * Math.PI * 2, // in radians
        vert: Math.floor(Math.random() * (ASTEROIDS_VERT + 1) + ASTEROIDS_VERT / 2),
        offs: []
    };

    // create the certex offset array
    for (var i = 0; i < asteroid.vert; i++) {
        asteroid.offs.push(Math.random() * ASTEROIDS_JAG * 2 + 1 - ASTEROIDS_JAG);
    }
    return asteroid;
}

function newGame() {
    level = 0;
    lives = GAME_LIVES;
    ship = newShip();
    newLevel();
}

function newLevel() {
    text = "Level " + (level + 1);
    textAlpha = 1.0;
    createAsteroidBelt();
}

function newShip() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: SHIP_SIZE / 2,
        a: 90 / 180 * Math.PI, // convert to radians
        blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
        explodeTime: 0,
        canShoot: true,
        dead: false,
        lasers: [],
        rot: 0,
        thrusting: false,
        thrust: {
            x: 0,
            y: 0,
        }
    }
}

function shootLaser() {
    // create laser object
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
        ship.lasers.push({ // from the nose of the ship
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: LASER_SPD * Math.cos(ship.a) / FPS, 
            yv: -LASER_SPD * Math.sin(ship.a) / FPS, 
            dist: 0,
        })
    }
    // prevent urther shooting
    ship.canShoot = false;
}

function update() {
    var blinkOn = ship.blinkNum % 2 == 0;
    var exploding = ship.explodeTime > 0;

    // draw background
    ctx.fillStyle = "#434660";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // forward movement
    if (ship.thrusting && !ship.dead) {
        ship.thrust.x -= SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

        // draw the thruster
        if (!exploding && blinkOn) {
            ctx.fillStyle = "red";
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = SHIP_SIZE / 10;
            ctx.beginPath();
            ctx.moveTo( // rear left
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
            );
            ctx.lineTo( // rear center behind the ship
                ship.x - ship.r * 6 / 3 * Math.cos(ship.a),
                ship.y + ship.r * 6 / 3 * Math.sin(ship.a)
            );
            ctx.lineTo( // rear right
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
            );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    } else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }

    // draw triangular ship
    if (!exploding) {
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a);
        }

        // handle blinking
        if (ship.blinkNum > 0) {

            // reduce the blink time
            ship.blinkTime--;

            // reduce the blink num
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
                ship.blinkNum--;
            }
        }
    } else {
        // draw the explosion
        ctx.fillStyle = "darkred";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
        ctx.fill();
    }
    if (SHOW_BOUNDING) {
        ctx.strokeStyle = "lime";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
        ctx.stroke();
    }

    // draw the lasers
    for (var i = 0; i < ship.lasers.length; i++) {
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
        ctx.fill();
    }

    // detect laser hits on asteroids
    var ax, ay, ar, lx, ly;
    for (var i = asteroids.length - 1; i >= 0; i--) { // backwards because we are removing asteroids from the array
        // grab the asteroid properties
        ax = asteroids[i].x;
        ay = asteroids[i].y;
        ar = asteroids[i].r;

        // loop over the lasers
        for (var j = ship.lasers.length - 1; j >= 0; j--) {
            // grab the laser properties
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;

            // detect hits
            if (distBetweenPoints(ax, ay, lx, ly) < ar) {

                // remove the laser
                ship.lasers.splice(j, 1);

                // remove the asteroids
                destroyAsteroid(i);

                break;
            }
            
        }

    }

    // draw the game text
    if (textAlpha > 0) {
        ctx.textAlign = "center";
        ctx.textBaseAlign = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px sans mono";
        ctx.fillText(text, canvas.width / 2, canvas.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    } else if (ship.dead) {
        newGame();
    }

    // draw the lives
    for (var i = 0; i < lives; i++) {
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, 0.5 * Math.PI);
    }

    // draw the asteroids
    var x, y, r, a, vert, offs;
    for (var i = 0; i < asteroids.length; i++) {

        ctx.strokeStyle = "darkred";
        ctx.fillStyle = "#6d587b";
        ctx.lineWidth = SHIP_SIZE / 20;
        
        // get the asteroid properties
        x = asteroids[i].x;
        y = asteroids[i].y;
        r = asteroids[i].r;
        a = asteroids[i].a;
        vert = asteroids[i].vert;
        offs = asteroids[i].offs;

        // draw a path
        ctx.beginPath();
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a)
        );

        // draw the polygon
        for (var j = 1; j < vert; j++) {
            ctx.lineTo(
                x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert),
            );
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        if (SHOW_BOUNDING) {
            ctx.strokeStyle = "lime";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2, false);
            ctx.stroke();
        }
    }

    // check for asteroid collisions
    if (!exploding) {
        if (ship.blinkNum == 0 && !ship.dead) {
            for (var i = 0; i < asteroids.length; i++) {
                if (distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.r + asteroids[i].r) {
                    explodeShip();
                    destroyAsteroid(i);
                    break;
                }
            }
        }
        // rotate ship
        ship.a += ship.rot;

        // move the ship
        ship.x -= ship.thrust.x;
        ship.y += ship.thrust.y;
    } else {
        ship.explodeTime--;

        if (ship.explodeTime == 0) {
            lives--;
            if (lives == 0) {
                gameOver();
            } else {
                ship = newShip();
            }
        }
    }
    // Out of canvas bounds detection
    if (ship.x < 0 - ship.r) {
        ship.x = canvas.width + ship.r;
    } else if (ship.x > canvas.width + ship.r) {
        ship.x = 0 - ship.r;
    }
    if (ship.y < 0 - ship.r) {
        ship.y = canvas.height + ship.r;
    } else if (ship.y > canvas.height + ship.r) {
        ship.y = 0 - ship.r;
    }  

    // move the lasers
    for (var i = ship.lasers.length - 1; i >= 0; i--) { // counting down to avoid errors when changing the size of the array
        // check distance traveled
        if (ship.lasers[i].dist > LASER_DIST * canvas.width) {
            ship.lasers.splice(i, 1);
            continue;
        }

        // move the laser
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;

        // calculate the distance traveled
        ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));

        //handle edge of screen
        if (ship.lasers[i].x < 0) {
            ship.lasers[i].x = canvas.width;
        } else if (ship.lasers[i].x > canvas.width) {
            ship.lasers[i].x = 0;
        }
        if (ship.lasers[i].y < 0) {
            ship.lasers[i].y = canvas.height;
        } else if (ship.lasers[i].y > canvas.height) {
            ship.lasers[i].y = 0;
        }
    }

    // move the asteroid
    for (var i = 0; i < asteroids.length; i++) {
        asteroids[i].x += asteroids[i].xv;
        asteroids[i].y += asteroids[i].yv;

        // handle edge of screen
        if (asteroids[i].x < 0 - asteroids[i].r) {
            asteroids[i].x = canvas.width + asteroids[i].r;
        } else if (asteroids[i].x > canvas.width + asteroids[i].r) {
            asteroids[i].x = 0 - asteroids[i].r;
        }
        if (asteroids[i].y < 0 - asteroids[i].r) {
            asteroids[i].y = canvas.height + asteroids[i].r;
        } else if (asteroids[i].y > canvas.height + asteroids[i].r) {
            asteroids[i].y = 0 - asteroids[i].r;
        }
    }

}